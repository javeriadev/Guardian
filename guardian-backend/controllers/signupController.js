const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../db");
const { sendVerificationEmail } = require("../config/mailer");


// Generate a random six-digit OTP
function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}


// Generate a session token after successful signup verification
function generateToken(user) {
    return jwt.sign(
        {
            user_id: user.user_id,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
}


// --------------------------------------------------
// SIGNUP
// POST /api/auth/signup
// --------------------------------------------------

exports.signup = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // Check required fields
        if (
            typeof full_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !full_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Full name, email and password are required."
            });
        }

        const cleanName = full_name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Validate full name length
        if (cleanName.length > 150) {
            return res.status(400).json({
                message: "Full name cannot exceed 150 characters."
            });
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(cleanEmail) || cleanEmail.length > 255) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // Validate password
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must contain at least 8 characters."
            });
        }

        // Check if email already exists
        const [existingUsers] = await db.query(
            "SELECT user_id FROM USERS WHERE email = ?",
            [cleanEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "An account with this email already exists. Please verify it or use another email."
            });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate and hash OTP
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        // Create user and OTP in a transaction
        const connection = await db.getConnection();

        let userId;

        try {
            await connection.beginTransaction();

            const [userResult] = await connection.query(
                `INSERT INTO USERS
                 (full_name, email, password_hash, is_verified)
                 VALUES (?, ?, ?, FALSE)`,
                [cleanName, cleanEmail, passwordHash]
            );

            userId = userResult.insertId;

            await connection.query(
                `INSERT INTO EMAIL_VERIFICATION_OTPS
                 (user_id, otp_hash, expires_at)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
                [userId, otpHash]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }

        // Send verification email
        try {
            await sendVerificationEmail(cleanEmail, otp);

        } catch (emailError) {
            console.error("Email delivery error:", emailError.message);

            return res.status(502).json({
                message: "Account created, but the verification email could not be sent. Please use the resend OTP option."
            });
        }

        return res.status(201).json({
            message: "Account created successfully. Please verify your email using the OTP sent to you.",
            email: cleanEmail
        });

    } catch (error) {
        console.error("Signup error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        return res.status(500).json({
            message: "An error occurred during signup."
        });
    }
};


// --------------------------------------------------
// VERIFY EMAIL
// POST /api/auth/verify-email
// --------------------------------------------------

exports.verifyEmail = async (req, res) => {
    const connection = await db.getConnection();
    let transactionStarted = false;

    try {
        const { email, otp } = req.body;

        if (
            typeof email !== "string" ||
            typeof otp !== "string" ||
            !email.trim() ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                message: "A valid email and six-digit OTP are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        await connection.beginTransaction();
        transactionStarted = true;

        // Find and lock the account
        const [users] = await connection.query(
            `SELECT user_id, full_name, email, is_verified
             FROM USERS
             WHERE email = ?
             FOR UPDATE`,
            [cleanEmail]
        );

        if (users.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        const user = users[0];

        if (user.is_verified) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: "This email is already verified."
            });
        }

        // Find the latest unused OTP
        const [otps] = await connection.query(
            `SELECT verification_id, otp_hash, attempts,
                    (expires_at > NOW()) AS is_valid
             FROM EMAIL_VERIFICATION_OTPS
             WHERE user_id = ?
             AND consumed_at IS NULL
             ORDER BY verification_id DESC
             LIMIT 1
             FOR UPDATE`,
            [user.user_id]
        );

        if (otps.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: "No active OTP found. Please request a new one."
            });
        }

        const verification = otps[0];

        if (verification.attempts >= 5) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        if (!verification.is_valid) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: "OTP has expired. Please request a new one."
            });
        }

        // Compare entered OTP with stored hash
        const isCorrect = await bcrypt.compare(
            otp,
            verification.otp_hash
        );

        if (!isCorrect) {
            await connection.query(
                `UPDATE EMAIL_VERIFICATION_OTPS
                 SET attempts = attempts + 1
                 WHERE verification_id = ?`,
                [verification.verification_id]
            );

            await connection.commit();
            transactionStarted = false;

            return res.status(400).json({
                message: "Incorrect OTP."
            });
        }

        // Activate user account
        await connection.query(
            `UPDATE USERS
             SET is_verified = TRUE,
                 email_verified_at = NOW()
             WHERE user_id = ?`,
            [user.user_id]
        );

        // Mark OTP as consumed
        await connection.query(
            `UPDATE EMAIL_VERIFICATION_OTPS
             SET consumed_at = NOW()
             WHERE verification_id = ?`,
            [verification.verification_id]
        );

        await connection.commit();
        transactionStarted = false;

        // Create session token after verification
        const token = generateToken(user);

        return res.status(200).json({
            message: "Email verified successfully. Your Guardian account is now active.",

            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email
            },

            token
        });

    } catch (error) {
        if (transactionStarted) {
            await connection.rollback();
        }

        console.error("Email verification error:", error.message);

        return res.status(500).json({
            message: "An error occurred during email verification."
        });

    } finally {
        connection.release();
    }
};


// --------------------------------------------------
// RESEND OTP
// POST /api/auth/resend-otp
// --------------------------------------------------

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find account
        const [users] = await db.query(
            `SELECT user_id, is_verified
             FROM USERS
             WHERE email = ?`,
            [cleanEmail]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "No account found with this email."
            });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({
                message: "This email is already verified."
            });
        }

        // Enforce 60-second resend cooldown
        const [recentOTPs] = await db.query(
            `SELECT verification_id
             FROM EMAIL_VERIFICATION_OTPS
             WHERE user_id = ?
             AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
             ORDER BY verification_id DESC
             LIMIT 1`,
            [user.user_id]
        );

        if (recentOTPs.length > 0) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP."
            });
        }

        // Generate a new OTP
        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // Invalidate previous unused OTPs
            await connection.query(
                `UPDATE EMAIL_VERIFICATION_OTPS
                 SET consumed_at = NOW()
                 WHERE user_id = ?
                 AND consumed_at IS NULL`,
                [user.user_id]
            );

            // Save the new OTP
            await connection.query(
                `INSERT INTO EMAIL_VERIFICATION_OTPS
                 (user_id, otp_hash, expires_at)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
                [user.user_id, otpHash]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }

        // Send new OTP
        try {
            await sendVerificationEmail(cleanEmail, otp);

        } catch (emailError) {
            console.error("Resend email error:", emailError.message);

            return res.status(502).json({
                message: "Unable to send the verification email. Please try again later."
            });
        }

        return res.status(200).json({
            message: "A new verification OTP has been sent to your email."
        });

    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            message: "An error occurred while resending the OTP."
        });
    }
};
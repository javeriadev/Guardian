const jwt = require("jsonwebtoken");
const db = require("../db");

const authenticateToken = async (req, res, next) => {
    try {
        // STEP 1: Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authentication token is required.",
                code: "TOKEN_MISSING"
            });
        }

        // STEP 2: Expect Bearer TOKEN
        const parts = authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {
            return res.status(401).json({
                message: "Invalid authorization format.",
                code: "INVALID_AUTH_FORMAT"
            });
        }

        const token = parts[1];

        // STEP 3: Verify JWT signature and expiration
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        // STEP 4: Validate user ID from token
        const userId = Number(decoded.user_id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json({
                message: "Invalid authentication token.",
                code: "INVALID_TOKEN"
            });
        }

        // STEP 5: Confirm user still exists and is verified
        const [users] = await db.query(
            `SELECT user_id, email, is_verified
             FROM USERS
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (
            users.length === 0 ||
            !users[0].is_verified
        ) {
            return res.status(401).json({
                message: "User account is unavailable or unverified.",
                code: "ACCOUNT_UNAVAILABLE"
            });
        }

        // STEP 6: Attach authenticated user to request
        req.user = {
            user_id: users[0].user_id,
            email: users[0].email
        };

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Session expired. Please log in again.",
                code: "TOKEN_EXPIRED"
            });
        }

        if (error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError") {
            return res.status(401).json({
                message: "Invalid authentication token.",
                code: "INVALID_TOKEN"
            });
        }

        console.error("Authentication error:", error);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
};

module.exports = authenticateToken;

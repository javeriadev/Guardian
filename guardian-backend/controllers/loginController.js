const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

// LOGIN CONTROLLER
const login = async (req, res) => {
  try {
    // STEP 1: Get email and password from request body
    const { email, password } = req.body || {};

    // STEP 2: Check required fields
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
        code: "MISSING_FIELDS"
      });
    }

    // STEP 3: Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // STEP 4: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
        code: "INVALID_EMAIL_FORMAT"
      });
    }

    // STEP 5: Find user in MySQL
    const [users] = await pool.execute(
      `SELECT user_id, full_name, email,
              password_hash, is_verified
       FROM USERS
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    // STEP 6: If user doesn't exist
    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }

    const user = users[0];

    // STEP 7: Compare password with stored hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    // STEP 8: If password is incorrect
    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS"
      });
    }

    // STEP 9: Check email verification
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Account not verified. Please verify your email.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    // STEP 10: Check JWT configuration
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Server configuration error"
      });
    }

    // STEP 11: Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
        algorithm: "HS256"
      }
    );

    // STEP 12: Return successful login response
    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};

// Export controller
module.exports = {
  login
};

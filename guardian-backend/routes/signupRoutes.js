const express = require("express");

const router = express.Router();

const signupController = require("../controllers/signupController");

// Signup
router.post("/signup", signupController.signup);

// Email verification
router.post("/verify-email", signupController.verifyEmail);

// Resend OTP
router.post("/resend-otp", signupController.resendOTP);

module.exports = router;

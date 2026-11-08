const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendVerificationEmail(email, otp) {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Guardian - Email Verification",

        text: `Your Guardian verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,

        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px;">
                <h2>Welcome to Guardian</h2>

                <p>Use this code to verify your email address:</p>

                <h1 style="letter-spacing: 8px;">${otp}</h1>

                <p>This code expires in 5 minutes.</p>

                <p>Do not share this code with anyone.</p>
            </div>
        `
    });
}

module.exports = { sendVerificationEmail };
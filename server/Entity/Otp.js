const express = require("express");
const db = require("../database/db");
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const otpStore = {};

const emailExist = async (userType, email) => {
  try {
    let [rows] = [];
    [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM AdultUser WHERE email = ?',
      [email]
    );
    
    if (rows[0].count > 0) {
      return true;
    }

    [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM AdminUser WHERE email = ?',
      [email]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
};

const usernameExist = async (username) => {
  try {
    const [rows] = await db.execute(
      'SELECT COUNT(*) AS count FROM User WHERE username = ?',
      [username]
    );
    return rows[0].count > 0; // Returns true if username exists, otherwise false
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

// Generate a 6-digit OTP
const generateOTP = () => String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

// Hash function using SHA-256
const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { username, userType, email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required!" });


  // Remove this line to enable email checking
  if (await emailExist(userType, email)) {
    return res.status(400).json({ error: "Email already exists!" });
  }

  if (await usernameExist(username)) {
    return res.status(400).json({ error: "Username already exists!" });
  }

  try {
    const otp = generateOTP();
    console.log(otp);
    const hashedOTP = hashOTP(otp);
    otpStore[email] = hashedOTP; // Store hashed OTP

    // Send OTP via email
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It expires in 15 minutes.`,
    });

    // Set a timeout to remove the OTP after expiration (15 minutes)
    setTimeout(() => delete otpStore[email], 15 * 60 * 1000);

    res.json({ message: "OTP sent!" });
  } catch (error) {
    console.error("OTP send error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || !email) return res.status(400).json({ error: "OTP and Email are required!" });

  try {
    const hashedOTP = hashOTP(otp); // Hash the entered OTP

    // Check if hashed OTP exists in memory and matches stored hash
    if (!otpStore[email] || otpStore[email] !== hashedOTP) {
      return res.status(400).json({ error: "Invalid OTP!" });
    }

    // OTP is valid, remove it from memory
    delete otpStore[email];
    res.json({ message: "OTP verified successfully!" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

module.exports = router;
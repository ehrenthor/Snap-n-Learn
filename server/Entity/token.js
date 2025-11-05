const express = require('express');
const db = require('../database/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Configure Nodemailer (SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 📌 **Request Reset Password**
router.post('/request-reset', async (req, res) => {
  const { username } = req.body;

  try {
    // Get child ID
    const [child] = await db.execute('SELECT userid FROM User WHERE username = ?', [username]);
    if (!child.length) return res.status(404).json({ message: 'Child not found' });

    const childId = child[0].userid;

    // Get adult email
    const [adult] = await db.execute(`
      SELECT email FROM AdultUser 
      WHERE userid IN (SELECT adultId FROM AdultChild WHERE childId = ?)`, [childId]
    );

    if (!adult.length) return res.status(400).json({ message: 'No linked adult found' });

    const token = jwt.sign({ childId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `http://localhost:3000/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adult[0].email,
      subject: 'Reset Your Child’s Password',
      text: `Click the link to reset: ${resetLink}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Reset link sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 **Reset Password & Store in PasswordHistory**
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;  // Extract token from URL parameter
    const { password } = req.body; // Get new password from the body
  
    try {
  
      // Verify token and extract childId
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.error('Error during token verification:', error);
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      const childId = decoded.childId;
  
      // Check if childId exists in the User table
      const [userCheck] = await db.execute('SELECT * FROM User WHERE userid = ?', [childId]);
      if (!userCheck.length) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Check if new password was previously used
      const [previousPasswords] = await db.execute(
        'SELECT password FROM PasswordHistory WHERE userid = ? ORDER BY createdAt DESC LIMIT 3',
        [childId]
      );

      const isReused = previousPasswords.some(record => bcrypt.compareSync(password, record.password));
      if (isReused) return res.status(400).json({ message: 'New password cannot match the last 3 passwords.' });
  
      // Update password
      await db.execute('UPDATE User SET password = ? WHERE userid = ?', [hashedPassword, childId]);
  
      // Save to PasswordHistory
      await db.execute('INSERT INTO PasswordHistory (userid, password) VALUES (?, ?)', [childId, hashedPassword]);
  
      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error during password reset:', error);
      res.status(400).json({ message: 'Invalid or expired token' });
    }
  });

module.exports = router;

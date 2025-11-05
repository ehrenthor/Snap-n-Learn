const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const JwtUtils = require('../utils/jwtUtils');
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required!" });
  }

  try {
    const authResult = await AuthService.authenticateUser(username, password);

    if (authResult.userType === 'Child') {
      return res.status(400).json({ error: "This is a child account!" });
    }

    const token = jwt.sign(
      { userid: authResult.userid, username: authResult.username, userType: authResult.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    // Send success response
    res.json({
      message: "Login successful!",
      username: authResult.username,
      userType: authResult.userType,
      userId: authResult.userid 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Add logout route for completeness
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout successful!" });
});

router.get('/validate', (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      isAuthenticated: true,
      userType: decoded.userType,
      username: decoded.username,
      userId: decoded.userid
    });
  } catch (error) {
    res.clearCookie('token');
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
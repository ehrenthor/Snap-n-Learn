const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const validator = require('validator');
const db = require("../database/db");
const jwt = require("jsonwebtoken");
const userService = require('../services/userService');

// Adult registration route
router.post("/registerAdult", async (req, res) => {
  const { username, firstName, lastName, dob, password, confirmPassword, email, otp } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !dob || !password || !confirmPassword || !email) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match!" });
  }

  try {
    await UserService.registerAdult(username, firstName, lastName, dob, password, email);
    res.json({ message: "Adult registered successfully!" });
  } catch (error) {
    console.error("Error during adult registration:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Child registration route
router.post("/registerChild", async (req, res) => {
  const { username, firstName, lastName, dob, password, confirmPassword, adultUsername } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !dob || !password || !confirmPassword || !adultUsername) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match!" });
  }

  try {
    await UserService.registerChild(username, firstName, lastName, dob, password, adultUsername);
    res.json({ message: "Child registered successfully!" });
  } catch (error) {
    console.error("Error during child registration:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Get all children for an adult user
router.post("/getChildren", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const children = await UserService.getChildrenByAdultUsername(username);
    res.json(children);
  } catch (error) {
    console.error("Error fetching child accounts:", error);
    res.status(error.status || 500).json({
      error: error.message || "Error fetching child accounts"
    });
  }
});

// Get child details by username
router.get('/children/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const childDetails = await UserService.getChildDetailsByUsername(username);
    res.json(childDetails);
  } catch (error) {
    console.error('Error fetching child details:', error);
    res.status(error.status || 500).json({
      error: error.message || "Error fetching child details"
    });
  }
});

// Update child settings
router.put('/children/:username', async (req, res) => {
  const { username } = req.params;
  const { is_locked, can_upload_image, daily_session_limit, complexity_level } = req.body;

  try {
    await UserService.updateChildSettings(
      username,
      is_locked,
      can_upload_image,
      daily_session_limit,
      complexity_level
    );

    res.json({ message: 'Child account updated successfully' });
  } catch (error) {
    console.error('Error updating child account:', error);
    res.status(error.status || 500).json({
      error: error.message || "Error updating child account"
    });
  }
});

// Admin registration route
router.post("/registerAdmin", async (req, res) => {
  const { username, firstName, lastName, dob, password, confirmPassword, email } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !password || !confirmPassword || !email) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match!" });
  }

  try {
    // Use the UserService to register the admin
    await UserService.registerAdmin(username, firstName, lastName, dob, password, email);

    res.json({ message: "Admin registered successfully!" });
  } catch (error) {
    console.error("Error during admin registration:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Get user ID by username
router.get('/getid/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const userId = await UserService.getUserIdByUsername(username);
    
    if (!userId) {
      return res.status(404).json({ error: "User not found!" });
    }

    res.json({ userId });
  } catch (error) {
    console.error('Error fetching user ID:', error);
    res.status(error.status || 500).json({
      error: error.message || "Error fetching user ID"
    });
  }
});

// Get all users (Admin access)
router.get('/users', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();  
    res.json(users);  
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

router.get('/userDetails/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await UserService.getUserbyId(userId);
    res.json(user);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});


router.post('/users/:userId/suspend', async (req, res) => {
  const { userId } = req.params;
  const { suspend, userType } = req.body;  

  try {
    await UserService.suspendUser(userId, suspend, userType);
    res.json(true);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post("/childLogin", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required!" });
  }

  try {
    const results = await UserService.verifyChildLogin(username);

    if (results.length === 0) {
      return res.status(404).json({ error: "Invalid credentials!" });
    }

    const token = jwt.sign(
      { userid: results.userid, username: username, userType: "Child" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful!", username: username, userType: "Child" });
  } catch (error) {
    console.error("Login error:", error);
    
    if (error.message === "This account is locked. Please contact an administrator.") {
      return res.status(403).json({ message: error.message, isLocked: true });
    }

    res.status(500).json({ error: "Server error" });
  }
});

// Update child settings
router.put('/deleteChild', async (req, res) => {
  const { username } = req.body;

  try {
    await UserService.deleteChild(username);
    res.json({ message: 'Child account deleted successfully!' });
  } catch (error) {
    console.error('Error deleting child account:', error);
    res.status(error.status || 500).json({
      error: error.message || "Error deleting child account"
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const ProfileService = require('../services/profileService');
const validator = require('validator');

// Get user profile
router.post("/getProfile", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is empty!" });
  }

  try {
    const profile = await ProfileService.getProfileByUsername(username);
    res.json({
      message: "Fetching successful!",
      ...profile
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Update adult profile
router.post("/updateAdultProfile", async (req, res) => {
  const {
    profilePic,
    username,
    newUsername,
    firstName,
    lastName,
    dob,
    email,
    oldPassword,
    newPassword,
    confirmPassword
  } = req.body;

  // Check if all required fields are provided
  if (!username || !newUsername || !firstName || !lastName || !dob || !email) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }

  // Password validation
  if ((!oldPassword && newPassword) || (oldPassword && !newPassword)) {
    return res.status(400).json({
      error: "Please fill in these fields to change your password (Old Password, New Password, Confirmed password)!"
    });
  }

  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ error: "New password and confirmation do not match!" });
  }

  try {
    await ProfileService.updateAdultProfile(
      username,
      newUsername,
      firstName,
      lastName,
      dob,
      email,
      "Empty",
      oldPassword,
      newPassword
    );

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Update child profile
router.post("/updateChildProfile", async (req, res) => {
  const {
    profilePic,
    username,
    newUsername,
    firstName,
    lastName,
    dob,
  } = req.body;

  // Check if all required fields are provided
  if (!username || !newUsername || !firstName || !lastName || !dob) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    await ProfileService.updateChildProfile(
      username,
      newUsername,
      firstName,
      lastName,
      dob,
      profilePic
    );

    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

module.exports = router;
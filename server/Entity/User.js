const express = require("express");
const router = express.Router();
const db = require("../database/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { uuidv7 } = require('uuidv7');
require("dotenv").config();

// Adult User Registration
router.post("/registerAdult", async (req, res) => {
  // const { username, firstName, lastName, dob, password, confirmPassword, email, otp, userType } = req.body;
  const { username, firstName, lastName, dob, password, confirmPassword, email, otp } = req.body;

  if (!username || !firstName || !lastName || !dob || !password || !confirmPassword || (!email && userType != "Child")) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long!" });
  }

  try {
    const [usernameResults] = await db.execute(
      "SELECT username FROM User WHERE username = ?",
      [username]
    );

    if (usernameResults.length > 0) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // if (userType == "Adult") {
    const [emailResults] = await db.execute(
      "SELECT email FROM AdultUser WHERE email = ?",
      [email]
    );
    if (emailResults.length > 0) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userid = uuidv7();

    // Insert into User table
    await db.execute(
      "INSERT INTO User (userid, username, password) VALUES (?, ?, ?)",
      [userid, username, hashedPassword]
    );

    // Store password in history
    await db.execute(
      "INSERT INTO PasswordHistory (userid, password) VALUES (?, ?)",
      [userid, hashedPassword]
    );

    await db.execute(
      'INSERT INTO UserProfile (userid, firstName, lastName, dob) VALUES (?, ?, ?, ?)',
      [userid, firstName, lastName, dob]
    )
    await db.execute(
      'INSERT INTO AdultUser (userid, email) VALUES (?, ?)',
      [userid, email]
    )

    res.json({ message: "Adult registered successfully!" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Adult Register Child
router.post("/registerChild", async (req, res) => {
  const { username, firstName, lastName, dob, password, confirmPassword, adultUsername } = req.body;

  if (!username || !firstName || !lastName || !dob || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long!" });
  }

  try {
    const [usernameResults] = await db.execute(
      "SELECT username FROM User WHERE username = ?",
      [username]
    );

    if (usernameResults.length > 0) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userid = uuidv7();

    // Insert into User table
    await db.execute(
      "INSERT INTO User (userid, username, password) VALUES (?, ?, ?)",
      [userid, username, hashedPassword]
    );

    // Store password in history
    await db.execute(
      "INSERT INTO PasswordHistory (userid, password) VALUES (?, ?)",
      [userid, hashedPassword]
    );

    await db.execute(
      'INSERT INTO UserProfile (userid, firstName, lastName, dob) VALUES (?, ?, ?, ?)',
      [userid, firstName, lastName, dob]
    )

    await db.execute(
      'INSERT INTO ChildUser (userid) VALUES (?)',
      [userid]
    );

    const [adultUserid] = await db.execute(
      "SELECT userid FROM User WHERE username = ?",
      [adultUsername]
    );

    await db.execute(
      'INSERT INTO AdultChild (adultId, childId) VALUES (?, ?)',
      [adultUserid[0].userid, userid]
    )

    res.json({ message: "Child registered successfully!" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/childLogin", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required!" });
  }

  try {
    let [results] = await db.execute(
      "SELECT * FROM User WHERE username = ?",
      [username]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Invalid credentials!" });
    }

    const user = results[0];

    const token = jwt.sign(
      { userid: user.userid, username: user.username, userType: "Child" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful!", username: user.username, userType: "Child" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// User Login with HTTP-only Cookies
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required!" });
  }

  try {
    let [results] = await db.execute(
      "SELECT * FROM User WHERE username = ?",
      [username]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "Invalid credentials!" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials!" });
    }

    // To determine which user is logging in

    let userType;

    [results] = await db.execute(
      "SELECT * FROM AdultUser WHERE userid = ?",
      [user.userid]
    );
    if (results.length > 0) {
      userType = "Adult";
    }

    [results] = await db.execute(
      "SELECT * FROM AdminUser WHERE userid = ?",
      [user.userid]
    );
    if (results.length > 0) {
      userType = "Admin";
    }

    // [results] = await db.execute(
    //   "SELECT * FROM ChildUser WHERE userid = ?",
    //   [user.userid]
    // );
    // if (results.length > 0) {
    //   userType = "Child";
    // }

    const token = jwt.sign(
      { userid: user.userid, username: user.username, userType: userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000,
    });

    res.json({ message: "Login successful!", username: user.username, userType: userType });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Gets profile of user 
router.post("/getProfile", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is empty!" });
  }

  try {
    const [results] = await db.execute(
      `SELECT u.userid,
              u.username,
              u.createdAt,
              up.firstName,
              up.lastName,
              up.dob,
              au.email
       FROM User u
                LEFT JOIN UserProfile up ON u.userid = up.userid
                LEFT JOIN AdultUser au ON u.userid = au.userid
       WHERE u.username = ?`,
      [username]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: "User doesn't exist!" });
    }

    const user = results[0];

    res.json({
      message: "Fetching successful!",
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
      email: user.email
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/getChildren", async (req, res) => {
  const { username } = req.body;

  try {
    const [adultUserid] = await db.execute("SELECT userid FROM User WHERE username = ?", [username]);

    if (adultUserid.length === 0) {
      return res.status(404).json({ message: "Adult not found." });
    }

    const [rows] = await db.execute("SELECT * FROM AdultChild ac LEFT JOIN User u ON ac.childId = u.userid WHERE ac.adultId = ?", [adultUserid[0].userid]);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching child accounts:", error);
    res.status(500).json({ message: "Error fetching child accounts", error });
  }
});

router.get('/children/:username', async (req, res) => {
  const { username } = req.params;

  try {
    // Most database libraries return [rows, fields]
    const [rows] = await db.execute(
      "SELECT u.username, cu.is_locked, cu.can_upload_image, cu.daily_session_limit, cu.complexity_level, cu.last_seen FROM childuser cu JOIN user u on cu.userid = u.userid WHERE u.username = ?",
      [username]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Send back just the rows
    res.json(rows);
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ error: 'Error fetching child details' });
  }
});

router.put('/children/:username', async (req, res) => {
  const { username } = req.params;
  const { is_locked, can_upload_image, daily_session_limit, complexity_level } = req.body;

  try {
    // Get the user ID from the username
    const [userRows] = await db.execute(
      "SELECT userid FROM user WHERE username = ?",
      [username]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const userId = userRows[0].userid;

    // Convert booleans and numbers
    const isLocked = is_locked === true || is_locked === "true" ? 1 : 0;
    const canUploadImage = can_upload_image === true || can_upload_image === "true" ? 1 : 0;
    const dailySessionLimit = parseInt(daily_session_limit, 10) || 0;
    const complexityLevel = parseInt(complexity_level, 10) || 1;

    // Update child user settings
    await db.execute(
      "UPDATE childuser SET is_locked = ?, can_upload_image = ?, daily_session_limit = ?, complexity_level = ? WHERE userid = ?",
      [isLocked, canUploadImage, dailySessionLimit, complexityLevel, userId]
    );

    res.json({ message: 'Child account updated successfully' });
  } catch (error) {
    console.error('Error updating child account:', error);
    res.status(500).json({ error: 'Error updating child account' });
  }
});

// Adult User wants to change their profile
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

  // Check if all fields are provided
  if (!username || !newUsername || !firstName || !lastName || !dob || !email) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [user] = await connection.execute(
      "SELECT userid FROM User WHERE username = ?",
      [username]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const userId = user[0].userid;

    // Check if username and newUsername are different
    if (username !== newUsername) {
      const [existingUser] = await connection.execute(
        "SELECT * FROM User WHERE username = ?",
        [newUsername]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "New username is already taken." });
      }

      await connection.execute(
        "UPDATE User SET username = ? WHERE userid = ?",
        [newUsername, userId]
      );
    }

    await connection.execute(
      `UPDATE UserProfile
       SET firstName = ?,
           lastName  = ?,
           dob       = ?
       WHERE userid = ?`,
      [firstName, lastName, dob, userId]
    );

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format!" });
    }
    await connection.execute(
      "UPDATE AdultUser SET email = ? WHERE userid = ?",
      [email, userId]
    );


    if ((!oldPassword && newPassword) || (oldPassword && !newPassword)) {
      return res.status(400).json({ error: "Please fill in these fields to change your password (Old Password, New Password, Confirmed password)!" });
    } else if (oldPassword && newPassword) {
      // Verify old password
      const [currentPassword] = await connection.execute(
        "SELECT password FROM User WHERE userid = ?",
        [userId]
      );

      const isMatch = await bcrypt.compare(oldPassword, currentPassword[0].password);
      if (!isMatch) {
        return res.status(400).json({ error: "Incorrect old password" });
      }

      // Check password history
      const [passwordHistory] = await connection.execute(
        `SELECT password
         FROM PasswordHistory
         WHERE userid = ?
         ORDER BY createdAt DESC`,
        [userId]
      );

      const passwordMatches = await Promise.all(
        passwordHistory.map(ph => bcrypt.compare(newPassword, ph.password))
      );
      const isReused = passwordMatches.some(match => match);

      if (isReused) {
        return res.status(400).json({ error: "Password recently used" });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await connection.execute(
        "UPDATE User SET password = ? WHERE userid = ?",
        [hashedPassword, userId]
      );

      // Update password history
      await connection.execute(
        `INSERT INTO PasswordHistory (userid, password)
         VALUES (?, ?)`,
        [userId, hashedPassword]
      );
    }

    await connection.commit();
    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
});

// Child User wants to change their profile
router.post("/updateChildProfile", async (req, res) => {
  const {
    profilePic,
    username,
    newUsername,
    firstName,
    lastName,
    dob,
  } = req.body;

  // Check if all fields are provided
  if (!username || !newUsername || !firstName || !lastName || !dob) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [user] = await connection.execute(
      "SELECT userid FROM User WHERE username = ?",
      [username]
    );

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }
    const userId = user[0].userid;

    // Check if username and newUsername are different
    if (username !== newUsername) {
      const [existingUser] = await connection.execute(
        "SELECT * FROM User WHERE username = ?",
        [newUsername]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: "New username is already taken." });
      }

      await connection.execute(
        "UPDATE User SET username = ? WHERE userid = ?",
        [newUsername, userId]
      );
    }

    await connection.execute(
      `UPDATE UserProfile
       SET firstName = ?,
           lastName  = ?,
           dob       = ?
       WHERE userid = ?`,
      [firstName, lastName, dob, userId]
    );

    await connection.commit();
    res.json({ message: "Profile updated successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
});


module.exports = router;

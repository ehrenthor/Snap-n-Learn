const express = require('express');
const db = require("../database/db");
const router = express.Router();

router.get('/user-statistics', async (req, res) => {
  try {
    const [[imageCount]] = await db.query('SELECT COUNT(*) AS count FROM Image');
    const [[quizCount]] = await db.query('SELECT COUNT(*) AS count FROM Quiz');
    const [[captionCount]] = await db.query('SELECT COUNT(*) AS count FROM Image WHERE caption IS NOT NULL');
    const [[childCount]] = await db.query('SELECT COUNT(*) AS count FROM ChildUser');
    const [[adultCount]] = await db.query('SELECT COUNT(*) AS count FROM AdultUser');

    res.json({
      childCount: childCount.count,
      adultCount: adultCount.count,
      imageUploads: imageCount.count,
      explanationsGenerated: captionCount.count,
      quizzesUploaded: quizCount.count
    });
  } catch (err) {
    console.error('Failed to fetch statistics:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;

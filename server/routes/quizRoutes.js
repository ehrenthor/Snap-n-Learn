const express = require('express');
const router = express.Router();
const QuizService = require('../services/quizService');
const { generateQuizForAllImages } = require('../services/quizAIService');
const validator = require('validator');
const { getUserId } = require('../utils/jwtUtils');

// Get quiz list
router.post("/getQuizList", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is empty!" });
  }

  try {
    const quizList = await QuizService.getQuizList(username);
    res.json({
      message: "Fetching successful!",
      ...quizList
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Get quiz review
router.post("/getQuizReview", async (req, res) => {
  const { username, quizId, datetimeTaken } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is empty!" });
  }

  if (!quizId) {
    return res.status(400).json({ error: "Quiz ID is empty!" });
  }

  if (!datetimeTaken) {
    return res.status(400).json({ error: "Quiz datetime is empty!" });
  }

  try {
    const quizReview = await QuizService.getQuizReview(username, quizId, datetimeTaken);
    res.json({
      message: "Fetching successful!",
      ...quizReview
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Get quiz question
router.post("/getQuizQuestion", async (req, res) => {
  const { quizId } = req.body;

  if (!quizId) {
    return res.status(400).json({ error: "Quiz ID is empty!" });
  }

  try {
    const quiz = await QuizService.getQuizQuestion(quizId);
    res.json({
      message: "Fetching successful!",
      ...quiz
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Insert quiz result
router.post("/insertQuizResult", async (req, res) => {
  const { quizId, username, answers } = req.body;

  if (!quizId) {
    return res.status(400).json({ error: "Quiz ID is empty!" });
  }
  if (!username) {
    return res.status(400).json({ error: "Username is empty!" });
  }
  if (!answers) {
    return res.status(400).json({ error: "Answer is empty!" });
  }

  try {
    await QuizService.insertQuizResult(quizId, username, answers);
    res.json({ message: "Insert successful!" });
  } catch (error) {
    console.error("Insert error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Get image for quiz creation
router.post("/getImages", async (req, res) => {
  const { childUsername } = req.body;

  if (!childUsername) {
    return res.status(400).json({ error: "Child username is empty!" });
  }

  try {
    const images = await QuizService.getImages(childUsername);
    res.json({
      message: "Fetching successful!",
      ...images
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Insert quiz created
router.post("/insertQuizCreated", async (req, res) => {
  const { childUsername, quizName, quizDescription, questions } = req.body;

  if (!childUsername) {
    return res.status(400).json({ error: "Child username is empty!" });
  }
  if (!quizName) {
    return res.status(400).json({ error: "Quiz name is empty!" });
  }
  if (!quizDescription) {
    return res.status(400).json({ error: "Quiz description is empty!" });
  }
  if (!questions) {
    return res.status(400).json({ error: "Questions is empty!" });
  }

  try {
    await QuizService.insertQuizCreated(childUsername, quizName, quizDescription, questions);
    res.json({ message: "Fetching successful!" });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

// Generate quiz using AI
router.post("/generateQuiz", async (req, res) => {
  const { chatIds } = req.body;


  if (!chatIds || !Array.isArray(chatIds) || chatIds.length === 0) {
    return res.status(400).json({ error: "Chat UUIDs are empty!" });
  }

  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const quizzes = await generateQuizForAllImages(chatIds, userId);
    res.json({
      quizzes
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

module.exports = router;
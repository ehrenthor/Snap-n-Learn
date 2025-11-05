// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage } = require('../services/chatService');

// Get chat history for a session
router.get('/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const chatHistory = await getChatHistory(sessionId);
    res.json(chatHistory);
  } catch (err) {
    console.error('Error fetching chat history:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Send a message
router.post('/send', async (req, res) => {
  const { sessionId, adultId, childId, note } = req.body;
  try {
    const newMessage = await sendMessage(sessionId, adultId, childId, note);
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;

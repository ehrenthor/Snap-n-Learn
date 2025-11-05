const chatRepository = require('../database/chatRepository');

// Get chat history for a session
const getChatHistory = async (sessionId) => {
  return await chatRepository.getChatHistory(sessionId);
};

// Send a new message
const sendMessage = async (sessionId, adultId, childId, note) => {
  return await chatRepository.saveMessage(sessionId, adultId, childId, note);
};

// Delete all notes associated with a session
const deleteNotesBySession = async (sessionId) => {
  return await chatRepository.deleteNotesBySession(sessionId);
};

module.exports = { getChatHistory, sendMessage, deleteNotesBySession };

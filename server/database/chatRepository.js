// repository/chatRepository.js
const db = require('./db');  // Assuming you have a database connection setup

// Get chat history for a specific session
const getChatHistory = async (sessionId) => {
  const query = 'SELECT * FROM AdultNote WHERE sessionId = ? ORDER BY createdAt ASC';
  const [rows] = await db.execute(query, [sessionId]);
  return rows;
};

// Save a new message
const saveMessage = async (sessionId, adultId, childId, note) => {
  const noteId = require('uuid').v4();  // Generate a new message ID
  const query = `
    INSERT INTO AdultNote (noteId, sessionId, adultId, childId, note)
    VALUES (?, ?, ?, ?, ?)
  `;
  await db.execute(query, [noteId, sessionId, adultId, childId, note]);
  return { noteId, sessionId, adultId, childId, note };
};

// Delete notes for a session when it ends
const deleteNotesBySession = async (sessionId) => {
  const query = 'DELETE FROM AdultNote WHERE sessionId = ?';
  await db.execute(query, [sessionId]);
  return { message: `Notes for session ${sessionId} deleted successfully` };
};

module.exports = { getChatHistory, saveMessage, deleteNotesBySession };

const express = require("express");
const router = express.Router();
const { getUserId, getUserType } = require('../utils/jwtUtils');
const {
  generateImageCaption,
  generateCaptionExplanation,
  getChatList,
  getChatById,
  getChallengeDetails,
  toggleBookmark,
  challengeCompleted,
  deleteImageRecordByChatId,
  checkChildCanUploadImage
} = require('../services/imageCaptioningService');

/**
 * @route POST /completions
 * @description Generate a caption for an uploaded image and return caption with audio version
 *
 * @param {Object} req.body.image - Base64 encoded image data
 * @returns {Object} 200 - Success response with image ID, caption text, chat ID and audio data
 * @returns {Object} 400 - Error response if no image is provided
 * @returns {Object} 401 - Error response if user is not authenticated
 * @returns {Object} 500 - Server error response
 */
router.post('/completions', async (req, res) => {
  try {
    // Base64 encoded image
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    // user id and type from JWT token
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userType = getUserType(req);

    const result = await generateImageCaption(image, userId, userType);

    // Add the prefix to the main audio
    const mainAudioDataUrl = `data:audio/mpeg;base64,${result.audio}`;

    // Map over the objectAudio array to add the prefix to each audio string
    const objectAudioWithPrefix = result.objectAudio.map(objAud => ({
      ...objAud, // Keep other properties like 'object' name
      audio: `data:audio/mpeg;base64,${objAud.audio}` // Add the prefix here
    }));

    res.status(200).json({
      imageId: result.imageId,
      caption: result.caption,
      chatId: result.chatId,
      audio: mainAudioDataUrl,
      bbox: result.bbox,
      objectAudio: objectAudioWithPrefix
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const { caption, selectedText } = req.body;
    if (!caption || !selectedText) {
      return res.status(400).json({ error: 'Caption and selected text are required' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userType = getUserType(req);

    const result = await generateCaptionExplanation(caption, selectedText, userId, userType);

    res.status(200).json({
      explanation: result
    });


  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

router.post('/checkCanUpload', async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing userId' });
  }

  try {
    await checkChildCanUploadImage(userId);
    return res.status(200).json({ success: true, canUpload: true });
  } catch (error) {
    return res.status(403).json({ success: false, canUpload: false, message: error.message });
  }
});

/**
 * @route GET /chats
 * @description Retrieve a list of all chat IDs associated with the authenticated user
 *
 * @returns {Object} 200 - Success response with array of chat IDs
 * @returns {Object} 401 - Error response if user is not authenticated
 * @returns {Object} 500 - Server error response
 */
router.get('/chats', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    const chatList = await getChatList(userId);
    res.status(200).json({ chats: chatList });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * @route GET /userchat/:userid
 * @description Retrieve a list of all chat IDs associated with the provided user ID
 *
 * @param {string} userid - The user ID from the route params
 *
 * @returns {Object} 200 - Success response with array of chat IDs
 * @returns {Object} 400 - Error response if userId is not provided in params
 * @returns {Object} 500 - Server error response
 */
router.get('/userchats/:userid', async (req, res) => {
  try {
    // Extract userId from route parameters
    const { userid } = req.params;

    // Check if the userId is provided in the route parameters
    if (!userid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Fetch the chat list for the provided userId
    const chatList = await getChatList(userid);

    res.status(200).json({ chats: chatList });
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

/**
 * @route GET /:chatId
 * @description Retrieve data for a specific chat including image, caption and audio
 *
 * @param {string} req.params.chatId - The ID of the chat to retrieve
 * @returns {Object} 200 - Success response with caption, base64 encoded image and audio
 * @returns {Object} 401 - Error response if user is not authenticated
 * @returns {Object} 404 - Error response if chat is not found or user doesn't have access
 * @returns {Object} 500 - Server error response
 */
router.get('/:chatId', async (req, res) => {
  try {
    // From JWT token
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { chatId } = req.params;

    const userType = getUserType(req);

    try {
      const chatData = await getChatById(chatId, userId);

      const mainAudioDataUrl = `data:audio/mpeg;base64,${chatData.audio}`;
      // Map over the objectAudio array to add the prefix to each audio string
      const objectAudioWithPrefix = chatData.objectAudio.map(objAud => ({
        ...objAud, // Keep other properties like 'object' name
        audio: `data:audio/mpeg;base64,${objAud.audio}` // Add the prefix here
      }));

      res.status(200).json({
        caption: chatData.caption,
        bbox: chatData.bbox,
        image: `data:image/jpeg;base64,${chatData.image}`,
        audio: mainAudioDataUrl,
        objectAudio: objectAudioWithPrefix
      });
    } catch (error) {
      if (error.message === 'Chat not found or access denied') {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving chat data:', error);
    res.status(500).json({ error: 'Failed to retrieve chat data' });
  }
});

router.get('/getChallenge/:chatId', async (req, res) => {
  try {
    // From JWT token
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { chatId } = req.params;

    try {
      const chatData = await getChallengeDetails(chatId);
      res.status(200).json({
        caption: chatData.caption,
        bbox: chatData.bbox,
        image: `data:image/jpeg;base64,${chatData.image}`,
        challengeDetails: chatData.challengeDetails
      });
    } catch (error) {
      if (error.message === 'Chat not found or access denied') {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving chat data:', error);
    res.status(500).json({ error: 'Failed to retrieve chat data' });
  }
});

/**
 * @route GET /userchat/:userid/:chatId
 * @description Retrieve data for a specific chat including image, caption, and audio for the provided user ID
 *
 * @param {string} req.params.userid - The user ID passed in the route
 * @param {string} req.params.chatId - The ID of the chat to retrieve
 *
 * @returns {Object} 200 - Success response with caption, base64 encoded image, and audio
 * @returns {Object} 400 - Error response if userId or chatId is not provided
 * @returns {Object} 404 - Error response if chat is not found or user doesn't have access
 * @returns {Object} 500 - Server error response
 */

router.get('/userchats/:userid/:chatId', async (req, res) => {
  try {
    // Extract userId and chatId from route parameters
    const { userid, chatId } = req.params;

    // Check if userId or chatId is missing
    if (!userid || !chatId) {
      return res.status(400).json({ error: 'User ID and Chat ID are required' });
    }

    try {
      // Call the function without userType
      const chatData = await getChatById(chatId, userid);
      
      res.status(200).json({
        caption: chatData.caption,
        bbox: chatData.bbox,
        image: `data:image/jpeg;base64,${chatData.image}`,
        audio: `data:audio/mpeg;base64,${chatData.audio}`
      });
    } catch (error) {
      if (error.message === 'Chat not found or access denied') {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving chat data:', error);
    res.status(500).json({ error: 'Failed to retrieve chat data' });
  }
});

router.post('/bookmark/:chatId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { chatId } = req.params;

    // Call service to toggle bookmark
    const newBookmarkStatus = await toggleBookmark(chatId, userId);

    res.status(200).json({ chatId, isBookmarked: newBookmarkStatus });
  } catch (error) {
    console.error('Error updating bookmark:', error);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// Complete Challenge
router.post("/challengeCompleted", async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ error: "Chat ID is empty!" });
  }

  try {
    await challengeCompleted(chatId);
    res.json({ message: "Challenge Completion Successful!" });
  } catch (error) {
    console.error("Completion Error:", error);
    res.status(error.status || 500).json({ error: error.message || "Server error" });
  }
});

/**
 * @route DELETE /:chatId
 * @description Soft deletes a chat/image (marks status as 'deleted')
 *
 * @param {string} req.params.chatId - The ID of the chat/image to delete
 * @returns {Object} 200 - Success message
 * @returns {Object} 401 - If unauthenticated
 * @returns {Object} 403 - If the user doesn't own the image
 * @returns {Object} 404 - If the image was not found
 * @returns {Object} 500 - On server/database error
 */
router.delete('/:chatId', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { chatId } = req.params;

    const success = await deleteImageRecordByChatId(chatId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Chat not found or not owned by user' });
    }

    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

module.exports = router;
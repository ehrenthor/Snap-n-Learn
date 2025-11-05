const db = require("../database/db");
const { generateImageAnalysisPrompt, generateExplanationPrompt, generateImageCaptionPrompt } = require('./llm-prompts');
const { fetchLLMResponse } = require('../external-apis/llm-api');
const { generateSpeech } = require('../external-apis/tts-api');
const ImageProcessor = require('./imageProcessor');
const { generateBoundingBox } = require('./imageBBoxService');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { broadcastImageCaption } = require('../socket');
const sessionService = require('./sessionService');
const imageRepository = require('../database/imageRepository');
const userRepository = require('../database/userRepository');
const fileStorage = require('../storage/fileStorage');
const { extractStringFromXMLTags } = require('../utils/stringUtils');

/**
 * Processes the raw LLM completion string to extract and validate the structured JSON output.
 * It first extracts the content within <output> tags, then the JSON code block within that content.
 * Finally, it validates the structure of the parsed JSON according to predefined rules.
 * Logs errors to the console if extraction or validation fails.
 *
 * @param {string} responseText - The raw string response from the LLM.
 * @returns {object} The validated JSON object if successful, or an empty object {} if any step fails.
 */
function processLlmCompletion(responseText) {
  let errors = [];

  const outputContent = extractStringFromXMLTags(responseText, 'output');
  if (!outputContent) {
    return {};
  }

  // Step 2: Extract JSON string from the code block
  const jsonBlockMatch = outputContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonBlockMatch || jsonBlockMatch.length < 2) {
    console.error("Validation Error: Could not find JSON code block within <output> content.");
    return {};
  }
  const jsonString = jsonBlockMatch[1].trim();

  // Step 3: Parse the JSON string
  let parsedData;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    console.error("Validation Error: Failed to parse JSON string.", error);
    return {};
  }

  // Step 4: Validate the JSON structure
  if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
    errors.push("Root level is not a valid object.");
  } else {
    // Validate 'objects' array
    if (!Array.isArray(parsedData.objects)) {
      errors.push("Missing or invalid type for 'objects' (expected array).");
    } else {
      // Validate each element within the 'objects' array
      parsedData.objects.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) {
          errors.push(`Object at index ${index} is not a valid object.`);
        } else {
          if (typeof item.object !== 'string') {
            errors.push(`Object at index ${index}: missing or invalid type for 'object' (expected string).`);
          }
          if (typeof item.description !== 'string') {
            errors.push(`Object at index ${index}: missing or invalid type for 'description' (expected string).`);
          }
          if (typeof item.context !== 'string') {
            errors.push(`Object at index ${index}: missing or invalid type for 'context' (expected string).`);
          }
        }
      });
    }
  }

  // Step 5: Check for errors and return
  if (errors.length > 0) {
    console.error("Validation Errors found:", errors.join("\n"));
    return {};
  }

  // If all checks pass, return the parsed data
  return parsedData;
}

function stripXMLTags(input) {
  return input.replace(/<[^>]+>/g, '');
}

/**
 * Extracts the names of the objects from the validated image data object.
 *
 * @param {object} imageData - The validated JSON object containing image analysis results.
 *                             Expected structure: { objects: [{ object: string, ... }, ...], ... }
 * @returns {string[]} An array of strings, where each string is the 'object' name.
 *                     Returns an empty array if imageData is invalid, lacks the 'objects' array,
 *                     or the 'objects' array is empty.
 */
const getObjectNames = (imageData) => {
  // Basic check to ensure imageData and the objects array exist and are valid
  if (!imageData || !Array.isArray(imageData.objects)) {
    console.warn("getObjectNames: Input data is invalid or missing 'objects' array. Returning empty array.");
    return [];
  }

  // Use map to extract the 'object' property from each item
  const objectNames = imageData.objects
    .map((item) => item?.object)

  return objectNames;
};

/**
 * Formats the input data to extract object descriptors and bounding boxes
 * based on the specified detail level.
 *
 * @param {Object} data - The JSON object containing annotated image data.
 * @param {number} level - The level of detail:
 *                         1 = "object",
 *                         2 = "description",
 *                         3 = "context".
 * @returns {Array<{object: string, bbox_2d: number[]}>}
 */
function formatCaption(data, level) {
  let key;

  switch (level) {
    case 1:
      key = "object";
      break;
    case 2:
      key = "description";
      break;
    case 3:
      key = "context";
      break;
    default:
      console.warn(`Invalid level "${level}" provided. Defaulting to level 1 ("object").`);
      key = "object";
  }

  return data.objects.map(item => ({
    id: item.id,
    object: item[key],
    bbox_2d: item.bbox_2d
  }));
}

/**
 * Core function that processes an image and generates a caption with audio.
 *
 * @async
 * @param {string} imageData - The raw image data, either as a base64 string
 * @param {string} userId - The unique ID of the user requesting the caption
 * @param {string} userType - The type of user (e.g., 'Child', 'Adult')
 * @returns {Promise<Object>} Object containing the processed image, generated caption, and audio
 * @throws {Error} If there's an issue with database access or processing
 */
async function generateImageCaption(imageData, userId, userType) {
  // 1. Process the image
  const processor = new ImageProcessor();
  await processor.decode(imageData);
  await processor.convert('jpeg'); // Process all images as JPEG for consistency
  await processor.resize(1024, 1024);
  const dimensions = processor.getDimensions(); // Get dimensions before final encoding
  const processedImageBase64 = await processor.encode(); // Get base64 encoded image

  // 2. Get user-specific settings (Complexity Level)
  let complexityLevel = 2; // Default
  if (userType === 'Child') {
    complexityLevel = await imageRepository.getChildComplexityLevel(userId);
  }

  // 3. Prepare for and call LLM
  const prompts = generateImageAnalysisPrompt();
  const messages = [
    { role: 'system', content: prompts.system },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompts.user },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${processedImageBase64}` } }
      ]
    }
  ];

  const model = process.env.LLM_CAPTION_MODEL;
  const requestBody = {
    ...(model ? { model } : {}),
    messages,
    max_tokens: 1024
  };

  // 4. Generate the caption
  const llmResponse = await fetchLLMResponse(requestBody);
  const processedResponse = processLlmCompletion(llmResponse);

  // 5. Get the list of objects
  const objectNames = getObjectNames(processedResponse);

  // 6. Generate bounding box data, if there are at least 1 object
  let bbox = [];
  if (objectNames.length > 0) {
    const imageMetadata = {
      width: dimensions.width,
      height: dimensions.height,
      objects: processedResponse.objects
    }
    bbox = await generateBoundingBox(processedImageBase64, imageMetadata);

    // Add the bounding box data to the processed response
    processedResponse.objects = bbox;
  }

  // 7. Generate the detailed caption at the specified complexity level
  const captionPrompt = generateImageCaptionPrompt(processedResponse.objects, complexityLevel);

  const captionMessages = [
    { role: 'system', content: captionPrompt.system },
    {
      role: 'user',
      content: [
        { type: 'text', text: captionPrompt.user },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${processedImageBase64}` } }
      ]
    }
  ];

  const captionRequestBody = {
    ...(model ? { model } : {}),
    messages: captionMessages,
    max_tokens: 1024
  };

  const captionResponse = await fetchLLMResponse(captionRequestBody);

  // 8. Process the caption response
  const captionProcessedResponse = extractStringFromXMLTags(captionResponse, 'output');
  const formattedCaption = formatCaption(processedResponse, complexityLevel);

  // 9. Generate Speech
  const { audioBuffer, text: ttsText } = await generateSpeech(stripXMLTags(captionProcessedResponse));

  let objectAudioSavePromises = [];
  let objectsAudioForReturn = []; // For the return value { object, audio: base64 }
  let objectAudioDataForDB = [];  // For the database { object, filePath }

  for (const item of formattedCaption) {
    const objectName = item.object;
    // Generate speech for the object name
    const objectAudioResult = await generateSpeech(objectName);
    const objectAudioBuffer = objectAudioResult.audioBuffer;

    // Prepare data for the immediate return value (base64 encoded audio)
    objectsAudioForReturn.push({
      object: objectName,
      audio: objectAudioBuffer.toString('base64')
    });

    // Add a promise to save the audio file and collect its path
    // We wrap the fileStorage call in a promise that resolves with the object name and path
    objectAudioSavePromises.push(
      fileStorage.saveAudioFile(objectAudioBuffer).then(filePath => ({
        object: objectName,
        filePath: filePath
      }))
    );
  }

  // Wait for all object audio files to be saved
  // This populates objectAudioDataForDB with { object, filePath } pairs
  objectAudioDataForDB = await Promise.all(objectAudioSavePromises);

  // 10. Generate IDs and Save Files using Storage Service
  const imageSerial = uuidv4(); // Used for the image file name
  const chatId = uuidv4(); // Used as the primary key in the Image table (serial column)

  // Save files concurrently
  const [imageFileName, audioFileName] = await Promise.all([
    fileStorage.saveImageFile(processedImageBase64, imageSerial),
    fileStorage.saveAudioFile(audioBuffer)
  ]);

  // 11. Prepare and Store Metadata in Database using Repository
  const captionData = {
    text: processedResponse,
    bbox: bbox,
    detailedCaption: captionProcessedResponse,
    generatedAt: new Date().toISOString()
  };
  const metadata = {
    complexityLevel: complexityLevel,
    model: model ?? "Unknown"
  };

  const randomIndex = Math.floor(Math.random() * bbox.length);
    
  // Get the object name from the randomly selected bbox entry
  const correctAnswer = bbox[randomIndex].object;

  const challengeDetails = {
    bbox: bbox,
    correctAnswer: correctAnswer,
  }

  const recordData = {
    chatId: chatId,
    userId: userId,
    imageFileName: imageFileName,
    audioFileName: audioFileName, // File path for the main caption audio
    caption: captionData, // Contains original analysis, bbox, detailed caption text
    metadata: metadata,
    challengeDetails: challengeDetails,
    objectAudioPaths: objectAudioDataForDB // Add the new array of { object, filePath }
  };

  // Save the record to the database
  await imageRepository.saveImageRecord(recordData);

  // 12. Perform Post-Save Actions (Update last_seen, Broadcast)
  if (userType === 'Child') {
    await userRepository.updateLastSeen(userId);

    // Broadcast the new image caption
    try {
      const activeSessions = await sessionService.getActiveSessionsByChild(userId);
      if (activeSessions) {
        const sessionId = activeSessions.sessionId;
        broadcastImageCaption(chatId, userId, sessionId);
      }
    } catch (sessionError) {
      console.error(`Failed to get active sessions or broadcast for userId ${userId}:`, sessionError);
    }
  }

  return {
    imageId: imageSerial,
    caption: captionProcessedResponse,
    chatId: chatId,
    audio: audioBuffer.toString('base64'),
    bbox: formattedCaption,
    objectAudio: objectsAudioForReturn
  };
}

async function generateCaptionExplanation(caption, selectedText, userId, userType) {
  const prompts = generateExplanationPrompt(caption, selectedText);
  const messages = [
    {
      role: 'system',
      content: prompts.system
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompts.user
        }
      ]
    }
  ];

  const model = process.env.LLM_CAPTION_MODEL;
  const requestBody = {
    ...(model ? { model } : {}),
    messages
  };

  const llmResponse = await fetchLLMResponse(requestBody);

  return llmResponse;

}

/**
 * Checks whether the child user is allowed to upload images.
 *
 * @async
 * @param {string} userId - The unique ID of the child user.
 * @throws {Error} If the user is not allowed to upload images.
 */
async function checkChildCanUploadImage(userId) {
  const childDetails = await userRepository.getChildDetailsByUserId(userId);
  
  if (childDetails.canUploadImage == false) {
    throw new Error('This user is not allowed to upload images. Please contact your parent/guardian');
  }
}

/**
 * Retrieves the list of chat IDs for a specific user
 *
 * @async
 * @param {string} userId - The unique ID of the user
 * @returns {Promise<Array<string>>} Array of chat serial numbers, ordered by most recent first
 * @throws {Error} If there's an issue with database access
 */
async function getChatList(userId) {
  try {
    let images = await imageRepository.getSortedImages(userId);

    images = await Promise.all(
      images.map(async (image) => {
        const imageBuffer = await fileStorage.getImageFile(image.filePath);
        const imageBase64 = imageBuffer.toString('base64');
        const dataURL = `data:image/jpeg;base64,${imageBase64}`;

        return {
          chatId: image.serial,
          imageUrl: dataURL,
          caption: image.caption,
          uploadedAt: image.uploadedAt,
          isBookmarked: image.isBookmarked === 1,
          challengeDone: image.challengeDone,
          status: image.status,
        };
      })
    );

    return images;
  } catch (error) {
    console.error('Error processing images:', error);
    throw new Error('Could not retrieve image files.');
  }
}


/**
 * Retrieves the details of a specific chat/image record, including the image,
 * audio caption, and formatted text caption, ensuring user access rights.
 * It fetches metadata from the database via the repository and file data
 * via the storage service.
 *
 * @async
 * @param {string} chatId - The unique ID (serial) of the chat/image record.
 * @param {string} userId - The ID of the user requesting the chat details.
 * @returns {Promise<Object>} An object containing caption, bbox, image (base64), and audio (base64).
 * @throws {Error} If the chat is not found,   access is denied, or files are missing/corrupted.
 */
async function getChatById(chatId, userId) {
  const imageDetails = await imageRepository.getImageDetailsForUser(chatId, userId);
  if (!imageDetails) {

    throw new Error('Chat not found or access denied');
  }

  const { filePath, audioFilePath, caption, metadata, objectAudioPaths } = imageDetails;

  let complexityLevel = metadata.complexityLevel;
  const formattedCaptionResult = formatCaption(caption.text, complexityLevel);

  let filePromises = [];

  // Image and caption audio
  filePromises.push(fileStorage.getImageFile(filePath));
  filePromises.push(fileStorage.getAudioFile(audioFilePath));

  // Individual object audio files
  let objectAudioFetchPromises = [];
  if (Array.isArray(objectAudioPaths) && objectAudioPaths.length > 0) {
    objectAudioFetchPromises = objectAudioPaths.map(objAudio =>
      fileStorage.getAudioFile(objAudio.filePath)
        .then(buffer => ({
          object: objAudio.object,
          buffer: buffer
        }))
        .catch(err => {
          console.error(`Error retrieving object audio for ${objAudio.object} (${objAudio.filePath}):`, err);
          return { object: objAudio.object, buffer: null, error: true };
        })
    );
  }

  // 4. Retrieve files
  let imageBuffer, mainAudioBuffer, objectAudioResults;
  try {
    [imageBuffer, mainAudioBuffer] = await Promise.all(filePromises);
    objectAudioResults = await Promise.all(objectAudioFetchPromises);

  } catch (storageError) {
    console.error(`Error retrieving main files for chatId ${chatId}:`, storageError);
    throw new Error('Could not retrieve associated image or main audio file.');
  }

  // 5. Convert file buffers to base64 strings and format object audio
  const imageBase64 = imageBuffer.toString('base64');
  const mainAudioBase64 = mainAudioBuffer.toString('base64');

  // Process the results for object audio
  const objectAudioData = objectAudioResults
    .filter(result => !result.error && result.buffer) // Filter out any errors or null buffers
    .map(result => ({
      object: result.object,
      audio: result.buffer.toString('base64')
    }));

  // 6. Return the combined data, including the new objectAudio array
  return {
    caption: caption.detailedCaption,
    bbox: formattedCaptionResult,
    image: imageBase64,
    audio: mainAudioBase64,
    objectAudio: objectAudioData
  };
}

/**
 * Retrieves the details of a challenge for an image.
 *
 * @async
 * @param {string} chatId - The unique ID (serial) of the chat/image record.
 * @returns {Promise<Object>} An object containing caption, bbox, image (base64), and audio (base64).
 * @throws {Error} If the chat is not found,   access is denied, or files are missing/corrupted.
 */
async function getChallengeDetails(chatId) {
  // 1. Retrieve challenge details and verify access using the repository
  const imageDetails = await imageRepository.getChallengeDetails(chatId);

  if (!imageDetails) {
    throw new Error('Chat not found or access denied');
  }

  const { filePath, caption, challengeDetails } = imageDetails;

  // 2. Retrieve files from storage using the fileStorage service
  let imageBuffer;
  try {
    [imageBuffer] = await Promise.all([
      fileStorage.getImageFile(filePath),
    ]);
  } catch (storageError) {
    console.error(`Error retrieving files for chatId ${chatId}:`, storageError);
    throw new Error('Could not retrieve associated image or audio files.');
  }

  // 3. Convert file buffers to base64 strings
  const imageBase64 = imageBuffer.toString('base64');

  // 4. Return the combined data
  return {
    caption: caption.text.imageCaption,
    bbox: caption.bbox,
    image: imageBase64,
    challengeDetails: challengeDetails
  };
}

async function toggleBookmark(chatId, userId) {
  const bookmarkData = await imageRepository.getBookmarkStatus(chatId, userId);

  if (!bookmarkData) {
    throw new Error('Image not found or access denied');
  }

  const newBookmarkStatus = !bookmarkData.isBookmarked;

  await imageRepository.updateBookmarkStatus(chatId, userId, newBookmarkStatus);

  return newBookmarkStatus;
}

/**
 * Complete Challenge.
 */
async function challengeCompleted(chatId) {
  await imageRepository.challengeCompleted(chatId);
  return true;
}

/**
 * Soft deletes an image by marking its status as deleted in the database.
 *
 * @async
 * @param {string} chatId - The unique ID (serial) of the image record to delete.
 * @param {string} userId - The ID of the user requesting the deletion.
 * @returns {Promise<boolean>} - Returns true if the image record was successfully marked as deleted.
 * @throws {Error} - Throws an error if there is an issue with deletion.
 */
async function deleteImageRecordByChatId(chatId, userId) {
  try {
    const result = await imageRepository.deleteImageRecordByChatId(chatId, userId);
    return result;
  } catch (error) {
    // Here, you can handle or log the error in a way that suits your application
    console.error('Error deleting image record:', error.message);
    throw new Error('Could not delete image record. Please try again later.');
  }
}


module.exports = {
  generateImageCaption,
  generateCaptionExplanation,
  getChatList,
  getChatById,
  getChallengeDetails,
  toggleBookmark,
  challengeCompleted,
  deleteImageRecordByChatId,
  checkChildCanUploadImage
};
const fileStorage = require('../storage/fileStorage');
const imageRepository = require('../database/imageRepository');
const { generateMCQPrompt } = require('./llm-prompts');
const { extractStringFromXMLTags } = require('../utils/stringUtils');
const { fetchLLMResponse } = require('../external-apis/llm-api');
require('dotenv').config();

/**
 * Processes the raw LLM completion string to extract and validate the structured JSON output.
 * It first extracts the content within <output> tags, then parses and validates the JSON structure.
 * Logs errors to the console if extraction or validation fails.
 *
 * @param {string} responseText - The raw string response from the LLM.
 * @returns {Object} The validated JSON object if successful, or an empty object {} if any step fails.
 */
function processLlmCompletion(responseText) {
  let errors = [];

  // Extract content inside <output>...</output> tags
  const outputContent = extractStringFromXMLTags(responseText, 'output');
  if (!outputContent) {
    console.error("Validation Error: No <output> tag found in response.");
    return {};
  }

  // Extract JSON string from the code block
  const jsonBlockMatch = outputContent.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonBlockMatch || jsonBlockMatch.length < 2) {
    console.error("Validation Error: Could not find JSON code block within <output> content.");
    return {};
  }
  const jsonString = jsonBlockMatch[1].trim();

  let parsedData;
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    console.error("Validation Error: Failed to parse JSON string.", error);
    return {};
  }

  // Begin structural validation
  if (typeof parsedData !== 'object' || parsedData === null) {
    errors.push("Parsed data should be a non-null object.");
  }

  const { question, choices } = parsedData;

  if (typeof question !== 'string' || question.trim() === '') {
    errors.push("Missing or invalid 'question' field. It must be a non-empty string.");
  }

  if (typeof choices !== 'object' || choices === null) {
    errors.push("Missing or invalid 'choices' field. It must be an object.");
  } else {
    const { correctAnswer, otherChoices } = choices;

    if (typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
      errors.push("Missing or invalid 'correctAnswer'. It must be a non-empty string.");
    }

    if (!Array.isArray(otherChoices)) {
      errors.push("'otherChoices' must be an array.");
    } else {
      if (otherChoices.length !== 3) {
        errors.push("'otherChoices' must contain exactly 3 elements.");
      }
      for (let i = 0; i < otherChoices.length; i++) {
        if (typeof otherChoices[i] !== 'string' || otherChoices[i].trim() === '') {
          errors.push(`Invalid entry in 'otherChoices' at index ${i}. Each must be a non-empty string.`);
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("Validation Errors found:", errors.join("\n"));
    return {};
  }

  // If all checks pass, return the parsed data
  return parsedData;
}

/**
 * Generates a quiz based on the provided image.
 *
 * @async
 * @param {string} imageData - The raw image data, either as a base64 string
 * @returns {Promise<Object>} - The generated quiz object containing questions and answers.
 */
async function generateQuiz(imageData) {
  const prompts = generateMCQPrompt();

  const messages = [
    { role: 'system', content: prompts.system },
    {
      role: 'user',
      content: [
        { type: 'text', text: prompts.user },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
      ]
    }
  ];

  const model = process.env.LLM_CAPTION_MODEL;
  const requestBody = {
    model,
    messages,
    max_tokens: 2048,
    temperature: 1.3
  };

  const llmResponse = await fetchLLMResponse(requestBody);
  return processLlmCompletion(llmResponse);
}

/**
 * Generates quiz for all images, based on the given image uuids.
 *
 * @async
 * @param {Array<string>} chatIds - An array of image UUIDs.
 * @param {string} userId - The ID of the user requesting the quiz.
 * @returns {Promise<Object>} - The generated array of quiz objects containing questions and answers.
 */
async function generateQuizForAllImages(chatIds, userId) {
  const quizzes = [];
  for (const chatId of chatIds) {
    const imageDetails = await imageRepository.getImageDetailsForUser(chatId, userId);

    if (!imageDetails) {
      throw new Error('Chat not found or access denied');
    }

    const filePath = imageDetails.filePath;

    let imageBuffer;

    try {
      imageBuffer = await fileStorage.getImageFile(filePath);
    } catch (error) {
      console.error(`Error fetching image with UUID ${chatId}:`, error);
      continue;
    }

    const imageBase64 = imageBuffer.toString('base64');

    const quiz = await generateQuiz(imageBase64);
    if (Object.keys(quiz).length > 0) {
      quizzes.push(quiz);
    }
  }
  return quizzes;
}

module.exports = {
  generateQuizForAllImages
}
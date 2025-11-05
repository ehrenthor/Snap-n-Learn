require('dotenv').config();
const axios = require('axios');

const LLM_BASE_URL = process.env.LLM_BASE_URL;
const API_KEY = process.env.LLM_API_KEY;

/**
 * Sends a request to the appropriate LLM API (OpenAI, OpenRouter, or a local instance).
 * The function dynamically routes based on the LLM_BASE_URL and includes authentication when necessary.
 *
 * @param {Object} requestBody - The request payload containing messages and optional parameters.
 * @returns {Promise<Object>} - The response from the LLM API.
 */
async function fetchLLMResponse(requestBody) {
  if (!LLM_BASE_URL) {
    console.error('Error: LLM_BASE_URL is not set in the environment variables.');
    return 'Error: LLM_BASE_URL is not configured. Please set it in your environment variables.';
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
    };

    const response = await axios.post(`${LLM_BASE_URL}`,
      requestBody,
      { headers });
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      console.error(`Unexpected response format: ${JSON.stringify(response.data)}`);
      throw new Error('Unexpected response format from LLM API.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Request failed with status:', error.response.status);
    }
    console.error('Error details:', error.message);
    throw new Error('Failed to fetch response from the LLM API.');
  }
}

module.exports = { fetchLLMResponse };
const { fetchLLMResponse } = require('../external-apis/llm-api');
const { generateBoundingBoxPrompt } = require('./llm-prompts');
require('dotenv').config();

const extractJsonFromLLMResponse = (llmResponse) => {
  // Match content between ```json and ``` markers, accounting for possible whitespace
  const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/);

  if (!jsonMatch) {
    console.error(`LLM response does not contain a valid JSON code block.\nResponse: ${llmResponse}`);
    throw new Error("No JSON code block found in LLM response");
  }

  try {
    // Parse the extracted JSON content
    const jsonContent = jsonMatch[1].trim();
    const parsedData = JSON.parse(jsonContent);

    // Validate that the result is an array
    if (!Array.isArray(parsedData)) {
      throw new Error("Extracted JSON is not an array");
    }

    return parsedData;
  } catch (error) {
    console.error(`Failed to parse JSON: ${error.message}`);
    return [];
  }
};

async function generateBoundingBox(image, imageMetadata) {
  const prompts = generateBoundingBoxPrompt(imageMetadata);
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
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${image}`
          }
        }
      ]
    }
  ];

  // Call LLM API
  const model = process.env.LLM_BBOX_MODEL;
  const requestBody = {
    ...(model ? { model } : {}),
    messages,
    max_tokens: 1024
  };

  const llmResponse = await fetchLLMResponse(requestBody);
  const llmData = extractJsonFromLLMResponse(llmResponse);

  // Add incrementing id key
  llmData.forEach((item, index) => {
    item.id = index + 1;
  });

  return llmData;
}

module.exports = { generateBoundingBox };
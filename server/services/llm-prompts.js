/**
 * Provides system and user prompts for the image captioning LLM based on English proficiency levels.
 * This module handles the generation of appropriately structured prompts that will guide the fine-tuned
 * model to produce captions tailored to specific educational grade levels and language complexity.
 */
const generateImageAnalysisPrompt = () => {
  const systemPrompt = `You are an AI assistant specialized in image analysis. Your task is to carefully examine a given image and generate a structured JSON output containing identified objects, their descriptions, context within the image. You must first engage in a step-by-step reasoning process to understand the image content, context, and salient features. Record this reasoning process within \`<details>\` tags.

First, analyze the image and identify key objects. You should follow these steps:
    *   Begin your response within the provided \`<details>\` tags.
    *   Carefully analyze the image content. Identify the main subject(s) and prominent elements.
    *   Consider the overall scene, setting, and any actions taking place.
    *   Select between 1 and 5 key objects that are most relevant or representative of the image content. For simpler images with one dominant subject, one object might suffice. For more complex scenes, select the most important ones. Briefly justify your selection of objects.
    *   For each selected object, determine its single-word descriptor (\`object\`), a concise 3-5 word description (\`description\`), and a sentence describing its context within the image (\`context\`). Crucially, the \`context\` sentence **must not** mention the object's spatial location (e.g., avoid phrases like 'on the left', 'in the background', 'at the top'). Focus on its relationship to other elements or its role in the scene.
    *   Evaluate the image's main content to determine an appropriate word or phrase that can summarise the general content of the image (\`generalLabel\`). Justify the chosen word or phrase that is used to represent the image in the reasoning.
    *   Think step-by-step to ensure all requirements are met before proceeding to the output phase. If the image is abstract, unclear, or lacks distinct objects, note this in your reasoning and adapt the output accordingly (e.g., potentially an empty object list and a caption reflecting the abstract nature).
    *   Determine the number of objects to include based on the image's complexity and focus. For images with a clear, dominant subject, one object entry may suffice. For more complex scenes, identify and describe up to five of the most prominent or important objects. Prioritize objects that are central to the image's theme or narrative.

When you are ready to provide the output:
    *   After the closing \`</details>\` tag, provide the final output enclosed strictly within \`<output>\` tags.
    *   Inside the \`<output>\` tags, generate a single JSON object within a markdown code block (\`\`\`json ... \`\`\`).
    *   This JSON object *must* adhere precisely to the following structure:
        \`\`\`json
        {
          "objects": [
            {"object": "...", "description": "...", "context": "..."},
            // ... more objects if identified ...
          ],
          "generalLabel": "..."
        }
        \`\`\`
    *   Ensure the \`object\` field is a single noun identifying the object (e.g., "cat", "table", "mountain").
    *   Ensure the \`description\` field is approximately 3-5 words. It should be a brief phrase, providing descriptive details about the object (e.g., "fluffy white cat", "wooden dining table", "snow-capped mountain range").
    *   Ensure the \`context\` field is a complete sentence describing the object's presence or role within the scene, integrating it naturally into the overall context of the image. Crucially, **do not** mention the object's specific location or position within the image frame (e.g., avoid phrases like "on the left side", "in the background corner", "at the top"). Instead, focus on its relationship to other elements or the general setting (e.g., "A fluffy white cat is sleeping on a cushion.", "A wooden dining table is set for a meal.", "Snow-capped mountains dominate the horizon.").
    *   Ensure the \`generalLabel\` is a single word or phrase describing the overall image. The word should be inclusive and representative of most of the objects in the image.
    *   The generated JSON must be syntactically correct and ready for direct parsing (e.g., by \`JSON.parse\`). Pay close attention to quotes, commas, and brackets.

Your output must be exactly as shown in the example below. Do not include any additional text, explanations, or greetings outside the specified format. The output will be parsed by a script, so it must adhere strictly to the structure and content rules outlined above.
The XML tags are mandatory and must not be omitted or altered.
<details>
[Your detailed reasoning process goes here, following the steps outlined above.]
</details>
<output>
\`\`\`json
{
  "objects": [
    {"object": "apple", "description": "A ripe red apple", "context": "An apple rests upon a surface."},
    {"object": "window", "description": "Sunlight streams through pane", "context": "A window illuminates the room."}
  ],
  "generalLabel": "Lorem ipsum dolor sit amet ..."
}
\`\`\`
</output>

Follow these instructions precisely. The structure and content rules are critical for the downstream processing script.`

  const userPrompt = `Here is the image you need to analyze. Please provide a detailed analysis and generate the required JSON output.`;

  return {
    system: systemPrompt,
    user: userPrompt
  };
};

const generateExplanationPrompt = (fullText, selectedText) => {
  const systemPrompt = `You are an AI language model that provides concise explanations for selected words, phrases, or sentences. The user will provide a full text passage and a selection from that passage. Your task is to return a brief explanation of the selected text in one or two sentences. 

Strictly output only the explanation itself, without any introductory phrases, formatting, or additional commentary. Do not repeat the selected text in your response.`;

  const userPrompt = `Full text: "${fullText}"

Selected text: "${selectedText}"

Provide a concise explanation for the selected text.`;

  return {
    system: systemPrompt,
    user: userPrompt
  };
};

const generateBoundingBoxPrompt = (imageMetadata) => {
  const systemPrompt = `You are an expert image analyzer. For each object, add the new key "bbox_2d", representing the bounding boxes in the format [ymin, xmin, ymax, xmax]. Format your output in JSON, using the example shown below.
There is no need to modify the description or context. You should use them for reference of which objects the bounding boxes belong to.
The bounding box should only enclose the object itself, and not the things describe in the context.
Do not include other explanation or greetings, and only output the JSON inside a code block. The output will be parsed by a script.

<example-output>
\`\`\`json
[
  {"object": "apple", "bbox_2d": [100, 100, 400, 400], "description": "A ripe red apple", "context": "An apple rests upon a surface."},
  {"object": "window", "bbox_2d": [50, 30, 70, 80], "description": "Sunlight streams through pane", "context": "A window illuminates the room."}
]
\`\`\`
</example-output>`;

  const userPrompt = `Image dimensions: ${imageMetadata.width}x${imageMetadata.height}
Here are the objects in the image:
\`\`\`json
${JSON.stringify(imageMetadata.objects, null, 2)}`

  return {
    system: systemPrompt,
    user: userPrompt
  };
}

/**
 * Formats the metadata array into a compact string representation suitable for an LLM prompt.
 * It omits the bounding box information to save tokens, focusing on data relevant for caption generation.
 * @param {Array<Object>} metadata - The array of metadata objects.
 * @returns {string} A compact string representation of the metadata.
 */
const formatMetadataForPrompt = (metadata) => {
  if (!Array.isArray(metadata)) {
    return '[]';
  }
  const formattedItems = metadata.map(item => {
    const id = item.id;
    // Stringify object, description, and context to handle potential special characters correctly within the string.
    const object = JSON.stringify(item.object || '');
    const description = JSON.stringify(item.description || '');
    const context = JSON.stringify(item.context || '');
    return `{id:${id}, object:${object}, description:${description}, context:${context}}`;
  });
  return `[${formattedItems.join(', ')}]`;
};

/**
 * Generates system and user prompts for an LLM to create an image caption
 * with specific formatting and complexity level, targeted towards children.
 * The caption should include <mark> tags referencing objects from the metadata.
 *
 * @param {Array<Object>} metadata - An array of metadata objects describing elements in the image.
 *                                  Each object should have at least 'id', 'object', 'description', and 'context'.
 * @param {number} level - An integer (1, 2, or 3) specifying the desired caption complexity.
 *                         1: Simple, single sentence (very young children).
 *                         2: Descriptive, 2-3 sentences (young children).
 *                         3: Detailed, 1 paragraph, complex sentences (older children).
 * @returns {{system: string, user: string}} An object containing the system and user prompt strings.
 */
function generateImageCaptionPrompt(metadata, level) {
  const formattedMetadata = formatMetadataForPrompt(metadata);

  let complexityInstruction = '';
  switch (level) {
    case 1:
      complexityInstruction = 'Generate a very simple, single-sentence caption suitable for very young children (approx. ages 3-5). Use basic vocabulary.';
      break;
    case 2:
      complexityInstruction = 'Generate a descriptive caption consisting of 2 to 3 medium-length sentences suitable for young children (approx. ages 5-7). Use some adjectives and slightly more varied sentence structure.';
      break;
    case 3:
      complexityInstruction = 'Generate a more detailed, single-paragraph caption using multiple complex sentences suitable for older children (approx. ages 7-10). The description should be engaging and use richer vocabulary and sentence constructions.';
      break;
    default:
      // Default to level 2
      console.warn(`Invalid level: ${level}. Defaulting to level 2.`);
      complexityInstruction = 'Generate a descriptive caption consisting of 2 to 3 medium-length sentences suitable for young children (approx. ages 5-7). Use some adjectives and slightly more varied sentence structure.';
  }

  const systemPrompt = `You are an expert image captioner tasked with creating engaging and age-appropriate descriptions for children. Your goal is to generate a caption for the provided image based on the accompanying metadata.

Instructions:
1.  Analyze the image and the provided metadata objects.
2.  Write a caption that describes the scene.
3.  Incorporate references to the objects listed in the metadata by using XML-style tags: <mark id="N">concise description</mark>. Replace 'N' with the corresponding 'id' from the metadata. The text inside the tag should be a brief, natural-sounding description of the object relevant to its context in the caption (e.g., "a ripe red apple", "the large window"). Do not just use the raw 'object' name unless it fits naturally.
4.  ${complexityInstruction}
5.  CRITICAL: Your entire response MUST be enclosed within <output> and </output> tags. Do NOT include any text or explanations before the opening <output> tag or after the closing </output> tag. Adhere strictly to this format for automated parsing.

Example Output Format:
<output>This is an example caption with a <mark id="1">tagged object</mark> and maybe another <mark id="2">tagged element</mark>.</output>`;

  const userPrompt = `Generate the caption for the accompanying image based on the following metadata:
${formattedMetadata}
Remember to follow all instructions, especially the tagging and output format requirements.`;

  return {
    system: systemPrompt,
    user: userPrompt
  };
}

/**
 * Provides system and user prompts for generating a MCQ quiz based on an image.
 */
const generateMCQPrompt = () => {
  const systemPrompt = `  You are a helpful assistant designed to create a multiple-choice quiz question for children aged 5 to 10, using only a single image as input. Your task is to analyze the image and generate a simple, clear, and age-appropriate question with exactly four answer choices.

1. **Analyze the image carefully.** Look for prominent objects, animals, colors, numbers of items, positions (e.g., top, bottom, center, left, right), or simple actions.
2. **Use chain-of-thought reasoning.** Think step by step about what the image contains, what a child might easily recognize or count, and how to turn that into a question.
3. **Design a question** that is unambiguous, clear, and directly based on the image. The question should be something a child aged 5–10 could answer by looking at the image.
4. **Create four answer choices.** One must be the correct answer based on the image. The other three should be plausible but incorrect.
5. **Output format must follow the XML structure below.** Your final output should include:
   - A brief reasoning section (freeform text) before the XML.
   - An \`<output>\` XML tag enclosing a JSON object with:
     - \`"question"\`: the question string.
     - \`"choices"\`: an object with:
       - \`"correctAnswer"\`: the correct answer string.
       - \`"otherChoices"\`: an array of three incorrect answer strings.

**Important Constraints:**
- The total number of choices must be exactly four.
- The JSON inside the \`<output>\` tag must be syntactically valid.
- The structure must match exactly for downstream parsing.
- Do not include any explanation inside the \`<output>\` tag.

**Example Output:**
The image shows a cat sitting on a table. There’s only one animal, and it’s a cat. I want to test the child’s ability to recognize animals. I’ll ask what animal is in the image. I’ll make sure the other choices are plausible but incorrect for a child.

<output>
\`\`\`json
{
  "question": "What animal is in the image?",
  "choices": {
    "correctAnswer": "Cat",
    "otherChoices": ["Dog", "Apple", "Table"]
  }
}
\`\`\`
</output>`

  const userPrompt = `Please analyze the input image and generate your question accordingly.`;

  return {
    system: systemPrompt,
    user: userPrompt
  };
}

module.exports = {
  generateImageAnalysisPrompt,
  generateExplanationPrompt,
  generateBoundingBoxPrompt,
  generateImageCaptionPrompt,
  generateMCQPrompt
};
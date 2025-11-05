const axios = require('axios');

/**
 * Creates a minimal silent MP3 buffer.
 * This generates a properly formatted MP3 file containing silence.
 *
 * @returns {Buffer} A buffer containing a valid silent MP3 file
 */
const createSilentMp3 = () => {
  // Minimal MP3 header for silence (MPEG-1 Layer 3, 32 kbps, 44100 Hz, mono)
  const silentMp3Hex = 'FFFB902064000000000000000000000000000000000000000000000000000000';
  return Buffer.from(silentMp3Hex, 'hex');
}

/**
 * Generates speech audio from text using an external TTS API.
 * Returns the audio buffer and the original text without saving to disk.
 * If TTS_BASE_URL is not configured, returns a silent MP3.
 *
 * @param {string} text - The text to be converted into speech.
 * @returns {Promise<{ audioBuffer: Buffer, text: string }>} - The audio buffer and original text.
 */
async function generateSpeech(text) {
  if (!text) {
    throw new Error('Input text is required for TTS.');
  }

  const apiUrl = process.env.TTS_BASE_URL;
  const apiKey = process.env.TTS_API_KEY || ''; // Used for OpenAI or potentially other secured local TTS

  if (!apiUrl) {
    console.warn('TTS_BASE_URL environment variable is missing. Returning silent audio.');
    return {
      audioBuffer: createSilentMp3(), // Provide a fallback silent audio
      text
    };
  }

  let requestConfig;
  let ttsProvider = 'unknown';

  try {
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      ttsProvider = 'local';
      requestConfig = {
        method: 'POST',
        url: `${apiUrl}/audio/speech`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          model: process.env.LOCAL_TTS_MODEL || 'kokoro',
          input: text,
          voice: process.env.LOCAL_TTS_VOICE || 'af_heart'
        },
        responseType: 'arraybuffer'
      };
    } else if (apiUrl === 'https://api.openai.com/v1') {
      // Configuration for OpenAI TTS
      ttsProvider = 'openai';
      if (!apiKey) {
        throw new Error('OpenAI API key (TTS_API_KEY) is required when using OpenAI TTS.');
      }
      requestConfig = {
        method: 'POST',
        url: `${apiUrl}/audio/speech`,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'gpt-4o-mini-tts',
          input: text,
          voice: 'fable',
          instruction: `Voice: Deep and rugged, with a hearty, boisterous quality, like a seasoned sea captain who's seen many voyages.

Tone: Friendly and spirited, with a sense of adventure and enthusiasm, making every detail feel like part of a grand journey.

Dialect: Classic pirate speech with old-timey nautical phrases, dropped "g"s, and exaggerated "Arrrs" to stay in character.

Pronunciation: Rough and exaggerated, with drawn-out vowels, rolling "r"s, and a rhythm that mimics the rise and fall of ocean waves.

Features: Uses playful pirate slang, adds dramatic pauses for effect, and blends hospitality with seafaring charm to keep the experience fun and immersive.`,
          response_format: 'mp3'
        },
        responseType: 'arraybuffer'
      };
    } else {
      throw new Error(`Unsupported TTS provider configured at TTS_BASE_URL: ${apiUrl}`);
    }

    // Make the API request
    const response = await axios(requestConfig);

    // Check for successful response status if needed (axios throws for non-2xx by default)
    // if (response.status >= 200 && response.status < 300) {
    return { audioBuffer: Buffer.from(response.data), text };
    // } else {
    //   // This part might be redundant if axios error handling is sufficient
    //   throw new Error(`TTS API request failed with status ${response.status}: ${response.statusText}`);
    // }

  } catch (error) {
    let errorMessage = `TTS API request failed for provider '${ttsProvider}'. `;
    if (axios.isAxiosError(error)) {
      errorMessage += `Status: ${error.response?.status || 'N/A'}. `;
      // Attempt to parse error data if it's JSON from the API provider
      if (error.response?.data) {
        try {
          // OpenAI errors are often JSON, try to parse them
          // If the response was arraybuffer, it might need decoding first if it's an error payload
          let errorData = error.response.data;
          if (error.response.request?.responseType === 'arraybuffer' && error.response.headers['content-type']?.includes('json')) {
            errorData = JSON.parse(Buffer.from(errorData).toString('utf-8'));
          }
          errorMessage += `Details: ${JSON.stringify(errorData.error?.message || errorData)}`;
        } catch (parseError) {
          // If parsing fails, just include the raw status text or default message
          errorMessage += `Message: ${error.response?.statusText || error.message}`;
        }
      } else {
        errorMessage += `Message: ${error.message}`;
      }
    } else {
      // Handle non-axios errors (e.g., configuration errors thrown above)
      errorMessage = error.message;
    }
    console.error(errorMessage); // Log the detailed error
    // Consider whether to return silent audio on failure or re-throw
    // Re-throwing might be better to signal the failure upstream
    throw new Error(errorMessage);
    // Or return silent audio:
    // console.warn('TTS generation failed. Returning silent audio.');
    // return {
    //   audioBuffer: createSilentMp3(),
    //   text
    // };
  }
}

module.exports = { generateSpeech };

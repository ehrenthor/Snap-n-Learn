const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// --- Configuration ---
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const useS3 = S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET_NAME;

// Declare variables needed for S3, but only require/initialize if useS3 is true
let S3Client, PutObjectCommand, GetObjectCommand, s3Client;

if (useS3) {
  try {
    // Only require the SDK if we are actually configured to use S3
    const awsSdkS3 = require("@aws-sdk/client-s3");
    S3Client = awsSdkS3.S3Client;
    PutObjectCommand = awsSdkS3.PutObjectCommand;
    GetObjectCommand = awsSdkS3.GetObjectCommand;

    s3Client = new S3Client({
      forcePathStyle: false, // Configures to use subdomain/virtual calling format.
      endpoint: "https://sgp1.digitaloceanspaces.com",
      region: "us-east-1",
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      }
    });
  } catch (error) {
    console.error("FATAL: S3 environment variables are set, but '@aws-sdk/client-s3' module is not installed or failed to load.", error);
    console.error("Please install the SDK using: npm install @aws-sdk/client-s3");
    process.exit(1); // Exit if S3 is configured but module missing
  }
}

// Define base directories for local uploads relative to this file's location
const BASE_LOCAL_UPLOAD_DIR = path.join(__dirname, '../uploads');
const LOCAL_IMAGE_DIR = path.join(BASE_LOCAL_UPLOAD_DIR, 'images');
const LOCAL_AUDIO_DIR = path.join(BASE_LOCAL_UPLOAD_DIR, 'audio');

// Define base paths for S3 keys (used only if useS3 is true)
const S3_IMAGE_PREFIX = 'images/';
const S3_AUDIO_PREFIX = 'audio/';

// Ensure local directories exist only if using local storage
if (!useS3) {
  try {
    fsSync.mkdirSync(LOCAL_IMAGE_DIR, { recursive: true });
    fsSync.mkdirSync(LOCAL_AUDIO_DIR, { recursive: true });
  } catch (err) {
    console.error("FATAL: Failed to create local storage directories. Check permissions and path.", err);
    process.exit(1);
  }
}

/**
 * Helper function to save data either locally or to S3.
 * Assumes S3 variables (s3Client, PutObjectCommand) are initialized if useS3 is true.
 * @param {string} storageKey - The filename for local storage or the S3 key.
 * @param {Buffer} dataBuffer - The data buffer to save.
 * @param {string} contentType - The MIME type of the content (relevant for S3).
 * @param {string} localDirPath - The local directory path if saving locally.
 */
async function _saveFile(storageKey, dataBuffer, contentType, localDirPath) {
  if (useS3) {
    // Save to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storageKey,
      Body: dataBuffer,
      ContentType: contentType,
      ACL: 'private',
    });
    try {
      await s3Client.send(command);
    } catch (error) {
      console.error(`Error uploading ${storageKey} to S3:`, error);
      throw new Error(`Failed to save file to S3: ${storageKey}`);
    }
  } else {
    // Save locally
    const localFilePath = path.join(localDirPath, path.basename(storageKey)); // Ensure only filename used for local path
    try {
      await fs.writeFile(localFilePath, dataBuffer);
    } catch (error) {
      console.error(`Error saving file ${storageKey} locally:`, error);
      throw new Error(`Failed to save file locally: ${storageKey}`);
    }
  }
}

/**
 * Helper function to retrieve data either from local storage or S3.
 * Assumes S3 variables (s3Client, GetObjectCommand) are initialized if useS3 is true.
 * @param {string} storageKey - The filename for local storage or the S3 key.
 * @param {string} localDirPath - The local directory path if retrieving locally.
 * @returns {Promise<Buffer>} - The retrieved data buffer.
 */
async function _getFile(storageKey, localDirPath) {
  if (useS3) {
    // Get from S3 (storageKey includes prefix)
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: storageKey,
    });
    try {
      const response = await s3Client.send(command);
      const stream = response.Body;
      if (!stream) {
        throw new Error(`S3 GetObject response body is empty for key: ${storageKey}`);
      }
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        console.error(`Error retrieving file from S3: Key ${storageKey} not found.`);
        throw new Error(`Could not retrieve file: ${storageKey} (Not Found)`);
      }
      console.error(`Error retrieving file ${storageKey} from S3:`, error);
      throw new Error(`Could not retrieve file from S3: ${storageKey}`);
    }
  } else {
    // Get from local (storageKey is just the filename)
    const localFilePath = path.join(localDirPath, storageKey);
    try {
      const data = await fs.readFile(localFilePath);
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`Error retrieving local file: ${localFilePath} not found.`);
        throw new Error(`Could not retrieve file: ${storageKey} (Not Found)`);
      }
      console.error(`Error retrieving local file ${storageKey}:`, error);
      throw new Error(`Could not retrieve local file: ${storageKey}`);
    }
  }
}

async function saveImageFile(imageDataBase64, imageSerial) {
  const imageFileName = `${imageSerial}.jpg`;
  // Key includes prefix only if using S3
  const storageKey = useS3 ? `${S3_IMAGE_PREFIX}${imageFileName}` : imageFileName;
  const imageBuffer = Buffer.from(imageDataBase64, 'base64');

  await _saveFile(storageKey, imageBuffer, 'image/jpeg', LOCAL_IMAGE_DIR);
  return storageKey;
}

async function saveAudioFile(audioBuffer) {
  const uniqueFileName = `${uuidv4()}.mp3`;
  // Key includes prefix only if using S3
  const storageKey = useS3 ? `${S3_AUDIO_PREFIX}${uniqueFileName}` : uniqueFileName;

  await _saveFile(storageKey, audioBuffer, 'audio/mpeg', LOCAL_AUDIO_DIR);
  return storageKey;
}

async function getImageFile(storageKey) {
  return await _getFile(storageKey, LOCAL_IMAGE_DIR);
}

async function getAudioFile(storageKey) {
  return await _getFile(storageKey, LOCAL_AUDIO_DIR);
}

module.exports = {
  saveImageFile,
  saveAudioFile,
  getImageFile,
  getAudioFile
};
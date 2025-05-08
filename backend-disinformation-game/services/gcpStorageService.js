const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

// Initialize Google Cloud Storage
let storage;

// If using JSON key file
if (process.env.GCP_KEY_FILE) {
  storage = new Storage({
    keyFilename: process.env.GCP_KEY_FILE
  });
} else {
  // Using environment variables
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });
}

// Bucket names (equivalent to container names in Azure)
const bucketNames = {
  images: 'disinformation-game-images',
  profiles: 'disinformation-game-profiles',
  data: 'disinformation-game-data'
};

/**
 * Get a readable stream from a file in GCP Storage
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @returns {Promise<ReadableStream>} - A readable stream of the file
 */
async function getFileStream(bucketName, fileName) {
  try {
    const bucket = storage.bucket(bucketNames[bucketName]);
    const file = bucket.file(fileName);
    
    return file.createReadStream();
  } catch (error) {
    console.error(`Error getting file stream for ${bucketNames[bucketName]}/${fileName}:`, error);
    throw error;
  }
}

/**
 * Get public URL for a file in GCP Storage
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @returns {string} - Public URL for the file
 */
function getFileUrl(bucketName, fileName) {
  // Using your backend API as a proxy, similar to Azure approach
  return `http://localhost:3001/api/media/${bucketName}/${encodeURIComponent(fileName)}`;
}

/**
 * Upload a file to GCP Storage
 * @param {string} bucketName - Bucket name
 * @param {string} fileName - File name
 * @param {Buffer|ReadableStream} content - File content
 * @param {Object} options - Upload options
 * @returns {Promise<void>}
 */
async function uploadFile(bucketName, fileName, content, options = {}) {
  try {
    const bucket = storage.bucket(bucketNames[bucketName]);
    const file = bucket.file(fileName);
    
    await file.save(content, options);
    console.log(`File ${fileName} uploaded to ${bucketNames[bucketName]}`);
  } catch (error) {
    console.error(`Error uploading file ${fileName} to ${bucketNames[bucketName]}:`, error);
    throw error;
  }
}

module.exports = {
  getFileStream,
  getFileUrl,
  uploadFile,
  bucketNames
};
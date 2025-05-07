const { BlobServiceClient } = require("@azure/storage-blob");
require('dotenv').config();

// Get connection string from environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

// Create the BlobServiceClient object
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Container names
const containerNames = {
  images: 'downloaded-images',
  profiles: 'profile-pics',
  data: 'data'
};

/**
 * Get a readable stream from a blob
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name
 * @returns {Promise<ReadableStream>} - A readable stream of the blob
 */
async function getBlobStream(containerName, blobName) {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const downloadResponse = await blobClient.download();
    return downloadResponse.readableStreamBody;
  } catch (error) {
    console.error(`Error getting blob stream for ${containerName}/${blobName}:`, error);
    throw error;
  }
}

/**
 * Get public URL for a blob
 * @param {string} containerName - Container name
 * @param {string} blobName - Blob name
 * @returns {string} - Public URL for the blob
 */
function getBlobUrl(containerName, blobName) {
    return `http://localhost:3001/api/media/${containerName}/${encodeURIComponent(blobName)}`;
  }

module.exports = {
  getBlobStream,
  getBlobUrl,
  containerNames
};
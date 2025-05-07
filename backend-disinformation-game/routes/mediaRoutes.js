const express = require('express');
const { BlobServiceClient } = require("@azure/storage-blob");
require('dotenv').config();

const router = express.Router();
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

router.get('/:container/:blobName', async (req, res) => {
  try {
    const { container, blobName } = req.params;
    const containerClient = blobServiceClient.getContainerClient(container);
    const blobClient = containerClient.getBlobClient(decodeURIComponent(blobName));
    
    const downloadResponse = await blobClient.download();
    
    // Set appropriate content type based on file extension
    const fileExtension = blobName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg'].includes(fileExtension)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (fileExtension === 'png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (fileExtension === 'gif') {
      res.setHeader('Content-Type', 'image/gif');
    }
    
    downloadResponse.readableStreamBody.pipe(res);
    console.log(`Serving ${blobName} from ${container} container`);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(500).send('Error retrieving media');
  }
});

module.exports = router;
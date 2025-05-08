const express = require('express');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const router = express.Router();
const { bucketNames } = require('../services/gcpStorageService');

// Initialize Google Cloud Storage
let storage;
if (process.env.GCP_KEY_FILE) {
  storage = new Storage({
    keyFilename: process.env.GCP_KEY_FILE
  });
} else {
  storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
  });
}

router.get('/:bucket/:fileName', async (req, res) => {
  try {
    const { bucket, fileName } = req.params;
    const decodedFileName = decodeURIComponent(fileName);
    
    console.log(`Attempting to serve: ${bucket}/${decodedFileName}`);
    
    // Get the actual bucket name from our mapping
    const actualBucketName = bucketNames[bucket];
    if (!actualBucketName) {
      console.error(`Invalid bucket type: ${bucket}`);
      return res.status(404).send('Bucket not found');
    }
    
    const bucketObj = storage.bucket(actualBucketName);
    const file = bucketObj.file(decodedFileName);
    
    // Check if file exists before streaming
    const [exists] = await file.exists();
    if (!exists) {
      console.error(`File not found in GCP: ${decodedFileName}`);
      
      // Try local fallback if available
      const localDir = path.join(__dirname, '..', 'temp');
      const localPath = path.join(localDir, decodedFileName);
      
      if (fs.existsSync(localPath)) {
        console.log(`Serving local file instead: ${localPath}`);
        
        // Set appropriate content type
        const fileExtension = decodedFileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg'].includes(fileExtension)) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (fileExtension === 'png') {
          res.setHeader('Content-Type', 'image/png');
        } else if (fileExtension === 'gif') {
          res.setHeader('Content-Type', 'image/gif');
        } else if (fileExtension === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
        }
        
        return fs.createReadStream(localPath).pipe(res);
      }
      
      // Check for file in other directory structures
      const profileDir = path.join(__dirname, '..', 'temp', 'profile_pics');
      const profilePath = path.join(profileDir, decodedFileName);
      
      if (fs.existsSync(profilePath)) {
        console.log(`Serving profile pic: ${profilePath}`);
        return fs.createReadStream(profilePath).pipe(res);
      }
      
      const imagesDir = path.join(__dirname, '..', 'temp', 'downloaded_images');
      const imagePath = path.join(imagesDir, decodedFileName);
      
      if (fs.existsSync(imagePath)) {
        console.log(`Serving downloaded image: ${imagePath}`);
        return fs.createReadStream(imagePath).pipe(res);
      }
      
      return res.status(404).send('File not found');
    }
    
    // Set appropriate content type based on file extension
    const fileExtension = decodedFileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg'].includes(fileExtension)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (fileExtension === 'png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (fileExtension === 'gif') {
      res.setHeader('Content-Type', 'image/gif');
    } else if (fileExtension === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    }
    
    // Stream the file directly to the response
    const fileStream = file.createReadStream();
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).send('Error retrieving file');
    });
    
    fileStream.pipe(res);
    console.log(`Successfully serving ${decodedFileName} from ${actualBucketName} bucket`);
  } catch (error) {
    console.error('Error serving media:', error);
    res.status(500).send('Error retrieving media');
  }
});

module.exports = router;
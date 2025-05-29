const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

// Initialize Google Cloud Storage
let storage;
const keyPath = path.join(__dirname, '..', 'GCP_KEYS.json');

// Initialize the storage client
try {
  if (fs.existsSync(keyPath)) {
    console.log('Using service account from:', keyPath);
    storage = new Storage({ keyFilename: keyPath });
  } else {
    console.log('Using environment credentials for GCP');
    storage = new Storage();
  }
} catch (error) {
  console.error('Failed to initialize GCP Storage:', error);
}

// Bucket names
const buckets = {
  images: 'disinformation-game-images',
  profiles: 'disinformation-game-profiles',
  data: 'disinformation-game-data'
};

// Debug route to list files in buckets
router.get('/storage/:bucketName', async (req, res) => {
  try {
    const bucketName = buckets[req.params.bucketName];
    if (!bucketName) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    console.log(`Listing files in bucket: ${bucketName}`);
    const [files] = await storage.bucket(bucketName).getFiles();
    
    const fileList = files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      contentType: file.metadata.contentType,
      updated: file.metadata.updated,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`
    }));

    res.json({
      bucket: bucketName,
      fileCount: files.length,
      files: fileList
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/storage/:bucketName/file', async (req, res) => {
  try {
    const bucketName = buckets[req.params.bucketName];
    if (!bucketName) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    const fileName = req.query.path;
    if (!fileName) {
      return res.status(400).json({ error: 'File path is required as a query parameter' });
    }

    console.log(`Getting file info: ${bucketName}/${fileName}`);
    
    const file = storage.bucket(bucketName).file(fileName);
    const [exists] = await file.exists();
    
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const [metadata] = await file.getMetadata();
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });
    
    res.json({
      name: file.name,
      metadata,
      signedUrl,
      publicUrl: `https://storage.googleapis.com/${bucketName}/${file.name}`
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: error.message });
  }
});



// Check a specific media file to see the exact path structure
router.get('/test-media-path', async (req, res) => {
  try {
    const mediaPath = req.query.path;
    if (!mediaPath) {
      return res.status(400).json({ 
        error: 'Missing path parameter',
        usage: '/api/debug/test-media-path?path=media/123/456/789/tweet_123.jpg'
      });
    }

    console.log('Testing media path:', mediaPath);

    const bucketNames = [
      'disinformation-game-images',
      'disinformation-game-media'
    ];
    
    const results = [];
    
    for (const bucketName of bucketNames) {
      try {
        const file = storage.bucket(bucketName).file(mediaPath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [metadata] = await file.getMetadata();
          const publicUrl = `https://storage.googleapis.com/${bucketName}/${mediaPath}`;
          
          results.push({
            bucket: bucketName,
            path: mediaPath,
            exists: true,
            publicUrl,
            metadata: {
              contentType: metadata.contentType,
              size: metadata.size,
              updated: metadata.updated
            }
          });
        } else {
          results.push({
            bucket: bucketName,
            path: mediaPath,
            exists: false
          });
        }
      } catch (error) {
        results.push({
          bucket: bucketName,
          path: mediaPath,
          error: error.message
        });
      }
    }

    res.json({
      query: mediaPath,
      results
    });
  } catch (error) {
    console.error('Error testing media path:', error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/first-match', async (req, res) => {
  try {
    const prefix = req.query.prefix;
    
    if (!prefix || prefix.length < 5) {
      return res.status(400).json({ 
        error: 'Missing or too short prefix parameter'
      });
    }
    
    console.log(`Looking for files with name containing: ${prefix}`);
    
    const bucketName = 'disinformation-game-images';
    
    // Try to find the file with a maxResults of 1
    const [files] = await storage.bucket(bucketName).getFiles({
      maxResults: 1
    });
    
    // Filter files that contain the prefix in their name
    const matchingFiles = files.filter(file => 
      file.name.includes(prefix)
    );
    
    if (matchingFiles.length > 0) {
      // If  found  match, stream  directly
      const file = matchingFiles[0];
      console.log(`Found match: ${file.name}`);
      
      const [metadata] = await file.getMetadata();
      if (metadata.contentType) {
        res.setHeader('Content-Type', metadata.contentType);
      }
      
      // Stream the file contents
      file.createReadStream().pipe(res);
    } else {
      res.status(404).json({ 
        error: 'No matching files found',
        prefix: prefix
      });
    }
  } catch (error) {
    console.error('Error finding matching file:', error);
    res.status(500).json({ error: error.message });
  }
});


// Test GCP credentials
router.get('/test-gcp-auth', async (req, res) => {
  try {
    const bucket = storage.bucket('disinformation-game-images');
    const [exists] = await bucket.exists();
    
    if (exists) {
      const [metadata] = await bucket.getMetadata();
      res.json({
        success: true,
        message: 'GCP authentication successful',
        bucketExists: true,
        bucketName: 'disinformation-game-images',
        metadata: {
          created: metadata.timeCreated,
          location: metadata.location,
          storageClass: metadata.storageClass
        },
        serviceAccount: keyPath
      });
    } else {
      res.json({
        success: false,
        message: 'GCP authentication successful but bucket not found',
        bucketExists: false,
        serviceAccount: keyPath
      });
    }
  } catch (error) {
    console.error('GCP auth test failed:', error);
    res.status(500).json({
      success: false,
      message: 'GCP authentication failed',
      error: error.message,
      serviceAccount: keyPath,
      stackTrace: error.stack
    });
  }
});

// Test specific image path with streaming
router.get('/test-stream-image', async (req, res) => {
  const imagePath = req.query.path || 'media/1389644909142069258/tweet_1389644909142069258_media_0.jpg';
  
  try {
    console.log(`Testing image streaming for: ${imagePath}`);
    const bucket = storage.bucket('disinformation-game-images');
    const file = bucket.file(imagePath);
    
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in GCP bucket',
        path: imagePath
      });
    }
    
    // Get content type
    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType);
    
    // Stream  file
    console.log('Streaming image file through backend...');
    file.createReadStream()
      .on('error', (err) => {
        console.error('Stream error:', err);
       
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file',
            error: err.message
          });
        }
      })
      .pipe(res);
      
  } catch (error) {
    console.error('Test stream failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stream image',
      error: error.message
    });
  }
});

// List files in specific path
router.get('/list-path', async (req, res) => {
  const prefix = req.query.prefix || 'media/';
  const maxResults = parseInt(req.query.limit || '10');
  
  try {
    console.log(`Listing files with prefix: ${prefix}`);
    const [files] = await storage.bucket('disinformation-game-images').getFiles({
      prefix: prefix,
      maxResults: maxResults
    });
    
    res.json({
      success: true,
      count: files.length,
      prefix: prefix,
      files: files.map(file => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        updated: file.metadata.updated,
        apiUrl: `/api/media/images?path=${encodeURIComponent(file.name)}`
      }))
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing files',
      error: error.message
    });
  }
});



router.get('/echo', (req, res) => {
  console.log('ECHO REQUEST RECEIVED:', req.query);
  res.json({
    received: true,
    query: req.query,
    timestamp: new Date().toISOString()
  });
});


module.exports = router;
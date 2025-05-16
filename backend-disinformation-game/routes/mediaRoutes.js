const express = require('express');
const path = require('path');
const fs = require('fs');
const { Storage } = require('@google-cloud/storage');
const router = express.Router();

// Initialize Google Cloud Storage with the same service account
let storage;
const keyPath = path.join(__dirname, '..', 'GCP_KEYS.json');

try {
  if (fs.existsSync(keyPath)) {
    console.log('Media routes using service account from:', keyPath);
    storage = new Storage({ keyFilename: keyPath });
  } else {
    console.log('Using environment credentials for GCP');
    storage = new Storage();
  }
} catch (error) {
  console.error('Failed to initialize GCP Storage:', error);
}

// Helper to check if a string is a URL
function isUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

// Helper to normalize path separators
function normalizePath(pathString) {
  // Replace Windows backslashes with forward slashes for URL consistency
  return pathString ? pathString.replace(/\\/g, '/') : '';
}

router.get('/:type', async (req, res) => {
  try {
    console.log('\n==== MEDIA REQUEST DETAILED ====');
    console.log('Type:', req.params.type);
    console.log('Raw path from query:', req.query.path);
    
    // Normalize path to use forward slashes
    const type = req.params.type;
    let mediaPath = normalizePath(req.query.path || '');
    
    console.log('Normalized path:', mediaPath);
    
    // Check if storage is initialized correctly
    if (!storage) {
      console.error('GCP Storage client not initialized!');
      return res.status(500).send('Storage configuration error');
    }
    
    // Test GCP auth inline
    try {
      const bucket = storage.bucket('disinformation-game-images');
      const [exists] = await bucket.exists();
      console.log('Bucket access test:', exists ? 'SUCCESS' : 'FAILED');
      
      if (!exists) {
        console.error('Bucket does not exist or no access');
        return res.status(500).send('Storage bucket not accessible');
      }
    } catch (authError) {
      console.error('GCP auth test failed:', authError.message);
      return res.status(500).send('Storage authentication failed');
    }
    
    // Set CORS headers to avoid issues
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // For media files that match the structure in GCP
    if (mediaPath.startsWith('media/')) {
      console.log('Found media path pattern in GCP structure');
      
      try {
        // Get the file from GCP using authenticated service account
        const bucket = storage.bucket('disinformation-game-images');
        const file = bucket.file(mediaPath);
        
        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          console.log('File does not exist in GCP:', mediaPath);
          return res.status(404).send('Media not found');
        }
        
        // Set appropriate headers based on file type
        const [metadata] = await file.getMetadata();
        if (metadata.contentType) {
          res.setHeader('Content-Type', metadata.contentType);
        }
        
        console.log('File metadata:', JSON.stringify(metadata, null, 2));
        
        // Stream the file directly to the response
        console.log('Streaming file from GCP:', mediaPath);
        file.createReadStream()
          .on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
              res.status(500).send('Error accessing media');
            }
          })
          .on('end', () => {
            console.log('Successfully streamed file:', mediaPath);
          })
          .pipe(res)
          .on('error', (err) => {
            console.error('Error in response stream:', err);
          });
          
      } catch (error) {
        console.error('Error accessing GCP file:', error);
        if (!res.headersSent) {
          res.status(500).send('Server error: ' + error.message);
        }
      }
      
      return; // Important to return here to end the request handling
    }
    
    // For tweet_id as folder name structure
    if (mediaPath.match(/\d+\/tweet_/)) {
      const gcpPath = `media/${mediaPath}`;
      console.log('Trying tweet ID folder structure:', gcpPath);
      
      try {
        const bucket = storage.bucket('disinformation-game-images');
        const file = bucket.file(gcpPath);
        
        const [exists] = await file.exists();
        if (!exists) {
          console.log('File does not exist in GCP with tweet ID structure');
          return res.status(404).send('Media not found');
        }
        
        // Set appropriate headers
        const [metadata] = await file.getMetadata();
        if (metadata.contentType) {
          res.setHeader('Content-Type', metadata.contentType);
        }
        
        // Stream the file
        console.log('Streaming file from GCP with tweet ID structure:', gcpPath);
        file.createReadStream()
          .on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
              res.status(500).send('Error accessing media');
            }
          })
          .pipe(res);
          
      } catch (error) {
        console.error('Error accessing GCP file with tweet ID structure:', error);
        if (!res.headersSent) {
          res.status(500).send('Server error');
        }
      }
      
      return;
    }
    
    // For downloaded_images paths
    if (mediaPath.includes('downloaded_images')) {
      console.log('Found downloaded_images pattern');
      // Extract the part after downloaded_images (and handle both / and \)
      const parts = mediaPath.split(/downloaded_images[\/\\]/);
      if (parts.length > 1) {
        const relativePath = parts[1];
        const gcpPath = `media/${relativePath}`;
        
        try {
          const bucket = storage.bucket('disinformation-game-images');
          const file = bucket.file(gcpPath);
          
          const [exists] = await file.exists();
          if (!exists) {
            console.log('File does not exist in GCP with downloaded_images path');
            return res.status(404).send('Media not found');
          }
          
          // Set appropriate headers
          const [metadata] = await file.getMetadata();
          if (metadata.contentType) {
            res.setHeader('Content-Type', metadata.contentType);
          }
          
          // Stream the file
          console.log('Streaming file from GCP with downloaded_images path:', gcpPath);
          file.createReadStream()
            .on('error', (err) => {
              console.error('Error streaming file:', err);
              if (!res.headersSent) {
                res.status(500).send('Error accessing media');
              }
            })
            .pipe(res);
            
        } catch (error) {
          console.error('Error accessing GCP file with downloaded_images path:', error);
          if (!res.headersSent) {
            res.status(500).send('Server error');
          }
        }
        
        return;
      }
    }

    // Determine local path for backward compatibility
    let basePath;
    switch (type) {
      case 'profiles':
        basePath = path.join(__dirname, '..', '..', 'python-backend', 'profile_pics');
        break;
      case 'images':
        basePath = path.join(__dirname, '..', '..', 'python-backend', 'downloaded_images');
        break;
      default:
        console.log('Invalid media type:', type);
        return res.status(404).send('Invalid media type');
    }
    
    // Serve local file as fallback
    const filePath = path.join(basePath, mediaPath);
    console.log('Attempting to serve local file:', filePath);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log('File does not exist locally:', filePath);
        
        // Try one more GCP path as last resort
        try {
          const lastResortPath = `media/${mediaPath}`;
          console.log('Trying last resort GCP path:', lastResortPath);
          
          const bucket = storage.bucket('disinformation-game-images');
          const file = bucket.file(lastResortPath);
          
          file.exists().then(([exists]) => {
            if (exists) {
              file.getMetadata().then(([metadata]) => {
                if (metadata.contentType) {
                  res.setHeader('Content-Type', metadata.contentType);
                }
                file.createReadStream().pipe(res);
              }).catch(error => {
                console.error('Metadata error:', error);
                res.status(500).send('Error getting file metadata');
              });
            } else {
              res.status(404).send('Media not found anywhere');
            }
          }).catch(error => {
            console.error('Last resort error:', error);
            res.status(500).send('Error checking file existence');
          });
        } catch (gcpError) {
          console.error('Final GCP attempt error:', gcpError);
          res.status(404).send('Media not found');
        }
        return;
      }
      
      console.log('File exists locally, sending:', filePath);
      res.sendFile(filePath, err => {
        if (err) {
          console.error(`Error sending local file ${filePath}:`, err);
          res.status(404).send('Media not found');
        }
      });
    });
  } catch (error) {
    console.error('Error processing media request:', error);
    if (!res.headersSent) {
      res.status(500).send('Server error');
    }
  }
});

module.exports = router;
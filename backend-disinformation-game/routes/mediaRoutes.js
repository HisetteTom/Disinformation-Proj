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
    // console.log('\n==== MEDIA REQUEST DETAILED ====');
    // console.log('Type:', req.params.type);
    // console.log('Raw path from query:', req.query.path);
    
    // Normalize path to use forward slashes
    const type = req.params.type;
    let mediaPath = normalizePath(req.query.path || '');
    
    //console.log('Normalized path:', mediaPath);
    
    // Check if storage is initialized correctly
    if (!storage) {
      console.error('GCP Storage client not initialized!');
      return res.status(500).send('Storage configuration error');
    }
    
    // Test GCP auth inline
    try {
      const bucket = storage.bucket('disinformation-game-images');
      const [exists] = await bucket.exists();
      //console.log('Bucket access test:', exists ? 'SUCCESS' : 'FAILED');
      
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

    // Special handling for profile pictures with gs:// path
    if (type === 'profiles' && mediaPath.startsWith('gs://')) {
      console.log('Handling GCP profile picture path:', mediaPath);
      
      try {
        // Parse the gs:// URL properly
        const gsPath = mediaPath.replace('gs://', '');
        const [bucketName, ...objectPathParts] = gsPath.split('/');
        const objectPath = objectPathParts.join('/');
        
        //console.log(`Accessing bucket: ${bucketName}, path: ${objectPath}`);
        
        // Use the correct bucket from the gs:// URL
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectPath);
        
        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          //console.log('Profile picture not found in GCP:', objectPath);
          
          // Try alternative paths for spaces in usernames
          if (objectPath.includes(' ')) {
            // Try replacing spaces with underscores
            const altPath = objectPath.replace(/ /g, '_');
            console.log('Trying alternative path with underscores:', altPath);
            
            const altFile = bucket.file(altPath);
            const [altExists] = await altFile.exists();
            
            if (altExists) {
              console.log('Found profile with underscores instead of spaces');
              const [metadata] = await altFile.getMetadata();
              if (metadata.contentType) {
                res.setHeader('Content-Type', metadata.contentType);
              }
              
              // Stream the file
              altFile.createReadStream()
                .on('error', (err) => {
                  console.error('Error streaming alternate profile:', err);
                  if (!res.headersSent) {
                    res.status(500).send('Error accessing profile');
                  }
                })
                .pipe(res);
              return;
            }
            
            // Try URL-encoded path
            const encodedPath = encodeURIComponent(objectPath).replace(/%2F/g, '/');
            if (encodedPath !== objectPath) {
              console.log('Trying URL-encoded path:', encodedPath);
              const encodedFile = bucket.file(encodedPath);
              const [encodedExists] = await encodedFile.exists();
              
              if (encodedExists) {
                console.log('Found profile with URL encoding');
                const [metadata] = await encodedFile.getMetadata();
                if (metadata.contentType) {
                  res.setHeader('Content-Type', metadata.contentType);
                }
                
                // Stream the file
                encodedFile.createReadStream()
                  .on('error', (err) => {
                    console.error('Error streaming encoded profile:', err);
                    if (!res.headersSent) {
                      res.status(500).send('Error accessing profile');
                    }
                  })
                  .pipe(res);
                return;
              }
            }
          }
          
          return res.status(404).send('Profile picture not found');
        }
        
        // Set appropriate headers
        const [metadata] = await file.getMetadata();
        if (metadata.contentType) {
          res.setHeader('Content-Type', metadata.contentType);
        }
        
        // Stream the file
        console.log('Streaming profile picture from GCP:', objectPath);
        file.createReadStream()
          .on('error', (err) => {
            console.error('Error streaming profile picture:', err);
            if (!res.headersSent) {
              res.status(500).send('Error accessing profile picture');
            }
          })
          .pipe(res);
          
      } catch (error) {
        console.error('Error accessing profile picture:', error);
        if (!res.headersSent) {
          res.status(500).send('Server error: ' + error.message);
        }
      }
      
      return; // Important to exit after handling
    }
    
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
        
        //console.log('File metadata:', JSON.stringify(metadata, null, 2));
        
        // Stream the file directly to the response
        //console.log('Streaming file from GCP:', mediaPath);
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

// Add this new route specifically for profiles with special characters
router.get('/profile-direct', async (req, res) => {
  try {
    // Set CORS headers - this is essential for browser to accept the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    const { bucket: bucketName, path: objectPath } = req.query;
    
    if (!bucketName || !objectPath) {
      return res.status(400).send('Missing bucket name or object path');
    }
    
    console.log(`Profile direct access: bucket=${bucketName}, path=${decodeURIComponent(objectPath)}`);
    
    // Ensure storage is initialized
    if (!storage) {
      return res.status(500).send('Storage not initialized');
    }
    
    // Handle special characters in the path by decoding first
    const decodedPath = decodeURIComponent(objectPath);
    
    // Get the file from GCP
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(decodedPath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log('Profile not found, trying alternatives');
      
      // Try alternatives for special characters
      const alternativePaths = [
        // Replace hashtags with encoded value
        decodedPath.replace(/#/g, '%23'),
        // Replace special chars with underscores
        decodedPath.replace(/[#\s-]/g, '_'),
        // Remove special characters
        decodedPath.replace(/[^\w\/\.]/g, '')
      ];
      
      for (const altPath of alternativePaths) {
        console.log(`Trying alternative path: ${altPath}`);
        const altFile = bucket.file(altPath);
        const [altExists] = await altFile.exists();
        
        if (altExists) {
          console.log(`Found profile at alternative path: ${altPath}`);
          
          // Set appropriate headers with proper caching
          const [metadata] = await altFile.getMetadata();
          if (metadata.contentType) {
            res.setHeader('Content-Type', metadata.contentType);
          }
          res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
          
          return altFile.createReadStream().pipe(res);
        }
      }
      
      return res.status(404).send('Profile picture not found');
    }
    
    // Set metadata and cache headers
    const [metadata] = await file.getMetadata();
    if (metadata.contentType) {
      res.setHeader('Content-Type', metadata.contentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    
    // Stream the file directly
    console.log('Streaming profile directly from GCP:', decodedPath);
    file.createReadStream().pipe(res);
    
  } catch (error) {
    console.error('Error accessing direct profile:', error);
    if (!res.headersSent) {
      res.status(500).send('Server error: ' + error.message);
    }
  }
});

// Add a new crossorigin-friendly route
router.get('/crossorigin-profile', async (req, res) => {
  try {
    // These headers are essential to prevent CORS issues
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    const { bucket: bucketName, path: objectPath } = req.query;
    
    if (!bucketName || !objectPath) {
      return res.status(400).send('Missing bucket or path parameter');
    }
    
    console.log(`CrossOrigin profile request: ${bucketName}/${objectPath}`);
    
    // Decode and clean the path
    const decodedPath = decodeURIComponent(objectPath);
    
    // Get the file from GCP
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(decodedPath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      // Try alternatives for special characters
      const alternativePaths = [
        // Original path but URL-encoded special chars
        decodedPath.replace(/#/g, '%23').replace(/🌍/g, encodeURIComponent('🌍')),
        // Replace special chars with underscores
        decodedPath.replace(/[#\s\-🌍]/g, '_')
      ];
      
      for (const altPath of alternativePaths) {
        console.log(`Trying alternative path: ${altPath}`);
        const altFile = bucket.file(altPath);
        const [altExists] = await altFile.exists();
        
        if (altExists) {
          console.log(`Found profile at alternative path: ${altPath}`);
          
          // Set content type
          const [metadata] = await altFile.getMetadata();
          if (metadata.contentType) {
            res.setHeader('Content-Type', metadata.contentType);
          }
          
          // Add cache headers
          res.setHeader('Cache-Control', 'public, max-age=86400');
          
          // Stream the file
          return altFile.createReadStream().pipe(res);
        }
      }
      
      return res.status(404).send('Profile image not found');
    }
    
    // Set headers for the original file
    const [metadata] = await file.getMetadata();
    if (metadata.contentType) {
      res.setHeader('Content-Type', metadata.contentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Stream file
    file.createReadStream().pipe(res);
    
  } catch (error) {
    console.error('Error in crossorigin profile route:', error);
    if (!res.headersSent) {
      res.status(500).send('Server error');
    }
  }
});

router.get('/profiles/direct', async (req, res) => {
  try {
    // Set proper headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    const { bucket: bucketName, path: encodedPath } = req.query;
    
    if (!bucketName || !encodedPath) {
      return res.status(400).send('Missing parameters');
    }
    
    // Decode the path properly
    const objectPath = decodeURIComponent(encodedPath);
    
    console.log(`Simple profile access: ${bucketName}/${objectPath}`);
    
    // Handle special characters like # and emojis
    // Use the Storage API to get a signed URL instead of streaming directly
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectPath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log('File not found, trying alternatives');
      
      // Alternative paths to try
      const alternatives = [
        objectPath.replace(/#/g, '_'),
        objectPath.replace(/[^\w\/\.]/g, '_')
      ];
      
      let found = false;
      
      for (const alt of alternatives) {
        console.log(`Trying alternative: ${alt}`);
        const altFile = bucket.file(alt);
        const [altExists] = await altFile.exists();
        
        if (altExists) {
          console.log('Found file with alternative path');
          
          // Get metadata
          const [metadata] = await altFile.getMetadata();
          if (metadata.contentType) {
            res.setHeader('Content-Type', metadata.contentType);
          }
          
          // Stream file
          return altFile.createReadStream().pipe(res);
        }
      }
      
      // If we get here, we couldn't find any alternative
      return res.status(404).send('Profile not found');
    }
    
    // Get metadata for the original file
    const [metadata] = await file.getMetadata();
    if (metadata.contentType) {
      res.setHeader('Content-Type', metadata.contentType);
    }
    
    // Stream the file
    file.createReadStream().pipe(res);
    
  } catch (error) {
    console.error('Error in profile direct endpoint:', error);
    if (!res.headersSent) {
      res.status(500).send('Server error');
    }
  }
});

// Also add a simple endpoint for basic profile paths
router.get('/profiles/simple', async (req, res) => {
  try {
    const { path: profilePath } = req.query;
    if (!profilePath) {
      return res.status(400).send('Missing path');
    }
    
    // Set headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Try to serve from profiles bucket
    const bucket = storage.bucket('disinformation-game-profiles');
    const file = bucket.file(`users/${profilePath}`);
    
    const [exists] = await file.exists();
    if (exists) {
      const [metadata] = await file.getMetadata();
      if (metadata.contentType) {
        res.setHeader('Content-Type', metadata.contentType);
      }
      return file.createReadStream().pipe(res);
    }
    
    // Not found
    res.status(404).send('Profile not found');
    
  } catch (error) {
    console.error('Error in simple profile endpoint:', error);
    if (!res.headersSent) {
      res.status(500).send('Server error');
    }
  }
});


module.exports = router;
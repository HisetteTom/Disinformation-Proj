const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Initialize Google Cloud Storage with service account
const storage = new Storage({
  keyFilename: path.join(__dirname,'GCP_KEYS.json')
});

// Bucket names
const buckets = [
  'disinformation-game-images',
  'disinformation-game-profiles',
  'disinformation-game-data'
];

// Origins to allow
const origins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  
  'http://localhost:3001'   
];

async function configureBucketCors() {
  console.log('Setting CORS configuration for GCP buckets...');
  
  for (const bucketName of buckets) {
    try {
      console.log(`Configuring CORS for bucket: ${bucketName}`);
      
      await storage.bucket(bucketName).setCorsConfiguration([
        {
          maxAgeSeconds: 86400,  // 24 hours
          method: ['GET', 'HEAD', 'OPTIONS'],
          origin: origins,
          responseHeader: [
            'Content-Type', 
            'Access-Control-Allow-Origin', 
            'Access-Control-Allow-Methods',
            'x-goog-resumable'
          ]
        }
      ]);
      
      console.log(`✅ Successfully updated CORS for bucket: ${bucketName}`);
    } catch (error) {
      console.error(`❌ Error setting CORS for bucket ${bucketName}:`, error);
    }
  }
}

// Run the configuration
configureBucketCors().catch(console.error);
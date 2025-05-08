const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

console.log('GCP Key file path:', process.env.GCP_KEY_FILE);

async function testGcpConnection() {
  try {
    // Initialize GCP Storage client
    const storage = new Storage({
      keyFilename: process.env.GCP_KEY_FILE
    });
    
    console.log('Testing access to specific buckets...');
    
    // Check specific buckets directly without listing all buckets
    const requiredBuckets = [
      'disinformation-game-images',
      'disinformation-game-profiles',
      'disinformation-game-data'
    ];
    
    for (const bucketName of requiredBuckets) {
      console.log(`\nChecking bucket: ${bucketName}`);
      
      try {
        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        
        if (!exists) {
          console.log(`Bucket "${bucketName}" does not exist. Attempting to create it...`);
          try {
            await storage.createBucket(bucketName);
            console.log(`Successfully created bucket "${bucketName}"`);
          } catch (createError) {
            console.error(`Failed to create bucket "${bucketName}":`, createError.message);
            continue;
          }
        } else {
          console.log(`Bucket "${bucketName}" exists`);
        }
        
        // Test if we can list files in the bucket
        console.log(`Attempting to list files in "${bucketName}"...`);
        const [files] = await bucket.getFiles();
        console.log(`Success! Bucket "${bucketName}" contains ${files.length} files.`);
        
        if (files.length > 0) {
          console.log('First few files:');
          files.slice(0, 5).forEach(file => console.log(`- ${file.name}`));
        }
      } catch (error) {
        console.error(`Error accessing bucket "${bucketName}":`, error.message);
      }
    }
    
    console.log('\nTest completed.');
    
  } catch (error) {
    console.error('Error with GCP connection:', error);
  }
}

testGcpConnection();
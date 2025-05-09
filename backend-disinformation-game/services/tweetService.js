const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { getFileStream, getFileUrl } = require('./gcpStorageService');

/**
 * Récupère les tweets depuis le fichier CSV dans Google Cloud Storage
 * @returns {Promise<Array>} Une promesse qui résout avec un tableau de tweets
 */
async function getTweets() {
  return new Promise(async (resolve, reject) => {
    const tweets = []; // Tableau qui contiendra tous les tweets
    
    try {
      console.log('Fetching tweets.csv from GCP...');
      
      let csvStream;
      try {
        // Try to get the file from GCP
        csvStream = await getFileStream('data', 'tweets.csv');
      } catch (gcpError) {
        console.error('Error accessing tweets.csv in GCP:', gcpError);
        
        // Fallback to local file
        const localPath = path.join(__dirname, '..', 'temp', 'tweets.csv');
        console.log(`Trying local file: ${localPath}`);
        
        if (fs.existsSync(localPath)) {
          console.log('Using local tweets.csv as fallback');
          csvStream = fs.createReadStream(localPath);
        } else {
          throw new Error('Could not access tweets.csv in GCP or locally');
        }
      }
      
      csvStream
        .pipe(csv()) // Analyse le CSV en objets JavaScript
        .on('data', (data) => {
          // Pour chaque ligne du CSV (un tweet)
          const formattedData = {};
          
          // Normalise les clés pour éviter les problèmes d'espaces
          Object.keys(data).forEach(key => {
            const normalizedKey = key.trim();
            formattedData[normalizedKey] = data[key];
          });
          
          // Handle profile pic paths
          if (formattedData.Profile_Pic) {
            try {
              // Extract just the filename, handling different path formats
              let fileName;
              if (formattedData.Profile_Pic.includes('\\')) {
                // Windows path format from CSV
                fileName = formattedData.Profile_Pic.split('\\').pop();
              } else if (formattedData.Profile_Pic.includes('/')) {
                // Unix path format
                fileName = formattedData.Profile_Pic.split('/').pop();
              } else {
                // Already just a filename
                fileName = formattedData.Profile_Pic;
              }
              
              formattedData.Profile_Pic = getFileUrl('profiles', fileName);
              //console.log(`Processed profile pic: ${fileName}`);
            } catch (error) {
              console.error('Error processing profile pic:', error);
              formattedData.Profile_Pic = null;
            }
          }
          
          // Handle media files similarly
          if (formattedData.Media_Files) {
            try {
              const mediaFiles = formattedData.Media_Files.split('|');
              const gcpMediaUrls = mediaFiles.map(filePath => {
                let fileName;
                if (filePath.includes('\\')) {
                  fileName = filePath.split('\\').pop();
                } else if (filePath.includes('/')) {
                  fileName = filePath.split('/').pop();
                } else {
                  fileName = filePath;
                }
                
                return getFileUrl('images', fileName);
              });
              
              formattedData.Media_Files = gcpMediaUrls.join('|');
              //console.log(`Processed ${gcpMediaUrls.length} media files`);
            } catch (error) {
              console.error('Error processing media files:', error);
              formattedData.Media_Files = '';
            }
          }
          
          // Ajoute le tweet formaté au tableau
          tweets.push(formattedData);
        })
        .on('end', () => {
          // Une fois la lecture terminée
          //console.log(`${tweets.length} tweets loaded successfully`);
          resolve(tweets); // Résout la promesse avec les tweets
        })
        .on('error', (error) => {
          // En cas d'erreur pendant la lecture
          console.error('Error reading CSV:', error);
          reject(error); // Rejette la promesse avec l'erreur
        });
    } catch (error) {
      console.error('Error getting tweets:', error);
      reject(error);
    }
  });
}

module.exports = {
  getTweets
};
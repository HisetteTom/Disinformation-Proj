const csv = require('csv-parser');
const { Readable } = require('stream');
const { getBlobStream, getBlobUrl, containerNames } = require('./azureStorageService');

/**
 * Récupère les tweets depuis le fichier CSV dans Azure Blob Storage
 * @returns {Promise<Array>} Une promesse qui résout avec un tableau de tweets
 */
async function getTweets() {
  return new Promise(async (resolve, reject) => {
    const tweets = []; // Tableau qui contiendra tous les tweets
    
    try {
      // Récupérer le stream du fichier CSV depuis Azure Blob Storage
      const csvStream = await getBlobStream(containerNames.data, 'tweets.csv');
      
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
          
          // Conversion des chemins d'images locaux en URLs Azure
          if (formattedData.Profile_Pic) {
            // Extraire juste le nom du fichier depuis le chemin Windows
            const fileName = formattedData.Profile_Pic.split('\\').pop();
            formattedData.Profile_Pic = getBlobUrl(containerNames.profiles, fileName);
          }
          
          // Même traitement pour les fichiers média attachés au tweet
          if (formattedData.Media_Files) {
            const mediaFiles = formattedData.Media_Files.split('|');
            const azureMediaUrls = mediaFiles.map(filePath => {
              // Extraire juste le nom du fichier depuis le chemin Windows
              const fileName = filePath.split('\\').pop();
              return getBlobUrl(containerNames.images, fileName);
            });
            formattedData.Media_Files = azureMediaUrls.join('|');
          }
          
          // Ajoute le tweet formaté au tableau
          tweets.push(formattedData);
        })
        .on('end', () => {
          // Une fois la lecture terminée
          console.log(`${tweets.length} tweets chargés avec succès depuis Azure Blob Storage`);
          resolve(tweets); // Résout la promesse avec les tweets
        })
        .on('error', (error) => {
          // En cas d'erreur pendant la lecture
          console.error('Erreur lors de la lecture du CSV depuis Azure:', error);
          reject(error); // Rejette la promesse avec l'erreur
        });
    } catch (error) {
      console.error('Erreur lors de la récupération du stream:', error);
      reject(error);
    }
  });
}

module.exports = {
  getTweets
};
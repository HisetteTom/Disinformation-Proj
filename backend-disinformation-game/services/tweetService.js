const fs = require('fs');      
const path = require('path'); 
const csv = require('csv-parser');

/**
 * Récupère les tweets depuis le fichier CSV
 * @returns {Promise<Array>} Une promesse qui résout avec un tableau de tweets
 */

//CC Promise : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
async function getTweets() {
  return new Promise((resolve, reject) => {
    const tweets = []; // Tableau qui contiendra tous les tweets
    
    // Création d'un stream de lecture pour le fichier CSV
    fs.createReadStream(path.resolve(__dirname, '../tweets.csv'))
      .pipe(csv()) // Analyse le CSV en objets JavaScript
      .on('data', (data) => {
        // Pour chaque ligne du CSV (un tweet)
        const formattedData = {};
        
        // Normalise les clés pour éviter les problèmes d'espaces
        Object.keys(data).forEach(key => {
          const normalizedKey = key.trim();
          formattedData[normalizedKey] = data[key];
        });
        
        // Conversion des chemins d'images de style Windows (avec \) en style URL (avec /)
        if (formattedData.Profile_Pic) {
          formattedData.Profile_Pic = formattedData.Profile_Pic.replace(/\\/g, '/');
          console.log('Chemin de la photo de profil:', formattedData.Profile_Pic);
        }
        
        // Même traitement pour les fichiers média attachés au tweet
        if (formattedData.Media_Files) {
          formattedData.Media_Files = formattedData.Media_Files.replace(/\\/g, '/');
        }
        
        // Ajoute le tweet formaté au tableau
        tweets.push(formattedData);
      })
      .on('end', () => {
        // Une fois la lecture terminée
        console.log(`${tweets.length} tweets chargés avec succès`);
        resolve(tweets); // Résout la promesse avec les tweets
      })
      .on('error', (error) => {
        // En cas d'erreur pendant la lecture
        console.error('Erreur lors de la lecture du CSV:', error);
        reject(error); // Rejette la promesse avec l'erreur
      });
  });
}

module.exports = {
  getTweets
};
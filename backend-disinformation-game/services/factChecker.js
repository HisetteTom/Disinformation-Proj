const axios = require('axios');    
const { extractKeyTerms } = require('./keywordExtractor.js'); 
const { searchNewsArticles } = require('./newsService.js');  
require('dotenv').config();         

/**
 * Vérifie si une affirmation est vraie ou fausse en cherchant des fact-checks ou des articles pertinents
 * @param {string} claim - L'affirmation à vérifier
 * @returns {Promise<Object>} - Résultat de la vérification (fact-checks ou articles)
 */
async function checkFact(claim) {
  try {
    const API_KEY = process.env.FACT_CHECK_API_KEY;
    
    const keyTerms = extractKeyTerms(claim, 5);
    console.log('Affirmation originale:', claim);
    console.log('Termes de recherche extraits:', keyTerms);
    
    let result = {
      found: false,
      message: 'Aucune information trouvée'
    };

    if (API_KEY) {
      // Construction de la requête avec les mots-clés
      const keyTermsQuery = keyTerms.join(' ');
      const factCheckResults = await searchFactCheck(keyTermsQuery, API_KEY);
      
      if (factCheckResults.claims && factCheckResults.claims.length > 0) {
        result = {
          found: true,
          result: factCheckResults.claims[0],    // Le fact-check le plus pertinent
          allResults: factCheckResults.claims,   // Tous les fact-checks trouvés
          type: 'factCheck'                      // Type de résultat
        };
      }
    } else {
      console.log('Pas de clé API de fact-check disponible, recherche ignorée');
    }
    
    // Si aucun fact-check n'est trouvé, chercher des articles de presse
    if (!result.found) {
      console.log('Aucun fact-check trouvé, recherche d\'articles de presse...');
      const newsResults = await searchNewsArticles(keyTerms);
      
      if (newsResults.found) {
        result = {
          found: true,
          articles: newsResults.articles,  // Articles trouvés
          type: 'news'                     // Type de résultat = articles
        };
      }
    }

    return result;
  } catch (error) {
    // Gestion des erreurs
    console.error('Erreur dans le processus de fact-checking:', error);
    return {
      found: false,
      error: error.message,
      message: 'Erreur lors du traitement de la requête.'
    };
  }
}

/**
 * Recherche des fact-checks via l'API Google Fact Check Tools
 * @param {string} query - Termes de recherche
 * @param {string} apiKey - Clé API pour Google Fact Check Tools
 * @returns {Promise<Object>} - Résultats des fact-checks
 */
async function searchFactCheck(query, apiKey) {
  try {
    // Encodage de la requête pour l'URL
    const encodedQuery = encodeURIComponent(query);
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodedQuery}&key=${apiKey}&languageCode=en`;

    console.log(`Recherche de fact-checks pour: "${query}"`);
    
    // Envoi de la requête à l'API
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    // En cas d'erreur, on log et on renvoie un tableau vide pour continuer avec la recherche d'articles
    console.error('Echec requete api:', error.message);
    return { claims: [] }; 
  }
}

module.exports = {
  checkFact
};
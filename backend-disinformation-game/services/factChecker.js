const axios = require('axios');    
const { extractKeyTerms } = require('./keywordExtractor.js'); 
const { searchNewsArticles } = require('./newsService.js');  
require('dotenv').config();         

/**
 * Génère des combinaisons de mots-clés de différentes tailles pour fact-checking
 * @param {string[]} keywords - Tableau de mots-clés
 * @param {number} minSize - Taille minimum de combinaison
 * @param {number} maxSize - Taille maximum de combinaison
 * @returns {string[]} - Tableau de requêtes formatées
 */
function generateSearchQueries(keywords, minSize = 2, maxSize = 5) {
  const queries = [];
  const maxQueriesCount = 5; // Nombre maximum de requêtes à générer
  
  // Assure que minSize ne dépasse pas le nombre de mots-clés
  minSize = Math.min(minSize, keywords.length);
  // Assure que maxSize ne dépasse pas le nombre de mots-clés
  maxSize = Math.min(maxSize, keywords.length);
  
  // Génère une requête principale avec tous les mots reliés par AND
  if (keywords.length > 0) {
    queries.push(keywords.join(' AND '));
  }
  
  // Génère des combinaisons de taille différente
  for (let size = maxSize; size >= minSize && queries.length < maxQueriesCount; size--) {
    // Mélange les mots-clés pour avoir des combinaisons variées
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    // Prend une sous-partie des mots-clés mélangés
    const subset = shuffled.slice(0, size);
    // Ajoute la requête formatée si elle n'existe pas déjà
    const query = subset.join(' AND ');
    if (!queries.includes(query)) {
      queries.push(query);
    }
  }
  
  return queries;
}

/**
 * Génère des combinaisons de mots-clés spécifiquement pour la recherche d'articles de presse
 * @param {string[]} keywords - Tableau de mots-clés
 * @param {string} originalClaim - L'affirmation originale
 * @returns {string[]} - Tableau de requêtes formatées pour les news
 */
function generateNewsSearchQueries(keywords, originalClaim) {
  const queries = [];
  const maxQueriesCount = 8; // Plus de requêtes pour les news
  
  // Identifie les mots-clés importants (comme "covid")
  const priorityKeywords = keywords.filter(k => 
    /covid|virus|pandemic|vaccine|death|million|billion|percent|study|report/i.test(k)
  );
  
  // Extrait les chiffres importants de l'affirmation originale
  const numbers = extractNumbersWithContext(originalClaim);
  
  // Si on a des mots-clés prioritaires, créer des requêtes qui les incluent toujours
  if (priorityKeywords.length > 0) {
    // Requête avec tous les mots-clés prioritaires
    queries.push(priorityKeywords.join(' AND '));
    
    // Ajout des nombres importants aux mots-clés prioritaires
    if (numbers.length > 0) {
      queries.push([...priorityKeywords, ...numbers].join(' AND '));
    }
    
    // Mélange les autres mots-clés non-prioritaires
    const normalKeywords = keywords.filter(k => !priorityKeywords.includes(k));
    
    // Crée des combinaisons avec au moins un mot prioritaire
    for (let i = 0; i < Math.min(maxQueriesCount - queries.length, priorityKeywords.length); i++) {
      const primaryWord = priorityKeywords[i % priorityKeywords.length];
      const shuffled = [...normalKeywords].sort(() => 0.5 - Math.random());
      const subset = shuffled.slice(0, Math.min(3, normalKeywords.length));
      const combined = [primaryWord, ...subset];
      const query = combined.join(' AND ');
      if (!queries.includes(query)) {
        queries.push(query);
      }
    }
  }
  
  // Si on n'a pas assez de requêtes, ajouter des requêtes standards
  if (queries.length < maxQueriesCount) {
    const standardQueries = generateSearchQueries(keywords, 2, 4);
    for (const query of standardQueries) {
      if (!queries.includes(query) && queries.length < maxQueriesCount) {
        queries.push(query);
      }
    }
  }
  
  return queries;
}

/**
 * Extrait les nombres importants avec leur contexte depuis une affirmation
 * @param {string} claim - L'affirmation originale
 * @returns {string[]} - Tableau de termes numériques avec contexte
 */
function extractNumbersWithContext(claim) {
  const results = [];
  
  // Trouve les nombres suivis d'unités ou de termes importants
  const numberPatterns = [
    /(\d+)\s*(million|billion|thousand|percent|%)/gi,
    /(\d+)\s*(deaths|cases|people|patients)/gi
  ];
  
  numberPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(claim)) !== null) {
      results.push(match[0].toLowerCase().replace(/\s+/g, ''));
    }
  });
  
  return results;
}

/**
 * Vérifie si une affirmation est vraie ou fausse en cherchant des fact-checks ou des articles pertinents
 * @param {string} claim - L'affirmation à vérifier
 * @returns {Promise<Object>} - Résultat de la vérification (fact-checks ou articles)
 */
async function checkFact(claim) {
  try {
    const API_KEY = process.env.FACT_CHECK_API_KEY;
    
    const keyTerms = extractKeyTerms(claim, 6); // Extraire plus de termes pour avoir plus de combinaisons
    console.log('Affirmation originale:', claim);
    console.log('Termes de recherche extraits:', keyTerms);
    
    let result = {
      found: false,
      message: 'Aucune information trouvée'
    };

    if (API_KEY) {
      // Génère plusieurs requêtes avec différentes combinaisons de mots-clés
      const searchQueries = generateSearchQueries(keyTerms, 2, 4);
      console.log('Requêtes générées pour fact-checking:', searchQueries);
      
      // Essaie chaque requête jusqu'à trouver des résultats
      for (const query of searchQueries) {
        console.log(`Essai de la requête: "${query}"`);
        const factCheckResults = await searchFactCheck(query, API_KEY);
        
        if (factCheckResults.claims && factCheckResults.claims.length > 0) {
          result = {
            found: true,
            result: factCheckResults.claims[0],    // Le fact-check le plus pertinent
            allResults: factCheckResults.claims,   // Tous les fact-checks trouvés
            type: 'factCheck'                     // Type de résultat
          };
          break; // Sortie de la boucle si des résultats sont trouvés
        }
      }
    } else {
      console.log('Pas de clé API de fact-check disponible, recherche ignorée');
    }
    
    // Si aucun fact-check n'est trouvé, chercher des articles de presse
    if (!result.found) {
      console.log('Aucun fact-check trouvé, recherche articles de presse...');
      // Utiliser des requêtes optimisées pour la recherche d'articles
      const newsQueries = generateNewsSearchQueries(keyTerms, claim);
      console.log('Requêtes générées pour news:', newsQueries);
      
      // Essaie chaque requête jusqu'à trouver des articles
      for (const query of newsQueries) {
        console.log(`Essai de la requête news: "${query}"`);
        const newsResults = await searchNewsArticles(query);
        
        if (newsResults.found) {
          result = {
            found: true,
            articles: newsResults.articles,  // Articles trouvés
            type: 'news'                     // Type de résultat = articles
          };
          break; // Sortie de la boucle si des articles sont trouvés
        }
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
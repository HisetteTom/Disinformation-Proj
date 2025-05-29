const axios = require('axios');      // Module pour effectuer des requêtes HTTP
require('dotenv').config();          // Charge les variables d'environnement depuis le fichier .env

/**
 * Recherche d'articles de presse liés à une requête formatée
 * @param {string} query - Requête de recherche (peut contenir AND, OR)
 * @param {number} maxResults - Nombre maximum de résultats à retourner
 */
async function searchNewsArticles(query, maxResults = 5) {
  try {
    const API_KEY = process.env.NEWS_API_KEY;
    
    // Vérification de l'existence de la clé API
    if (!API_KEY) {
      console.error('Clé API NEWS_API_KEY manquante dans les variables environnement');
      return {
        found: false,
        message: 'Erreur de configuration de l API News'
      };
    }

    const url = 'https://newsapi.org/v2/everything';
    
    console.log(`Recherche d'articles pour: "${query}"`);
    
    // Appel à l'API News avec axios
    const response = await axios.get(url, {
      params: {
        q: query,               // Requête de recherche formatée (AND/OR)
        language: 'en',         // Langue des articles (anglais)
        sortBy: 'relevancy',    // Tri par pertinence
        pageSize: maxResults,   // Nombre d'articles à retourner
        apiKey: API_KEY         // Clé d'API
      }
    });

    // Traitement de la réponse si des articles sont trouvés
    if (response.data && response.data.articles && response.data.articles.length > 0) {
      return {
        found: true,
        articles: response.data.articles.map(article => ({
          title: article.title,
          description: article.description,
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          imageUrl: article.urlToImage
        }))
      };
    }
    
    // Aucun article pertinent trouvé
    return {
      found: false,
      message: 'Aucun article pertinent trouvé'
    };
  } catch (error) {
    // Gestion des erreurs 
    console.error('Erreur lors de la recherche d articles:', error.message);
    return {
      found: false,
      error: error.message,
      message: 'Erreur de connexion au service de nouvelles'
    };
  }
}

module.exports = {
  searchNewsArticles
};
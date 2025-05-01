const axios = require('axios');      // Module pour effectuer des requêtes HTTP
require('dotenv').config();          // Charge les variables d'environnement depuis le fichier .env

/**
 * Recherche d'articles de presse liés aux mots-clés fournis
 * @param {string[]} keywords - Tableau de mots-clés à rechercher
 * @param {number} maxResults - Nombre maximum de résultats à retourner
 */
async function searchNewsArticles(keywords, maxResults = 5) {
  try {
    // Récupération de la clé API depuis les variables d'environnement
    // Vous devez vous inscrire sur newsapi.org pour obtenir une clé gratuite
    const API_KEY = process.env.NEWS_API_KEY;
    
    // Vérification de l'existence de la clé API
    if (!API_KEY) {
      console.error('Clé API NEWS_API_KEY manquante dans les variables environnement');
      return {
        found: false,
        message: 'Erreur de configuration de l API News'
      };
    }

    // Construction de la requête avec les mots-clés joints par "OR"
    const query = keywords.join(' OR ');
    const url = 'https://newsapi.org/v2/everything';
    
    console.log(`Recherche d'articles pour: "${query}"`);
    
    // Appel à l'API News avec axios
    const response = await axios.get(url, {
      params: {
        q: query,               // Mots-clés de recherche
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
        // Transformation des articles pour ne garder que les informations nécessaires
        articles: response.data.articles.map(article => ({
          title: article.title,                  // Titre de l'article
          description: article.description,      // Description/résumé
          source: article.source.name,           // Nom de la source
          url: article.url,                      // URL de l'article
          publishedAt: article.publishedAt,      // Date de publication
          imageUrl: article.urlToImage           // URL de l'image
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
const axios = require('axios');
const { extractKeyTerms } = require('./keywordExtractor.js'); 
const { searchNewsArticles } = require('./newsService.js');  
require('dotenv').config();

/**
 * Generates simple, basic keyword queries for the Google Fact Check API
 * @param {string[]} keywords - Keywords to use
 * @returns {string[]} - Formatted queries
 */
function generateFactCheckQueries(keywords) {
  const queries = [];
  
  // Clean all keywords - strip hashtags and special chars
  const cleanKeywords = keywords.map(word => 
    word.replace(/^#/, '').replace(/[^\w\s]/g, '').toLowerCase()
  );
  
  // Set up meaningful query combinations
  // 1. Single key terms (Google API works best with simple queries)
  cleanKeywords.slice(0, Math.min(3, cleanKeywords.length)).forEach(term => {
    queries.push(term);
  });
  
  // 2. Two-word pairs
  if (cleanKeywords.length >= 2) {
    // Try different pairs - don't use Boolean operators
    for (let i = 0; i < Math.min(3, cleanKeywords.length); i++) {
      for (let j = i+1; j < Math.min(4, cleanKeywords.length); j++) {
        const pair = `${cleanKeywords[i]} ${cleanKeywords[j]}`;
        if (pair.length < 30) { // Keep queries short
          queries.push(pair);
        }
      }
    }
  }
  
  // 3. Add "fact check" to the most important term if available
  if (cleanKeywords.length > 0) {
    queries.push(`${cleanKeywords[0]} fact`);
  }

  return [...new Set(queries)].slice(0, 5); // Keep only unique queries, max 5
}

/**
 * Generates news search queries using appropriate operators
 * @param {string[]} keywords - Keywords to use
 * @returns {string[]} - Formatted queries
 */
function generateNewsQueries(keywords) {
  const queries = [];
  
  // Clean and prepare keywords
  const cleanKeywords = keywords.map(word => 
    word.replace(/^#/, '').replace(/[^\w\s]/g, '').toLowerCase()
  );
  
  // News API handles Boolean operators well - use them
  
  // 1. Single term queries for key topics
  if (cleanKeywords.length > 0) {
    queries.push(cleanKeywords[0]);
  }
  
  // 2. Two terms with AND between important keywords
  if (cleanKeywords.length >= 2) {
    queries.push(`${cleanKeywords[0]} AND ${cleanKeywords[1]}`);
  }
  
  // 3. First term AND any of the other terms (useful for qualifying searches)
  if (cleanKeywords.length >= 3) {
    const others = cleanKeywords.slice(1, 4).join(' OR ');
    queries.push(`${cleanKeywords[0]} AND (${others})`);
  }
  
  // 4. Mixed OR terms for broader results when specific terms don't match
  if (cleanKeywords.length >= 2) {
    queries.push(cleanKeywords.slice(0, 3).join(' OR '));
  }
  
  return [...new Set(queries)].slice(0, 5); // Unique queries, max 5
}

/**
 * Ultra-simplified search for Google Fact Check API
 * @param {string} query - Search query
 * @param {string} apiKey - Google API key
 * @returns {Promise<Object>} - Fact check results
 */
async function searchFactCheck(query, apiKey) {
  try {
    // Make the query ultra-simple
    // Take only first few words, remove all special chars
    let cleanedQuery = query
      .replace(/['"(){}\[\]]/g, '')        // Remove brackets and quotes
      .replace(/\b(AND|OR|NOT)\b/gi, ' ')  // Remove Boolean operators
      .replace(/[^\w\s]/g, ' ')           // Replace other special chars with spaces
      .replace(/\s+/g, ' ')               // Normalize spaces
      .trim();
    
    // Keep only 1-2 words maximum for best results
    const words = cleanedQuery.split(' ').filter(Boolean);
    if (words.length > 2) {
      cleanedQuery = words.slice(0, 2).join(' ');
    }
    
    console.log(`Sending to Google Fact Check API: "${cleanedQuery}"`);
    
    // Encode components separately
    const encodedQuery = encodeURIComponent(cleanedQuery);
    
    // Full URL with properly encoded components
    const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodedQuery}&key=${apiKey}&languageCode=en&pageSize=5`;
    
    // Try with different headers and options
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    console.error('Fact check API error:', error.message);
    return { claims: [] }; 
  }
}

/**
 * Main fact-checking function
 * @param {string} claim - The claim to check
 * @returns {Promise<Object>} - Verification results
 */
async function checkFact(claim) {
  try {
    const API_KEY = process.env.FACT_CHECK_API_KEY;
    
    // Extract keywords
    const keyTerms = extractKeyTerms(claim, 6);
    console.log('Termes de recherche extraits:', keyTerms);
    
    let result = {
      found: false,
      message: 'Aucune information trouvée'
    };

    // Try fact checking first
    if (API_KEY) {
      const factQueries = generateFactCheckQueries(keyTerms);
      console.log('Requêtes pour fact-checking:', factQueries);
      
      for (const query of factQueries) {
        const factCheckResults = await searchFactCheck(query, API_KEY);
        
        if (factCheckResults.claims && factCheckResults.claims.length > 0) {
          return {
            found: true,
            result: factCheckResults.claims[0],
            allResults: factCheckResults.claims,
            type: 'factCheck',
            query: query
          };
        }
        
        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // If no fact-checks found, try news articles
    console.log('Recherche articles de presse...');
    const newsQueries = generateNewsQueries(keyTerms);
    console.log('Requêtes pour news:', newsQueries);
    
    for (const query of newsQueries) {
      const newsResults = await searchNewsArticles(query);
      
      if (newsResults.found) {
        return {
          found: true,
          articles: newsResults.articles,
          type: 'news',
          query: query
        };
      }
    }

    return result;
  } catch (error) {
    console.error('Erreur de fact-checking:', error);
    return {
      found: false,
      message: 'Erreur lors du traitement de la requête.'
    };
  }
}

module.exports = {
  checkFact
};
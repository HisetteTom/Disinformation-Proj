const axios = require('axios');
const natural = require('natural');
const { extractKeyTerms } = require('./keywordExtractor.js');

// Initialize tokenizer
const tokenizer = new natural.WordTokenizer();

async function checkFact(claim) {
  try {
    const API_KEY = process.env.FACT_CHECK_API_KEY;

    // Use NLP to extract key terms
    const keyTerms = extractKeyTerms(claim);
    const keyTermsQuery = keyTerms.join(' ');

    console.log('Original claim:', claim);
    console.log('Extracted search terms:', keyTermsQuery);

    // Try with key terms first
    const keyTermsResults = await searchFactCheck(keyTermsQuery, API_KEY);

    // If no results with key terms, try with full claim
    if (!keyTermsResults.claims || keyTermsResults.claims.length === 0) {
      console.log('No results with key terms, trying full claim...');
      const fullClaimResults = await searchFactCheck(claim, API_KEY);

      if (fullClaimResults.claims && fullClaimResults.claims.length > 0) {
        return {
          found: true,
          result: fullClaimResults.claims[0],
          allResults: fullClaimResults.claims,
        };
      }
    }

    // Return key terms results if any, otherwise return not found
    if (keyTermsResults.claims && keyTermsResults.claims.length > 0) {
      return {
        found: true,
        result: keyTermsResults.claims[0],
        allResults: keyTermsResults.claims,
      };
    }

    return {
      found: false,
      message: 'No fact checks found for this claim.',
    };
  } catch (error) {
    console.error('Error checking facts:', error);
    return {
      found: false,
      error: error.message,
      message: 'Error connecting to fact check service.',
    };
  }
}

async function searchFactCheck(query, apiKey) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodedQuery}&key=${apiKey}&languageCode=en`;

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('API request failed:', error.message);
    throw error;
  }
}

module.exports = {
  checkFact
};
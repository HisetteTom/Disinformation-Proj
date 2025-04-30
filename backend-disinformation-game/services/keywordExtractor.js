const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const NGrams = natural.NGrams;

// Common misinformation topics to prioritize (including variations)
const misinfoTopics = new Set([
  "vaccines", "vaccine", "vaccinated", "vaccination",
  "autism", "autistic", 
  "5g", "covid", "coronavirus", 
  "climate", "election", "fraud", "cancer", "cure",
  "government", "conspiracy", "moon", "earth",
  "study", "studies", "research", "confirm", "proof"
]);

const stopwords = new Set(['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
  'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to',
  'was', 'were', 'will', 'with', 'the', 'breaking', 'news']);

function extractKeyTerms(text, maxTerms = 6) {
  // Preserve original terms for exact matching
  const originalTerms = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Tokenize and clean the text
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const cleanTokens = tokens.filter(token => !stopwords.has(token));

  // Generate unigrams and bigrams
  const unigrams = cleanTokens;
  const bigrams = NGrams.bigrams(cleanTokens)
    .map(bigram => bigram.join(' '));
  
  // Combine all possible terms
  const allTerms = [...originalTerms, ...unigrams, ...bigrams];
  
  // First get misinformation related terms (prioritize exact matches)
  const misinfoMatches = [...new Set(allTerms.filter(term => 
    misinfoTopics.has(term) || 
    [...misinfoTopics].some(topic => term === topic || term.includes(topic))
  ))];

  // Then get other important terms
  const otherTerms = allTerms.filter(term => 
    !misinfoMatches.includes(term) && 
    term.length > 2
  );

  // Combine and limit results
  const result = [...new Set([...misinfoMatches, ...otherTerms])]
    .slice(0, maxTerms);

  return result;
}

module.exports = {
  extractKeyTerms
};

console.log(extractKeyTerms("5G towers are spreading COVID-19. Government is hiding this from us!"));
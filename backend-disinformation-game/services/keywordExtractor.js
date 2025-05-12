const natural = require('natural');
const stopwords = require('natural').stopwords;

const tokenizer = new natural.WordTokenizer();

/**
 * Extract meaningful keywords from text with smarter prioritization
 * @param {string} text - Text to extract keywords from
 * @param {number} maxKeywords - Maximum keywords to return (default: 5)
 * @returns {string[]} - Array of unique keywords
 */
function extractKeyTerms(text, maxKeywords = 5) {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  
  // Extract hashtags but also analyze their content
  const hashtags = extractHashtags(text);
  const mentions = extractMentions(text);
  
  // Define priority medical and scientific terms
  const medicalTerms = [
    'mask', 'masks', 'covid', 'vaccine', 'vaccines', 'doctor', 'doctors',
    'lung', 'lungs', 'oxygen', 'damage', 'health', 'medical', 'disease',
    'death', 'deaths', 'die', 'dying', 'kill', 'killed', 'kills', 'killing',
    'virus', 'hospital', 'breathe', 'breathing','bioweapon','autism'
  ];
  
  const scientificTerms = [
    'study', 'studies', 'research', 'evidence', 'science', 'scientific',
    'data', 'report', 'analysis', 'experiment', 'trial', 'clinical',
    'proof', 'test', 'testing', 'laboratory', 'lab', 'peer', 'review'
  ];
  
  const claimTerms = [
    'admit', 'admits', 'admitted', 'claim', 'claims', 'cause', 'causes',
    'caused', 'discover', 'discovered', 'announce', 'announced', 'reveal',
    'revealed', 'prove', 'proves', 'proven', 'confirm', 'confirmed',
    'debunk', 'debunked', 'false', 'true', 'fake', 'real', 'hoax', 'lie',
    'fact', 'facts', 'truth', 'control', 'conspiracy', 'government'
  ];
  
  // Basic tokenization of the main text
  const tokens = tokenizer.tokenize(lowerText);
  
  // Filter out stopwords, short words, numbers, and mentions
  const filteredTokens = tokens.filter(token => {
    return (
      !stopwords.includes(token) &&
      token.length > 2 &&
      !/^\d+$/.test(token) &&
      !mentions.includes(token)
    );
  });
  
  // Also extract words from hashtags (e.g., #nomasks → "no" and "masks")
  let hashtagWords = [];
  for (const tag of hashtags) {
    // Try to break compound hashtags into words
    // First check for camelCase: #NoMasks
    const camelCaseWords = tag.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
    
    // Also try to find common words within the hashtag
    const words = [];
    let currentTag = tag.toLowerCase();
    
    // Try to extract known words from the tag
    [...medicalTerms, ...scientificTerms, ...claimTerms].forEach(term => {
      if (currentTag.includes(term)) {
        words.push(term);
        // Remove the found term to avoid overlap
        currentTag = currentTag.replace(term, '');
      }
    });
    
    // Add both the original tag and any extracted words
    hashtagWords.push(tag);
    hashtagWords.push(...camelCaseWords);
    hashtagWords.push(...words);
  }
  
  // Filter out duplicates and short words
  hashtagWords = [...new Set(hashtagWords)].filter(word => word.length > 2);
  
  // Combine all tokens
  const allTokens = [...filteredTokens, ...hashtagWords];
  
  // Create word frequency dictionary
  const wordFrequencies = {};
  allTokens.forEach(token => {
    wordFrequencies[token] = (wordFrequencies[token] || 0) + 1;
  });
  
  // Categorize words by domain relevance
  const categorizedWords = Object.keys(wordFrequencies).reduce(
    (acc, word) => {
      if (medicalTerms.includes(word.toLowerCase())) {
        acc.medical.push(word);
      } else if (scientificTerms.includes(word.toLowerCase())) {
        acc.scientific.push(word);
      } else if (claimTerms.includes(word.toLowerCase())) {
        acc.claim.push(word);
      } else {
        acc.other.push(word);
      }
      return acc;
    },
    { medical: [], scientific: [], claim: [], other: [] }
  );
  
  // Create balanced keyword list with priorities:
  // 1. Include medical terms first (most important)
  // 2. Include some scientific and claim terms
  // 3. Include a few other high-frequency terms
  const result = [];
  
  // Start with medical terms (highest priority)
  if (categorizedWords.medical.length > 0) {
    // Sort medical terms by frequency
    const sortedMedical = categorizedWords.medical.sort(
      (a, b) => wordFrequencies[b] - wordFrequencies[a]
    );
    
    // Take top medical terms (up to 3)
    result.push(...sortedMedical.slice(0, 3));
  }
  
  // Add scientific terms next
  if (categorizedWords.scientific.length > 0) {
    const sortedScientific = categorizedWords.scientific.sort(
      (a, b) => wordFrequencies[b] - wordFrequencies[a]
    );
    
    // Take top scientific terms (up to 2)
    result.push(...sortedScientific.slice(0, 2));
  }
  
  // Add claim terms next
  if (categorizedWords.claim.length > 0) {
    const sortedClaim = categorizedWords.claim.sort(
      (a, b) => wordFrequencies[b] - wordFrequencies[a]
    );
    
    // Take top claim terms (up to 2)
    result.push(...sortedClaim.slice(0, 2));
  }
  
  // Add other high-frequency terms if needed
  if (result.length < maxKeywords && categorizedWords.other.length > 0) {
    const sortedOther = categorizedWords.other.sort(
      (a, b) => wordFrequencies[b] - wordFrequencies[a]
    );
    
    // Fill remaining slots
    result.push(...sortedOther.slice(0, maxKeywords - result.length));
  }
  
  // Return unique keywords up to the maximum requested
  return [...new Set(result)].slice(0, maxKeywords);
}

/**
 * Extract hashtags from text
 * @param {string} text - Text to extract hashtags from
 * @returns {string[]} - Array of hashtags without the # symbol
 */
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex) || [];
  
  // Remove # symbol and return unique, lowercase hashtags
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
}

/**
 * Extract mentions from text
 * @param {string} text - Text to extract mentions from
 * @returns {string[]} - Array of usernames without the @ symbol
 */
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex) || [];
  
  // Remove @ symbol and return lowercase usernames
  return matches.map(mention => mention.substring(1).toLowerCase());
}

module.exports = {
  extractKeyTerms
};
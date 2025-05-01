const natural = require('natural');      // Bibliothèque pour le traitement du langage naturel
const stopwords = require('natural').stopwords;  // Liste de mots vides (le, la, de, etc.)

// Initialisation de l'outil de tokenisation (découpage du texte en mots)
const tokenizer = new natural.WordTokenizer();

/**
 * Extrait les termes clés d'un texte, en évitant les doublons et améliorant la pertinence
 * @param {string} text - Le texte duquel extraire les mots-clés
 * @param {number} maxKeywords - Nombre maximum de mots-clés à retourner (5 par défaut)
 * @returns {string[]} - Tableau de mots-clés uniques
 */
function extractKeyTerms(text, maxKeywords = 5) {
  if (!text) return [];  // Si le texte est vide, retourne un tableau vide
  
  const lowerText = text.toLowerCase();
  
  const hashtags = extractHashtags(text);
  
  const mentions = extractMentions(text);
  
  // Découpage du texte en mots (tokens)
  const tokens = tokenizer.tokenize(lowerText);
  
  // Suppression des mots vides, mots courts et nombres
  const filteredTokens = tokens.filter(token => {
    return (
      !stopwords.includes(token) && // Pas un mot vide (le, la, de, etc.)
      token.length > 2 &&           // Plus de 2 caractères
      !/^\d+$/.test(token) &&       // Pas uniquement un nombre
      !mentions.includes(token)     // Pas un nom d'utilisateur
    );
  });
  
  // Création d'un dictionnaire pour compter les fréquences des mots
  const wordFrequencies = {};
  
  // Comptage des occurrences de chaque mot
  filteredTokens.forEach(token => {
    if (wordFrequencies[token]) {
      wordFrequencies[token]++;  // Incrémente si le mot existe déjà
    } else {
      wordFrequencies[token] = 1;  // Initialise à 1 pour un nouveau mot
    }
  });
  
  // Tri des mots par fréquence (du plus fréquent au moins fréquent)
  const sortedWords = Object.keys(wordFrequencies).sort((a, b) => {
    return wordFrequencies[b] - wordFrequencies[a];
  });
  
  // Combinaison des hashtags avec les mots les plus fréquents, sans doublons
  const combinedTerms = [...new Set([...hashtags, ...sortedWords])];
  
  // Retourne les termes les plus importants (limité par maxKeywords)
  return combinedTerms.slice(0, maxKeywords);
}

/**
 * Extrait les hashtags d'un texte
 * @param {string} text - Le texte duquel extraire les hashtags
 * @returns {string[]} - Tableau de hashtags sans le symbole #
 */
function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;  // Expression régulière pour trouver les hashtags
  const matches = text.match(hashtagRegex) || [];  // Trouve tous les hashtags ou retourne tableau vide
  
  // Supprime le symbole # et retourne les hashtags uniques en minuscules
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
}

/**
 * Extrait les mentions (@utilisateur) d'un texte
 * @param {string} text - Le texte duquel extraire les mentions
 * @returns {string[]} - Tableau de noms d'utilisateurs sans le symbole @
 */
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;  // Expression régulière pour trouver les mentions
  const matches = text.match(mentionRegex) || [];  // Trouve toutes les mentions ou retourne tableau vide
  
  // Supprime le symbole @ et retourne les noms d'utilisateurs en minuscules
  return matches.map(mention => mention.substring(1).toLowerCase());
}

module.exports = {
  extractKeyTerms
};
export function parseTwitterDate(twitterDate) {
    if (!twitterDate) return new Date();
    
    try {
      return new Date(twitterDate);
    } catch (e) {
      console.error("Error date:", e);
      return new Date();
    }
  }
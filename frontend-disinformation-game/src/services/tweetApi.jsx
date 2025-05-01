export async function fetchTweets() {
    try {
      const response = await fetch('http://localhost:3001/api/tweets');
      
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching tweets:', error);
      throw error;
    }
  }
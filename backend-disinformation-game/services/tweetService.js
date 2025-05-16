const { adminDb } = require('../services/FirebaseService');

/**
 * Get tweets from Firestore
 * @returns {Promise<Array>} A promise that resolves with an array of tweets
 */
async function getTweets() {
  return new Promise(async (resolve, reject) => {
    try {
      // Fetch tweets from Firestore
      const tweetsRef = adminDb.collection('tweets');
      const snapshot = await tweetsRef.get();
      
      if (snapshot.empty) {
        console.log('No tweets found in Firestore');
        resolve([]);
        return;
      }
      
      // Convert Firestore documents to tweet objects
      const tweets = [];
      snapshot.forEach(doc => {
        const tweetData = doc.data();
        
        // Format the tweet to match your frontend expectations
        const formattedTweet = {
          Username: tweetData.Username,
          Text: tweetData.Text,
          Created_At: tweetData.Created_At,
          Retweets: tweetData.Retweets,
          Likes: tweetData.Likes,
          Tweet_ID: tweetData.Tweet_ID,
          Profile_Pic: tweetData.Profile_Pic,
          Media_Files: tweetData.Media_Files,
          T_co_Links: tweetData.T_co_Links,
          is_disinfo: tweetData.is_disinfo
        };
        
        tweets.push(formattedTweet);
      });
      
      console.log(`Retrieved ${tweets.length} tweets from Firestore`);
      resolve(tweets);
    } catch (error) {
      console.error('Error getting tweets from Firestore:', error);
      reject(error);
    }
  });
}

module.exports = {
  getTweets
};
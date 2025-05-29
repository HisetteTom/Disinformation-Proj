const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { updateUserUpgrades } = require("../services/userService");
const router = express.Router();
const { adminDb } = require("../services/FirebaseService");
const { Storage } = require('@google-cloud/storage');
const path = require("path");

const { 
  uploadFile,
  bucketNames,
  getFileStream
} = require('../services/gcpStorageService');
// Apply middleware to all routes in this router
router.use(authMiddleware);


const storage = new Storage({
  keyFilename: path.join(__dirname, '..', 'GCP_KEYS.json')
});

// Get user profile
router.get("/profile", async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch the complete user data from Firestore including upgrades
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userData = userDoc.data();
    
    // Combine Firebase auth user data with Firestore user data
    const completeUserData = {
      ...req.user,
      money: userData.money || 0,
      upgrades: userData.upgrades || {},
      correctlyAnsweredTweets: userData.correctlyAnsweredTweets || [] 
    };
    
    res.status(200).json({
      message: "Profile retrieved successfully",
      user: completeUserData,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error retrieving profile" });
  }
});

router.post("/upgrades", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { money, upgrades } = req.body;

    if (typeof money !== "number") {
      return res.status(400).json({ message: "Valid money amount is required" });
    }

    // Update user upgrades and money
    const updatedProfile = await updateUserUpgrades(userId, money, upgrades);

    res.status(200).json({
      message: "Upgrades updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Upgrades update error:", error);
    res.status(500).json({ message: "Server error updating upgrades" });
  }
});

router.get("/money", async (req, res) => {
  try {
    // Get userId from the middleware
    const userId = req.user.userId;

    // Fetch user from database with full details 
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    res.status(200).json({
      message: "Money retrieved successfully",
      money: userData.money || 0,
      upgrades: userData.upgrades || {},
    });
  } catch (error) {
    console.error("Money retrieval error:", error);
    res.status(500).json({ message: "Server error retrieving money" });
  }
});

router.get('/tweets', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { hashtag } = req.query;
    
    // Get user correctly answered tweets to filter them out
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const alreadyAnsweredTweets = userData.correctlyAnsweredTweets || [];
    
    console.log(`User ${userId} has already answered ${alreadyAnsweredTweets.length} tweets`);
    console.log(`Already answered tweet IDs:`, alreadyAnsweredTweets.slice(0, 5));
    
    if (hashtag) {
      console.log(`Filtering tweets by hashtag: "${hashtag}"`);
    }
    
    const tweetsRef = adminDb.collection('tweets');
    const allTweetsSnapshot = await tweetsRef.limit(500).get();
    
    let availableTweets = [];
    let filteredOutCount = 0;
    
    allTweetsSnapshot.forEach(doc => {
      const tweetData = doc.data();
      
      // Filter by hashtag if specified
      if (hashtag) {
        const tweetHashtags = tweetData.Hashtags || '';
        const hashtagList = tweetHashtags.split(/[,;|#\s]+/)
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0);
        
        const hasMatchingHashtag = hashtagList.includes(hashtag.toLowerCase());
        
        if (!hasMatchingHashtag) {
          console.log(`Skipping tweet ${doc.id} - hashtags: "${tweetHashtags}" doesn't contain "${hashtag}"`);
          filteredOutCount++;
          return;
        } else {
          console.log(`Including tweet ${doc.id} - hashtags: "${tweetHashtags}" contains "${hashtag}"`);
        }
      }
      
      // Add all tweets that match hashtag filter 
      availableTweets.push({ 
        id: doc.id,
        ...tweetData 
      });
    });
    
    // Separate into new tweets and answered tweets
    const newTweets = availableTweets.filter(tweet => 
      !alreadyAnsweredTweets.includes(tweet.id)
    );
    
    const answeredTweets = availableTweets.filter(tweet => 
      alreadyAnsweredTweets.includes(tweet.id)
    );
    
    console.log(`Found ${newTweets.length} new tweets and ${answeredTweets.length} previously answered tweets`);
    
    // If we don't have enough new tweets, include some answered ones
    let finalTweets = [...newTweets];
    
    if (finalTweets.length < 20) { 
      console.log(`Only ${finalTweets.length} new tweets available. Adding some previously answered tweets for replay.`);
      
      // Add some answered tweets to make the game playable
      const shuffledAnsweredTweets = answeredTweets.sort(() => Math.random() - 0.5);
      const tweetsNeeded = Math.min(50 - finalTweets.length, shuffledAnsweredTweets.length);
      finalTweets = [...finalTweets, ...shuffledAnsweredTweets.slice(0, tweetsNeeded)];
      
      console.log(`Added ${tweetsNeeded} previously answered tweets for replay`);
    }
    
    const unclassifiedTweets = finalTweets.filter(tweet => 
      !tweet.is_disinfo || tweet.is_disinfo === ''
    );
    
    const classifiedTweets = finalTweets.filter(tweet => 
      tweet.is_disinfo === 'true' || tweet.is_disinfo === 'false'
    );
    
    // Combine with unclassified first, then classified
    let gameTweets = [...unclassifiedTweets, ...classifiedTweets];
    
    // Shuffle the final list
    gameTweets = gameTweets.sort(() => Math.random() - 0.5);
    
    // Limit to 100 tweets maximum
    gameTweets = gameTweets.slice(0, 100);
    
    const filterText = hashtag ? ` (filtered by hashtag: ${hashtag})` : '';
    console.log(`Returning ${gameTweets.length} tweets for game${filterText} (${unclassifiedTweets.length} unclassified, ${Math.min(classifiedTweets.length, 100 - unclassifiedTweets.length)} classified)`);
    console.log(`Included ${newTweets.filter(t => gameTweets.some(gt => gt.id === t.id)).length} new tweets and ${answeredTweets.filter(t => gameTweets.some(gt => gt.id === t.id)).length} replay tweets`);
    
    if (hashtag && gameTweets.length > 0) {
      console.log(`Sample hashtags from returned tweets:`);
      gameTweets.slice(0, 3).forEach((tweet, i) => {
        console.log(`  Tweet ${i}: "${tweet.Hashtags}"`);
      });
    }
    
    res.json(gameTweets);
  } catch (error) {
    console.error('Error fetching tweets for game:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

// Delete tweet and associated media
router.post('/delete', async (req, res) => {
  try {
    const { tweetId } = req.body;
    
    if (!tweetId) {
      return res.status(400).json({ error: 'Tweet ID is required' });
    }
    
    // Get tweet data first
    const tweetRef = adminDb.collection('tweets').doc(tweetId);
    const tweetDoc = await tweetRef.get();
    
    if (!tweetDoc.exists) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    const tweetData = tweetDoc.data();
    
    // Delete profile pic if exists - with proper error handling
    if (tweetData.Profile_Pic && tweetData.Profile_Pic.includes('gs://')) {
      try {
        const profilePicPath = tweetData.Profile_Pic.replace('gs://', '');
        const [bucketName, ...objectPath] = profilePicPath.split('/');
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectPath.join('/'));
        
        // Check if file exists before trying to delete
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted profile pic: ${profilePicPath}`);
        } else {
          console.log(`Profile pic not found, skipping: ${profilePicPath}`);
        }
      } catch (profileError) {
        console.error(`Error deleting profile pic: ${profileError.message}`);
        // Don't throw the error, just log it and continue
      }
    }
    
    // Delete media files if they exist - with proper error handling
    if (tweetData.Media_Files) {
      const mediaFiles = tweetData.Media_Files.split('|');
      
      for (const mediaFile of mediaFiles) {
        if (mediaFile && mediaFile.includes('gs://')) {
          try {
            const mediaPath = mediaFile.replace('gs://', '');
            const [bucketName, ...objectPath] = mediaPath.split('/');
            const bucket = storage.bucket(bucketName);
            const file = bucket.file(objectPath.join('/'));
            
            // Check if file exists before trying to delete
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
              console.log(`Deleted media: ${mediaPath}`);
            } else {
              console.log(`Media file not found, skipping: ${mediaPath}`);
            }
          } catch (mediaError) {
            console.error(`Error deleting media file: ${mediaError.message}`);
            // Don't throw the error, just log it and continue
          }
        }
      }
    }
    
    // Finally delete the tweet document from Firestore
    await tweetRef.delete();
    
    res.json({ 
      success: true, 
      message: `Tweet ${tweetId} deleted successfully`,
      note: 'Some associated media files may not have existed and were skipped'
    });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).json({ error: 'Failed to delete tweet', details: error.message });
  }
});

router.post('/answered-tweets', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tweetIds } = req.body;

    console.log(`DEBUG: Received request to save ${tweetIds?.length} answered tweets for user ${userId}`);
    console.log(`DEBUG: Tweet IDs:`, tweetIds);
    
    if (!Array.isArray(tweetIds)) {
      console.error("Invalid tweet IDs format:", tweetIds);
      return res.status(400).json({ error: 'Invalid tweet IDs format' });
    }
    
    if (tweetIds.length === 0) {
      console.log("Empty tweet IDs array, nothing to save");
      return res.json({ success: true, message: 'No tweets to save', count: 0 });
    }
    
    // Validate that all tweet IDs are strings and not null/undefined
    const validTweetIds = tweetIds.filter(id => 
      id !== null && 
      id !== undefined && 
      typeof id === 'string' && 
      id.trim() !== ''
    );
    
    if (validTweetIds.length !== tweetIds.length) {
      console.log(`Filtered out ${tweetIds.length - validTweetIds.length} invalid tweet IDs`);
      console.log(`Invalid IDs:`, tweetIds.filter(id => !validTweetIds.includes(id)));
    }
    
    console.log(`Processing ${validTweetIds.length} valid tweet IDs`);
    
    // Get existing answered tweets for this user
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`User ${userId} not found in Firestore`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const existingAnsweredTweets = userData.correctlyAnsweredTweets || [];
    
    console.log(`User ${userId} has ${existingAnsweredTweets.length} existing answered tweets`);
    
    // Combine existing and new correctly answered tweets (remove duplicates)
    const updatedAnsweredTweets = [...new Set([...existingAnsweredTweets, ...validTweetIds])];
    
    console.log(`Saving ${updatedAnsweredTweets.length} total answered tweets (${updatedAnsweredTweets.length - existingAnsweredTweets.length} new)`);
    
    // Update the user document
    await userRef.update({ 
      correctlyAnsweredTweets: updatedAnsweredTweets,
      lastUpdated: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'Correctly answered tweets saved',
      count: updatedAnsweredTweets.length,
      newCount: updatedAnsweredTweets.length - existingAnsweredTweets.length,
      savedIds: validTweetIds
    });
  } catch (error) {
    console.error('Error saving correctly answered tweets:', error);
    res.status(500).json({ error: 'Failed to save answered tweets', message: error.message });
  }
});

router.post("/reset-profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Reset user profile data
    const userRef = adminDb.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset all user data to defaults
    const resetData = {
      money: 0,
      upgrades: {},
      correctlyAnsweredTweets: [],
      lastUpdated: new Date().toISOString()
    };

    await userRef.update(resetData);

    // Return the reset profile
    const userData = userDoc.data();
    const resetProfile = {
      ...req.user,
      money: 0,
      upgrades: {},
      correctlyAnsweredTweets: []
    };

    res.status(200).json({
      message: "Profile reset successfully",
      user: resetProfile,
    });
  } catch (error) {
    console.error("Profile reset error:", error);
    res.status(500).json({ message: "Server error resetting profile" });
  }
});

router.get('/hashtag-stats', async (req, res) => {
  try {
    const tweetsRef = adminDb.collection('tweets');
    const allTweetsSnapshot = await tweetsRef.get();
    
    const hashtagCounts = {};
    
    allTweetsSnapshot.forEach(doc => {
      const tweetData = doc.data();
      const hashtags = tweetData.Hashtags || '';
      
      if (hashtags) {
        // Split hashtags by common delimiters and clean them
        const hashtagList = hashtags.split(/[,;|]/).map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
        
        hashtagList.forEach(hashtag => {
          if (hashtagCounts[hashtag]) {
            hashtagCounts[hashtag]++;
          } else {
            hashtagCounts[hashtag] = 1;
          }
        });
      }
    });
    
    // Sort hashtags by count (descending)
    const sortedHashtags = Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20); // Return top 20 hashtags
    
    res.json(sortedHashtags.map(([hashtag, count]) => ({ hashtag, count })));
  } catch (error) {
    console.error('Error fetching hashtag stats:', error);
    res.status(500).json({ error: 'Failed to fetch hashtag statistics' });
  }
});

// Add this route after the delete route
router.post('/classify', async (req, res) => {
  try {
    const { tweetId, isDisinfo } = req.body;
    
    if (!tweetId) {
      return res.status(400).json({ error: 'Tweet ID is required' });
    }
    
    if (typeof isDisinfo !== 'boolean') {
      return res.status(400).json({ error: 'isDisinfo must be a boolean value' });
    }
    
    // Get tweet reference
    const tweetRef = adminDb.collection('tweets').doc(tweetId);
    const tweetDoc = await tweetRef.get();
    
    if (!tweetDoc.exists) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    // Update the tweet's classification
    await tweetRef.update({
      is_disinfo: isDisinfo.toString(), // Store as string to match existing data format
      classified_at: new Date().toISOString(),
      classified_by: req.user.userId
    });
    
    console.log(`Tweet ${tweetId} classified as ${isDisinfo ? 'disinformation' : 'not disinformation'} by user ${req.user.userId}`);
    
    res.json({ 
      success: true, 
      message: `Tweet classified as ${isDisinfo ? 'disinformation' : 'not disinformation'}`,
      tweetId,
      classification: isDisinfo
    });
  } catch (error) {
    console.error('Error classifying tweet:', error);
    res.status(500).json({ error: 'Failed to classify tweet', details: error.message });
  }
});


module.exports = router;

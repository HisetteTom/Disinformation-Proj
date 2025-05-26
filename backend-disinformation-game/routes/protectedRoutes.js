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

    // Fetch user from database with full details including money
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

// Get tweets that need moderation (prioritize unclassified tweets)
router.get('/tweets', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's correctly answered tweets to filter them out
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const alreadyAnsweredTweets = userData.correctlyAnsweredTweets || [];
    
    console.log(`User ${userId} has already answered ${alreadyAnsweredTweets.length} tweets`);
    console.log(`Already answered tweet IDs:`, alreadyAnsweredTweets.slice(0, 5)); // Show first 5 for debugging
    
    const tweetsRef = adminDb.collection('tweets');
    
    // Get all tweets from Firestore
    const allTweetsSnapshot = await tweetsRef.limit(500).get(); // Limit to avoid huge queries
    
    let availableTweets = [];
    allTweetsSnapshot.forEach(doc => {
      const tweetData = doc.data();
      
      // Skip tweets the user has already correctly answered
      // Use the Firestore document ID for comparison
      if (!alreadyAnsweredTweets.includes(doc.id)) {
        availableTweets.push({ 
          id: doc.id, // Use Firestore document ID
          ...tweetData 
        });
      } else {
        console.log(`Skipping already answered tweet: ${doc.id}`);
      }
    });
    
    // Prioritize unclassified tweets first
    const unclassifiedTweets = availableTweets.filter(tweet => 
      !tweet.is_disinfo || tweet.is_disinfo === ''
    );
    
    const classifiedTweets = availableTweets.filter(tweet => 
      tweet.is_disinfo === 'true' || tweet.is_disinfo === 'false'
    );
    
    // Combine with unclassified first, then classified
    let finalTweets = [...unclassifiedTweets, ...classifiedTweets];
    
    // Shuffle the final list to avoid predictable order
    finalTweets = finalTweets.sort(() => Math.random() - 0.5);
    
    // Limit to 100 tweets maximum
    finalTweets = finalTweets.slice(0, 100);
    
    console.log(`Returning ${finalTweets.length} tweets for game (${unclassifiedTweets.length} unclassified, ${Math.min(classifiedTweets.length, 100 - unclassifiedTweets.length)} classified)`);
    console.log(`Excluded ${alreadyAnsweredTweets.length} already answered tweets`);
    
    res.json(finalTweets);
  } catch (error) {
    console.error('Error fetching tweets for game:', error);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});

// Update tweet classification
router.post('/classify', async (req, res) => {
  try {
    const { tweetId, isDisinfo } = req.body;
    
    if (!tweetId) {
      return res.status(400).json({ error: 'Tweet ID is required' });
    }
    
    // Convert to string format as stored in Firestore
    const isDisinfoValue = isDisinfo ? 'true' : 'false';
    
    const tweetRef = adminDb.collection('tweets').doc(tweetId);
    await tweetRef.update({ 
      is_disinfo: isDisinfoValue,
      moderated_at: new Date().toISOString()
    });
    
    res.json({ success: true, message: `Tweet ${tweetId} marked as ${isDisinfoValue}` });
  } catch (error) {
    console.error('Error updating tweet classification:', error);
    res.status(500).json({ error: 'Failed to update classification' });
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
    
    // Delete profile pic if exists
    if (tweetData.Profile_Pic && tweetData.Profile_Pic.includes('gs://')) {
      try {
        const profilePicPath = tweetData.Profile_Pic.replace('gs://', '');
        const [bucketName, ...objectPath] = profilePicPath.split('/');
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(objectPath.join('/'));
        await file.delete();
        console.log(`Deleted profile pic: ${profilePicPath}`);
      } catch (profileError) {
        console.error(`Error deleting profile pic: ${profileError}`);
      }
    }
    
    // Delete media files if they exist
    if (tweetData.Media_Files) {
      const mediaFiles = tweetData.Media_Files.split('|');
      
      for (const mediaFile of mediaFiles) {
        if (mediaFile && mediaFile.includes('gs://')) {
          try {
            const mediaPath = mediaFile.replace('gs://', '');
            const [bucketName, ...objectPath] = mediaPath.split('/');
            const bucket = storage.bucket(bucketName);
            const file = bucket.file(objectPath.join('/'));
            await file.delete();
            console.log(`Deleted media: ${mediaPath}`);
          } catch (mediaError) {
            console.error(`Error deleting media file: ${mediaError}`);
          }
        }
      }
    }
    
    // Finally delete the tweet document from Firestore
    await tweetRef.delete();
    
    res.json({ success: true, message: `Tweet ${tweetId} and associated media deleted` });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).json({ error: 'Failed to delete tweet' });
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


module.exports = router;

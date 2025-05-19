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
      upgrades: userData.upgrades || {}
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
    const tweetsRef = adminDb.collection('tweets');
    
    // First get unclassified tweets
    const unclassifiedSnapshot = await tweetsRef
      .where('is_disinfo', '==', '')
      .limit(100)
      .get();
    
    let tweets = [];
    unclassifiedSnapshot.forEach(doc => {
      tweets.push({ id: doc.id, ...doc.data() });
    });
    
    // If we have fewer than 100 unclassified tweets, add some classified ones
    if (tweets.length < 100) {
      const classifiedSnapshot = await tweetsRef
        .where('is_disinfo', 'in', ['true', 'false'])
        .limit(100 - tweets.length)
        .get();
      
      classifiedSnapshot.forEach(doc => {
        tweets.push({ id: doc.id, ...doc.data() });
      });
    }
    
    console.log(`Returning ${tweets.length} tweets for moderation`);
    res.json(tweets);
  } catch (error) {
    console.error('Error fetching tweets for moderation:', error);
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


module.exports = router;

const { adminAuth, adminDb } = require('./FirebaseService');
require('dotenv').config();

/**
 * Register a new user's data in Firestore (Firebase Auth user already created)
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<Object>} - Registered user object
 */
async function registerUser(username, email, userId) {
    try {
      console.log(`REGISTRATION: Storing Firestore data for ${email} with username: ${username}`);
      
      // Check if username already exists in Firestore
      const usersRef = adminDb.collection('users');
      console.log(`REGISTRATION: Checking if username ${username} exists`);
      
      try {
        const usernameQuery = await usersRef.where('username', '==', username).get();
        console.log(`REGISTRATION: Username query completed. Empty? ${usernameQuery.empty}`);
        
        if (!usernameQuery.empty) {
          throw new Error('Username already taken');
        }
      } catch (firestoreError) {
        console.error(' REGISTRATION: Firestore username check error:', firestoreError);
        throw firestoreError;
      }
      
      // We don't need to create Firebase Auth user - it's already created by frontend
      // Just store additional user data in Firestore
      console.log(`REGISTRATION: Writing user data to Firestore for ${userId}`);
      try {
        await adminDb.collection('users').doc(userId).set({
          username,
          email,
          createdAt: new Date().toISOString(),
          money: 0,
          upgrades: {},
        });
        console.log(`REGISTRATION: User data written to Firestore`);
      } catch (writeError) {
        console.error(' REGISTRATION: Firestore user data write error:', writeError);
        throw writeError;
      }
      
      // Create initial stats document for user
      console.log(`REGISTRATION: Creating initial stats document for ${userId}`);
      try {
        await adminDb.collection('userStats').doc(userId).set({
          score: 0,
          gamesPlayed: 0,
          correctFlags: 0,
          incorrectFlags: 0,
          lastUpdated: new Date().toISOString()
        });
        console.log(`REGISTRATION: Initial stats created`);
      } catch (statsError) {
        console.error('REGISTRATION: Firestore stats write error:', statsError);
        // Don't throw here - the user is already created
      }
      
      console.log(`REGISTRATION: Successfully registered user with ID: ${userId}`);
      
      return {
        userId,
        username,
        email
      };
    } catch (error) {
      console.error('REGISTRATION FAILED:', error);
      throw error;
    }
}

/**
 * Login a user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Authenticated user object
 */
async function loginUser(email, password) {
  try {
    // We can't directly verify password with Firebase Admin
    // This would be done on the client side with Firebase Auth
    // Here we're just fetching the user data based on email
    
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;
    
    // Get user data from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User data not found');
    }
    
    const userData = userDoc.data();
    
    // Get user stats from Firestore
    const statsDoc = await adminDb.collection('userStats').doc(uid).get();
    let stats = {
      score: 0,
      gamesPlayed: 0,
      correctFlags: 0,
      incorrectFlags: 0
    };
    
    if (statsDoc.exists) {
      stats = statsDoc.data();
    }
    
    return {
      userId: uid,
      username: userData.username,
      email: userData.email,
      stats
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw new Error('Invalid credentials');
  }
}

/**
 * Update user stats after game completion
 * @param {string} userId - User ID
 * @param {Object} stats - Game statistics
 * @returns {Promise<Object>} - Updated user stats
 */
async function updateUserStats(userId, stats) {
  try {
    // Get current stats from Firestore
    const statsRef = adminDb.collection('userStats').doc(userId);
    const statsDoc = await statsRef.get();
    
    let currentStats = {
      score: 0,
      gamesPlayed: 0,
      correctFlags: 0,
      incorrectFlags: 0
    };
    
    if (statsDoc.exists) {
      currentStats = statsDoc.data();
    }
    
    // Update stats
    const updatedStats = {
      score: (currentStats.score || 0) + (stats.score || 0),
      gamesPlayed: (currentStats.gamesPlayed || 0) + 1,
      correctFlags: (currentStats.correctFlags || 0) + (stats.correctFlags || 0),
      incorrectFlags: (currentStats.incorrectFlags || 0) + (stats.incorrectFlags || 0),
      lastUpdated: new Date().toISOString()
    };
    
    // Save to Firestore
    await statsRef.set(updatedStats);
    
    return updatedStats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

/**
 * Update user upgrades and money
 * @param {string} userId - User ID
 * @param {number} money - User's money amount
 * @param {Object} upgrades - Object containing upgrade levels by upgrade ID
 * @returns {Promise<Object>} - Updated user profile
 */
async function updateUserUpgrades(userId, money, upgrades) {
    try {
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // Update user data with new money and upgrades
      const updatedData = {
        money: money,
        upgrades: upgrades || {},
        lastUpdated: new Date().toISOString()
      };
      
      await userRef.update(updatedData);
      
      return {
        userId,
        username: userData.username,
        email: userData.email,
        money: money,
        upgrades: upgrades
      };
    } catch (error) {
      console.error('Error updating user upgrades:', error);
      throw error;
    }
  }


module.exports = {
  registerUser,
  loginUser,
  updateUserStats,
  updateUserUpgrades
};
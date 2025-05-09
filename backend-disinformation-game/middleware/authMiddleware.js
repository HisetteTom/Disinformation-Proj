const { adminAuth } = require('../services/FirebaseService');

/**
 * Middleware that verifies Firebase ID tokens
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or malformed Authorization header');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const idToken = authHeader.split(' ')[1];
    
    try {
      // Verify Firebase token directly
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // Add user info to request object
      req.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.displayName
      };
      
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}

module.exports = authMiddleware;
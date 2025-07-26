const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied - No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];

  // Check if token exists and is not empty
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: "Access Denied - Token is null or empty" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure the user object has consistent ID field
    req.user = {
      id: verified.userId || verified.id, // Support both userId and id
      userId: verified.userId || verified.id, // Add userId for backward compatibility
      ...verified // Include any other token payload fields
    };
    
    console.log("Authenticated User:", req.user); // Debug log
    
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(400).json({ message: "Invalid Token" });
  }
};


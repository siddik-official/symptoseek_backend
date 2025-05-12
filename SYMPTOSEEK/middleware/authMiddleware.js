const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.header("Authorization");
  
  if (!authHeader) return res.status(401).json({ message: "Access Denied" });

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid token format" });
  }

  const token = authHeader.split(" ")[1];


  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
  
    
    // Ensure the user object has consistent ID field
    req.user = {
      id: verified.userId || verified.userId, // Supports both 'id' and '_id' from token
      ...verified // Include any other token payload fields
    };
    
    console.log("Authenticated User:", req.user); // Debug log
    
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(400).json({ message: "Invalid Token" });
  }
};


// const jwt = require("jsonwebtoken");

// module.exports = function (req, res, next) {
//   const authHeader = req.header("Authorization");
  
//   if (!authHeader) return res.status(401).json({ message: "Access Denied" });

//   if (!authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Invalid token format" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     next();
//   } catch (error) {
//     res.status(400).json({ message: "Invalid Token" });
//   }
// };




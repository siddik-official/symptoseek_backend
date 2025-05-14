const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        profile_pic: user.profile_pic
      } 
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Get Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Profile (now accepts Cloudinary URL from frontend)
router.put("/profile/edit", authMiddleware, async (req, res) => {
  try {
    const { 
      name, 
      bio, 
      gender, 
      age, 
      phone, 
      address, 
      zip_code, 
      country, 
      state, 
      city, 
      profile_pic,
      blood_group,
      weight,
      height,
      allergies,
      medical_conditions,
      medications,
      surgeries,
      family_medical_history,
      emergency_contact 
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        name, 
        bio, 
        gender, 
        age, 
        phone, 
        address, 
        zip_code, 
        country, 
        state, 
        city, 
        profile_pic,
        blood_group,
        weight,
        height,
        allergies,
        medical_conditions,
        medications,
        surgeries,
        family_medical_history,
        emergency_contact  
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

//previous code

// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/user");
// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("cloudinary").v2;

// const router = express.Router();

// // Cloudinary Storage Configuration
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "profile_pics", // Folder name in Cloudinary
//     format: async () => "png", // Image format
//     public_id: (req, file) => file.fieldname + "-" + Date.now(),
//   },
// });

// const upload = multer({ storage });

// router.post("/signup", async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     let user = await User.findOne({ email });
//     if (user) return res.status(400).json({ message: "User already exists" });

//     const salt = await bcrypt.genSalt(10); // Generate salt
//     const hashedPassword = await bcrypt.hash(password, salt); // Hash password

//     user = new User({ name, email, password: hashedPassword });
//     await user.save();

//     res.status(201).json({ message: "User created successfully" });
//   } catch (error) {
//     res.status(500).json({ error: "Server Error" });
//   }
// });



// module.exports = router;



// router.post("/login", async (req, res) => {
//     try {
//       const { email, password } = req.body;
  
//       const user = await User.findOne({ email });
//       if (!user) return res.status(400).json({ message: "Invalid credentials" });
  
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
  
//       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
//       res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
//     } catch (error) {
//       res.status(500).json({ error: "Server Error" });
//     }
//   });
  
//   module.exports = router;

//   const authMiddleware = require("../middleware/authMiddleware");

// router.get("/profile", authMiddleware, async (req, res) => {
//   const user = await User.findById(req.user.userId).select("-password");
//   res.json(user);
// });

// // router.put("/profile/edit", authMiddleware, async (req, res) => {
// //   try {
// //     const { name, bio, gender, age, phone, address, zip_code, country, state, city, profile_pic } = req.body;

// //     // Find and update the user

    
// //     const updatedUser = await User.findByIdAndUpdate(
// //       req.user.userId,
// //       { name, bio, gender, age, phone, address, zip_code, country, state, city, profile_pic },
// //       { new: true, runValidators: true }
// //     ).select("-password"); // Exclude password from response

// //     if (!updatedUser) {
// //       return res.status(404).json({ message: "User not found" });
// //     }

// //     res.json(updatedUser);
// //   } catch (error) {
// //     res.status(500).json({ message: "Server error", error: error.message });
// //   }
// // });

// router.put("/profile/edit", authMiddleware, upload.single("profile_pic"), async (req, res) => {
//   try {
//     const { name, bio, gender, age, phone, address, zip_code, country, state, city } = req.body;

//     // Get the Cloudinary URL
//     let profilePicUrl = req.file ? req.file.path : undefined;

//     // Update User in MongoDB
//     const updatedUser = await User.findByIdAndUpdate(
//       req.user.userId,
//       { name, bio, gender, age, phone, address, zip_code, country, state, city, ...(profilePicUrl && { profile_pic: profilePicUrl }) },
//       { new: true, runValidators: true }
//     ).select("-password"); // Exclude password from response

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(updatedUser);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// });


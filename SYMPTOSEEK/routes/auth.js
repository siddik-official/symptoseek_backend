const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // NEW: Import nodemailer
const User = require("../models/user");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// NEW: Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or your preferred email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Signup (Updated for OTP verification)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
        // NEW: If user exists but is not verified, resend OTP
        if (!user.isVerified) {
            // Generate and save new OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otp = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
            await user.save();

            // Resend OTP email
            await transporter.sendMail({
                to: user.email,
                subject: 'Verify Your Email Address Again',
                html: `<p>Your new OTP is: <b>${otp}</b>. It is valid for 10 minutes.</p>`
            });
            return res.status(200).json({ message: "User already exists but is not verified. A new OTP has been sent." });
        }
        return res.status(400).json({ message: "User with this email already exists and is verified." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // NEW: Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    user = new User({ 
        name, 
        email, 
        password: hashedPassword,
        otp,        // NEW: Save OTP
        otpExpires  // NEW: Save OTP expiry
    });
    await user.save();
    
    // NEW: Send OTP email
    await transporter.sendMail({
        to: user.email,
        subject: 'Verify Your Email Address',
        html: `<p>
  Welcome to the 
  <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a>!
  Your OTP for email verification is: <b>${otp}</b>.
  It is valid for 10 minutes.
  Do not share this code with anyone.
  Keep stay with 
  <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a>.
</p>
        <p>Thank you for registering with us!</p>`

    });

    res.status(201).json({ message: "User created successfully. Please check your email for the verification OTP." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// NEW: Endpoint to verify the OTP
router.post("/verify-email", async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user and explicitly select otp fields
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(400).json({ message: "User not found or email is incorrect." });
        }
        
        if (user.isVerified) {
            return res.status(400).json({ message: "Email is already verified." });
        }

        if (user.otp !== otp || Date.now() > user.otpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Verification successful
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now log in." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server Error" });
    }
});

// In routes/auth.js

// ... (after your /verify-email route) ...

/**
 * @route POST /api/auth/resend-otp
 * @desc Resend the verification OTP
 */
router.post("/resend-otp", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return res.status(400).json({ message: "This account is already verified." });
        }

        // Generate a new OTP and expiry date
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        await user.save();

        // Send the new OTP email
        await transporter.sendMail({
            to: user.email,
            subject: 'Your New Verification Code',
            html: `<p>Your new OTP for email verification is: <b>${otp}</b>. It is valid for 10 minutes.</p>`
        });

        res.status(200).json({ message: "A new OTP has been sent to your email." });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});


// Login (Updated to check for verification)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password'); // Explicitly select password
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // NEW: Check if the user's email is verified
    if (!user.isVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in." });
    }

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


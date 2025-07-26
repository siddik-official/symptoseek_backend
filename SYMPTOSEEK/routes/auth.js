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

// Forgot Password - Send reset token
router.post("/forgot-password", async (req, res) => {
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

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(400).json({ message: "Please verify your email first before resetting password." });
        }

        // Generate a secure random token (6-digit code for simplicity)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Set token and expiry (1 minute from now)
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 1 * 60 * 1000; // 1 minute

        await user.save();

        // Send password reset email
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <p>Hello ${user.name},</p>
                <p>You requested to reset your password for your 
                <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a> account.</p>
                <p>Your password reset code is: <b>${resetToken}</b></p>
                <p>This code is valid for 1 minute only.</p>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Best regards,<br>
                <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a> Team</p>
            `
        });

        res.status(200).json({ 
            message: "Password reset code has been sent to your email." 
        });

    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Reset Password - Verify token and set new password
router.post("/reset-password", async (req, res) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ 
                message: "Email, reset token, and new password are required." 
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters long." 
            });
        }

        // Find user and explicitly select password reset fields
        const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(400).json({ 
                message: "Please verify your email first." 
            });
        }

        // Check if reset token is valid and not expired
        if (!user.passwordResetToken || 
            user.passwordResetToken !== resetToken || 
            Date.now() > user.passwordResetExpires) {
            return res.status(400).json({ 
                message: "Invalid or expired reset token." 
            });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user with new password and clear reset fields
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.passwordChangedAt = new Date();

        await user.save();

        // Send confirmation email
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Successful',
            html: `
                <p>Hello ${user.name},</p>
                <p>Your password has been successfully reset for your 
                <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a> account.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <p>Best regards,<br>
                <a href="https://symptoseek.vercel.app" target="_blank">SymptoSeek</a> Team</p>
            `
        });

        res.status(200).json({ 
            message: "Password has been reset successfully. You can now log in with your new password." 
        });

    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// Verify Reset Token (optional - for frontend validation)
router.post("/verify-reset-token", async (req, res) => {
    try {
        const { email, resetToken } = req.body;

        if (!email || !resetToken) {
            return res.status(400).json({ 
                message: "Email and reset token are required." 
            });
        }

        // Find user and check reset token
        const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check if reset token is valid and not expired
        if (!user.passwordResetToken || 
            user.passwordResetToken !== resetToken || 
            Date.now() > user.passwordResetExpires) {
            return res.status(400).json({ 
                message: "Invalid or expired reset token." 
            });
        }

        res.status(200).json({ 
            message: "Reset token is valid.",
            valid: true
        });

    } catch (error) {
        console.error("Verify reset token error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});


// Login (Updated to check for verification)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password'); // Explicitly select password
    if (!user) return res.status(400).json({ message: "Incorrect email address. Please try again." });

    // NEW: Check if the user's email is verified
    if (!user.isVerified) {
        return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password. Please try again." });

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
    const userId = req.user.id || req.user.userId; // Support both for backward compatibility
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
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

// Admin Login Route
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is an admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create and sign JWT token
    const payload = {
      userId: user._id,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_pic: user.profile_pic
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create Admin User (for testing/setup only - remove in production)
router.post("/admin/create", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin user already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user
    const adminUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true // Admin doesn't need email verification
    });

    await adminUser.save();

    res.json({ 
      message: "Admin user created successfully",
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Change Password - For authenticated users
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    user.password = hashedNewPassword;
    await user.save();

    // Send confirmation email
    try {
      await transporter.sendMail({
        to: user.email,
        subject: 'Password Changed Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #9333ea;">Password Changed Successfully</h2>
            <p>Hello ${user.name},</p>
            <p>Your password has been successfully changed on ${new Date().toLocaleString()}.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <br>
            <p>Best regards,<br>SymptoSeek Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Failed to send password change confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({ 
      message: "Password changed successfully. A confirmation email has been sent." 
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;


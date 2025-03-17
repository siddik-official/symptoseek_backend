const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: {String},
  gender: {String},
  age: {Number},
  phone: {String},
  address: {String},
  zip_code: {String},
  country: {String},
  state: {String},
  city: {String},
  profile_pic: {String},
  date: { type: Date, default: Date.now },
  role: { type: String, default: "user" },
  status: { type: String, default: "active" },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationSentAt: { type: Date },
  passwordChangedAt: { type: Date },

  // Mdeical Information
  blood_group: {String},
  weight: {String},
  height: {String},
  allergies: {String},
  medical_conditions: {String},
  medications: {String},
  surgeries: {String},
  family_medical_history: {String},
  emergency_contact: {String},
  
  
});

module.exports = mongoose.model("User", UserSchema);

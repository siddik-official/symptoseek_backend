const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: "" },
  gender: { type: String, default: "" },
  age: { type: Number, default: null },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  zip_code: { type: String, default: "" },
  country: { type: String, default: "" },
  state: { type: String, default: "" },
  city: { type: String, default: "" },
  profile_pic: { type: String, default: "" },
  date: { type: Date, default: Date.now },
  role: { type: String, default: "user" },
  status: { type: String, default: "active" },

  isVerified: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        required: false, // Not required for all users, only during verification
        select: false,   // Will not be returned in queries by default
    },
    otpExpires: {
        type: Date,
        required: false,
        select: false,   // Will not be returned in queries by default
    },

  timezone: { type: String, default: 'Asia/Dhaka' },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  emailVerified: { type: Boolean, default: false },
  emailVerificationSentAt: { type: Date, select: false },
  passwordChangedAt: { type: Date, select: false },
  

  
  // Medical Information
  blood_group: { type: String, default: "" },
  weight: { type: String, default: "" },
  height: { type: String, default: "" },
  allergies: { type: String, default: "" },
  medical_conditions: { type: String, default: "" },
  medications: { type: String, default: "" },
  surgeries: { type: String, default: "" },
  family_medical_history: { type: String, default: "" },
  emergency_contact: { type: String, default: "" }
});

module.exports = mongoose.model("User", UserSchema);


//previous code

// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   bio: {String},
//   gender: {String},
//   age: {Number},
//   phone: {String},
//   address: {String},
//   zip_code: {String},
//   country: {String},
//   state: {String},
//   city: {String},
//   profile_pic: { type: String, default: "" },
//     date: { type: Date, default: Date.now },
//   role: { type: String, default: "user" },
//   status: { type: String, default: "active" },
//   // isVerified: { type: Boolean, default: false },
//   // verificationToken: { type: String },
//   // passwordResetToken: { type: String },
//   // passwordResetExpires: { type: Date },
//   // emailVerificationToken: { type: String },
//   // emailVerificationExpires: { type: Date },
//   // emailVerified: { type: Boolean, default: false },
//   // emailVerificationSentAt: { type: Date },
//   // passwordChangedAt: { type: Date },

//   // Mdeical Information
//   blood_group: {String},
//   weight: {String},
//   height: {String},
//   allergies: {String},
//   medical_conditions: {String},
//   medications: {String},
//   surgeries: {String},
//   family_medical_history: {String},
//   emergency_contact: {String},
  
  
// });

// module.exports = mongoose.model("User", UserSchema);

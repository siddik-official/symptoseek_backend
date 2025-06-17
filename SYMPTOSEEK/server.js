require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
// const dotenv = require("dotenv");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;


// Routes
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const symptomRoutes = require("./routes/symptoms");
const alertRoutes = require("./routes/emergency-alert");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const chatRoutes = require("./routes/chat");
const reminderRoutes = require("./routes/reminder"); 
const reportsRoutes = require("./routes/reports"); 
const { initializeSchedules } = require('./services/schedulerService'); 


// dotenv.config();

// In server.js
// app.use(cors({
//   origin: "http://localhost:3000",
//   credentials: true
// }));

// Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded ✅" : "Missing ❌");


const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/emergency-alert", alertRoutes);
app.use("/api/doctors", doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes); // Chat route
app.use('/api/reminder', reminderRoutes); // Reminders route
app.use('/api/reports', reportsRoutes); // Reports route


const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialize scheduled reminders
initializeSchedules()
  .then(() => console.log("Reminder schedules initialized successfully."))
  .catch(err => console.error("Error initializing reminder schedules:", err));

// Create a single, robust graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Stop the server from accepting new connections
  server.close(async (err) => {
    if (err) {
      console.error('Error closing the server:', err);
      process.exit(1); // Exit with an error code
    }
    console.log('✅ HTTP server closed.');

    // Close the MongoDB connection
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed.');
    } catch (dbErr) {
      console.error('Error closing MongoDB connection:', dbErr);
    } finally {
      // This is the final exit
      console.log('Exiting process.');
      process.exit(0);
    }
  });
};

// 3. Listen for termination signals (Ctrl+C and from deployment environments)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));


// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error.name, error.message);
  // It's often recommended to crash on unhandled rejections
  // so the process can be restarted in a clean state by a process manager (like PM2 or Docker)
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.name, error.message);
  server.close(() => {
    process.exit(1);
  });
});

// =================================================================
// END OF CHANGES
// =================================================================

module.exports = app;
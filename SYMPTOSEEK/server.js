const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
// const session = require("express-session");
const authRoutes = require("./routes/auth");  // Import authentication routes
const symptomRoutes = require("./routes/symptoms");
const alertRoutes = require("./routes/emergency-alert");
const doctorRoutes = require("./routes/doctors");
// const checkUserSession = require("./middleware/checkUserSession");

// const Symptom = require("./models/symptoms");
// const EmergencyAlert = require("./models/EmergencyAlert");
// const Doctor = require("./models/doctors");
dotenv.config();  // Load environment variables


const app = express();

// Middleware
app.use(express.json()); // Parse JSON requests
app.use(cors()); // Enable CORS
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: false } 
// }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Routes
app.use("/api/auth", authRoutes); // Use authentication routes
app.use("/api/symptom", symptomRoutes); // use
app.use("/api/emergency-alert", alertRoutes);
app.use("/api/doctors", doctorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

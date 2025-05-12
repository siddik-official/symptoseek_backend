const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

// Routes
const authRoutes = require("./routes/auth");
const symptomRoutes = require("./routes/symptoms");
const alertRoutes = require("./routes/emergency-alert");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");



dotenv.config();

// In server.js
// app.use(cors({
//   origin: "http://localhost:3000", // Your frontend URL
//   credentials: true
// }));

// Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
app.use("/api/auth", authRoutes);
app.use("/api/symptoms", symptomRoutes);
app.use("/api/emergency-alert", alertRoutes);
app.use("/api/doctors", doctorRoutes);
app.use('/api/appointments', appointmentRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


//previous code 

// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const http = require("http");
// const socketIo = require("socket.io");
// const cors = require("cors");
// const cloudinary = require("cloudinary").v2;
// // const session = require("express-session");
// const authRoutes = require("./routes/auth");  // Import authentication routes
// const symptomRoutes = require("./routes/symptoms");
// const alertRoutes = require("./routes/emergency-alert");
// const doctorRoutes = require("./routes/doctors");
// // const checkUserSession = require("./middleware/checkUserSession");

// // const Symptom = require("./models/symptoms");
// // const EmergencyAlert = require("./models/EmergencyAlert");
// // const Doctor = require("./models/doctors");
// dotenv.config();  // Load environment variables


// const app = express();


// // Middleware
// app.use(express.json({ limit: "50mb" })); // Parse JSON requests
// app.use(cors()); // Enable CORS
// // app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ limit: "50mb", extended: true }));

// // app.use(session({
// //   secret: process.env.SESSION_SECRET,
// //   resave: false,
// //   saveUninitialized: true,
// //   cookie: { secure: false } 
// // }));

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err));

// // Routes
// app.use("/api/auth", authRoutes); // Use authentication routes
// app.use("/api/symptom", symptomRoutes); // use
// app.use("/api/emergency-alert", alertRoutes);
// app.use("/api/doctors", doctorRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

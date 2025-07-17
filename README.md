# SymptomSeek - AI-Powered Medical Diagnosis Assistant

SymptomSeek is an intelligent healthcare application that uses machine learning to analyze symptoms and provide disease predictions, along with doctor recommendations and appointment booking functionality.
## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/siddik-official/symptoseek_backend.git
   cd symptoseek_backend/SYMPTOSEEK
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies for ML services**
   ```bash
   cd disease_predictions
   pip install -r requirements.txt
   cd ..
   
   # For additional ML services
   cd ml-services
   pip install -r requirement.txt
   cd ..
   ```

4. **Environment Setup**
   Create a `.env` file in the SYMPTOSEEK root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGO_URI=your_mongo_uri
   
   # Authentication
   JWT_SECRET=your_super_secure_jwt_secret_here
   
   # Cloudinary Configuration (for file uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Email Service (for notifications and reminders)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   
   # ML Service Configuration
   FLASK_PORT=5001
   ML_SERVICE_URL=http://localhost:5001
   ```

5. **Database Setup**
   - Ensure MongoDB is running on your system
   - The application will automatically create the required collections

6. **Train the ML Model** (First time setup)
   ```bash
   cd disease_predictions
   python model_training.py
   ```

7. **Start the Application**
   
   **Method 1: Manual Start**
   ```bash
   # Terminal 1: Start the main Express server
   npm start
   # or
   node server.js
   
   # Terminal 2: Start the ML prediction service
   cd disease_predictions
   python app.py
   
   # Terminal 3: Start additional ML services (optional)
   cd ml-services
   python app.py
   ```
   
   **Method 2: Using Docker (if configured)**
   ```bash
   docker-compose up
   ```

## 🌟 Features

- **AI Disease Prediction**: Machine learning-powered symptom analysis using Random Forest Classifier
- **Doctor Recommendations**: Find suitable doctors based on predicted conditions
- **Appointment Booking**: Schedule appointments with healthcare providers
- **User Authentication**: Secure user registration and login system
- **Real-time Chat**: Interactive symptom assessment through chat interface
- **Emergency Alerts**: Critical health condition notifications
- **Appointment Reminders**: Automated email reminders for scheduled appointments
- **Report Generation**: Comprehensive health reports and analytics
- **Admin Panel**: Administrative interface for managing users and data

## 🏗️ Project Structure

```
SYMPTOSEEK/
├── server.js                     # Main Express server
├── package.json                  # Node.js dependencies
├── docker-compose.yml            # Docker configuration
├── dataset.py                    # Data processing utilities
├── keyword_extraction.py         # Symptom keyword extraction
├── admin/                        # Admin panel components
├── config/
│   └── cloudinary.js            # Cloudinary configuration
├── disease_predictions/
│   ├── app.py                   # Flask ML service
│   ├── model_training.py        # ML model training script
│   ├── requirements.txt         # Python dependencies
│   ├── models/                  # Trained ML models
│   ├── datasets/                # Training and testing data
│   ├── doctors_bd_detailed.csv  # Doctor database
│   ├── symptom_Description.csv  # Disease descriptions
│   └── symptom_precaution.csv   # Disease precautions
├── models/
│   ├── user.js                  # User schema
│   ├── appointments.js          # Appointment schema
│   ├── doctors.js               # Doctor schema
│   ├── emergency-alert.js       # Emergency alert schema
│   ├── notifications.js         # Notification schema
│   ├── reminders.js             # Reminder schema
│   ├── reports.js               # Report schema
│   └── symptoms.js              # Symptom schema
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── appointments.js          # Appointment management
│   ├── doctors.js               # Doctor information
│   ├── chat.js                  # Chat/symptom interaction
│   ├── emergency-alert.js       # Emergency notifications
│   ├── notifications.js         # General notifications
│   ├── reminder.js              # Appointment reminders
│   ├── reports.js               # Health reports
│   ├── symptoms.js              # Symptom data
│   └── admin.js                 # Admin operations
├── middleware/
│   ├── authMiddleware.js        # JWT authentication
│   ├── adminMiddleware.js       # Admin authorization
│   ├── checkUserSession.js     # Session validation
│   ├── upload.js                # File upload handling
│   └── validation.js            # Input validation
├── services/
│   ├── emailService.js          # Email notifications
│   └── schedulerService.js      # Task scheduling
├── utils/
│   └── cronJobs.js              # Background job management
└── ml-services/
    ├── app.py                   # Additional ML services
    ├── models/                  # ML model storage
    └── tests/                   # ML service tests
```


## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Appointments
- `POST /api/appointments` - Book new appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/time` - Get server time

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor
- `GET /api/doctors/speciality/:speciality` - Get doctors by speciality

### Chat & Symptoms
- `POST /api/chat` - Send symptom message
- `GET /api/symptoms` - Get symptom list
- `POST /api/symptoms/predict` - Predict disease from symptoms

### Emergency Alerts
- `POST /api/emergency-alert` - Create emergency alert
- `GET /api/emergency-alert` - Get emergency alerts

### Notifications & Reminders
- `GET /api/notifications` - Get user notifications
- `POST /api/reminder` - Set appointment reminder
- `GET /api/reminder` - Get user reminders

### Reports
- `GET /api/reports` - Get health reports
- `POST /api/reports` - Generate new report

### Admin (Protected Routes)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/appointments` - Get all appointments
- `GET /api/admin/doctors` - Manage doctors

### Disease Prediction Service (Flask - Port 5001)
- `POST /predict` - Predict disease based on symptoms
- `POST /chat` - Interactive symptom assessment
- `GET /symptoms` - Get available symptoms list

## 🤖 Machine Learning Model

The disease prediction system uses a **Random Forest Classifier** with the following specifications:

- **Algorithm**: Random Forest with 150 estimators
- **Features**: 132+ symptom features
- **Classes**: 40+ different diseases
- **Expected Accuracy**: 92-98% on test data
- **Training Method**: Pre-split training and testing datasets

### Model Training

```bash
cd disease_predictions
python model_training.py
```

This will:
- Load training and testing data from CSV files
- Clean and preprocess the data
- Train the Random Forest model
- Evaluate model performance
- Save the trained model and symptom columns

### Model Files Generated
- `disease_prediction_model.pkl` - Trained classifier
- `symptom_columns.pkl` - Feature column names

## 📊 Database Schema

### User Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### Appointment Collection
```javascript
{
  userId: ObjectId (ref: User),
  doctors_id: ObjectId (ref: Doctor),
  date: Date,
  reason: String,
  status: String (default: 'Scheduled'),
  createdAt: Date
}
```

### Doctor Collection
```javascript
{
  name: String,
  speciality: String,
  address: String,
  number: String,
  visiting_hours: String,
  degree: String,
  hospital_name: String,
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `EMAIL_USER` | Email service username | Yes |
| `EMAIL_PASS` | Email service password | Yes |

### Development Scripts

```bash
# Start development server with nodemon
npm run dev

# Run tests
npm test

# Start production server
npm start

# Train ML model
cd disease_predictions && python model_training.py

# Run ML service tests
cd ml-services && python -m pytest tests/
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## 🧪 Testing

### Backend Testing
```bash
# Run Node.js tests
npm test

# Run specific test files
npm test -- --grep "appointments"
```

### ML Service Testing
```bash
cd ml-services
python -m pytest tests/ -v
```

## 📱 Frontend Integration

This backend is designed to work with a frontend application. Key integration points:

- **CORS enabled** for cross-origin requests
- **RESTful API** structure
- **JSON responses** for all endpoints
- **JWT authentication** for protected routes
- **WebSocket support** for real-time features (if implemented)

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive data protection
- **Admin Middleware**: Role-based access control

## 🚀 Deployment

### Production Deployment Steps

1. **Set up production MongoDB**
2. **Configure production environment variables**
3. **Install production dependencies**
4. **Train and deploy ML models**
5. **Set up reverse proxy (nginx)**
6. **Configure SSL certificates**
7. **Set up monitoring and logging**

### Recommended Hosting Platforms
- **Backend**: Heroku, DigitalOcean, AWS, Railway
- **Database**: MongoDB Atlas, AWS DocumentDB
- **File Storage**: Cloudinary, AWS S3
- **ML Services**: Heroku, Google Cloud Platform, AWS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Abu Bakar Siddik** - *Initial work* - [siddik-official](https://github.com/siddik-official)

## 🙏 Acknowledgments

- scikit-learn for machine learning capabilities
- Express.js and Node.js community
- MongoDB for database solutions
- Cloudinary for file storage
- All contributors and testers

## 📞 Support

For support, email official.siddik@gmail.com or create an issue in the GitHub repository.

## 🔄 Version History

- **1.0.0** - Initial release with core features
  - Disease prediction ML model
  - User authentication system
  - Appointment booking
  - Doctor recommendations
  - Admin panel

---

**Built with ❤️ for better healthcare accessibility**

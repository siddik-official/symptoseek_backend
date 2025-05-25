const request = require('supertest');
const app = require('../server');
const Doctor = require('../models/doctor.model');

describe('Prediction API', () => {
  beforeAll(async () => {
    // Seed test doctors
    await Doctor.create([
      {
        name: "Dr. Smith",
        specialization: "Cardiology",
        contact: "123-456-7890",
        hospital: "City General",
        rating: 4.5
      }
    ]);
  });

  afterAll(async () => {
    await Doctor.deleteMany({});
  });

  test('POST /api/chat/predict - valid symptoms', async () => {
    const res = await request(app)
      .post('/api/chat/predict')
      .send({ symptoms: ["chest pain", "shortness of breath"] })
      .expect(200);
    
    expect(res.body).toHaveProperty('diagnosis');
    expect(res.body.diagnosis).toHaveProperty('disease');
    expect(res.body.diagnosis.confidence).toBeGreaterThan(0.1);
    expect(res.body.recommended_doctors.length).toBeGreaterThan(0);
  });

  test('POST /api/chat/predict - invalid input', async () => {
    const res = await request(app)
      .post('/api/chat/predict')
      .send({ symptoms: [] })
      .expect(400);
    
    expect(res.body).toHaveProperty('errors');
  });

  test('POST /api/chat/predict - ML service down', async () => {
    // Temporarily change the ML service URL to an invalid one
    process.env.PYTHON_ML_URL = "http://localhost:9999";
    
    const res = await request(app)
      .post('/api/chat/predict')
      .send({ symptoms: ["fever"] })
      .expect(500);
    
    expect(res.body).toHaveProperty('error', 'Diagnosis service unavailable');
    
    // Restore the original URL
    process.env.PYTHON_ML_URL = "http://localhost:5001";
  });
});
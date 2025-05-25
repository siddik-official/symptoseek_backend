import pytest
from app import app, model, mlb
import joblib
import numpy as np

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_model_loading():
    """Test if model files exist and can be loaded"""
    try:
        model = joblib.load("models/symptom_classifier.pkl")
        mlb = joblib.load("models/symptom_binarizer.pkl")
        assert model is not None
        assert mlb is not None
    except FileNotFoundError:
        pytest.fail("Model files not found")

def test_prediction_endpoint(client):
    """Test the /predict endpoint"""
    # Test with valid symptoms
    response = client.post('/predict', json={
        "symptoms": ["fever", "cough"]
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "predicted_disease" in data
    assert "confidence" in data
    assert data["confidence"] > 0  # Confidence should be positive

    # Test with empty symptoms
    response = client.post('/predict', json={"symptoms": []})
    assert response.status_code == 400

def test_model_accuracy():
    """Test model accuracy with known samples"""
    # Get some known disease-symptom pairs from your CSV
    test_cases = [
        (["fever", "cough", "chest pain"], "Pneumonia"),
        (["abdominal pain", "nausea"], "Acute Pancreatitis")
    ]
    
    for symptoms, expected_disease in test_cases:
        features = mlb.transform([symptoms])
        prediction = model.predict(features)[0]
        assert prediction == expected_disease
import pytest
import joblib
import os
from sklearn.metrics import accuracy_score

@pytest.fixture
def trained_model():
    model_path = os.path.join("..", "models", "symptom_classifier.pkl")
    return joblib.load(model_path)

@pytest.fixture
def binarizer():
    binarizer_path = os.path.join("..", "models", "symptom_binarizer.pkl")
    return joblib.load(binarizer_path)

def test_model_prediction(trained_model, binarizer):
    test_symptoms = ["fever", "cough", "headache"]
    features = binarizer.transform([test_symptoms])
    prediction = trained_model.predict(features)
    assert len(prediction) == 1
    assert isinstance(prediction[0], str)

def test_model_accuracy(trained_model, binarizer, sample_data):
    X_test, y_test = sample_data
    y_pred = trained_model.predict(X_test)
    assert accuracy_score(y_test, y_pred) > 0.8  # Minimum accuracy threshold
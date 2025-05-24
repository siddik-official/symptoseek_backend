import pytest
from utils.preprocessing import clean_symptom_text, prepare_symptoms_for_prediction

def test_clean_symptom_text():
    assert clean_symptom_text("Severe Headache!") == "severe headache"
    assert clean_symptom_text("Nausea & Vomiting") == "nausea vomiting"
    assert clean_symptom_text("") == ""
    assert clean_symptom_text(123) == ""

def test_prepare_symptoms():
    symptoms = ["Chest pain", "Difficulty breathing"]
    processed = prepare_symptoms_for_prediction(symptoms)
    assert len(processed) == 2
    assert "pain" in processed[0]
    assert "breathing" in processed[1]
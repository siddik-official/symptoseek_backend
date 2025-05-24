import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

app = Flask(__name__)

# Path configuration
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_preprocess_data():
    """Load and preprocess the symptoms dataset"""
    data_path = os.path.join("data", "Fydp_Works2.csv")
    df = pd.read_csv(data_path)
    
    diseases = []
    current_category = ""
    
    for _, row in df.iterrows():
        if pd.isna(row["Desease"]):
            continue
        if all(pd.isna(row[1:])):
            current_category = row["Desease"]
        else:
            symptoms = [s.strip() for s in row[1:] if pd.notna(s)]
            diseases.append({
                "disease": row["Desease"],
                "category": current_category,
                "symptoms": symptoms
            })
    
    return diseases

def train_model():
    """Train and save the ML model"""
    diseases = load_and_preprocess_data()
    
    # Prepare features and labels
    mlb = MultiLabelBinarizer()
    X = mlb.fit_transform([d["symptoms"] for d in diseases])
    y = [d["disease"] for d in diseases]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train model
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    print("Model Accuracy:", accuracy_score(y_test, y_pred))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save artifacts
    joblib.dump(model, os.path.join(MODEL_DIR, "symptom_classifier.pkl"))
    joblib.dump(mlb, os.path.join(MODEL_DIR, "symptom_binarizer.pkl"))
    
    return model, mlb

# Load or train model
try:
    model = joblib.load(os.path.join(MODEL_DIR, "symptom_classifier.pkl"))
    mlb = joblib.load(os.path.join(MODEL_DIR, "symptom_binarizer.pkl"))
    print("Loaded pre-trained models")
except FileNotFoundError:
    print("Training new models...")
    model, mlb = train_model()

@app.route('/predict', methods=['POST'])
def predict():
    """Prediction endpoint"""
    symptoms = request.json.get('symptoms', [])
    
    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400
    
    try:
        features = mlb.transform([symptoms])
        proba = model.predict_proba(features)[0]
        best_idx = proba.argmax()
        
        return jsonify({
            "predicted_disease": model.classes_[best_idx],
            "confidence": float(proba[best_idx]),
            "related_symptoms": symptoms,
            "all_probabilities": {
                disease: float(prob) 
                for disease, prob in zip(model.classes_, proba)
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
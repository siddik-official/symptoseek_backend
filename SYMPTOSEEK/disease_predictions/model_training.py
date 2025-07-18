# model_training.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import os
import numpy as np 

# --- Configuration ---
MODEL_DIR = 'models'  # Directory to save models
MODEL_FILENAME = os.path.join(MODEL_DIR, 'disease_prediction_model.pkl')
SYMPTOM_COLUMNS_FILENAME = os.path.join(MODEL_DIR, 'symptom_columns.pkl')

# Create models directory if it doesn't exist
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Data Loading and Preprocessing ---
print("Loading training and testing data...")
try:
    train_df = pd.read_csv('Training.csv')
    test_df = pd.read_csv('Testing2.csv')
    print("Data loaded successfully.")
except FileNotFoundError:
    print("********************************************************************************")
    print("Error: Training.csv or Testing.csv not found in the current directory.")
    print("Please ensure these files  are present.")
    print("********************************************************************************")
    exit()

# Drop 'Unnamed: 133' if it exists and is all NaN (common issue with this dataset)
# Also, handle potential trailing spaces in column names
train_df.columns = train_df.columns.str.strip()
test_df.columns = test_df.columns.str.strip()

if 'Unnamed: 133' in train_df.columns:
    train_df = train_df.dropna(axis=1, how='all')
if 'Unnamed: 133' in test_df.columns:
    test_df = test_df.dropna(axis=1, how='all')

print(f"Training data shape: {train_df.shape}")
print(f"Testing data shape: {test_df.shape}")

# Features (X) and Target (y)
# Ensure 'prognosis' is the correct target column name
if 'prognosis' not in train_df.columns or 'prognosis' not in test_df.columns:
    print("Error: 'prognosis' column not found in CSV files. Please check column names.")
    exit()

X_train = train_df.drop('prognosis', axis=1)
y_train = train_df['prognosis']

X_test = test_df.drop('prognosis', axis=1)
y_test = test_df['prognosis']

# Store column names (symptoms) from the training set
# These names MUST match the symptom inputs the model expects
symptom_columns = list(X_train.columns)
if not symptom_columns:
    print("Error: No symptom columns found after dropping 'prognosis'. Check your CSV structure.")
    exit()
print(f"Number of symptom features: {len(symptom_columns)}")
print(f"First few symptoms: {symptom_columns[:5]}")


# --- Model Training ---
print("\nTraining the disease prediction model (RandomForestClassifier)...")

model = RandomForestClassifier(n_estimators=150, random_state=50, class_weight='balanced', min_samples_split=5)
try:
    model.fit(X_train, y_train)
    print("Model training complete.")
except Exception as e:
    print(f"Error during model training: {e}")
    exit()

# --- Model Evaluation ---
print("\nEvaluating model performance on the test set...")
try:
    y_pred_test = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred_test)
    print(f"Model Accuracy on Test Set: {accuracy * 100:.2f}%")

    # Example: Show a classification report for more detailed metrics
    from sklearn.metrics import classification_report
    print("\nClassification Report (Test Set):")
    # Use zero_division=0 to avoid warnings if a class has no predicted samples
    report = classification_report(y_test, y_pred_test, zero_division=0)
    print(report)

except Exception as e:
    print(f"Error during model evaluation: {e}")


# --- Saving the Model and Symptoms List using pickle ---
print("\nSaving the trained model and symptom list...")
try:
    with open(MODEL_FILENAME, 'wb') as model_file:
        pickle.dump(model, model_file)
    print(f"Model saved to: {MODEL_FILENAME}")

    with open(SYMPTOM_COLUMNS_FILENAME, 'wb') as Scolumns_file:
        pickle.dump(symptom_columns, Scolumns_file)
    print(f"Symptom column list saved to: {SYMPTOM_COLUMNS_FILENAME}")
except Exception as e:
    print(f"Error saving model or symptom list: {e}")

print("\n--- model_training.py finished ---")


# --- Optional: Example Prediction (for quick check) ---
if len(symptom_columns) > 3: # Ensure we have enough symptoms for a sensible example
    print("\n--- Running a quick example prediction ---")
    # Create a sample input: pick a few symptoms that exist in `symptom_columns`
    sample_symptoms_present = symptom_columns[:3] # e.g., ['itching', 'skin_rash', 'nodal_skin_eruptions']
    
    sample_symptoms_input_dict = {symptom: 0 for symptom in symptom_columns}
    for s in sample_symptoms_present:
        if s in sample_symptoms_input_dict:
            sample_symptoms_input_dict[s] = 1

    sample_df = pd.DataFrame([sample_symptoms_input_dict])
    # Ensure column order is the same as during training
    sample_df = sample_df[symptom_columns]

    try:
        predicted_disease_example = model.predict(sample_df)
        predicted_proba_example = model.predict_proba(sample_df)
        max_proba_example = np.max(predicted_proba_example)

        print(f"Example symptoms chosen: {', '.join(sample_symptoms_present)}")
        print(f"Predicted Disease: {predicted_disease_example[0]}")
        print(f"Confidence: {max_proba_example * 100:.2f}%")
    except Exception as e:
        print(f"Error during example prediction: {e}")
else:
    print("\nSkipping example prediction due to insufficient symptom columns for a test.")
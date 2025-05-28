# ArogyaBot BD - AI Health Assistant

ArogyaBot BD is a Flask-based web application that acts as an AI-powered chatbot. It helps users identify potential health conditions based on their symptoms and suggests relevant doctors in Bangladesh.

## Features

*   **Interactive Chat Interface:** Users communicate with the bot in a conversational manner.
*   **Symptom-Based Disease Prediction:** Utilizes a machine learning model trained on a symptom-disease dataset to predict potential ailments.
*   **Natural Language Symptom Input:** Users can describe symptoms in plain English; the bot attempts to map these to known symptoms.
*   **Iterative Symptom Elicitation:** The bot asks clarifying questions if initial symptom information is insufficient.
*   **Personalized Interaction:** Asks for the user's name for a more personal chat experience. Age and sex are requested for conversational completeness.
*   **Disease Information:** Provides descriptions and precautionary advice for predicted diseases.
*   **Doctor Recommendation (Bangladesh):** Suggests doctors based on the predicted disease and their specialization from a curated list of Bangladeshi doctors.

## Technology Stack

*   **Backend:** Python, Flask
*   **Machine Learning:** Scikit-learn (model trained on symptom data)
*   **NLP (Basic):** Fuzzy string matching (`fuzzywuzzy`) for symptom extraction, rule-based conversation flow.
*   **Frontend:** HTML, Tailwind CSS (via CDN), JavaScript
*   **Data:**
    *   Symptom-Disease Training Data (e.g., from Kaggle)
    *   Curated list of Bangladeshi Doctors (`doctors_bd_detailed.csv`)
    *   Disease Descriptions & Precautions (`symptom_Description.csv`, `symptom_precaution.csv`)

## Project Structure
/arogyabot_bd_project/
├── models/ # Trained ML model (.pkl) & symptom list
├── static/ # (Currently empty, Tailwind via CDN)
├── templates/ # HTML template (chat.html)
├── venv/ # Python virtual environment
├── app.py # Main Flask application logic
├── model_training.py # Script to train the disease prediction model
├── doctors_bd_detailed.csv # Doctor dataset
├── Training.csv # ML model training data
├── Testing.csv # ML model testing data
├── symptom_Description.csv # Disease descriptions
├── symptom_precaution.csv # Disease precautions
├── requirements.txt # Python dependencies
└── README.md # This file


## Setup and Installation

1.  **Clone the Repository (or create project directory):**
    ```bash
    git clone <your-repo-url>
    cd arogyabot_bd_project
    ```
    (If not using git, create the directory and place files manually.)

2.  **Create and Activate Virtual Environment:**
    ```bash
    python -m venv venv
    # On Windows:
    # venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    (If `requirements.txt` is not up-to-date, install manually: `pip install Flask pandas scikit-learn numpy fuzzywuzzy python-Levenshtein`)

4.  **Place Data Files:**
    Ensure the following CSV files are in the root project directory (`arogyabot_bd_project/`):
    *   `Training.csv`
    *   `Testing.csv`
    *   `doctors_bd_detailed.csv`
    *   `symptom_Description.csv`
    *   `symptom_precaution.csv`

5.  **Train the ML Model:**
    Run the training script once to generate the model files in the `models/` directory:
    ```bash
    python model_training.py
    ```

6.  **Configure `SYMPTOM_MAP` in `app.py`:**
    **CRITICAL STEP:** Open `app.py` and thoroughly populate the `SYMPTOM_MAP` dictionary. This map is essential for the bot to understand symptoms described in natural language. Every symptom your model uses must be mapped.

## Running the Application

1.  **Activate the virtual environment (if not already active).**
2.  **Start the Flask development server:**
    ```bash
    python app.py
    ```
3.  Open your web browser and navigate to `http://127.0.0.1:5002/` (or the port specified in `app.py`).

## Important Disclaimer

This application is for informational and demonstrative purposes only. It **does not** provide medical advice. The predictions made by the AI are not a substitute for consultation with a qualified healthcare professional. Always consult a doctor for any health concerns or before making any decisions related to your health.

## Future Enhancements

*   Integrate more advanced NLP (e.g., spaCy, Rasa) for better language understanding.
*   Improve the "intelligent questioning" strategy for symptom elicitation.
*   Use a proper database for session management and doctor data.
*   Add user authentication and history.
*   Incorporate location-based doctor search.
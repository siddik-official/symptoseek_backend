# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os
import re
from fuzzywuzzy import process, fuzz
from datetime import datetime
import pytz 

app = Flask(__name__)
CORS(app)
app.secret_key = os.urandom(24)

# --- Configuration & Paths ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'disease_prediction_model.pkl')
SYMPTOM_COLUMNS_PATH = os.path.join(MODEL_DIR, 'symptom_columns.pkl')

DOCTORS_CSV_PATH = os.path.join(BASE_DIR, 'doctors_bd_detailed.csv')
DISEASE_DESC_CSV_PATH = os.path.join(BASE_DIR, 'symptom_Description.csv')
DISEASE_PRECAUTION_CSV_PATH = os.path.join(BASE_DIR, 'symptom_precaution.csv')

# --- Global Variables for Loaded Data ---
model = None
MODEL_SYMPTOM_KEYS = []
doctors_df = pd.DataFrame()
disease_desc_df = pd.DataFrame()
disease_precaution_df = pd.DataFrame()

# --- Confidence thresholds & other constants (NEW) ---
HIGH_CONFIDENCE_THRESHOLD = 95
MEDIUM_CONFIDENCE_THRESHOLD = 80
MIN_SYMPTOMS_FOR_PREDICTION = 4
MAX_QUESTIONS_PER_ROUND = 3
GREETING_INPUTS = {"hi", "hello", "hey", "salam", "assalamualaikum", "good morning", "good afternoon", "good evening", "menu", "start"}


SYMPTOM_MAP = {
    "itching": {"model_key": "itching", "ask_phrase": "Are you experiencing any itching?"},
    "skin rash": {"model_key": "skin_rash", "ask_phrase": "Do you have a skin rash or any rashes on your skin?"},
    "nodal skin eruptions": {"model_key": "nodal_skin_eruptions", "ask_phrase": "Have you noticed any nodal skin eruptions, like bumps under the skin?"},
    "continuous sneezing": {"model_key": "continuous_sneezing", "ask_phrase": "Are you sneezing continuously or very frequently?"},
    "shivering": {"model_key": "shivering", "ask_phrase": "Are you shivering, perhaps feeling cold even when it's not?"},
    "chills": {"model_key": "chills", "ask_phrase": "Do you have chills, possibly with a fever?"},
    "joint pain": {"model_key": "joint_pain", "ask_phrase": "Are you experiencing pain in your joints?"},
    "stomach pain": {"model_key": "stomach_pain", "ask_phrase": "Do you have stomach pain or an ache in your abdomen?"},
    "acidity": {"model_key": "acidity", "ask_phrase": "Are you suffering from acidity or heartburn?"},
    "ulcers on tongue": {"model_key": "ulcers_on_tongue", "ask_phrase": "Do you have any ulcers or sores on your tongue?"},
    "muscle wasting": {"model_key": "muscle_wasting", "ask_phrase": "Have you noticed any muscle wasting or a decrease in muscle mass?"},
    "vomiting": {"model_key": "vomiting", "ask_phrase": "Have you been vomiting or throwing up?"},
    "burning micturition": {"model_key": "burning_micturition", "ask_phrase": "Do you feel a burning sensation when you urinate?"},
    "fatigue": {"model_key": "fatigue", "ask_phrase": "Are you feeling fatigued, very tired, or lacking energy?"},
    "weight gain": {"model_key": "weight_gain", "ask_phrase": "Have you experienced unexplained weight gain recently?"},
    "anxiety": {"model_key": "anxiety", "ask_phrase": "Are you feeling anxious, worried, or uneasy?"},
    "cold hands and feet": {"model_key": "cold_hands_and_feets", "ask_phrase": "Do your hands and feet often feel cold?"},
    "mood swings": {"model_key": "mood_swings", "ask_phrase": "Are you experiencing frequent mood swings?"},
    "weight loss": {"model_key": "weight_loss", "ask_phrase": "Have you had unexplained weight loss recently?"},
    "restlessness": {"model_key": "restlessness", "ask_phrase": "Are you feeling restless or unable to relax?"},
    "lethargy": {"model_key": "lethargy", "ask_phrase": "Are you experiencing lethargy or a lack of energy?"},
    "patches in throat": {"model_key": "patches_in_throat", "ask_phrase": "Have you noticed any patches or unusual spots in your throat?"},
    "irregular sugar level": {"model_key": "irregular_sugar_level", "ask_phrase": "Have you had irregular blood sugar levels?"},
    "cough": {"model_key": "cough", "ask_phrase": "Do you have a cough?"},
    "high fever": {"model_key": "high_fever", "ask_phrase": "Do you have a high fever?"},
    "sunken eyes": {"model_key": "sunken_eyes", "ask_phrase": "Do your eyes appear sunken or hollow?"},
    "breathlessness": {"model_key": "breathlessness", "ask_phrase": "Are you experiencing breathlessness or shortness of breath?"},
    "sweating": {"model_key": "sweating", "ask_phrase": "Are you sweating more than usual, or having night sweats?"},
    "dehydration": {"model_key": "dehydration", "ask_phrase": "Do you feel dehydrated, thirsty, or have a dry mouth?"},
    "indigestion": {"model_key": "indigestion", "ask_phrase": "Are you suffering from indigestion?"},
    "headache": {"model_key": "headache", "ask_phrase": "Do you have a headache?"},
    "yellowish skin": {"model_key": "yellowish_skin", "ask_phrase": "Has your skin taken on a yellowish tint?"},
    "dark urine": {"model_key": "dark_urine", "ask_phrase": "Is your urine darker than usual?"},
    "nausea": {"model_key": "nausea", "ask_phrase": "Are you feeling nauseous or like you might vomit?"},
    "loss of appetite": {"model_key": "loss_of_appetite", "ask_phrase": "Have you experienced a loss of appetite?"},
    "pain behind the eyes": {"model_key": "pain_behind_the_eyes", "ask_phrase": "Do you have pain behind your eyes?"},
    "back pain": {"model_key": "back_pain", "ask_phrase": "Are you experiencing back pain?"},
    "constipation": {"model_key": "constipation", "ask_phrase": "Are you suffering from constipation?"},
    "abdominal pain": {"model_key": "abdominal_pain", "ask_phrase": "Do you have pain in your abdomen (belly area)?"},
    "diarrhoea": {"model_key": "diarrhoea", "ask_phrase": "Are you experiencing diarrhoea or loose stools?"},
    "mild fever": {"model_key": "mild_fever", "ask_phrase": "Do you have a mild fever?"},
    "yellow urine": {"model_key": "yellow_urine", "ask_phrase": "Is your urine distinctly yellow?"},
    "yellowing of eyes": {"model_key": "yellowing_of_eyes", "ask_phrase": "Have the whites of your eyes turned yellow?"},
    "acute liver failure": {"model_key": "acute_liver_failure", "ask_phrase": "Are there signs or a diagnosis of acute liver failure?"},
    "fluid overload": {"model_key": "fluid_overload", "ask_phrase": "Are you experiencing symptoms of fluid overload, like swelling?"},
    "swelling of stomach": {"model_key": "swelling_of_stomach", "ask_phrase": "Is your stomach swollen or distended?"},
    "swelled lymph nodes": {"model_key": "swelled_lymph_nodes", "ask_phrase": "Do you have any swelled lymph nodes?"},
    "malaise": {"model_key": "malaise", "ask_phrase": "Are you feeling a general sense of malaise or discomfort?"},
    "blurred and distorted vision": {"model_key": "blurred_and_distorted_vision", "ask_phrase": "Is your vision blurred or distorted?"},
    "phlegm": {"model_key": "phlegm", "ask_phrase": "Are you coughing up phlegm or mucus?"},
    "throat irritation": {"model_key": "throat_irritation", "ask_phrase": "Do you have throat irritation or a scratchy throat?"},
    "redness of eyes": {"model_key": "redness_of_eyes", "ask_phrase": "Are your eyes red or bloodshot?"},
    "sinus pressure": {"model_key": "sinus_pressure", "ask_phrase": "Do you feel pressure in your sinuses?"},
    "runny nose": {"model_key": "runny_nose", "ask_phrase": "Do you have a runny nose?"},
    "congestion": {"model_key": "congestion", "ask_phrase": "Are you experiencing nasal congestion or a stuffy nose?"},
    "chest pain": {"model_key": "chest_pain", "ask_phrase": "Are you experiencing any chest pain?"},
    "weakness in limbs": {"model_key": "weakness_in_limbs", "ask_phrase": "Do you have weakness in your arms or legs?"},
    "fast heart rate": {"model_key": "fast_heart_rate", "ask_phrase": "Is your heart beating faster than usual?"},
    "pain during bowel movements": {"model_key": "pain_during_bowel_movements", "ask_phrase": "Do you experience pain during bowel movements?"},
    "pain in anal region": {"model_key": "pain_in_anal_region", "ask_phrase": "Do you have pain in your anal region?"},
    "bloody stool": {"model_key": "bloody_stool", "ask_phrase": "Have you noticed any blood in your stool?"},
    "irritation in anus": {"model_key": "irritation_in_anus", "ask_phrase": "Do you have irritation in your anus?"},
    "neck pain": {"model_key": "neck_pain", "ask_phrase": "Are you experiencing neck pain?"},
    "dizziness": {"model_key": "dizziness", "ask_phrase": "Are you feeling dizzy or lightheaded?"},
    "cramps": {"model_key": "cramps", "ask_phrase": "Are you experiencing cramps?"},
    "bruising": {"model_key": "bruising", "ask_phrase": "Are you bruising more easily than usual?"},
    "obesity": {"model_key": "obesity", "ask_phrase": "Are you concerned about obesity?"},
    "swollen legs": {"model_key": "swollen_legs", "ask_phrase": "Are your legs swollen?"},
    "swollen blood vessels": {"model_key": "swollen_blood_vessels", "ask_phrase": "Have you noticed any swollen blood vessels?"},
    "puffy face and eyes": {"model_key": "puffy_face_and_eyes", "ask_phrase": "Is your face or around your eyes puffy?"},
    "enlarged thyroid": {"model_key": "enlarged_thyroid", "ask_phrase": "Do you have an enlarged thyroid?"},
    "brittle nails": {"model_key": "brittle_nails", "ask_phrase": "Are your nails brittle or breaking easily?"},
    "swollen extremeties": {"model_key": "swollen_extremeties", "ask_phrase": "Are your extremeties (hands, feet) swollen?"},
    "excessive hunger": {"model_key": "excessive_hunger", "ask_phrase": "Are you experiencing excessive hunger?"},
    "extra marital contacts": {"model_key": "extra_marital_contacts", "ask_phrase": "Have you had extra-marital contacts?"},
    "drying and tingling lips": {"model_key": "drying_and_tingling_lips", "ask_phrase": "Are your lips dry or do they have a tingling sensation?"},
    "slurred speech": {"model_key": "slurred_speech", "ask_phrase": "Is your speech slurred or difficult to understand?"},
    "knee pain": {"model_key": "knee_pain", "ask_phrase": "Are you experiencing knee pain?"},
    "hip joint pain": {"model_key": "hip_joint_pain", "ask_phrase": "Do you have pain in your hip joint?"},
    "muscle weakness": {"model_key": "muscle_weakness", "ask_phrase": "Are you experiencing muscle weakness?"},
    "stiff neck": {"model_key": "stiff_neck", "ask_phrase": "Do you have a stiff neck?"},
    "swelling joints": {"model_key": "swelling_joints", "ask_phrase": "Are any of your joints swollen?"},
    "movement stiffness": {"model_key": "movement_stiffness", "ask_phrase": "Do you feel stiffness when trying to move?"},
    "spinning movements": {"model_key": "spinning_movements", "ask_phrase": "Are you experiencing spinning sensations or vertigo?"},
    "loss of balance": {"model_key": "loss_of_balance", "ask_phrase": "Have you had any loss of balance or unsteadiness?"},
    "unsteadiness": {"model_key": "unsteadiness", "ask_phrase": "Do you feel unsteady on your feet?"},
    "weakness of one body side": {"model_key": "weakness_of_one_body_side", "ask_phrase": "Do you have weakness on one side of your body?"},
    "loss of smell": {"model_key": "loss_of_smell", "ask_phrase": "Have you experienced a loss of smell?"},
    "bladder discomfort": {"model_key": "bladder_discomfort", "ask_phrase": "Are you feeling any discomfort in your bladder area?"},
    "foul smell of urine": {"model_key": "foul_smell_of_urine", "ask_phrase": "Does your urine have a foul or unusual smell?"},
    "continuous feel of urine": {"model_key": "continuous_feel_of_urine", "ask_phrase": "Do you have a continuous feeling of needing to urinate?"},
    "passage of gases": {"model_key": "passage_of_gases", "ask_phrase": "Are you passing more gas than usual?"},
    "internal itching": {"model_key": "internal_itching", "ask_phrase": "Are you experiencing internal itching?"},
    "toxic look (typhos)": {"model_key": "toxic_look_(typhos)", "ask_phrase": "Do you appear very ill, perhaps with a 'toxic look'?"},
    "depression": {"model_key": "depression", "ask_phrase": "Are you feeling depressed, sad, or hopeless?"},
    "irritability": {"model_key": "irritability", "ask_phrase": "Are you feeling more irritable than usual?"},
    "muscle pain": {"model_key": "muscle_pain", "ask_phrase": "Are you experiencing muscle pain or aches?"},
    "altered sensorium": {"model_key": "altered_sensorium", "ask_phrase": "Have you experienced any confusion or changes in consciousness?"},
    "red spots over body": {"model_key": "red_spots_over_body", "ask_phrase": "Have you noticed red spots appearing over your body?"},
    "belly pain": {"model_key": "belly_pain", "ask_phrase": "Do you have pain in your belly area?"},
    "abnormal menstruation": {"model_key": "abnormal_menstruation", "ask_phrase": "Are you experiencing abnormal menstruation?"},
    "dischromic patches": {"model_key": "dischromic_patches", "ask_phrase": "Do you have discolored skin patches?"},
    "watering from eyes": {"model_key": "watering_from_eyes", "ask_phrase": "Are your eyes watering excessively?"},
    "increased appetite": {"model_key": "increased_appetite", "ask_phrase": "Has your appetite increased significantly?"},
    "polyuria": {"model_key": "polyuria", "ask_phrase": "Are you urinating large volumes frequently?"},
    "family history": {"model_key": "family_history", "ask_phrase": "Is there a family history of similar conditions?"},
    "mucoid sputum": {"model_key": "mucoid_sputum", "ask_phrase": "Are you coughing up clear or white sputum?"},
    "rusty sputum": {"model_key": "rusty_sputum", "ask_phrase": "Are you coughing up rusty-colored sputum?"},
    "lack of concentration": {"model_key": "lack_of_concentration", "ask_phrase": "Are you having difficulty concentrating?"},
    "visual disturbances": {"model_key": "visual_disturbances", "ask_phrase": "Are you experiencing any visual disturbances?"},
    "receiving blood transfusion": {"model_key": "receiving_blood_transfusion", "ask_phrase": "Have you recently received a blood transfusion?"},
    "receiving unsterile injections": {"model_key": "receiving_unsterile_injections", "ask_phrase": "Have you recently received any unsterile injections?"},
    "coma": {"model_key": "coma", "ask_phrase": "Has there been any instance of coma or unresponsiveness?"},
    "stomach bleeding": {"model_key": "stomach_bleeding", "ask_phrase": "Are there any signs of stomach bleeding?"},
    "distention of abdomen": {"model_key": "distention_of_abdomen", "ask_phrase": "Is your abdomen distended or significantly bloated?"},
    "history of alcohol consumption": {"model_key": "history_of_alcohol_consumption", "ask_phrase": "Do you have a history of significant alcohol consumption?"},
    "blood in sputum": {"model_key": "blood_in_sputum", "ask_phrase": "Are you coughing up blood in your sputum?"},
    "prominent veins on calf": {"model_key": "prominent_veins_on_calf", "ask_phrase": "Are the veins on your calf prominent or bulging?"},
    "palpitations": {"model_key": "palpitations", "ask_phrase": "Are you experiencing palpitations or a fluttering sensation in your chest?"},
    "painful walking": {"model_key": "painful_walking", "ask_phrase": "Is it painful for you to walk?"},
    "pus filled pimples": {"model_key": "pus_filled_pimples", "ask_phrase": "Do you have pus-filled pimples?"},
    "blackheads": {"model_key": "blackheads", "ask_phrase": "Are you experiencing blackheads?"},
    "scurring": {"model_key": "scurring", "ask_phrase": "Do you have scabbing or scarring on your skin?"},
    "skin peeling": {"model_key": "skin_peeling", "ask_phrase": "Is your skin peeling?"},
    "silver like dusting": {"model_key": "silver_like_dusting", "ask_phrase": "Do you have a silver-like dusting or scales on your skin?"},
    "small dents in nails": {"model_key": "small_dents_in_nails", "ask_phrase": "Are there small dents or pits in your nails?"},
    "inflammatory nails": {"model_key": "inflammatory_nails", "ask_phrase": "Are your nails inflamed, red, or swollen?"},
    "blister": {"model_key": "blister", "ask_phrase": "Have you developed any blisters on your skin?"},
    "red sore around nose": {"model_key": "red_sore_around_nose", "ask_phrase": "Do you have a red sore or irritation around your nose?"},
    "yellow crust ooze": {"model_key": "yellow_crust_ooze", "ask_phrase": "Is there any yellow crust or ooze from skin lesions?"},
    "numbness or tingling": {"model_key": "numbness_or_tingling", "ask_phrase": "Are you experiencing any numbness or tingling sensations?"},
    "tremors": {"model_key": "tremors", "ask_phrase": "Do you have any tremors or shaking?"},
    "confusion": {"model_key": "confusion", "ask_phrase": "Are you feeling confused or disoriented?"},
    "memory loss": {"model_key": "memory_loss", "ask_phrase": "Have you noticed any memory loss?"},
    "seizures": {"model_key": "seizures", "ask_phrase": "Have you had any seizures?"},
    "ringing in ears": {"model_key": "ringing_in_ears", "ask_phrase": "Are you experiencing a ringing sound in your ears (tinnitus)?"},
    "loss of taste": {"model_key": "loss_of_taste", "ask_phrase": "Have you experienced a loss of taste?"},
    "sensitivity to light": {"model_key": "sensitivity_to_light", "ask_phrase": "Are your eyes unusually sensitive to light?"},
    "sensitivity to sound": {"model_key": "sensitivity_to_sound", "ask_phrase": "Are you unusually sensitive to sound?"},
    "ear pain": {"model_key": "ear_pain", "ask_phrase": "Do you have pain in your ear?"},
    "bloating": {"model_key": "bloating", "ask_phrase": "Are you feeling bloated?"},
    "difficulty swallowing": {"model_key": "difficulty_swallowing", "ask_phrase": "Do you have any difficulty swallowing?"},
    "heartburn": {"model_key": "heartburn", "ask_phrase": "Are you experiencing heartburn?"},
    "wheezing": {"model_key": "wheezing", "ask_phrase": "Have you been wheezing?"},
    "hoarseness": {"model_key": "hoarseness", "ask_phrase": "Is your voice hoarse?"},
    "hives": {"model_key": "hives", "ask_phrase": "Have you broken out in hives?"},
    "hair loss": {"model_key": "hair_loss", "ask_phrase": "Are you experiencing unusual hair loss?"},
    "panic attacks": {"model_key": "panic_attacks", "ask_phrase": "Have you been having panic attacks?"},
    "hallucinations": {"model_key": "hallucinations", "ask_phrase": "Are you experiencing hallucinations (seeing or hearing things that aren't there)?"},
    "sore throat": {"model_key": "throat_irritation", "ask_phrase": "Do you have a sore throat?"},
    "tiredness": {"model_key": "fatigue", "ask_phrase": "Are you feeling extremely tired?"},
    "throwing up": {"model_key": "vomiting", "ask_phrase": "Have you been throwing up?"},
    "painful urination": {"model_key": "burning_micturition", "ask_phrase": "Is it painful when you urinate?"},
    "loose stools": {"model_key": "diarrhoea", "ask_phrase": "Are you having loose stools or diarrhoea?"},
    "shortness of breath": {"model_key": "breathlessness", "ask_phrase": "Are you experiencing shortness of breath?"},
    "upset stomach": {"model_key": "indigestion", "ask_phrase": "Do you have an upset stomach?"},
    "feeling sick": {"model_key": "nausea", "ask_phrase": "Are you feeling sick to your stomach?"},
    "stuffy nose": {"model_key": "congestion", "ask_phrase": "Do you have a stuffy nose?"},
    "vertigo": {"model_key": "spinning_movements", "ask_phrase": "Are you experiencing vertigo or a spinning sensation?"},
    "passing gas": {"model_key": "passage_of_gases", "ask_phrase": "Are you passing more gas than usual?"},
    "feeling down": {"model_key": "depression", "ask_phrase": "Are you feeling down or depressed?"},
    "peeing a lot": {"model_key": "polyuria", "ask_phrase": "Are you urinating much more frequently?"},
    "feeling confused": {"model_key": "confusion", "ask_phrase": "Are you feeling confused?"},
    "shaking": {"model_key": "tremors", "ask_phrase": "Are you experiencing shaking or tremors?"},
    "tinnitus": {"model_key": "ringing_in_ears", "ask_phrase": "Do you have ringing in your ears?"},
}

MODEL_KEY_TO_ASK_PHRASE = {}
NATURAL_SYMPTOM_PHRASES_FOR_FUZZY = []


# For time-based greetings #
def get_time_based_greeting():
    """Returns a greeting based on the time of day in Bangladesh."""
    try:
        bangladesh_tz = pytz.timezone('Asia/Dhaka')
        # Get the current time in that timezone
        now_in_bd = datetime.now(bangladesh_tz)
        hour = now_in_bd.hour

        if 5 <= hour < 12:
            return "Good Morning"
        elif 12 <= hour < 18:
            return "Good Afternoon"
        elif 18 <= hour < 23:
            return "Good Evening"
        else:
            return "Hello"  
    except Exception as e:
        app.logger.error(f"Error getting time-based greeting: {e}")
        return "Hello"  # Fallback in case of any error


def initialize_app_data():
    global model, MODEL_SYMPTOM_KEYS, doctors_df, disease_desc_df, disease_precaution_df
    global MODEL_KEY_TO_ASK_PHRASE, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY

    app.logger.info("Initializing application data...")
    try:
        with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
        with open(SYMPTOM_COLUMNS_PATH, 'rb') as f: MODEL_SYMPTOM_KEYS = pickle.load(f)
        MODEL_SYMPTOM_KEYS = [key.strip().lower().replace(' ', '_') for key in MODEL_SYMPTOM_KEYS]
        app.logger.info(f"Model and {len(MODEL_SYMPTOM_KEYS)} symptom keys loaded.")
        
        validated_symptom_map_temp = {}
        for phrase, details in SYMPTOM_MAP.items():
            key = details.get("model_key")
            if isinstance(key, str):
                norm_key = key.strip().lower().replace(' ', '_').replace(" _", "_")
                if norm_key in MODEL_SYMPTOM_KEYS:
                    details["model_key"] = norm_key
                    validated_symptom_map_temp[phrase.strip().lower()] = details
                else:
                    app.logger.warning(f"SymptomMap Warning: model_key '{norm_key}' (from '{phrase}') not in model. Skipping.")
        SYMPTOM_MAP.clear(); SYMPTOM_MAP.update(validated_symptom_map_temp)
        
        MODEL_KEY_TO_ASK_PHRASE = {d["model_key"]: d["ask_phrase"] for d in SYMPTOM_MAP.values()}
        NATURAL_SYMPTOM_PHRASES_FOR_FUZZY = list(SYMPTOM_MAP.keys())
        app.logger.info(f"SYMPTOM_MAP processed: {len(SYMPTOM_MAP)} valid natural phrases.")
        
    except Exception as e:
        app.logger.error(f"CRITICAL Error initializing model/symptom data: {e}", exc_info=True)
        model = None
        
    try:
        doctors_df = pd.read_csv(DOCTORS_CSV_PATH, dtype={'number': str})
        doctors_df.columns = doctors_df.columns.str.strip().str.lower().str.replace(' ', '_')
        doctors_df['latitude'] = pd.to_numeric(doctors_df.get('latitude'), errors='coerce')
        doctors_df['longitude'] = pd.to_numeric(doctors_df.get('longitude'), errors='coerce')
        app.logger.info(f"Doctors data loaded. Shape: {doctors_df.shape}")
    except Exception as e:
        app.logger.error(f"Error loading doctors data: {e}", exc_info=True)
        
    for path, df_name, var_name in [(DISEASE_DESC_CSV_PATH, "Descriptions", "disease_desc_df"), (DISEASE_PRECAUTION_CSV_PATH, "Precautions", "disease_precaution_df")]:
        try:
            temp_df = pd.read_csv(path)
            temp_df.columns = temp_df.columns.str.strip().str.lower()
            if 'disease' in temp_df.columns:
                temp_df['disease'] = temp_df['disease'].str.strip().str.lower()
                temp_df.set_index('disease', inplace=True)
                globals()[var_name] = temp_df
                app.logger.info(f"{df_name} loaded.")
        except Exception as e:
            app.logger.warning(f"Could not load {df_name} from {path}: {e}")

raw_disease_to_specialization_map = {
    "fungal infection": "Dermatologist", "allergy": "Allergist", "gerd": "Gastroenterologist",
    "chronic cholestasis": "Hepatologist", "drug reaction": "Dermatologist",
    "peptic ulcer diseae": "Gastroenterologist", "aids": "Infectious Disease Specialist",
    "diabetes": "Endocrinologist", "gastroenteritis": "Gastroenterologist",
    "bronchial asthma": "Pulmonologist", "hypertension": "Cardiologist",
    "migraine": "Neurologist", "cervical spondylosis": "Orthopedist",
    "paralysis (brain hemorrhage)": "Neurologist", "jaundice": "Hepatologist",
    "malaria": "Infectious Disease Specialist", "chicken pox": "Dermatologist",
    "dengue": "Infectious Disease Specialist", "typhoid": "Infectious Disease Specialist",
    "hepatitis a": "Hepatologist", "hepatitis b": "Hepatologist", "hepatitis c": "Hepatologist",
    "hepatitis d": "Hepatologist", "hepatitis e": "Hepatologist", "alcoholic hepatitis": "Hepatologist",
    "tuberculosis": "Pulmonologist", "common cold": "General Physician", "pneumonia": "Pulmonologist",
    "dimorphic hemmorhoids(piles)": "Proctologist", "heart attack": "Cardiologist",
    "varicose veins": "Vascular Surgeon", "hypothyroidism": "Endocrinologist",
    "hyperthyroidism": "Endocrinologist", "hypoglycemia": "Endocrinologist",
    "osteoarthristis": "Orthopedist", "arthritis": "Rheumatologist",
    "(vertigo) paroymsal positional vertigo": "ENT Specialist", "acne": "Dermatologist",
    "urinary tract infection": "Urologist", "psoriasis": "Dermatologist", "impetigo": "Dermatologist",
    "anemia": "Hematologist", "appendicitis": "General Surgeon", "bipolar disorder": "Psychiatrist",
    "anxiety disorder": "Psychiatrist", "schizophrenia": "Psychiatrist",
    "stroke": "Neurologist","stroke": "Neurology Specialist", "epilepsy": "Neurologist", "meningitis": "Neurologist",
    "endometriosis": "Gynecologist", "polycystic ovary syndrome": "Gynecologist",
    "miscarriage": "Gynecologist", "infertility": "Reproductive Endocrinologist",
    "prostate cancer": "Oncologist", "breast cancer": "Oncologist", "lung cancer": "Oncologist",
    "colon cancer": "Oncologist", "skin cancer": "Dermatologist", "kidney stones": "Urologist",
    "nephrotic syndrome": "Nephrologist", "chronic kidney disease": "Nephrologist",
    "gallstones": "Gastroenterologist", "liver cirrhosis": "Hepatologist",
    "irritable bowel syndrome": "Gastroenterologist", "crohn's disease": "Gastroenterologist",
    "ulcerative colitis": "Gastroenterologist", "asthma": "Pulmonologist", "copd": "Pulmonologist",
    "sleep apnea": "Pulmonologist", "eczema": "Dermatologist", "lupus": "Rheumatologist",
    "multiple sclerosis": "Neurologist", "parkinson's disease": "Neurologist",
    "alzheimer's disease": "Neurologist", "glaucoma": "Ophthalmologist",
    "cataract": "Ophthalmologist", "macular degeneration": "Ophthalmologist",
    "conjunctivitis": "Ophthalmologist", "sinusitis": "ENT Specialist", "otitis media": "ENT Specialist",
    "tonsillitis": "ENT Specialist", "covid-19": "Infectious Disease Specialist",
    "measles": "Infectious Disease Specialist", "mumps": "Infectious Disease Specialist",
    "rubella": "Infectious Disease Specialist", "whooping cough": "Infectious Disease Specialist",
    "rheumatic fever": "Cardiologist", "obesity": "Endocrinologist", "autism spectrum disorder": "Psychiatrist",
    "adhd": "Psychiatrist", "hemophilia": "Hematologist", "thalassemia": "Hematologist",
    "deep vein thrombosis": "Vascular Surgeon", "pulmonary embolism": "Pulmonologist",
    "sickle cell anemia": "Hematologist", "pancreatitis": "Gastroenterologist",
    "gastritis": "Gastroenterologist", "barrett's esophagus": "Gastroenterologist",
    "hernia": "General Surgeon", "bursitis": "Orthopedist", "tendonitis": "Orthopedist",
    "gout": "Rheumatologist", "fibromyalgia": "Rheumatologist", "muscular dystrophy": "Neurologist",
    "trigeminal neuralgia": "Neurologist", "sciatica": "Orthopedist", "plantar fasciitis": "Orthopedist",
    "carpal tunnel syndrome": "Orthopedist", "kidney infection (pyelonephritis)": "Nephrologist",
    "bladder infection": "Urologist", "benign prostatic hyperplasia": "Urologist",
    "erectile dysfunction": "Urologist", "amenorrhea": "Gynecologist", "menorrhagia": "Gynecologist",
    "pelvic inflammatory disease": "Gynecologist", "mastitis": "Gynecologist", "cystitis": "Urologist",
    "retinopathy": "Ophthalmologist", "strabismus": "Ophthalmologist", "keratitis": "Ophthalmologist",
    "myopia": "Ophthalmologist", "hyperopia": "Ophthalmologist", "otitis externa": "ENT Specialist",
    "nasal polyps": "ENT Specialist", "tinnitus": "ENT Specialist", "barotrauma": "ENT Specialist",
    "heat stroke": "Emergency Medicine Specialist", "snake bite": "Toxicologist",
    "poisoning": "Toxicologist", "sepsis": "Infectious Disease Specialist",
    "lyme disease": "Infectious Disease Specialist", "zika virus": "Infectious Disease Specialist",
    "ebola": "Infectious Disease Specialist", "menopause": "Gynecologist", "andropause": "Endocrinologist",
    "osteoporosis": "Endocrinologist", "cushing's syndrome": "Endocrinologist",
    "addison's disease": "Endocrinologist", "acromegaly": "Endocrinologist",
    "pituitary tumor": "Endocrinologist", "brain tumor": "Neurosurgeon",
    "spinal cord injury": "Neurosurgeon", "hydrocephalus": "Neurosurgeon",
    "anaphylaxis": "Allergist", "dermatitis": "Dermatologist", "vitiligo": "Dermatologist",
    "rosacea": "Dermatologist", "alopecia": "Dermatologist", "warts": "Dermatologist",
    "scabies": "Dermatologist", "ringworm": "Dermatologist",
    ### NEW DISEASE-SPECIALIST MAPPINGS ADDED ###
    "food poisoning": "Gastroenterologist",
    "celiac disease": "Gastroenterologist",
    "diverticulitis": "Gastroenterologist",
    "concussion": "Neurologist",
    "peripheral neuropathy": "Neurologist",
    "cluster headache": "Neurologist",
    "panic disorder": "Psychiatrist",
    "obsessive-compulsive disorder": "Psychiatrist",
    "ptsd": "Psychiatrist",
    "scoliosis": "Orthopedist",
    "herniated disc": "Orthopedist",
    "cellulitis": "Dermatologist",
    "shingles": "Dermatologist",
    "atrial fibrillation": "Cardiologist",
    "angina": "Cardiologist",
    "laryngitis": "ENT Specialist",
    "labyrinthitis": "ENT Specialist"
}
disease_to_specialization_map = {k.strip().lower(): v for k, v in raw_disease_to_specialization_map.items()}

initialize_app_data()


# --- Helper Functions ---
def normalize_text(text):
    return str(text).strip().lower() if pd.notna(text) else ""

# REVISED: Extracts symptoms with confidence scores
def extract_symptoms_with_confidence(user_text, symptom_map_config_dict, natural_phrases_list_for_fuzzy):
    symptom_candidates = {}
    user_text_lower = user_text.lower().strip()
    if not user_text_lower: return []
    
    split_pattern = r',|\s*\b(and|or|i\s*feel|i\s*am\s*feeling|i\'m\s*feeling|i\s*have|i\'ve\s*got|experiencing)\b\s*'
    potential_phrases = [p.strip() for p in re.split(split_pattern, user_text_lower) if p and len(p.strip()) > 2 and p.strip() not in ["and", "or", "i feel", "i am feeling", "i'm feeling", "i have", "i've got", "experiencing"]]
    
    if not potential_phrases and user_text_lower: 
        potential_phrases.append(user_text_lower)
        
    for phrase in potential_phrases:
        # 1. Exact match
        if phrase in symptom_map_config_dict:
            key = symptom_map_config_dict[phrase]["model_key"]
            if key not in symptom_candidates or 100 > symptom_candidates[key]['score']:
                symptom_candidates[key] = {'key': key, 'score': 100, 'phrase': phrase}
            continue # Prioritize exact match
            
        # 2. Fuzzy match
        if not natural_phrases_list_for_fuzzy: continue
        best_match, score = process.extractOne(phrase, natural_phrases_list_for_fuzzy, scorer=fuzz.WRatio)
        if best_match and score >= MEDIUM_CONFIDENCE_THRESHOLD:
            key = symptom_map_config_dict[best_match]["model_key"]
            # Only add if it's a better match than an existing one for the same key
            if key not in symptom_candidates or score > symptom_candidates[key]['score']:
                 symptom_candidates[key] = {'key': key, 'score': score, 'phrase': best_match.replace("_", " ")}
                 
    return list(symptom_candidates.values())

def determine_next_symptoms_to_ask(symptoms_vector_dict, all_model_symptom_keys, count=MAX_QUESTIONS_PER_ROUND):
    confirmed_pos = {k for k, v in symptoms_vector_dict.items() if v == 1}
    unasked = [k for k in all_model_symptom_keys if (k not in symptoms_vector_dict or symptoms_vector_dict[k] == 0) and k in MODEL_KEY_TO_ASK_PHRASE and k not in confirmed_pos]
    if not unasked: return []
    import random
    random.shuffle(unasked)
    return unasked[:count]

# --- In-memory Session Store ---
user_sessions = {}

def get_session(user_id):
    if user_id not in user_sessions:
        s_vec = {key: 0 for key in MODEL_SYMPTOM_KEYS} if MODEL_SYMPTOM_KEYS else {}
        user_sessions[user_id] = {
            'state': 'AWAITING_INITIAL_SYMPTOMS',
            'user_name': None, 'age': None, 'gender': None,
            'symptoms_vector': s_vec,
            'symptoms_confirmed_count': 0,
            'symptoms_pending_clarification': [],
            'current_clarifying_symptom_key': None,
            'symptoms_targeted_questions_q': [],
            'current_targeted_symptom_key': None,
            'predicted_disease_context': None
        }
    return user_sessions[user_id]

def reset_session_for_new_query(user_id, name=None, age=None, gender=None):
    s_vec = {key: 0 for key in MODEL_SYMPTOM_KEYS} if MODEL_SYMPTOM_KEYS else {}
    user_sessions[user_id] = {
        'state': 'AWAITING_INITIAL_SYMPTOMS',
        'user_name': name, 'age': age, 'gender': gender,
        'symptoms_vector': s_vec,
        'symptoms_confirmed_count': 0,
        'symptoms_pending_clarification': [],
        'current_clarifying_symptom_key': None,
        'symptoms_targeted_questions_q': [],
        'current_targeted_symptom_key': None,
        'predicted_disease_context': None
    }
    app.logger.info(f"Session reset for {user_id}. Kept Name: {name}, Age: {age}, Gender: {gender}")
    return user_sessions[user_id]


# --- Flask Routes ---
@app.route('/')
def chat_home():
    return render_template('chat.html')

@app.route('/chat_api', methods=['POST'])
def chat_api():
    if not model or not MODEL_SYMPTOM_KEYS:
        return jsonify({'bot_response_parts': ["I apologize, my medical knowledge system is currently offline."]})

    data = request.get_json()
    user_id = data.get('user_id', 'temp_user_' + str(np.random.randint(10000)))
    user_message = data.get('message', '').lower().strip()
    session = get_session(user_id)

    # Update user details from payload every time
    session['user_name'] = data.get('user_name', session.get('user_name'))
    session['gender'] = data.get('gender', session.get('gender'))
    try:
        session['age'] = int(data.get('age')) if data.get('age') is not None else session.get('age')
    except (ValueError, TypeError):
        session['age'] = None

    bot_responses = []
    map_data_for_frontend = None
    current_state = session['state']
    user_greeting_name_part = f"{session['user_name']}" if session['user_name'] else "there"
    app.logger.info(f"API CALL: ID:{user_id}, State:{current_state}, Msg:'{user_message}'")

    # Universal Commands
    if user_message in ["reset", "start over", "restart"]:
        greeting = get_time_based_greeting()
        session = reset_session_for_new_query(user_id, session.get('user_name'), session.get('age'), session.get('gender'))
        bot_responses.append(f"{greeting}, {user_greeting_name_part}. Okay, let's start fresh! Please describe your main symptoms.")
        current_state = session['state']
    elif "help" in user_message:
        s_list = sorted([s.replace("_", " ").title() for s in list(NATURAL_SYMPTOM_PHRASES_FOR_FUZZY)[:20]])
        bot_responses.append("You can describe how you're feeling, for example: 'I have a headache and a fever'. I understand symptoms like: " + ", ".join(s_list) + ", and many more. You can also type 'reset' to start over.")

    if not bot_responses: # Proceed if no universal command was handled
        if current_state == 'AWAITING_INITIAL_SYMPTOMS':
            if user_message in GREETING_INPUTS and session['symptoms_confirmed_count'] == 0:
                greeting = get_time_based_greeting()
                bot_responses.append(f"{greeting}, {user_greeting_name_part}! I'm SymptoSeek-Bot. Please describe your symptoms so I can help.")
            else:
                extracted_symptoms = extract_symptoms_with_confidence(user_message, SYMPTOM_MAP, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY)
                if not extracted_symptoms:
                    if "no more" in user_message or "that's all" in user_message:
                        if session['symptoms_confirmed_count'] >= MIN_SYMPTOMS_FOR_PREDICTION:
                            bot_responses.append(f"Thanks. Let me analyze...")
                            session['state'] = 'READY_TO_PREDICT'
                        else:
                            bot_responses.append(f"I need at least {MIN_SYMPTOMS_FOR_PREDICTION} symptoms. Let me ask some questions.")
                            session['state'] = 'TARGETED_QUESTIONING'
                    else:
                        bot_responses.append("I'm sorry, I didn't recognize any symptoms. Could you please rephrase?")
                else:
                    newly_confirmed, newly_pending = [], []
                    for s in extracted_symptoms:
                        if session['symptoms_vector'].get(s['key']) != 1:
                            if s['score'] >= HIGH_CONFIDENCE_THRESHOLD:
                                session['symptoms_vector'][s['key']] = 1
                                session['symptoms_confirmed_count'] += 1
                                newly_confirmed.append(s['phrase'].capitalize())
                            else:
                                newly_pending.append(s['key'])
                    
                    response_parts = []
                    if newly_confirmed: response_parts.append(f"Okay, noted: **{', '.join(newly_confirmed)}**.")
                    
                    if newly_pending:
                        session['symptoms_pending_clarification'].extend(newly_pending)
                        session['symptoms_pending_clarification'] = list(dict.fromkeys(session['symptoms_pending_clarification']))
                        session['state'] = 'CLARIFYING_SYMPTOMS'
                    elif newly_confirmed:
                        response_parts.append("Any other symptoms? If not, say 'no more'.")

                    if not response_parts:
                        response_parts.append("I didn't recognize any new symptoms. Do you have any others to add? If not, say 'no more'.")

                    bot_responses.append(" ".join(response_parts))

        elif current_state == 'CLARIFYING_SYMPTOMS':
            symptom_key = session.get('current_clarifying_symptom_key')
            # --- START: BUG FIX ---
            # First, check for any new symptoms mentioned alongside the yes/no.
            newly_extracted = extract_symptoms_with_confidence(user_message, SYMPTOM_MAP, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY)
            newly_identified = [s for s in newly_extracted if session['symptoms_vector'].get(s['key']) != 1]
            if newly_identified:
                confirmed_phrases = [s['phrase'].capitalize() for s in newly_identified if s['score'] >= HIGH_CONFIDENCE_THRESHOLD]
                for s in newly_identified:
                    if s['score'] >= HIGH_CONFIDENCE_THRESHOLD:
                        session['symptoms_vector'][s['key']] = 1
                        session['symptoms_confirmed_count'] += 1
                if confirmed_phrases:
                    bot_responses.append(f"Also noted: **{', '.join(confirmed_phrases)}**.")
            # --- END: BUG FIX ---
            
            responded_to_question = False
            if "yes" in user_message:
                if symptom_key:
                    session['symptoms_vector'][symptom_key] = 1
                    session['symptoms_confirmed_count'] += 1
                    bot_responses.append(f"Noted: {symptom_key.replace('_',' ')}.")
                responded_to_question = True
            elif "no" in user_message:
                if symptom_key:
                    session['symptoms_vector'][symptom_key] = 0
                    bot_responses.append(f"Okay, no {symptom_key.replace('_',' ')}.")
                responded_to_question = True
            
            if responded_to_question:
                session['current_clarifying_symptom_key'] = None
                # Fall through to the next logic block to ask the next question or transition state
            elif not newly_identified: # Only re-prompt if no other info was gleaned
                ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(symptom_key, f"Are you experiencing {symptom_key.replace('_',' ')}?")
                bot_responses.append(f"Please answer 'yes' or 'no'. {ask_phrase}")

        elif current_state == 'TARGETED_QUESTIONING':
            symptom_key = session.get('current_targeted_symptom_key')
            # --- START: BUG FIX ---
            # First, check for any new symptoms mentioned alongside the yes/no.
            newly_extracted = extract_symptoms_with_confidence(user_message, SYMPTOM_MAP, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY)
            newly_identified = [s for s in newly_extracted if session['symptoms_vector'].get(s['key']) != 1]
            if newly_identified:
                confirmed_phrases = [s['phrase'].capitalize() for s in newly_identified if s['score'] >= HIGH_CONFIDENCE_THRESHOLD]
                for s in newly_identified:
                     if s['score'] >= HIGH_CONFIDENCE_THRESHOLD:
                        session['symptoms_vector'][s['key']] = 1
                        session['symptoms_confirmed_count'] += 1
                if confirmed_phrases:
                    bot_responses.append(f"Also noted: **{', '.join(confirmed_phrases)}**.")
            # --- END: BUG FIX ---
            
            responded_to_question = False
            if "yes" in user_message:
                if symptom_key:
                    session['symptoms_vector'][symptom_key] = 1
                    session['symptoms_confirmed_count'] += 1
                    bot_responses.append(f"Understood: {symptom_key.replace('_',' ')}.")
                responded_to_question = True
            elif "no" in user_message:
                if symptom_key:
                    session['symptoms_vector'][symptom_key] = 0
                    bot_responses.append(f"Okay, no {symptom_key.replace('_',' ')}.")
                responded_to_question = True
            
            if responded_to_question:
                session['current_targeted_symptom_key'] = None
                if session['symptoms_confirmed_count'] >= MIN_SYMPTOMS_FOR_PREDICTION + 1:
                    bot_responses.append("Thank you. I'll analyze your symptoms now.")
                    session['state'] = 'READY_TO_PREDICT'
                # Fall through to ask next question if needed
            elif not newly_identified: # Only re-prompt if no other info was gleaned
                ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(symptom_key, f"Do you have {symptom_key.replace('_',' ')}?")
                bot_responses.append(f"Please answer 'yes' or 'no'. {ask_phrase}")
        
        # TRANSITION LOGIC BLOCK
        if not bot_responses:
            if session['state'] == 'CLARIFYING_SYMPTOMS':
                if not session.get('current_clarifying_symptom_key'): # Check if we need to pull a new question
                    if session['symptoms_pending_clarification']:
                        session['current_clarifying_symptom_key'] = session['symptoms_pending_clarification'].pop(0)
                        ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_clarifying_symptom_key'], f"What about {session['current_clarifying_symptom_key'].replace('_',' ')}?")
                        bot_responses.append(f"{ask_phrase} (yes/no)")
                    else: # Clarification finished
                        if session['symptoms_confirmed_count'] >= MIN_SYMPTOMS_FOR_PREDICTION:
                            bot_responses.append("Thanks. Do you have any other symptoms? If not, say 'no more'.")
                            session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
                        else:
                            bot_responses.append(f"I still need a few more details. Let me ask some specific questions.")
                            session['state'] = 'TARGETED_QUESTIONING'
                else: # A question is active but wasn't answered with yes/no; re-ask it.
                    ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_clarifying_symptom_key'])
                    bot_responses.append(f"Thanks for the extra info. Now, back to my question: {ask_phrase} (yes/no)")
            
            elif session['state'] == 'TARGETED_QUESTIONING':
                if not session.get('current_targeted_symptom_key'): # Check if we need to pull a new question
                    if not session['symptoms_targeted_questions_q']:
                        session['symptoms_targeted_questions_q'] = determine_next_symptoms_to_ask(session['symptoms_vector'], MODEL_SYMPTOM_KEYS)
                    
                    if session['symptoms_targeted_questions_q']:
                        session['current_targeted_symptom_key'] = session['symptoms_targeted_questions_q'].pop(0)
                        ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_targeted_symptom_key'], f"And how about {session['current_targeted_symptom_key'].replace('_',' ')}?")
                        bot_responses.append(f"{ask_phrase} (yes/no)")
                    else:
                        bot_responses.append("I have enough information now. Let me analyze...")
                        session['state'] = 'READY_TO_PREDICT'
                else: # A question is active but wasn't answered with yes/no; re-ask it.
                    ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_targeted_symptom_key'])
                    bot_responses.append(f"Thanks for the extra info. Now, back to my question: {ask_phrase} (yes/no)")

    # PREDICTION AND DOCTOR SEARCH LOGIC
    if session['state'] == 'READY_TO_PREDICT' and not bot_responses:
        if session['symptoms_confirmed_count'] < 1:
            bot_responses.append(f"I don't have enough symptoms to analyze. Please describe how you feel.")
            session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
        elif session['age'] is None:
            bot_responses.append(f"Before I proceed, {user_greeting_name_part}, what is your age?")
            session['state'] = 'AWAITING_AGE'
        elif session['gender'] is None:
            bot_responses.append(f"And your biological gender, {user_greeting_name_part}? (Male/Female/Other)")
            session['state'] = 'AWAITING_GENDER'
        else:
            app.logger.info(f"Predicting for user {user_id}...")
            input_df = pd.DataFrame([session['symptoms_vector']])[MODEL_SYMPTOM_KEYS]
            try:
                pred_proba = model.predict_proba(input_df)[0]
                pred_idx = np.argmax(pred_proba)
                disease_raw = model.classes_[pred_idx]
                confidence = pred_proba[pred_idx] * 100
                session['predicted_disease_context'] = disease_raw
                disease_clean = disease_raw.strip().title()

                bot_responses.append(f"Based on the symptoms, my analysis suggests it might be **{disease_clean}** (Confidence: {confidence:.2f}%).")
                
                norm_disease_key = normalize_text(disease_raw)
                description = "No detailed description available."
                if not disease_desc_df.empty and norm_disease_key in disease_desc_df.index:
                    description = disease_desc_df.loc[norm_disease_key, 'description']
                
                precautions = []
                if not disease_precaution_df.empty and norm_disease_key in disease_precaution_df.index:
                    prec_series = disease_precaution_df.loc[norm_disease_key]
                    precautions = [prec_series[f'precaution_{i}'] for i in range(1, 5) if pd.notna(prec_series.get(f'precaution_{i}'))]

                bot_responses.append(f"*{description}*")
                if precautions: bot_responses.append("\n**Recommended Precautions:**\n- " + "\n- ".join(precautions))
                bot_responses.append("\n**Important Disclaimer:** This is an AI suggestion and not a medical diagnosis. Please consult a doctor.")
                bot_responses.append(f"\nWould you like me to look for doctors in Bangladesh for **{disease_clean}**? (yes/no)")
                session['state'] = 'AWAITING_DOCTOR_CONFIRMATION'
            except Exception as e:
                app.logger.error(f"Prediction error: {e}", exc_info=True)
                bot_responses.append("I encountered an issue while analyzing. Please try again.")
                session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
    
    elif current_state == 'AWAITING_AGE':
        try:
            age_val = int(re.search(r'\d+', user_message).group(0))
            if 0 < age_val < 120:
                session['age'] = age_val
                if session['gender'] is None:
                    bot_responses.append("And your biological gender? (Male/Female/Other)")
                    session['state'] = 'AWAITING_GENDER'
                else:
                    bot_responses.append("Thank you. I'll analyze your symptoms now...")
                    session['state'] = 'READY_TO_PREDICT'
            else: bot_responses.append("Please provide a valid age.")
        except: bot_responses.append("Please enter your age as a number (e.g., 30).")

    elif current_state == 'AWAITING_GENDER':
        gender_val = None
        if "male" in user_message: gender_val = "Male"
        elif "female" in user_message: gender_val = "Female"
        elif "other" in user_message: gender_val = "Other"
        if gender_val:
            session['gender'] = gender_val
            bot_responses.append("Thank you. I'll analyze your symptoms now...")
            session['state'] = 'READY_TO_PREDICT'
        else: bot_responses.append("Please specify Male, Female, or Other.")

    elif current_state == 'AWAITING_DOCTOR_CONFIRMATION':
        disease_context = session.get('predicted_disease_context')
        if "yes" in user_message and disease_context:
            target_spec = disease_to_specialization_map.get(normalize_text(disease_context))
            if target_spec and not doctors_df.empty:
                relevant_docs = doctors_df[doctors_df['speciality'].str.contains(target_spec, case=False, na=False) & doctors_df['latitude'].notna() & doctors_df['longitude'].notna()]
                if not relevant_docs.empty:
                    bot_responses.append(f"For **{disease_context.title()}**, you should see a **{target_spec}**. Here are a few doctors:")
                    doctors_for_map_list = []
                    for i, doc in relevant_docs.head(3).iterrows():
                        doc_info = f"<div class='doctor-card'><strong>{i+1}. {doc.get('name', 'N/A')}</strong><br/><em>{doc.get('speciality', 'N/A')}</em><br/>🏥 {doc.get('hospital_name', 'N/A')}<br/>📍 {doc.get('address', 'N/A')}</div>"
                        bot_responses.append(doc_info)
                        doctors_for_map_list.append({
                            "name": doc.get('name'), "lat": doc.get('latitude'), "lng": doc.get('longitude'),
                            "speciality": doc.get('speciality'), "hospital": doc.get('hospital_name')
                        })
                    map_data_for_frontend = {"doctors": doctors_for_map_list}
                else: bot_responses.append(f"I couldn't find doctors for the specialty '{target_spec}' with location data.")
            else: bot_responses.append(f"I don't have specific doctor recommendations for this condition.")
            session = reset_session_for_new_query(user_id, session.get('user_name'), session.get('age'), session.get('gender'))
            bot_responses.append("\nIs there anything else I can help you with?")
        elif "no" in user_message:
            bot_responses.append("Alright. Please take care and consult a doctor if symptoms persist.")
            session = reset_session_for_new_query(user_id, session.get('user_name'), session.get('age'), session.get('gender'))
        else:
            bot_responses.append(f"Sorry, I didn't catch that. Regarding the doctor search, please answer 'yes' or 'no'.")


    # Fallback response
    if not bot_responses:
        bot_responses.append("I'm not sure how to respond. You can describe your symptoms, or type 'reset' or 'help'.")
    
    return jsonify({'bot_response_parts': bot_responses, 'user_id': user_id, 'map_data': map_data_for_frontend})

if __name__ == '__main__':
    if not model or not MODEL_SYMPTOM_KEYS:
        print("="*80, "\nERROR: CRITICAL DATA NOT LOADED.", "\nCheck 'models' directory.", "\n" + "="*80)
    else:
        app.logger.info("Flask app starting...")
    app.run(debug=True, port=5002)
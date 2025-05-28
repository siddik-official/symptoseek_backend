# app.py
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS # Import CORS
import pickle
import pandas as pd
import numpy as np
import os
import re
from fuzzywuzzy import process, fuzz

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, or specify origins: CORS(app, resources={r"/chat_api": {"origins": "http://localhost:3000"}})
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

# --- SYMPTOM MAP (CRITICAL: Populate this thoroughly!) ---
SYMPTOM_MAP = {
    # ... (your existing SYMPTOM_MAP - keep it as is, I'll omit for brevity) ...
    # ... (your existing SYMPTOM_MAP - keep it as is) ...
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
# "spotting urination": {"model_key": "spotting_ urination", "ask_phrase": "Have you noticed any spotting or unusual discharge during urination?"}, # Assuming space converted to underscore for model_key
"fatigue": {"model_key": "fatigue", "ask_phrase": "Are you feeling fatigued, very tired, or lacking energy?"},
"weight gain": {"model_key": "weight_gain", "ask_phrase": "Have you experienced unexplained weight gain recently?"},
"anxiety": {"model_key": "anxiety", "ask_phrase": "Are you feeling anxious, worried, or uneasy?"},
"cold hands and feet": {"model_key": "cold_hands_and_feets", "ask_phrase": "Do your hands and feet often feel cold?"}, # Original key 'feets'
"mood swings": {"model_key": "mood_swings", "ask_phrase": "Are you experiencing frequent mood swings or changes in your emotional state?"},
"weight loss": {"model_key": "weight_loss", "ask_phrase": "Have you had unexplained weight loss recently?"},
"restlessness": {"model_key": "restlessness", "ask_phrase": "Are you feeling restless or unable to relax?"},
"lethargy": {"model_key": "lethargy", "ask_phrase": "Are you experiencing lethargy or a lack of energy and enthusiasm?"},
"patches in throat": {"model_key": "patches_in_throat", "ask_phrase": "Have you noticed any patches or unusual spots in your throat?"},
"irregular sugar level": {"model_key": "irregular_sugar_level", "ask_phrase": "Have you had irregular blood sugar levels?"},
"cough": {"model_key": "cough", "ask_phrase": "Do you have a cough?"},
"high fever": {"model_key": "high_fever", "ask_phrase": "Do you have a high fever?"},
"sunken eyes": {"model_key": "sunken_eyes", "ask_phrase": "Do your eyes appear sunken or hollow?"},
"breathlessness": {"model_key": "breathlessness", "ask_phrase": "Are you experiencing breathlessness or shortness of breath?"},
"sweating": {"model_key": "sweating", "ask_phrase": "Are you sweating more than usual, or having night sweats?"},
"dehydration": {"model_key": "dehydration", "ask_phrase": "Do you feel dehydrated, thirsty, or have a dry mouth?"},
"indigestion": {"model_key": "indigestion", "ask_phrase": "Are you suffering from indigestion or an upset stomach after eating?"},
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
"yellow urine": {"model_key": "yellow_urine", "ask_phrase": "Is your urine distinctly yellow?"}, # Note: dark_urine already exists, this might be redundant or different context
"yellowing of eyes": {"model_key": "yellowing_of_eyes", "ask_phrase": "Have the whites of your eyes turned yellow?"},
"acute liver failure": {"model_key": "acute_liver_failure", "ask_phrase": "Are there signs or a diagnosis of acute liver failure?"}, # This is serious, bot should emphasize doctor visit
"fluid overload": {"model_key": "fluid_overload", "ask_phrase": "Are you experiencing symptoms of fluid overload, like swelling?"}, # If another "fluid_overload" exists, ensure distinct model_keys
"swelling of stomach": {"model_key": "swelling_of_stomach", "ask_phrase": "Is your stomach swollen or distended?"},
"swelled lymph nodes": {"model_key": "swelled_lymph_nodes", "ask_phrase": "Do you have any swelled lymph nodes, for example, in your neck, armpits, or groin?"},
"malaise": {"model_key": "malaise", "ask_phrase": "Are you feeling a general sense of malaise, discomfort, or illness?"},
"blurred and distorted vision": {"model_key": "blurred_and_distorted_vision", "ask_phrase": "Is your vision blurred or distorted?"},
"phlegm": {"model_key": "phlegm", "ask_phrase": "Are you coughing up phlegm or mucus?"},
"throat irritation": {"model_key": "throat_irritation", "ask_phrase": "Do you have throat irritation or a scratchy throat?"},
"redness of eyes": {"model_key": "redness_of_eyes", "ask_phrase": "Are your eyes red or bloodshot?"},
"sinus pressure": {"model_key": "sinus_pressure", "ask_phrase": "Do you feel pressure in your sinuses?"},
"runny nose": {"model_key": "runny_nose", "ask_phrase": "Do you have a runny nose?"},
"congestion": {"model_key": "congestion", "ask_phrase": "Are you experiencing nasal congestion or a stuffy nose?"},
"chest pain": {"model_key": "chest_pain", "ask_phrase": "Are you experiencing any chest pain?"}, # Critical, emphasize doctor
"weakness in limbs": {"model_key": "weakness_in_limbs", "ask_phrase": "Do you have weakness in your arms or legs?"},
"fast heart rate": {"model_key": "fast_heart_rate", "ask_phrase": "Is your heart beating faster than usual, or do you have palpitations?"},
"pain during bowel movements": {"model_key": "pain_during_bowel_movements", "ask_phrase": "Do you experience pain during bowel movements?"},
"pain in anal region": {"model_key": "pain_in_anal_region", "ask_phrase": "Do you have pain in your anal region?"},
"bloody stool": {"model_key": "bloody_stool", "ask_phrase": "Have you noticed any blood in your stool?"},
"irritation in anus": {"model_key": "irritation_in_anus", "ask_phrase": "Do you have irritation in your anus?"},
"neck pain": {"model_key": "neck_pain", "ask_phrase": "Are you experiencing neck pain?"},
"dizziness": {"model_key": "dizziness", "ask_phrase": "Are you feeling dizzy or lightheaded?"},
"cramps": {"model_key": "cramps", "ask_phrase": "Are you experiencing cramps (e.g., muscle or abdominal)?"},
"bruising": {"model_key": "bruising", "ask_phrase": "Are you bruising more easily than usual?"},
"obesity": {"model_key": "obesity", "ask_phrase": "Are you concerned about obesity or significant overweight?"}, # This is a condition, not a typical acute symptom
"swollen legs": {"model_key": "swollen_legs", "ask_phrase": "Are your legs swollen?"},
"swollen blood vessels": {"model_key": "swollen_blood_vessels", "ask_phrase": "Have you noticed any swollen blood vessels?"},
"puffy face and eyes": {"model_key": "puffy_face_and_eyes", "ask_phrase": "Is your face or around your eyes puffy?"},
"enlarged thyroid": {"model_key": "enlarged_thyroid", "ask_phrase": "Do you have an enlarged thyroid or a noticeable swelling in the front of your neck?"},
"brittle nails": {"model_key": "brittle_nails", "ask_phrase": "Are your nails brittle or breaking easily?"},
"swollen extremeties": {"model_key": "swollen_extremeties", "ask_phrase": "Are your extremeties (hands, feet, arms, legs) swollen?"}, # Note: extremities
"excessive hunger": {"model_key": "excessive_hunger", "ask_phrase": "Are you experiencing excessive hunger?"},
"extra marital contacts": {"model_key": "extra_marital_contacts", "ask_phrase": "Have you had extra-marital contacts? (This information is confidential and helps assess certain risks.)"}, # Sensitive, handle with care
"drying and tingling lips": {"model_key": "drying_and_tingling_lips", "ask_phrase": "Are your lips dry or do they have a tingling sensation?"},
"slurred speech": {"model_key": "slurred_speech", "ask_phrase": "Is your speech slurred or difficult to understand?"}, # Critical
"knee pain": {"model_key": "knee_pain", "ask_phrase": "Are you experiencing knee pain?"},
"hip joint pain": {"model_key": "hip_joint_pain", "ask_phrase": "Do you have pain in your hip joint?"},
"muscle weakness": {"model_key": "muscle_weakness", "ask_phrase": "Are you experiencing muscle weakness?"},
"stiff neck": {"model_key": "stiff_neck", "ask_phrase": "Do you have a stiff neck?"},
"swelling joints": {"model_key": "swelling_joints", "ask_phrase": "Are any of your joints swollen?"},
"movement stiffness": {"model_key": "movement_stiffness", "ask_phrase": "Do you feel stiffness when trying to move?"},
"spinning movements": {"model_key": "spinning_movements", "ask_phrase": "Are you experiencing spinning sensations or vertigo?"},
"loss of balance": {"model_key": "loss_of_balance", "ask_phrase": "Have you had any loss of balance or unsteadiness?"},
"unsteadiness": {"model_key": "unsteadiness", "ask_phrase": "Do you feel unsteady on your feet?"},
"weakness of one body side": {"model_key": "weakness_of_one_body_side", "ask_phrase": "Do you have weakness on one side of your body?"}, # Critical
"loss of smell": {"model_key": "loss_of_smell", "ask_phrase": "Have you experienced a loss of smell?"},
"bladder discomfort": {"model_key": "bladder_discomfort", "ask_phrase": "Are you feeling any discomfort in your bladder area?"},
# "foul smell of urine": {"model_key": "foul_smell_of urine", "ask_phrase": "Does your urine have a foul or unusual smell?"}, # Assuming space to underscore
"continuous feel of urine": {"model_key": "continuous_feel_of_urine", "ask_phrase": "Do you have a continuous feeling of needing to urinate?"},
"passage of gases": {"model_key": "passage_of_gases", "ask_phrase": "Are you passing more gas than usual?"},
"internal itching": {"model_key": "internal_itching", "ask_phrase": "Are you experiencing internal itching (e.g., vaginal or anal)?"},
"toxic look (typhos)": {"model_key": "toxic_look_(typhos)", "ask_phrase": "Do you appear very ill, perhaps with a 'toxic look' or typhos-like state?"}, # TYPHOS is a severe state
"depression": {"model_key": "depression", "ask_phrase": "Are you feeling depressed, sad, or hopeless?"},
"irritability": {"model_key": "irritability", "ask_phrase": "Are you feeling more irritable than usual?"},
"muscle pain": {"model_key": "muscle_pain", "ask_phrase": "Are you experiencing muscle pain or aches?"},
"altered sensorium": {"model_key": "altered_sensorium", "ask_phrase": "Have you experienced any altered sensorium, confusion, or changes in consciousness?"}, # Critical
"red spots over body": {"model_key": "red_spots_over_body", "ask_phrase": "Have you noticed red spots appearing over your body?"},
"belly pain": {"model_key": "belly_pain", "ask_phrase": "Do you have pain in your belly area?"}, # Note: 'stomach_pain' and 'abdominal_pain' exist. Ensure model keys are distinct if these are truly different symptoms in model.
"abnormal menstruation": {"model_key": "abnormal_menstruation", "ask_phrase": "Are you experiencing abnormal menstruation (e.g., irregular, heavy, or missed periods)?"},
# "dischromic patches": {"model_key": "dischromic _patches", "ask_phrase": "Do you have dischromic patches (discolored skin patches)?"}, # Assuming dischromic__patches -> dischromic_patches
"watering from eyes": {"model_key": "watering_from_eyes", "ask_phrase": "Are your eyes watering excessively?"},
"increased appetite": {"model_key": "increased_appetite", "ask_phrase": "Has your appetite increased significantly?"},
"polyuria": {"model_key": "polyuria", "ask_phrase": "Are you experiencing polyuria (urinating large volumes frequently)?"},
"family history": {"model_key": "family_history", "ask_phrase": "Is there a family history of similar conditions or specific diseases?"}, # This is a risk factor, not a direct symptom usually
"mucoid sputum": {"model_key": "mucoid_sputum", "ask_phrase": "Are you coughing up mucoid (clear or white) sputum?"},
"rusty sputum": {"model_key": "rusty_sputum", "ask_phrase": "Are you coughing up rusty-colored sputum?"},
"lack of concentration": {"model_key": "lack_of_concentration", "ask_phrase": "Are you having difficulty concentrating?"},
"visual disturbances": {"model_key": "visual_disturbances", "ask_phrase": "Are you experiencing any visual disturbances other than blurred vision?"},
"receiving blood transfusion": {"model_key": "receiving_blood_transfusion", "ask_phrase": "Have you recently received a blood transfusion?"}, # Risk factor
"receiving unsterile injections": {"model_key": "receiving_unsterile_injections", "ask_phrase": "Have you recently received any unsterile injections?"}, # Risk factor
"coma": {"model_key": "coma", "ask_phrase": "Has there been any instance of coma or unresponsiveness?"}, # Critical
"stomach bleeding": {"model_key": "stomach_bleeding", "ask_phrase": "Are there any signs of stomach bleeding (e.g., vomiting blood, black tarry stools)?"}, # Critical
"distention of abdomen": {"model_key": "distention_of_abdomen", "ask_phrase": "Is your abdomen distended or significantly bloated?"},
"history of alcohol consumption": {"model_key": "history_of_alcohol_consumption", "ask_phrase": "Do you have a history of significant alcohol consumption?"}, # Risk factor
# "fluid_overload" is listed twice in your input. Assuming it maps to the same model_key. If they are different symptoms in the model, they need different keys.
# Assuming the second one is the same or a typo.
"blood in sputum": {"model_key": "blood_in_sputum", "ask_phrase": "Are you coughing up blood in your sputum?"},
"prominent veins on calf": {"model_key": "prominent_veins_on_calf", "ask_phrase": "Are the veins on your calf prominent or bulging?"},
"palpitations": {"model_key": "palpitations", "ask_phrase": "Are you experiencing palpitations or a fluttering sensation in your chest?"}, # Similar to fast_heart_rate, check model diff.
"painful walking": {"model_key": "painful_walking", "ask_phrase": "Is it painful for you to walk?"},
"pus filled pimples": {"model_key": "pus_filled_pimples", "ask_phrase": "Do you have pus-filled pimples?"},
"blackheads": {"model_key": "blackheads", "ask_phrase": "Are you experiencing blackheads?"},
"scurring": {"model_key": "scurring", "ask_phrase": "Do you have scurring (scarring or scabbing) on your skin?"}, # Spelling "scurring" as in dataset
"skin peeling": {"model_key": "skin_peeling", "ask_phrase": "Is your skin peeling?"},
"silver like dusting": {"model_key": "silver_like_dusting", "ask_phrase": "Do you have a silver-like dusting or scales on your skin?"},
"small dents in nails": {"model_key": "small_dents_in_nails", "ask_phrase": "Are there small dents or pits in your nails?"},
"inflammatory nails": {"model_key": "inflammatory_nails", "ask_phrase": "Are your nails inflamed, red, or swollen around the edges?"},
"blister": {"model_key": "blister", "ask_phrase": "Have you developed any blisters on your skin?"},
"red sore around nose": {"model_key": "red_sore_around_nose", "ask_phrase": "Do you have a red sore or irritation around your nose?"},
"yellow crust ooze": {"model_key": "yellow_crust_ooze", "ask_phrase": "Is there any yellow crust or ooze from skin lesions?"},
# --- Synonyms (Add more as you think of them) ---
"sore throat": {"model_key": "throat_irritation", "ask_phrase": "Do you have a sore throat?"}, # Or 'patches_in_throat' depending on context
"tiredness": {"model_key": "fatigue", "ask_phrase": "Are you feeling extremely tired?"},
"throwing up": {"model_key": "vomiting", "ask_phrase": "Have you been throwing up?"},
"painful urination": {"model_key": "burning_micturition", "ask_phrase": "Is it painful when you urinate?"},
"loose stools": {"model_key": "diarrhoea", "ask_phrase": "Are you having loose stools or diarrhoea?"},
"shortness of breath": {"model_key": "breathlessness", "ask_phrase": "Are you experiencing shortness of breath?"},
"upset stomach": {"model_key": "indigestion", "ask_phrase": "Do you have an upset stomach?"}, # Or nausea/vomiting depending on detail
"feeling sick": {"model_key": "nausea", "ask_phrase": "Are you feeling sick to your stomach?"},
"stuffy nose": {"model_key": "congestion", "ask_phrase": "Do you have a stuffy nose?"},
"vertigo": {"model_key": "spinning_movements", "ask_phrase": "Are you experiencing vertigo or a spinning sensation?"},
"passing gas": {"model_key": "passage_of_gases", "ask_phrase": "Are you passing more gas than usual?"},
"feeling down": {"model_key": "depression", "ask_phrase": "Are you feeling down or depressed?"},
"peeing a lot": {"model_key": "polyuria", "ask_phrase": "Are you urinating much more frequently or in larger amounts?"},
}


MODEL_KEY_TO_ASK_PHRASE = {}
NATURAL_SYMPTOM_PHRASES_FOR_FUZZY = []

def initialize_app_data():
    # ... (your existing initialize_app_data function - no changes needed here for this step)
    # I will omit for brevity, assume it's the same as your provided code.
    global model, MODEL_SYMPTOM_KEYS, doctors_df, disease_desc_df, disease_precaution_df
    global MODEL_KEY_TO_ASK_PHRASE, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY

    app.logger.info("Initializing application data...")
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SYMPTOM_COLUMNS_PATH, 'rb') as f:
            MODEL_SYMPTOM_KEYS = pickle.load(f)
        MODEL_SYMPTOM_KEYS = [key.strip().lower().replace(' ', '_') for key in MODEL_SYMPTOM_KEYS]
        app.logger.info(f"Model and {len(MODEL_SYMPTOM_KEYS)} symptom keys loaded.")

        app.logger.info(f"Verifying SYMPTOM_MAP against {len(MODEL_SYMPTOM_KEYS)} model keys...")
        validated_symptom_map_temp = {}
        
        for natural_phrase, details in SYMPTOM_MAP.items():
            model_key_in_map = details.get("model_key")
            if not isinstance(model_key_in_map, str):
                 app.logger.warning(f"SymptomMap Integrity Issue: Entry for '{natural_phrase}' has no 'model_key' or it's not a string. Skipping.")
                 continue
            normalized_model_key_in_map = model_key_in_map.strip().lower().replace(' ', '_')
            if normalized_model_key_in_map not in MODEL_SYMPTOM_KEYS:
                # Try to find a match for keys that might have typos like 'spotting_ urination' vs 'spotting_urination'
                # This is a simple fix, more robust matching might be needed for complex cases
                corrected_key = normalized_model_key_in_map.replace(" _", "_") 
                if corrected_key in MODEL_SYMPTOM_KEYS:
                    app.logger.info(f"Corrected model_key '{normalized_model_key_in_map}' to '{corrected_key}' for phrase '{natural_phrase}'.")
                    normalized_model_key_in_map = corrected_key
                else:
                    app.logger.warning(f"SymptomMap Error: model_key '{normalized_model_key_in_map}' (from phrase '{natural_phrase}') not found in loaded MODEL_SYMPTOM_KEYS. Skipping this entry.")
                    continue # Skip this entry
            
            details["model_key"] = normalized_model_key_in_map
            validated_symptom_map_temp[natural_phrase] = details
        
        SYMPTOM_MAP.clear()
        SYMPTOM_MAP.update(validated_symptom_map_temp)

        MODEL_KEY_TO_ASK_PHRASE = {details["model_key"]: details["ask_phrase"]
                                   for details in SYMPTOM_MAP.values() if details["model_key"] in MODEL_SYMPTOM_KEYS}
        NATURAL_SYMPTOM_PHRASES_FOR_FUZZY = list(SYMPTOM_MAP.keys())
        app.logger.info(f"SYMPTOM_MAP processed: {len(SYMPTOM_MAP)} natural phrases, {len(MODEL_KEY_TO_ASK_PHRASE)} model key ask phrases.")
        app.logger.info(f"Sample model keys in MODEL_KEY_TO_ASK_PHRASE: {list(MODEL_KEY_TO_ASK_PHRASE.keys())[:5]}")
        app.logger.info(f"MODEL_SYMPTOM_KEYS sample: {MODEL_SYMPTOM_KEYS[:5]}")


    except FileNotFoundError:
        app.logger.error(f"CRITICAL: Model or symptom_columns.pkl not found in {MODEL_DIR}.")
        model = None
    except Exception as e:
        app.logger.error(f"CRITICAL Error initializing model/symptom keys: {e}")
        model = None

    try:
        doctors_df = pd.read_csv(DOCTORS_CSV_PATH, dtype={'number': str})
        doctors_df.columns = doctors_df.columns.str.strip().str.lower().str.replace(' ', '_')
        
        lat_col_name = 'latitude' 
        lon_col_name = 'longitude'

        if lat_col_name in doctors_df.columns:
            doctors_df[lat_col_name] = pd.to_numeric(doctors_df[lat_col_name], errors='coerce')
        else:
            app.logger.warning(f"Latitude column '{lat_col_name}' not found in doctors CSV.")
            doctors_df[lat_col_name] = np.nan 

        if lon_col_name in doctors_df.columns:
            doctors_df[lon_col_name] = pd.to_numeric(doctors_df[lon_col_name], errors='coerce')
        else:
            app.logger.warning(f"Longitude column '{lon_col_name}' not found in doctors CSV.")
            doctors_df[lon_col_name] = np.nan 

        doctors_df['about'] = doctors_df['about'].fillna('N/A')
        doctors_df['image_source'] = doctors_df['image_source'].fillna('https://via.placeholder.com/100?text=No+Image')
        app.logger.info(f"Doctors data loaded from {DOCTORS_CSV_PATH}. Shape: {doctors_df.shape}")
        
        # Correct column name reference for logging if `doc_name_col` wasn't defined in this scope.
        # Assuming the name column after cleaning is 'name'.
        doc_name_actual_col = 'name' # This should be the actual column name after cleaning
        if doc_name_actual_col not in doctors_df.columns:
            app.logger.warning(f"Doctor name column '{doc_name_actual_col}' not found for logging head.")
            # Fallback or log error, here we just proceed without it in the log
            app.logger.info(doctors_df[[lat_col_name, lon_col_name]].head())
        else:
            app.logger.info(doctors_df[[doc_name_actual_col, lat_col_name, lon_col_name]].head())


    except Exception as e:
        app.logger.error(f"Error loading doctors data {DOCTORS_CSV_PATH}: {e}")
        doctors_df = pd.DataFrame() 

    for path, df_name, global_var_name in [
        (DISEASE_DESC_CSV_PATH, "Disease Descriptions", "disease_desc_df"),
        (DISEASE_PRECAUTION_CSV_PATH, "Disease Precautions", "disease_precaution_df")
    ]:
        try:
            temp_df = pd.read_csv(path)
            temp_df.columns = temp_df.columns.str.strip().str.lower()
            if 'disease' in temp_df.columns:
                temp_df.set_index('disease', inplace=True)
                globals()[global_var_name] = temp_df
                app.logger.info(f"{df_name} loaded from {path}")
            else:
                app.logger.error(f"'disease' column not found in {path}")
        except Exception as e:
            app.logger.warning(f"Could not load {df_name} from {path}: {e}")
            globals()[global_var_name] = pd.DataFrame()

initialize_app_data()

# --- Disease to Specialization Map ---
disease_to_specialization_map = {
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

    # Additional diseases
    "anemia": "Hematologist", "appendicitis": "General Surgeon", "bipolar disorder": "Psychiatrist",
    "depression": "Psychiatrist", "anxiety disorder": "Psychiatrist", "schizophrenia": "Psychiatrist",
    "stroke": "Neurologist", "epilepsy": "Neurologist", "meningitis": "Neurologist",
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
    "scabies": "Dermatologist", "ringworm": "Dermatologist"
}

def normalize_text(text):
    # ... (your existing function - keep as is) ...
    return str(text).strip().lower() if pd.notna(text) else ""

# --- NLP Symptom Extraction Helper ---
def extract_initial_symptoms_nlp(user_text, symptom_map_config_dict, natural_phrases_list_for_fuzzy, threshold=80):
    # ... (your existing function - keep as is, omit for brevity) ...
    identified_model_symptoms = set()
    user_text_lower = user_text.lower()
    if not user_text_lower: return []

    potential_phrases = [p.strip() for p in re.split(r',|\band\b|\bi feel\b|\bi have\b|\bexperiencing\b', user_text_lower) if p.strip()]
    if not potential_phrases: potential_phrases.append(user_text_lower) # Handle single phrase input

    app.logger.debug(f"NLP: Potential phrases from '{user_text_lower}': {potential_phrases}")
    app.logger.debug(f"NLP: Fuzzy matching against {len(natural_phrases_list_for_fuzzy)} natural phrases.")


    for phrase in potential_phrases:
        phrase = phrase.strip() # Ensure phrase is stripped
        if not phrase or len(phrase) < 3: continue # Skip very short phrases
        
        # Use fuzz.ratio for potentially better matching on short phrases, or token_set_ratio for longer ones
        # scorer_to_use = fuzz.token_set_ratio # Original
        scorer_to_use = fuzz.WRatio # Often good for general purpose matching

        # Ensure natural_phrases_list_for_fuzzy is not empty
        if not natural_phrases_list_for_fuzzy:
            app.logger.warning("NLP: natural_phrases_list_for_fuzzy is empty. Cannot perform matching.")
            continue

        best_match_tuple = process.extractOne(phrase, natural_phrases_list_for_fuzzy, scorer=scorer_to_use)
        
        if best_match_tuple:
            best_match, score = best_match_tuple
            app.logger.debug(f"NLP: Phrase '{phrase}' -> Best match '{best_match}' with score {score}")
            if score >= threshold:
                if best_match in symptom_map_config_dict:
                    model_symptom_key = symptom_map_config_dict[best_match]["model_key"]
                    if model_symptom_key in MODEL_SYMPTOM_KEYS: # Final check
                        identified_model_symptoms.add(model_symptom_key)
                    else:
                        app.logger.warning(f"NLP: Matched natural phrase '{best_match}' but its model_key '{model_symptom_key}' is NOT in MODEL_SYMPTOM_KEYS.")
                else:
                     app.logger.warning(f"NLP: Matched natural phrase '{best_match}' but it's NOT in symptom_map_config_dict (SYMPTOM_MAP).")
            else:
                app.logger.debug(f"NLP: Match for '{phrase}' ('{best_match}') below threshold {threshold} (score: {score})")
        else:
            app.logger.debug(f"NLP: No fuzzy match found for phrase '{phrase}'")
    
    app.logger.info(f"NLP Extracted for '{user_text}': {list(identified_model_symptoms)}")
    return list(identified_model_symptoms)


# --- Targeted Symptom Questioning Strategy ---
MIN_SYMPTOMS_FOR_PREDICTION = 3 # Reduced for easier testing
MAX_QUESTIONS_PER_ROUND = 2

def determine_next_symptoms_to_ask(symptoms_vector_dict, all_model_symptom_keys, ml_model, symptom_map_config_dict, count=MAX_QUESTIONS_PER_ROUND):
    # ... (your existing function - keep as is, omit for brevity) ...
    # This function's logic depends on how the ML model might guide symptom questioning.
    # For now, let's stick to a simpler random approach from unasked relevant symptoms.
    
    # Get keys of symptoms that are confirmed positive (value is 1)
    confirmed_positive_keys = {k for k, v in symptoms_vector_dict.items() if v == 1}
    
    # Get keys of symptoms that have already been addressed (value is 0 or 1)
    already_addressed_keys = set(symptoms_vector_dict.keys())

    # Potential symptoms to ask about:
    # - Must be in our SYMPTOM_MAP (so we have an ask_phrase)
    # - Must correspond to a model_key
    # - Must NOT have been confirmed positive already
    # - Ideally, should not have been explicitly denied (value is 0), but can be asked again if logic improves
    
    candidate_model_keys_to_ask = []
    for natural_phrase, details in symptom_map_config_dict.items():
        model_key = details.get("model_key")
        if model_key in all_model_symptom_keys: # Ensure it's a valid model symptom
            # Prioritize symptoms not yet addressed at all
            if model_key not in already_addressed_keys:
                 candidate_model_keys_to_ask.append(model_key)
            # Or, if it was addressed but is not confirmed positive (i.e., was 0 or not asked yet)
            elif symptoms_vector_dict.get(model_key, 0) == 0 : # and model_key not in confirmed_positive_keys:
                 # Could add logic here to re-ask if needed, or avoid re-asking denied symptoms
                 # For now, let's also consider these as candidates if not yet positive
                 if model_key not in confirmed_positive_keys: # defensive check
                    candidate_model_keys_to_ask.append(model_key)


    # Remove duplicates that might have arisen if a model_key is mapped from multiple natural_phrases
    unique_candidate_model_keys = sorted(list(set(candidate_model_keys_to_ask)))
    
    # Filter out any keys that are already confirmed positive or explicitly denied recently.
    # For simplicity, we will filter out any key that has a '1' or '0' already in symptoms_vector_dict
    # This means we are only looking for keys not yet in symptoms_vector_dict explicitly.
    # However, symptoms_vector is initialized with all keys as 0.
    # So we need to pick from those that are still 0 and NOT confirmed positive.

    truly_unasked_or_denied_keys = [
        key for key in all_model_symptom_keys 
        if (key not in symptoms_vector_dict or symptoms_vector_dict[key] == 0) # Not yet asked or denied
           and key in MODEL_KEY_TO_ASK_PHRASE # Make sure we have a question for it
           and key not in confirmed_positive_keys # Not already confirmed
    ]

    if not truly_unasked_or_denied_keys:
        app.logger.info("Determine_next: No truly unasked/denied symptoms with ask_phrases left.")
        return []

    import random
    random.shuffle(truly_unasked_or_denied_keys) # Shuffle to vary questions
    
    # A more advanced strategy might involve looking at co-occurrence with confirmed symptoms,
    # or using model probabilities if partial symptoms are fed in.
    # For now, random unasked is okay.
    
    selected_to_ask = truly_unasked_or_denied_keys[:count]
    app.logger.info(f"Determine_next: Selected {len(selected_to_ask)} symptoms to ask: {selected_to_ask}")
    return selected_to_ask


# --- In-memory Session Store ---
user_sessions = {} # This will store session data per user_id

def get_session(user_id):
    # ... (your existing function - keep as is, omit for brevity) ...
    if user_id not in user_sessions:
        app.logger.info(f"New session for user_id: {user_id}")
        # Ensure MODEL_SYMPTOM_KEYS is populated before this is called
        if not MODEL_SYMPTOM_KEYS:
            app.logger.error("MODEL_SYMPTOM_KEYS is empty! Cannot initialize session symptoms_vector.")
            # Potentially raise an error or handle this state if critical at runtime
            # For now, initialize to empty dict if keys are not ready, but this indicates a problem.
            symptoms_vector_init = {}
        else:
            symptoms_vector_init = {key: 0 for key in MODEL_SYMPTOM_KEYS}

        user_sessions[user_id] = {
            'state': 'AWAITING_NAME', 'user_name': None,
            'symptoms_vector': symptoms_vector_init,
            'symptoms_confirmed_count': 0,
            'symptoms_pending_clarification': [], 'current_clarifying_symptom_key': None,
            'symptoms_targeted_questions_q': [], 'current_targeted_symptom_key': None,
            'age': None, 'sex': None, 'predicted_disease_context': None
        }
    return user_sessions[user_id]

def reset_session_for_new_query(user_id, existing_name=None):
    # ... (your existing function - keep as is, omit for brevity) ...
    if not MODEL_SYMPTOM_KEYS:
        app.logger.error("MODEL_SYMPTOM_KEYS is empty during reset! Cannot initialize session symptoms_vector.")
        symptoms_vector_init = {}
    else:
        symptoms_vector_init = {key: 0 for key in MODEL_SYMPTOM_KEYS}
        
    user_sessions[user_id] = {
        'state': 'AWAITING_INITIAL_SYMPTOMS' if existing_name else 'AWAITING_NAME',
        'user_name': existing_name,
        'symptoms_vector': symptoms_vector_init,
        'symptoms_confirmed_count': 0,
        'symptoms_pending_clarification': [], 'current_clarifying_symptom_key': None,
        'symptoms_targeted_questions_q': [], 'current_targeted_symptom_key': None,
        'age': None, 'sex': None, 'predicted_disease_context': None
    }
    app.logger.info(f"Session reset for user_id: {user_id}. New state: {user_sessions[user_id]['state']}")
    return user_sessions[user_id]


# --- Flask Routes ---
@app.route('/')
def chat_home():
    # This route might not be used directly if the frontend is separate or served by Node.
    return render_template('chat.html')

@app.route('/chat_api', methods=['POST'])
def chat_api():
    # ... (Most of your existing chat_api logic will remain the same)
    # Key change: user_id is now expected to be passed by the Node.js backend.
    # If user_id is not passed, we might assign a temporary one, but it's better if Nodejs provides it.

    if not model or not MODEL_SYMPTOM_KEYS:
        app.logger.error("Model or MODEL_SYMPTOM_KEYS not available in /chat_api")
        return jsonify({'bot_response_parts': ["I apologize, my medical knowledge system is currently offline. Please check back soon."]})

    data = request.get_json()
    # IMPORTANT: user_id should now come from the authenticated user via Node.js
    user_id = data.get('user_id') 
    if not user_id:
        app.logger.warning("No user_id received in /chat_api request. This should be provided by the calling service.")
        # Fallback for direct testing, but in production, user_id is crucial.
        user_id = 'temp_flask_user_' + str(np.random.randint(100000))
        # return jsonify({'error': 'user_id is required'}), 400 # Or handle as an error

    user_message = data.get('message', '').lower().strip()

    # Ensure MODEL_SYMPTOM_KEYS are loaded before get_session is called
    if not MODEL_SYMPTOM_KEYS:
        app.logger.critical("MODEL_SYMPTOM_KEYS not loaded when trying to get/create session. This is a fatal error for session init.")
        # This should ideally not happen if initialize_app_data() worked.
        # If it does, the bot cannot function.
        return jsonify({'bot_response_parts': ["Critical system error: Symptom data not loaded. Please contact support."]})

    session = get_session(user_id) # get_session will initialize if MODEL_SYMPTOM_KEYS is ready
    
    # Check if symptoms_vector was initialized correctly (it might be empty if MODEL_SYMPTOM_KEYS was empty during init)
    if not session['symptoms_vector'] and MODEL_SYMPTOM_KEYS:
        app.logger.warning(f"Session for {user_id} has empty symptoms_vector. Re-initializing.")
        session['symptoms_vector'] = {key: 0 for key in MODEL_SYMPTOM_KEYS}


    bot_responses = []
    map_data_for_frontend = None 
    current_state = session['state']
    user_name_greet = f"{session['user_name']}, " if session['user_name'] else ""

    app.logger.info(f"Flask API - ID:{user_id}, Name:{session.get('user_name')}, State:{current_state}, Msg:'{user_message}'")
    app.logger.debug(f"Flask API - Current symptoms_vector: {session['symptoms_vector']}")
    app.logger.debug(f"Flask API - Confirmed count: {session['symptoms_confirmed_count']}")


    # Universal commands
    if user_message in ["reset", "start over", "restart"]:
        existing_name = session.get('user_name') # Preserve name if known
        session = reset_session_for_new_query(user_id, existing_name)
        if existing_name:
            bot_responses.append(f"Okay, {existing_name}, let's start the diagnosis questions fresh! Please describe your main symptoms.")
        else:
            bot_responses.append("Okay, let's start fresh! What's your name?")
        current_state = session['state'] # Update current_state after reset
    
    elif "help symptoms" in user_message or user_message == "help":
        s_list_display = sorted([s.title() for s in NATURAL_SYMPTOM_PHRASES_FOR_FUZZY if s not in ["tiredness", "feeling sick"]]) # Example filter
        response_text = "I can understand symptoms like: " + ", ".join(s_list_display[:15])
        if len(s_list_display) > 15:
            response_text += f"... and about {len(s_list_display)-15} more. Try describing how you feel, or ask about a specific one."
        else:
            response_text += ". Try describing how you feel."
        bot_responses.append(response_text)

    if not bot_responses: # Proceed with state machine if no universal command handled it
        if current_state == 'AWAITING_NAME':
            if user_message and len(user_message) > 1 and not user_message.isdigit():
                session['user_name'] = user_message.strip().title()
                bot_responses.append(f"Nice to meet you, {session['user_name']}! To help me understand your situation, please describe your main symptoms.")
                session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
            else:
                bot_responses.append("Hello! I'm ArogyaBot, your AI health assistant. What's your name, please?")
        
        elif current_state == 'AWAITING_INITIAL_SYMPTOMS':
            if not NATURAL_SYMPTOM_PHRASES_FOR_FUZZY:
                 app.logger.error("NATURAL_SYMPTOM_PHRASES_FOR_FUZZY is empty in AWAITING_INITIAL_SYMPTOMS. NLP cannot function.")
                 bot_responses.append("I'm having trouble understanding symptoms right now. Please try again later.")
            else:
                extracted_keys = extract_initial_symptoms_nlp(user_message, SYMPTOM_MAP, NATURAL_SYMPTOM_PHRASES_FOR_FUZZY)
                
                # Filter out keys already confirmed or currently being clarified/targeted
                newly_identified_keys = [
                    k for k in extracted_keys 
                    if session['symptoms_vector'].get(k, 0) == 0 and \
                    k != session.get('current_clarifying_symptom_key') and \
                    k != session.get('current_targeted_symptom_key')
                ]
                
                if newly_identified_keys:
                    session['symptoms_pending_clarification'].extend(newly_identified_keys)
                    # Remove duplicates while preserving order (important for pop(0))
                    seen = set()
                    session['symptoms_pending_clarification'] = [x for x in session['symptoms_pending_clarification'] if not (x in seen or seen.add(x))]
                    
                if session['symptoms_pending_clarification']:
                    session['current_clarifying_symptom_key'] = session['symptoms_pending_clarification'].pop(0)
                    ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_clarifying_symptom_key'], f"Are you experiencing {session['current_clarifying_symptom_key'].replace('_',' ')}?")
                    bot_responses.append(user_name_greet + ask_phrase + " (yes/no)")
                    session['state'] = 'CLARIFYING_SYMPTOMS'
                elif extracted_keys: # Extracted keys but all were already processed or known (e.g. user repeats a symptom)
                    if session['symptoms_confirmed_count'] > 0:
                         bot_responses.append(user_name_greet + "I've noted those. Do you have any other symptoms you'd like to add? If not, say 'no more symptoms'.")
                    else: # No symptoms confirmed yet, and NLP didn't find new ones to clarify
                         bot_responses.append(user_name_greet + "I didn't catch any new symptoms from that. Could you describe your symptoms again, or list some common ones like 'fever', 'cough', 'headache'?")
                elif "no more symptoms" in user_message or "that's all" in user_message:
                    if session['symptoms_confirmed_count'] >= MIN_SYMPTOMS_FOR_PREDICTION:
                        bot_responses.append(user_name_greet + "Thanks. For our records, what is your age?")
                        session['state'] = 'AWAITING_AGE'
                    else:
                        bot_responses.append(user_name_greet + f"I need at least {MIN_SYMPTOMS_FOR_PREDICTION} symptoms for a preliminary analysis. Can you think of any others? If not, I can ask some targeted questions.")
                        # Optionally, jump to targeted questioning if user is stuck
                        session['symptoms_targeted_questions_q'] = determine_next_symptoms_to_ask(
                            session['symptoms_vector'], MODEL_SYMPTOM_KEYS, model, SYMPTOM_MAP, count=MAX_QUESTIONS_PER_ROUND +1 # ask a bit more
                        )
                        if session['symptoms_targeted_questions_q']:
                            session['current_targeted_symptom_key'] = session['symptoms_targeted_questions_q'].pop(0)
                            ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_targeted_symptom_key'], f"Okay, let me ask: do you also have {session['current_targeted_symptom_key'].replace('_',' ')}?")
                            bot_responses.append(ask_phrase + " (yes/no)")
                            session['state'] = 'TARGETED_QUESTIONING'
                        else:
                            bot_responses.append(user_name_greet + "I'm unable to suggest further questions right now. Please try describing any other feelings or symptoms.")

                else: # No symptoms extracted and not "no more symptoms"
                    bot_responses.append(user_name_greet + "I'm sorry, I didn't quite catch any symptoms. Could you please describe them again? For example, 'I have a headache and a cough'.")

        elif current_state == 'CLARIFYING_SYMPTOMS':
            symptom_key = session['current_clarifying_symptom_key']
            responded = False
            if "yes" in user_message:
                if symptom_key and symptom_key in session['symptoms_vector']:
                    session['symptoms_vector'][symptom_key] = 1
                    session['symptoms_confirmed_count'] += 1
                    bot_responses.append(f"Noted: {symptom_key.replace('_',' ')}.")
                else:
                    app.logger.error(f"CLARIFYING: symptom_key '{symptom_key}' is invalid or not in symptoms_vector.")
                    bot_responses.append("Sorry, there was a small glitch. Let's try that again or tell me other symptoms.")
                    session['state'] = 'AWAITING_INITIAL_SYMPTOMS' # Reset to gather
                responded = True
            elif "no" in user_message:
                if symptom_key and symptom_key in session['symptoms_vector']:
                    session['symptoms_vector'][symptom_key] = 0 
                    bot_responses.append(f"Okay, no {symptom_key.replace('_',' ')}.")
                else:
                    app.logger.error(f"CLARIFYING: symptom_key '{symptom_key}' is invalid or not in symptoms_vector for NO response.")
                    # Less critical if it's a 'no', but still log
                responded = True
            
            if responded:
                session['current_clarifying_symptom_key'] = None # Clear current clarification
                if session['symptoms_pending_clarification']: # More from initial NLP
                    session['current_clarifying_symptom_key'] = session['symptoms_pending_clarification'].pop(0)
                    ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_clarifying_symptom_key'], f"What about {session['current_clarifying_symptom_key'].replace('_',' ')}?")
                    bot_responses.append(ask_phrase + " (yes/no)")
                else: # No more NLP clarifications, decide next step
                    if session['symptoms_confirmed_count'] < MIN_SYMPTOMS_FOR_PREDICTION:
                        session['symptoms_targeted_questions_q'] = determine_next_symptoms_to_ask(
                            session['symptoms_vector'], MODEL_SYMPTOM_KEYS, model, SYMPTOM_MAP
                        )
                        if session['symptoms_targeted_questions_q']:
                            session['current_targeted_symptom_key'] = session['symptoms_targeted_questions_q'].pop(0)
                            ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_targeted_symptom_key'], f"Do you also have {session['current_targeted_symptom_key'].replace('_',' ')}?")
                            bot_responses.append(user_name_greet + "Okay. " + ask_phrase + " (yes/no)")
                            session['state'] = 'TARGETED_QUESTIONING'
                        else: 
                            bot_responses.append(user_name_greet + f"I need a bit more information (at least {MIN_SYMPTOMS_FOR_PREDICTION} symptoms). Are there any other symptoms at all, even minor ones? Or say 'no more symptoms'.")
                            session['state'] = 'AWAITING_INITIAL_SYMPTOMS' 
                    else: # Sufficient symptoms confirmed
                        bot_responses.append(user_name_greet + "Thanks. For a more complete picture, what is your age?")
                        session['state'] = 'AWAITING_AGE'
            else: # Invalid yes/no response
                ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(symptom_key, f"Are you experiencing {symptom_key.replace('_',' ')}?")
                bot_responses.append("Please answer 'yes' or 'no'. " + ask_phrase)


        elif current_state == 'TARGETED_QUESTIONING':
            symptom_key = session['current_targeted_symptom_key']
            responded = False
            if "yes" in user_message:
                if symptom_key and symptom_key in session['symptoms_vector']:
                    session['symptoms_vector'][symptom_key] = 1
                    session['symptoms_confirmed_count'] += 1
                    bot_responses.append(f"Understood: {symptom_key.replace('_',' ')}.")
                else:
                     app.logger.error(f"TARGETED: symptom_key '{symptom_key}' is invalid or not in symptoms_vector.")
                responded = True
            elif "no" in user_message:
                if symptom_key and symptom_key in session['symptoms_vector']:
                    session['symptoms_vector'][symptom_key] = 0
                    bot_responses.append(f"Okay, no {symptom_key.replace('_',' ')}.")
                else:
                    app.logger.error(f"TARGETED: symptom_key '{symptom_key}' is invalid or not in symptoms_vector for NO.")
                responded = True

            if responded:
                session['current_targeted_symptom_key'] = None
                # Ask one more targeted if available & still below min_symptoms + buffer, or if queue has items
                if session['symptoms_targeted_questions_q'] and session['symptoms_confirmed_count'] < (MIN_SYMPTOMS_FOR_PREDICTION + 1): 
                    session['current_targeted_symptom_key'] = session['symptoms_targeted_questions_q'].pop(0)
                    ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(session['current_targeted_symptom_key'], f"And how about {session['current_targeted_symptom_key'].replace('_',' ')}?")
                    bot_responses.append(ask_phrase + " (yes/no)")
                elif session['symptoms_confirmed_count'] < MIN_SYMPTOMS_FOR_PREDICTION and not session['symptoms_targeted_questions_q']:
                    bot_responses.append(user_name_greet + f"I still need a bit more information (at least {MIN_SYMPTOMS_FOR_PREDICTION} symptoms). Can you think of any other symptoms you're experiencing? Or say 'no more symptoms'.")
                    session['state'] = 'AWAITING_INITIAL_SYMPTOMS' 
                else: # Either enough symptoms or ran out of questions but met minimum
                    bot_responses.append(user_name_greet + "Thank you. Just a couple of routine questions. What is your age?")
                    session['state'] = 'AWAITING_AGE'
            else: # Invalid yes/no
                ask_phrase = MODEL_KEY_TO_ASK_PHRASE.get(symptom_key, f"Do you have {symptom_key.replace('_',' ')}?")
                bot_responses.append("Please answer 'yes' or 'no'. " + ask_phrase)

        elif current_state == 'AWAITING_AGE':
            try:
                age_match = re.search(r'\d+', user_message)
                if age_match:
                    age = int(age_match.group(0))
                    if 0 < age < 120:
                        session['age'] = age
                        bot_responses.append(user_name_greet + f"Age {age} noted. And your biological sex? (Male/Female/Other/Prefer not to say)")
                        session['state'] = 'AWAITING_SEX'
                    else: bot_responses.append("That age seems unlikely. Could you please provide a valid age (e.g., 30)?")
                else: bot_responses.append("I couldn't understand the age. Please enter it as a number (e.g., 'I am 30' or just '30').")
            except ValueError: bot_responses.append("Please enter your age using numbers (e.g., 30).")

        elif current_state == 'AWAITING_SEX':
            sex_val = None
            msg_lower = user_message.lower()
            if "male" in msg_lower or msg_lower == "m": sex_val = "Male"
            elif "female" in msg_lower or msg_lower == "f": sex_val = "Female"
            elif "other" in msg_lower: sex_val = "Other"
            elif "prefer not to say" in msg_lower or "skip" in msg_lower or "n/a" in msg_lower : sex_val = "Prefer not to say"
            
            if sex_val:
                session['sex'] = sex_val
                bot_responses.append(user_name_greet + f"{sex_val} recorded. Thank you. I'll analyze your symptoms now...")
                session['state'] = 'READY_TO_PREDICT' 
            else:
                bot_responses.append(user_name_greet + "Please specify Male, Female, Other, or you can say 'Prefer not to say'.")
        
        if session['state'] == 'READY_TO_PREDICT': 
            if session['symptoms_confirmed_count'] < 1 : # MIN_SYMPTOMS_FOR_PREDICTION already checked usually
                bot_responses.append(user_name_greet + "I don't seem to have enough symptom information to make an analysis. Could we start over by you telling me your main symptoms?")
                session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
            elif session['age'] is None or session['sex'] is None: 
                # This case implies a direct jump or logic error, guide back
                if session['age'] is None:
                    bot_responses.append(user_name_greet + "Before I proceed, what is your age?")
                    session['state'] = 'AWAITING_AGE'
                elif session['sex'] is None: # Should not happen if age is asked first
                    bot_responses.append(user_name_greet + "And your biological sex? (Male/Female/Other/Prefer not to say)")
                    session['state'] = 'AWAITING_SEX'
            else: # All checks passed, proceed to prediction
                app.logger.info(f"Predicting for user {user_id} vector: {{k: v for k, v in session['symptoms_vector'].items() if v == 1}}")
                
                # Ensure all MODEL_SYMPTOM_KEYS are present in the vector for the model
                current_symptom_vector_for_model = {key: session['symptoms_vector'].get(key, 0) for key in MODEL_SYMPTOM_KEYS}
                input_df = pd.DataFrame([current_symptom_vector_for_model])
                input_df = input_df[MODEL_SYMPTOM_KEYS] # Ensure correct column order and all columns
                
                try:
                    pred_proba = model.predict_proba(input_df)[0]
                    pred_idx = np.argmax(pred_proba)
                    disease_raw = model.classes_[pred_idx]
                    confidence = pred_proba[pred_idx] * 100
                    session['predicted_disease_context'] = disease_raw # Store raw name for lookups
                    disease_clean = disease_raw.strip().title() # For display

                    bot_responses.append(user_name_greet + f"Based on the symptoms, my analysis suggests it might be **{disease_clean}** (Confidence: {confidence:.2f}%).")
                    
                    norm_disease_key = normalize_text(disease_raw) # Use raw for matching CSVs
                    description = "No detailed description available for this condition."
                    if not disease_desc_df.empty and norm_disease_key in disease_desc_df.index:
                        desc_val = disease_desc_df.loc[norm_disease_key, 'description']
                        if pd.notna(desc_val): description = desc_val
                    
                    precautions = []
                    if not disease_precaution_df.empty and norm_disease_key in disease_precaution_df.index:
                        prec_series = disease_precaution_df.loc[norm_disease_key]
                        precautions = [prec_series[f'precaution_{i}'] for i in range(1,5) if pd.notna(prec_series.get(f'precaution_{i}'))]

                    bot_responses.append(f"*{description}*")
                    if precautions: bot_responses.append("\n**Recommended Precautions:**\n- " + "\n- ".join(precautions))
                    bot_responses.append("\n**Important Disclaimer:** This is an AI-generated suggestion and not a substitute for professional medical diagnosis. Please consult a qualified doctor for accurate advice and treatment.")
                    bot_responses.append(f"\nWould you like me to look for doctors in Bangladesh who might treat **{disease_clean}**, {session['user_name']}? (yes/no)")
                    session['state'] = 'AWAITING_DOCTOR_CONFIRMATION'
                except Exception as e:
                    app.logger.error(f"Error during prediction or info retrieval for user {user_id}: {e}")
                    bot_responses.append(user_name_greet + "I encountered an issue while analyzing the symptoms. Please try again or consult a healthcare professional directly.")
                    session['state'] = 'AWAITING_INITIAL_SYMPTOMS' # Or some error state

        # elif current_state == 'AWAITING_DOCTOR_CONFIRMATION':
        #     disease_context_raw = session.get('predicted_disease_context') # Raw name for matching
        #     responded_to_doc_q = False
        #     doctors_for_map_list = [] 

        #     if "yes" in user_message and disease_context_raw:
        #         disease_display_name = disease_context_raw.strip().title() # For display
        #         norm_disease_key = normalize_text(disease_context_raw) # For map lookup
        #         target_spec_from_map = disease_to_specialization_map.get(norm_disease_key)
                
        #         default_no_docs_msg = f"I'm sorry, {session['user_name']}, I couldn't immediately find doctors specifically listed for '{disease_display_name}' or its related specialty ('{target_spec_from_map if target_spec_from_map else 'N/A'}') in my current database with location data."
        #         found_docs_messages = [default_no_docs_msg]
                
        #         if target_spec_from_map and not doctors_df.empty:
        #             # Ensure latitude and longitude columns exist and are used correctly
        #             lat_col = 'latitude'  # as cleaned
        #             lon_col = 'longitude' # as cleaned

        #             # Filter for specialty and valid lat/lon
        #             # relevant_docs_df = doctors_df[
        #             #     doctors_df['speciality'].str.contains(target_spec_from_map, case=False, na=False) &
        #             #     doctors_df[lat_col].notna() & doctors_df[lat_col] != 0 & # also exclude 0,0 if it's placeholder
        #             #     doctors_df[lon_col].notna() & doctors_df[lon_col] != 0
        #             # ]

        #             relevant_docs_df = doctors_df[
        #                 doctors_df['speciality'].str.contains(target_spec_from_map, case=False, na=False) &
        #                 doctors_df[lat_col].notna() & doctors_df[lat_col] != 0 & # <-- POTENTIAL ISSUE HERE
        #                 doctors_df[lon_col].notna() & doctors_df[lon_col] != 0   # <-- AND HERE
        #             ]
                    
        #             if not relevant_docs_df.empty:
        #                 found_docs_messages = [f"For a condition like **{disease_display_name}**, you would typically consult a **{target_spec_from_map}**. Here are a few doctors listed with that or a similar specialty in Bangladesh. I can also show them on a map."]
                        
        #                 name_col = 'name' 
        #                 spec_col = 'speciality'
        #                 hosp_col = 'hospital_name'
        #                 addr_col = 'address'
        #                 num_col = 'number'
        #                 img_col = 'image_source'

        #                 for i, (_, doc) in enumerate(relevant_docs_df.head(3).iterrows()):
        #                     doc_name = doc.get(name_col, 'N/A')
        #                     doc_spec = doc.get(spec_col, 'N/A')
        #                     doc_hosp = doc.get(hosp_col, 'N/A')
        #                     doc_addr = doc.get(addr_col, 'N/A')
        #                     doc_contact = doc.get(num_col, 'N/A')
        #                     doc_img = doc.get(img_col, 'https://via.placeholder.com/80?text=Doc')
        #                     doc_lat = doc.get(lat_col) 
        #                     doc_lon = doc.get(lon_col) 

        #                     doc_info_html = (f"<div class='doctor-card' style='border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px; overflow:hidden;'>"
        #                                 f"<img src='{doc_img}' alt='{doc_name}' style='width:60px; height:60px; border-radius:50%; float:left; margin-right:10px; object-fit:cover;'>"
        #                                 f"<div><strong>{i+1}. {doc_name}</strong><br>"
        #                                 f"<em>{doc_spec}</em><br>"
        #                                 f"🏥 {doc_hosp if pd.notna(doc_hosp) else 'N/A'}<br>"
        #                                 f"📍 <small>{doc_addr if pd.notna(doc_addr) else 'N/A'}</small><br>"
        #                                 f"{'📞 '+str(doc_contact) if pd.notna(doc_contact) and str(doc_contact).lower() != 'nan' else ''}"
        #                                 f"</div><div style='clear:both;'></div></div>")
        #                     found_docs_messages.append(doc_info_html)

        #                     if pd.notna(doc_lat) and pd.notna(doc_lon) and doc_lat != 0 and doc_lon != 0:
        #                         doctors_for_map_list.append({
        #                             "name": doc_name, "speciality": doc_spec, "hospital": doc_hosp,
        #                             "address": doc_addr, "contact": str(doc_contact) if pd.notna(doc_contact) else 'N/A',
        #                             "lat": doc_lat, "lng": doc_lon, "image": doc_img
        #                         })
                        
        #                 if doctors_for_map_list:
        #                      map_data_for_frontend = {"doctors": doctors_for_map_list} 
        #                      found_docs_messages.append("Check the map display for their locations (if available).")
        #                 else:
        #                     found_docs_messages.append("I found some doctors, but unfortunately, I don't have valid location data for them to display on a map.")
                        
        #                 found_docs_messages.append("It's always best to call ahead to confirm availability and suitability for your specific needs.")
        #             # else: # No relevant_docs_df, message remains the default "couldn't find"
        #             #    pass
        #         elif not target_spec_from_map: # No specialization mapped for the disease
        #             found_docs_messages = [f"I don't have a specific doctor specialization mapped for '{disease_display_name}'. You might want to consult a General Physician for a referral or search for specialists based on your symptoms."]
        #         # else: # doctors_df is empty, message remains default

        #         bot_responses.extend(found_docs_messages)
        #         responded_to_doc_q = True
        #     elif "no" in user_message:
        #         bot_responses.append(f"Alright, {session['user_name']}. Please take good care of yourself and consult a doctor if your symptoms persist or worsen.")
        #         responded_to_doc_q = True
        #     elif not disease_context_raw: # Should not happen if state is AWAITING_DOCTOR_CONFIRMATION
        #         app.logger.error(f"User {user_id} in AWAITING_DOCTOR_CONFIRMATION but no disease_context_raw.")
        #         bot_responses.append("I seem to have lost the context of our previous discussion. Could we start over with your symptoms?")
        #         session['state'] = 'AWAITING_INITIAL_SYMPTOMS'
        #         responded_to_doc_q = True # To trigger reset below
            
        #     if responded_to_doc_q:
        #         bot_responses.append("\nIs there anything else I can help you with today? (You can say 'reset' or tell me new symptoms)")
        #         # Semi-reset: Keep name, but go to initial symptoms state for a new query.
        #         # Or full reset: reset_session_for_new_query(user_id, session['user_name'])
        #         session['state'] = 'AWAITING_INITIAL_SYMPTOMS' 
        #         # Clear prediction specific context for next round
        #         session['predicted_disease_context'] = None
        #         session['symptoms_vector'] = {key: 0 for key in MODEL_SYMPTOM_KEYS} if MODEL_SYMPTOM_KEYS else {}
        #         session['symptoms_confirmed_count'] = 0
        #         session['symptoms_pending_clarification'] = []
        #         session['current_clarifying_symptom_key'] = None
        #         session['symptoms_targeted_questions_q'] = []
        #         session['current_targeted_symptom_key'] = None
        #         # Keep age and sex for now, could also be reset if desired.
        #     else:
        #         bot_responses.append(f"Sorry, I didn't catch that. Regarding the doctor search for {disease_context_raw.strip().title() if disease_context_raw else 'the condition'}, please answer 'yes' or 'no'.")
    

    # if not bot_responses: # Fallback if no state handled the message
    #     greeting = f"{session.get('user_name', 'There')}, " if session.get('user_name') else ""
    #     bot_responses.append(f"I'm sorry, {greeting}I'm not sure how to respond to that. You can tell me your symptoms, ask for 'help', or type 'reset' to start over.")
    # ... (previous states in chat_api) ...

        elif current_state == 'AWAITING_DOCTOR_CONFIRMATION':
            app.logger.info(f"STATE: AWAITING_DOCTOR_CONFIRMATION. User message: '{user_message}'")
            disease_context_raw = session.get('predicted_disease_context')
            app.logger.info(f"Disease context from session: '{disease_context_raw}'")

            responded_to_doc_q = False
            doctors_for_map_list = [] 

            # More robust check for affirmative response
            is_affirmative = user_message == "yes" or "yeah" in user_message or "sure" in user_message or "ok" in user_message

            if is_affirmative and disease_context_raw:
                app.logger.info("User confirmed YES for doctor search.")
                try: # Add a try-except block for the doctor search logic
                    disease_display_name = disease_context_raw.strip().title()
                    norm_disease_key = normalize_text(disease_context_raw)
                    app.logger.info(f"DOCTOR SEARCH: Raw disease: '{disease_context_raw}', Normalized key: '{norm_disease_key}'")
                    
                    target_spec_from_map = disease_to_specialization_map.get(norm_disease_key)
                    app.logger.info(f"DOCTOR SEARCH: Target specialization from map: '{target_spec_from_map}'")
                    
                    default_no_docs_msg = f"I'm sorry, {session.get('user_name', 'there')}, I couldn't immediately find doctors specifically listed for '{disease_display_name}' or its related specialty ('{target_spec_from_map if target_spec_from_map else 'N/A'}') in my current database with location data."
                    found_docs_messages = [default_no_docs_msg] # Initialize with default
                    
                    if target_spec_from_map and not doctors_df.empty:
                        lat_col = 'latitude'
                        lon_col = 'longitude'

                        app.logger.info(f"DOCTOR SEARCH: Filtering doctors_df for speciality containing '{target_spec_from_map}'")
                        
                        cond1 = doctors_df['speciality'].str.contains(target_spec_from_map, case=False, na=False)
                        cond2 = doctors_df[lat_col].notna()
                        cond3 = (doctors_df[lat_col] != 0)
                        cond4 = doctors_df[lon_col].notna()
                        cond5 = (doctors_df[lon_col] != 0)
                        combined_conditions = cond1 & cond2 & cond3 & cond4 & cond5
                        relevant_docs_df = doctors_df[combined_conditions]

                        app.logger.info(f"DOCTOR SEARCH: Found {len(relevant_docs_df)} relevant doctors after all filters.")
                        
                        if not relevant_docs_df.empty:
                            app.logger.info(f"DOCTOR SEARCH: Head of relevant_docs_df: \n{relevant_docs_df.head().to_string()}")
                            found_docs_messages = [f"For a condition like **{disease_display_name}**, you would typically consult a **{target_spec_from_map}**. Here are a few doctors listed with that or a similar specialty in Bangladesh. I can also show them on a map."]
                            
                            name_col, spec_col, hosp_col, addr_col, num_col, img_col = 'name', 'speciality', 'hospital_name', 'address', 'number', 'image_source'

                            for i, (_, doc) in enumerate(relevant_docs_df.head(3).iterrows()):
                                doc_name = doc.get(name_col, 'N/A')
                                doc_spec = doc.get(spec_col, 'N/A')
                                doc_hosp = doc.get(hosp_col, 'N/A')
                                doc_addr = doc.get(addr_col, 'N/A')
                                doc_contact = doc.get(num_col, 'N/A')
                                doc_img = doc.get(img_col, 'https://via.placeholder.com/80?text=Doc')
                                doc_lat_val = doc.get(lat_col) 
                                doc_lon_val = doc.get(lon_col) 

                                doc_info_html = (f"<div class='doctor-card' style='border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:5px; overflow:hidden;'>"
                                            f"<img src='{doc_img}' alt='{doc_name}' style='width:60px; height:60px; border-radius:50%; float:left; margin-right:10px; object-fit:cover;'>"
                                            f"<div><strong>{i+1}. {doc_name}</strong><br>"
                                            f"<em>{doc_spec}</em><br>"
                                            f"🏥 {doc_hosp if pd.notna(doc_hosp) else 'N/A'}<br>"
                                            f"📍 <small>{doc_addr if pd.notna(doc_addr) else 'N/A'}</small><br>"
                                            f"{'📞 '+str(doc_contact) if pd.notna(doc_contact) and str(doc_contact).strip().lower() not in ['nan', ''] else ''}"
                                            f"</div><div style='clear:both;'></div></div>")
                                found_docs_messages.append(doc_info_html)

                                if pd.notna(doc_lat_val) and pd.notna(doc_lon_val) and doc_lat_val != 0 and doc_lon_val != 0:
                                    doctors_for_map_list.append({
                                        "name": doc_name, "speciality": doc_spec, "hospital": doc_hosp,
                                        "address": doc_addr, 
                                        "contact": str(doc_contact) if pd.notna(doc_contact) and str(doc_contact).strip().lower() not in ['nan', ''] else 'N/A',
                                        "lat": doc_lat_val, "lng": doc_lon_val, "image": doc_img
                                    })
                            
                            if doctors_for_map_list:
                                 map_data_for_frontend = {"doctors": doctors_for_map_list} 
                                 found_docs_messages.append("Check the map display for their locations (if available).")
                            else:
                                found_docs_messages.append("I found some doctors based on specialty, but unfortunately, none had valid location data to display on a map.")
                            found_docs_messages.append("It's always best to call ahead to confirm availability and suitability for your specific needs.")
                        # else: relevant_docs_df is empty, default_no_docs_msg (already in found_docs_messages) will be used.
                    
                    elif doctors_df.empty:
                         app.logger.warning("DOCTOR SEARCH: doctors_df is empty!")
                         # default_no_docs_msg will be used
                    elif not target_spec_from_map: # target_spec_from_map was None
                         app.logger.warning("DOCTOR SEARCH: target_spec_from_map is None, no speciality to search for.")
                         # Overwrite found_docs_messages because default_no_docs_msg would be confusing
                         found_docs_messages = [f"I don't have a specific doctor specialization mapped for '{disease_display_name}'. You might want to consult a General Physician for a referral or search for specialists based on your symptoms."]

                    bot_responses.extend(found_docs_messages)
                    responded_to_doc_q = True

                except Exception as e_doc_search:
                    app.logger.error(f"ERROR during doctor search logic: {e_doc_search}", exc_info=True)
                    bot_responses.append(f"I'm sorry, {session.get('user_name', 'there')}, I encountered an issue while searching for doctors. Please try again later or consult a directory manually.")
                    responded_to_doc_q = True # Still counts as a response to the yes/no question
            
            elif user_message == "no" or "don't" in user_message: # More robust check for negative response
                app.logger.info("User declined doctor search.")
                bot_responses.append(f"Alright, {session.get('user_name', 'there')}. Please take good care of yourself and consult a doctor if your symptoms persist or worsen.")
                responded_to_doc_q = True
            
            elif not disease_context_raw and (is_affirmative or user_message == "no"):
                app.logger.error(f"User {user_id} in AWAITING_DOCTOR_CONFIRMATION but no disease_context_raw. User said: '{user_message}'")
                bot_responses.append("I seem to have lost the context of our previous discussion (the predicted condition). Could we start over with your symptoms?")
                session['state'] = 'AWAITING_INITIAL_SYMPTOMS' # Go to a safe state
                # To prevent immediately falling into the final "I'm not sure" fallback, ensure responded_to_doc_q is true
                # or that this path leads to a session reset that will provide a new initial prompt.
                # For now, let the session reset handle the next prompt.
                responded_to_doc_q = True # This will trigger the session reset section below.
            
            # If responded_to_doc_q is True, it means we handled the yes/no for doctor search
            if responded_to_doc_q:
                app.logger.info(f"Doctor search question handled. responded_to_doc_q: {responded_to_doc_q}")
                bot_responses.append("\nIs there anything else I can help you with today? (You can say 'reset' or tell me new symptoms)")
                # Reset session for a new query, keeping user name
                existing_name = session.get('user_name')
                session = reset_session_for_new_query(user_id, existing_name) # This will change session['state']
                # current_state = session['state'] # Update current_state if needed for logic *after* this block
                                                # But since this is the end of this turn, it's less critical here.
            else:
                # This 'else' means user_message was not "yes", "no", or similar, AND responded_to_doc_q is still False.
                # This is where your "I'm not sure how to respond" might be coming from if the initial "yes" isn't caught.
                app.logger.warning(f"User response '{user_message}' in AWAITING_DOCTOR_CONFIRMATION was not a clear yes/no.")
                bot_responses.append(f"Sorry, I didn't quite catch that. Regarding the doctor search for {disease_context_raw.strip().title() if disease_context_raw else 'the condition'}, please answer 'yes' or 'no'.")
                # No session state change here, keep in AWAITING_DOCTOR_CONFIRMATION to re-ask.


    if not bot_responses: # Fallback if no state handled the message and bot_responses is still empty
        app.logger.warning(f"FALLBACK: No bot responses generated for state '{current_state}' and message '{user_message}'.")
        greeting = f"{session.get('user_name', 'There')}, " if session.get('user_name') else ""
        bot_responses.append(f"I'm sorry, {greeting}I'm not sure how to respond to that. You can tell me your symptoms, ask for 'help', or type 'reset' to start over.")

   

    app.logger.info(f"Flask BOT for {user_id} (Name: {session.get('user_name')}, EndState: {session['state']}): Response parts: {len(bot_responses)}")
    
    json_response = {'bot_response_parts': bot_responses, 'user_id': user_id} # user_id is returned for context if needed
    if map_data_for_frontend:
        json_response['map_data'] = map_data_for_frontend
        app.logger.info(f"Flask Sending map data for {user_id}: {map_data_for_frontend['doctors'][0] if map_data_for_frontend['doctors'] else 'empty'}")


    return jsonify(json_response)


if __name__ == '__main__':
    if not model or not MODEL_SYMPTOM_KEYS or not NATURAL_SYMPTOM_PHRASES_FOR_FUZZY:
        print("="*80)
        print("ERROR: CRITICAL DATA NOT LOADED (MODEL, SYMPTOM KEYS, or NATURAL PHRASES).")
        print("MODEL_LOADED:", bool(model))
        print("MODEL_SYMPTOM_KEYS_LOADED:", bool(MODEL_SYMPTOM_KEYS), "Count:", len(MODEL_SYMPTOM_KEYS) if MODEL_SYMPTOM_KEYS else 0)
        print("NATURAL_SYMPTOM_PHRASES_FOR_FUZZY_LOADED:", bool(NATURAL_SYMPTOM_PHRASES_FOR_FUZZY), "Count:", len(NATURAL_SYMPTOM_PHRASES_FOR_FUZZY) if NATURAL_SYMPTOM_PHRASES_FOR_FUZZY else 0)
        print("Please check `initialize_app_data()` and file paths.")
        print("Ensure 'symptom_columns.pkl' contains the expected list of symptom strings for the model.")
        print("Ensure SYMPTOM_MAP is correctly populated and validated against symptom_columns.pkl.")
        print("Flask app will start but /chat_api will likely fail or behave unexpectedly.")
        print("="*80)
    else:
        app.logger.info("Flask app starting... Model and initial data loaded.")
    
    # Make sure to run Flask on a specific port, e.g., 5002 as you had.
    # The use_reloader=False might be helpful if initialize_app_data is slow or has side effects
    # that don't play well with Werkzeug's reloader running it twice. For development, True is fine.
    app.run(debug=True, port=5002, use_reloader=True)
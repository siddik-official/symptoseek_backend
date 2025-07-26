import pandas as pd
import numpy as np
import joblib
from flask import Flask, request, jsonify
from math import radians, sin, cos, sqrt, atan2
import os
import spacy
from spacy.matcher import PhraseMatcher
from flask_cors import CORS
import requests
import warnings
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import uuid

# Comment out LLM import to avoid errors
# from llm_client import query_llm

warnings.filterwarnings("ignore")
load_dotenv()

nlp = spacy.load("en_core_web_sm")

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)
app.config['GOOGLE_API_KEY'] = os.getenv('GOOGLE_API_KEY', 'YOUR_GOOGLE_KEY')

user_sessions = {}
chat_history = {}  # Store chat history: {user_id: {chat_id: {messages: [], created_at: datetime, title: str}}}

def get_path(relative_path):
    return os.path.join(os.path.dirname(__file__), relative_path)

def save_chat_history():
    """Save chat history to file"""
    try:
        history_file = get_path('data/chat_history.json')
        os.makedirs(os.path.dirname(history_file), exist_ok=True)
        
        # Convert datetime objects to ISO format for JSON serialization
        serializable_history = {}
        for user_id, user_chats in chat_history.items():
            serializable_history[user_id] = {}
            for chat_id, chat_data in user_chats.items():
                serializable_history[user_id][chat_id] = {
                    'messages': chat_data['messages'],
                    'created_at': chat_data['created_at'].isoformat(),
                    'title': chat_data['title'],
                    'last_updated': chat_data.get('last_updated', chat_data['created_at']).isoformat()
                }
        
        with open(history_file, 'w') as f:
            json.dump(serializable_history, f, indent=2)
    except Exception as e:
        print(f"Error saving chat history: {e}")

def load_chat_history():
    """Load chat history from file"""
    try:
        history_file = get_path('data/chat_history.json')
        if os.path.exists(history_file):
            with open(history_file, 'r') as f:
                serializable_history = json.load(f)
            
            # Convert ISO format back to datetime objects
            for user_id, user_chats in serializable_history.items():
                chat_history[user_id] = {}
                for chat_id, chat_data in user_chats.items():
                    chat_history[user_id][chat_id] = {
                        'messages': chat_data['messages'],
                        'created_at': datetime.fromisoformat(chat_data['created_at']),
                        'title': chat_data['title'],
                        'last_updated': datetime.fromisoformat(chat_data.get('last_updated', chat_data['created_at']))
                    }
            print("✅ Chat history loaded successfully")
    except Exception as e:
        print(f"❌ Error loading chat history: {e}")

def cleanup_old_chats():
    """Remove chats older than 3 days"""
    try:
        cutoff_date = datetime.now() - timedelta(days=3)
        for user_id in list(chat_history.keys()):
            user_chats = chat_history[user_id]
            for chat_id in list(user_chats.keys()):
                if user_chats[chat_id]['created_at'] < cutoff_date:
                    del user_chats[chat_id]
            
            # Remove empty user entries
            if not user_chats:
                del chat_history[user_id]
        
        save_chat_history()
        print("✅ Old chats cleaned up successfully")
    except Exception as e:
        print(f"❌ Error cleaning up old chats: {e}")

def generate_chat_title(messages):
    """Generate a title for the chat based on first user message"""
    for msg in messages:
        if msg.get('isUser', False) and msg.get('text'):
            text = msg['text']
            # Extract first meaningful part and limit length
            if len(text) > 40:
                return text[:37] + "..."
            return text
    return "New Chat"

def add_message_to_history(user_id, chat_id, message):
    """Add a message to chat history"""
    try:
        if user_id not in chat_history:
            chat_history[user_id] = {}
        
        if chat_id not in chat_history[user_id]:
            chat_history[user_id][chat_id] = {
                'messages': [],
                'created_at': datetime.now(),
                'title': 'New Chat',
                'last_updated': datetime.now()
            }
        
        chat_history[user_id][chat_id]['messages'].append(message)
        chat_history[user_id][chat_id]['last_updated'] = datetime.now()
        
        # Update title if it's still "New Chat" and we have messages
        if (chat_history[user_id][chat_id]['title'] == 'New Chat' and 
            len(chat_history[user_id][chat_id]['messages']) >= 1):
            chat_history[user_id][chat_id]['title'] = generate_chat_title(chat_history[user_id][chat_id]['messages'])
        
        save_chat_history()
    except Exception as e:
        print(f"Error adding message to history: {e}")

# Load chat history on startup
load_chat_history()
cleanup_old_chats()

try:
    model = joblib.load(get_path('models/best_rf_model.joblib'))
    label_encoder = joblib.load(get_path('models/label_encoder.joblib'))

    training_df = pd.read_csv(get_path('data/Training.csv'))
    doctors_df = pd.read_csv(get_path('data/doctors_bd_detailed.csv'))
    description_df = pd.read_csv(get_path('data/disease_description.csv'))
    precaution_df = pd.read_csv(get_path('data/disease_precaution.csv'))

    for df in [training_df, doctors_df, description_df, precaution_df]:
        df.columns = df.columns.str.strip()

    SYMPTOMS = training_df.columns[:-1].tolist()

    symptom_matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
    patterns = [nlp.make_doc(s.replace('_', ' ')) for s in SYMPTOMS]
    symptom_matcher.add("SYMPTOMS", patterns)

    disease_to_specialty = {
        'Fungal infection': 'Dermatologist', 'Allergy': 'Dermatologist', 'Acne': 'Dermatologist', 'Psoriasis': 'Dermatologist', 'Impetigo': 'Dermatologist', 'Chicken pox': 'Dermatologist',
        'GERD': 'Gastroenterologist', 'Peptic ulcer disease': 'Gastroenterologist', 'Gastroenteritis': 'Gastroenterologist', 'Dimorphic hemmorhoids(piles)': 'General Surgeon',
        'Jaundice': 'Hepatologist', 'Hepatitis A': 'Hepatologist', 'Hepatitis B': 'Hepatologist', 'Hepatitis C': 'Hepatologist', 'Hepatitis D': 'Hepatologist', 'Hepatitis E': 'Hepatologist', 'Chronic cholestasis': 'Hepatologist', 'Alcoholic hepatitis': 'Hepatologist',
        'Diabetes ': 'Endocrinologist', 'Hypothyroidism': 'Endocrinologist', 'Hyperthyroidism': 'Endocrinologist', 'Hypoglycemia': 'Endocrinologist',
        'Hypertension ': 'Cardiologist', 'Heart attack': 'Cardiologist', 'Varicose veins': 'Vascular Surgeon',
        'Bronchial Asthma': 'Pulmonologist', 'Tuberculosis': 'Pulmonologist', 'Pneumonia': 'Pulmonologist',
        'Common Cold': 'General Medicine', 'Covid': 'General Medicine', 'Malaria': 'General Medicine', 'Dengue': 'General Medicine', 'Typhoid': 'General Medicine', 'AIDS': 'General Medicine', 'Drug Reaction': 'General Medicine',
        'Migraine': 'Neurologist', 'Paralysis (brain hemorrhage)': 'Neurologist',
        'Cervical spondylosis': 'Orthopedic Surgeon', 'Osteoarthritis': 'Orthopedic Surgeon', 'Arthritis': 'Rheumatologist',
        '(vertigo) Paroymsal Positional Vertigo': 'ENT Specialist',
        'Urinary tract infection': 'Urologist', 'kidney stones': 'Urologist', 'prostate cancer': 'Urologist'
    }

    canonical_specialty_keywords = {
        "Dermatologist": ["Dermatologist", "Skin"],
    "Gastroenterologist": ["Gastro", "Hepato", "Liver"],
    "Pulmonologist": ["Chest", "Pulmonology", "COPD", "Asthma"],
    "Cardiologist": ["Cardio", "Heart"],
    "Neurologist": ["Neuro", "Brain", "Nerve"],
    "Orthopedic Surgeon": ["Orthopedic", "Bone", "Joint", "Trauma"],
    "General Medicine": ["Medicine Specialist", "Internal Medicine", "General Physician"],
    "ENT Specialist": ["ENT", "Otolaryngologist"],
    "Urologist": ["Urology", "Kidney", "Prostate"],
    "Endocrinologist": ["Endocrine", "Diabetes", "Thyroid"],
    "Hepatologist": ["Hepato", "Liver"],
    "Rheumatologist": ["Rheumatology", "Arthritis"],
    "General Surgeon": ["Surgeon"],
    "Vascular Surgeon": ["Vascular", "Vein"],
    "Hematologist": ["Blood", "Hematology"],
    "Oncologist": ["Cancer", "Oncology"],
    "Psychiatrist": ["Psychiatry", "Mental Health"],
    "Gynecologist": ["Gynecology", "Obstetrics"],
    "Pediatrician": ["Pediatrics", "Children"],
    "Ophthalmologist": ["Eye", "Ophthalmology"],
    "General Practitioner": ["GP", "Family Medicine", "Primary Care"],
    "General Surgeon": ["Surgery", "Surgeon", "General Surgery"],
    "Vascular Surgeon": ["Vascular", "Vein", "Artery"],
    "Hematologist": ["Blood", "Hematology"],
    "Oncologist": ["Cancer", "Oncology"],
    "Psychiatrist": ["Psychiatry", "Mental Health"],
    "Gynecologist": ["Gynecology", "Obstetrics"],
    "Pediatrician": ["Pediatrics", "Children"],
    "Ophthalmologist": ["Eye", "Ophthalmology"],
    }

    print("✅ All models and data loaded successfully.")
except Exception as e:
    print(f"❌ Error: {e}")
    model = None

def keyword_match_specialty(canonical_label, df_specialty_series):
    keywords = canonical_specialty_keywords.get(canonical_label, [])
    matched_indices = []
    for i, val in enumerate(df_specialty_series.fillna('')):
        if any(keyword.lower() in val.lower() for keyword in keywords):
            matched_indices.append(i)
    return matched_indices

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    try:
        lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return R * c
    except:
        return float('inf')

def find_doctors_from_local_dataset(specialty, user_lat, user_lon):
    if 'speciality' not in doctors_df.columns:
        return []

    doctors_df_clean = doctors_df.dropna(subset=['latitude', 'longitude', 'speciality']).copy()
    doctors_df_clean['latitude'] = pd.to_numeric(doctors_df_clean['latitude'], errors='coerce')
    doctors_df_clean['longitude'] = pd.to_numeric(doctors_df_clean['longitude'], errors='coerce')
    doctors_df_clean = doctors_df_clean[(doctors_df_clean['latitude'] != 0) & (doctors_df_clean['longitude'] != 0)]

    match_indices = keyword_match_specialty(specialty, doctors_df_clean['speciality'])
    if not match_indices:
        return []

    matched_doctors = doctors_df_clean.iloc[match_indices].copy()
    matched_doctors['distance'] = matched_doctors.apply(
        lambda row: haversine_distance(user_lat, user_lon, row['latitude'], row['longitude']), axis=1
    )
    recommended = matched_doctors.sort_values(by='distance').head(3).to_dict('records')

    for doc in recommended:
        doc['map_url'] = f"http://www.openstreetmap.org/?mlat={doc['latitude']}&mlon={doc['longitude']}&zoom=16"
    return recommended

def extract_symptoms_nlp(text):
    """Enhanced symptom extraction with better natural language understanding"""
    doc = nlp(text.lower())
    
    # Direct symptom matching
    matches = symptom_matcher(doc)
    direct_symptoms = [str(doc[start:end]).replace(' ', '_') for _, start, end in matches]
    
    # Enhanced pattern matching for common symptom descriptions
    symptom_patterns = {
        'fever': ['temperature', 'hot', 'burning up', 'feverish', 'high temp'],
        'headache': ['head pain', 'head hurts', 'migraine', 'head ache'],
        'nausea': ['feel sick', 'queasy', 'want to vomit', 'sick to stomach'],
        'fatigue': ['tired', 'exhausted', 'weak', 'no energy', 'worn out'],
        'cough': ['coughing', 'hacking', 'throat clearing'],
        'shortness_of_breath': ['hard to breathe', 'can\'t breathe', 'breathing difficulty'],
        'chest_pain': ['chest hurts', 'chest ache', 'pain in chest'],
        'abdominal_pain': ['stomach pain', 'belly hurts', 'stomach ache', 'tummy pain'],
        'joint_pain': ['joints hurt', 'aching joints', 'joint ache'],
        'muscle_pain': ['muscle ache', 'sore muscles', 'muscle soreness'],
        'dizziness': ['dizzy', 'lightheaded', 'feel faint', 'spinning'],
        'vomiting': ['throwing up', 'puking', 'being sick']
    }
    
    # Check for pattern matches
    pattern_symptoms = []
    text_lower = text.lower()
    for symptom, patterns in symptom_patterns.items():
        if any(pattern in text_lower for pattern in patterns):
            if symptom in SYMPTOMS:
                pattern_symptoms.append(symptom)
    
    # Combine and deduplicate
    all_symptoms = list(set(direct_symptoms + pattern_symptoms))
    return all_symptoms

def fetch_disease_info_online(disease_name):
    """Fetch disease information from online sources when local data is insufficient"""
    try:
        # Enhanced disease information database
        disease_database = {
            'common cold': {
                'description': 'The common cold is a viral infection of your nose and throat (upper respiratory tract). It\'s usually harmless, although it might not feel that way. Common symptoms include runny or stuffy nose, sneezing, cough, and mild fatigue.',
                'precautions': [
                    'Get plenty of rest and stay hydrated',
                    'Use saline nasal drops to relieve congestion',
                    'Gargle with warm salt water for sore throat',
                    'Wash hands frequently to prevent spread'
                ]
            },
            'diabetes': {
                'description': 'Diabetes is a group of metabolic disorders characterized by high blood sugar levels. It occurs when your body doesn\'t make enough insulin or can\'t effectively use the insulin it makes.',
                'precautions': [
                    'Monitor blood glucose levels regularly',
                    'Follow a balanced diet with controlled carbohydrate intake',
                    'Exercise regularly as recommended by your doctor',
                    'Take medications as prescribed and attend regular checkups'
                ]
            },
            'hypertension': {
                'description': 'Hypertension (high blood pressure) is a condition where the force of blood against artery walls is consistently too high. It can lead to serious health complications if left untreated.',
                'precautions': [
                    'Reduce sodium intake and maintain a healthy diet',
                    'Exercise regularly and maintain a healthy weight',
                    'Limit alcohol consumption and quit smoking',
                    'Take prescribed medications consistently and monitor blood pressure'
                ]
            },
            'migraine': {
                'description': 'Migraine is a neurological condition that can cause severe headaches, often accompanied by nausea, vomiting, and sensitivity to light and sound. Episodes can last hours to days.',
                'precautions': [
                    'Identify and avoid known triggers',
                    'Maintain regular sleep schedule and manage stress',
                    'Stay hydrated and eat regular meals',
                    'Use prescribed medications as directed by your doctor'
                ]
            }
        }
        
        # Normalize disease name for lookup
        disease_key = disease_name.lower().strip()
        
        # Check if we have specific information for this disease
        if disease_key in disease_database:
            return disease_database[disease_key]
        
        # Enhanced generic information based on disease type
        if any(term in disease_key for term in ['infection', 'bacterial', 'viral']):
            return {
                'description': f'{disease_name} is an infection that affects the body. Infections can be caused by bacteria, viruses, fungi, or parasites. Proper medical treatment is essential for recovery.',
                'precautions': [
                    'Complete the full course of prescribed antibiotics or antiviral medications',
                    'Get adequate rest and maintain good hygiene',
                    'Stay hydrated and eat nutritious foods',
                    'Isolate if contagious and follow medical advice'
                ]
            }
        
        if any(term in disease_key for term in ['heart', 'cardiac', 'cardiovascular']):
            return {
                'description': f'{disease_name} is a cardiovascular condition affecting the heart or blood vessels. Heart conditions require immediate medical attention and ongoing care.',
                'precautions': [
                    'Follow a heart-healthy diet low in saturated fats',
                    'Exercise as recommended by your cardiologist',
                    'Take prescribed medications consistently',
                    'Monitor symptoms and seek immediate help for chest pain'
                ]
            }
        
        # Default comprehensive information
        return {
            'description': f'{disease_name} is a medical condition that requires proper medical evaluation and treatment. Symptoms, causes, and treatments can vary significantly between individuals. A healthcare professional can provide personalized guidance based on your specific situation.',
            'precautions': [
                'Consult a qualified healthcare professional for accurate diagnosis',
                'Follow all prescribed medications and treatment plans',
                'Maintain a healthy lifestyle with proper diet and exercise',
                'Monitor your symptoms and report any changes to your doctor',
                'Attend all scheduled follow-up appointments'
            ]
        }
        
    except Exception as e:
        print(f"Error fetching disease info: {e}")
        return {
            'description': f"Medical information about {disease_name} requires professional consultation. Please seek advice from a qualified healthcare provider.",
            'precautions': [
                "Seek immediate medical attention from a healthcare professional",
                "Follow professional medical advice and prescribed treatments"
            ]
        }

def get_related_symptoms(symptom, confirmed_symptoms):
    related = set()
    rows = training_df[training_df[symptom] == 1]
    for _, row in rows.iterrows():
        related.update(row[row == 1].index.tolist())
    related.discard(symptom)
    return list(related - set(confirmed_symptoms))[:3]

def generate_prediction_response(symptoms_list, user_lat, user_lon):
    """Enhanced prediction with better accuracy and human-like responses"""
    input_vector = np.zeros(len(SYMPTOMS))
    for symptom in symptoms_list:
        if symptom in SYMPTOMS:
            input_vector[SYMPTOMS.index(symptom)] = 1

    # Get prediction probabilities for better accuracy
    prediction_proba = model.predict_proba([input_vector])[0]
    top_predictions = np.argsort(prediction_proba)[-3:][::-1]  # Top 3 predictions
    
    primary_prediction = label_encoder.inverse_transform([top_predictions[0]])[0].strip()
    confidence = prediction_proba[top_predictions[0]]
    
    # Enhanced confidence-based messaging
    if confidence > 0.8:
        confidence_msg = "high confidence"
        intro_msg = f"🎯 **Primary Analysis** (High Confidence)\nBased on your symptoms, you most likely have **{primary_prediction}**."
    elif confidence > 0.6:
        confidence_msg = "moderate confidence"
        intro_msg = f"🔍 **Primary Analysis** (Moderate Confidence)\nBased on your symptoms, you might have **{primary_prediction}**."
    else:
        confidence_msg = "low confidence"
        intro_msg = f"🤔 **Preliminary Analysis** (Multiple Possibilities)\nYour symptoms suggest **{primary_prediction}** as a possibility, but other conditions should also be considered."

    # Try to get description from local dataset first
    desc_row = description_df[description_df['Disease'].str.strip().str.lower() == primary_prediction.lower()]
    description = ""
    if not desc_row.empty:
        description = desc_row['Symptom_Description'].iloc[0]
    
    # If no local description or description is insufficient, fetch online
    if not description or len(description.strip()) < 20:
        print(f"Fetching comprehensive info for: {primary_prediction}")
        online_info = fetch_disease_info_online(primary_prediction)
        description = online_info['description']

    # Try to get precautions from local dataset first
    prec_row = precaution_df[precaution_df['Disease'].str.strip().str.lower() == primary_prediction.lower()]
    precautions = []
    if not prec_row.empty:
        precautions = [prec_row.iloc[0][f'Symptom_precaution_{i}'] for i in range(4) if pd.notna(prec_row.iloc[0][f'Symptom_precaution_{i}'])]
    
    # If no local precautions or insufficient precautions, fetch online
    if not precautions or len(precautions) < 2:
        print(f"Fetching comprehensive precautions for: {primary_prediction}")
        online_info = fetch_disease_info_online(primary_prediction)
        precautions = online_info['precautions']

    specialty_to_find = disease_to_specialty.get(primary_prediction, 'General Medicine')
    local_doctors = find_doctors_from_local_dataset(specialty_to_find, user_lat, user_lon) if user_lat and user_lon else []

    # Build comprehensive response with better human-like communication
    response_parts = [
        {"type": "text", "content": intro_msg}
    ]
    
    # Add alternative possibilities if confidence is low
    if confidence < 0.6 and len(top_predictions) > 1:
        alternatives = []
        for i in range(1, min(3, len(top_predictions))):
            alt_disease = label_encoder.inverse_transform([top_predictions[i]])[0].strip()
            alt_confidence = prediction_proba[top_predictions[i]]
            if alt_confidence > 0.2:  # Only show meaningful alternatives
                alternatives.append(f"• **{alt_disease}** ({alt_confidence:.1%} likelihood)")
        
        if alternatives:
            alt_text = "🔄 **Other Possibilities to Consider:**\n" + "\n".join(alternatives)
            response_parts.append({"type": "text", "content": alt_text})
    
    # Enhanced description with more context
    desc_text = f"� **Understanding {primary_prediction}:**\n{description}"
    if confidence > 0.7:
        desc_text += f"\n\n💡 **Why this diagnosis?** Your combination of symptoms ({', '.join(symptoms_list)}) strongly matches the typical presentation of this condition."
    response_parts.append({"type": "text", "content": desc_text})
    
    if precautions:
        precautions_text = "🛡️ **Immediate Care Recommendations:**\n" + "\n".join([f"• {prec}" for prec in precautions])
        response_parts.append({"type": "text", "content": precautions_text})
    
    # More personalized next steps
    next_steps = f"""📋 **Your Next Steps:**
• **Urgency Level:** {'High - Seek immediate care' if confidence > 0.8 and any(urgent in primary_prediction.lower() for urgent in ['heart', 'stroke', 'emergency']) else 'Moderate - Schedule appointment soon' if confidence > 0.6 else 'Low - Monitor and consult if symptoms persist'}
• **Specialist to see:** {specialty_to_find}
• **What to tell your doctor:** Mention your symptoms: {', '.join(symptoms_list)}
• **Preparation:** Note symptom duration, severity (1-10 scale), and any triggers"""
    
    response_parts.append({"type": "text", "content": next_steps})
    
    # Enhanced disclaimer with more empathy
    disclaimer = """⚠️ **Important Medical Notice:**
I'm an AI assistant designed to help you understand your symptoms better, but I'm not a replacement for professional medical care. Think of me as a knowledgeable friend who can point you in the right direction.

🏥 **Please remember:**
• This analysis is based on patterns in medical data, not a clinical examination
• Every person is unique - your actual condition may differ
• Some serious conditions can have mild early symptoms
• When in doubt, it's always better to consult a healthcare professional
• For emergencies, call your local emergency number immediately

Your health is precious - don't hesitate to seek professional care! 💙"""
    
    response_parts.append({"type": "text", "content": disclaimer})

    if local_doctors:
        doctor_intro = f"🏥 **Recommended {specialty_to_find}s Near You:**\nI've found some qualified specialists in your area. You can view their locations on the map below and choose the most convenient option for you."
        response_parts.append({"type": "text", "content": doctor_intro})
        response_parts.append({"type": "doctors", "content": local_doctors})
        
        # Add map data for frontend
        map_data = {
            "center": {"lat": float(user_lat), "lng": float(user_lon)},
            "doctors": [
                {
                    "id": i,
                    "name": doc.get('name', 'Unknown Doctor'),
                    "specialty": doc.get('speciality', specialty_to_find),
                    "distance": f"{doc.get('distance', 0):.1f} km",
                    "lat": float(doc.get('latitude', 0)),
                    "lng": float(doc.get('longitude', 0)),
                    "address": doc.get('address', 'Address not available'),
                    "phone": doc.get('phone', 'Phone not available'),
                    "map_url": doc.get('map_url', '')
                }
                for i, doc in enumerate(local_doctors)
            ]
        }
        response_parts.append({"type": "map", "content": map_data})
    else:
        location_help = f"""�️ **Finding a {specialty_to_find}:**
Don't worry! Here are some ways to find a qualified specialist:
• Search online directories like Zocdoc, Healthgrades, or your insurance provider's website
• Ask your primary care doctor for a referral
• Contact your local hospital for specialist recommendations
• Check with your insurance for covered providers in your area

Would you like me to help you with anything else regarding your symptoms?"""
        response_parts.append({"type": "text", "content": location_help})

    return {"bot_response_parts": response_parts}

@app.route('/api/chat/history', methods=['GET'])
def get_chat_history():
    """Get chat history for a user"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        if user_id not in chat_history:
            return jsonify({"chats": []})
        
        user_chats = chat_history[user_id]
        chat_list = []
        
        for chat_id, chat_data in user_chats.items():
            last_message = ""
            if chat_data['messages']:
                # Get the last non-user message or last message
                for msg in reversed(chat_data['messages']):
                    if not msg.get('isUser', False):
                        last_message = msg.get('text', '')[:100] + "..." if len(msg.get('text', '')) > 100 else msg.get('text', '')
                        break
                if not last_message and chat_data['messages']:
                    last_message = chat_data['messages'][-1].get('text', '')[:100] + "..." if len(chat_data['messages'][-1].get('text', '')) > 100 else chat_data['messages'][-1].get('text', '')
            
            chat_list.append({
                "id": chat_id,
                "title": chat_data['title'],
                "lastMessage": last_message,
                "timestamp": chat_data['last_updated'].isoformat(),
                "messageCount": len(chat_data['messages'])
            })
        
        # Sort by last updated (most recent first)
        chat_list.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({"chats": chat_list})
    
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return jsonify({"error": "Failed to retrieve chat history"}), 500

@app.route('/api/chat/history/<chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    """Get messages for a specific chat"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        if (user_id not in chat_history or 
            chat_id not in chat_history[user_id]):
            return jsonify({"error": "Chat not found"}), 404
        
        chat_data = chat_history[user_id][chat_id]
        return jsonify({
            "chat_id": chat_id,
            "title": chat_data['title'],
            "messages": chat_data['messages'],
            "created_at": chat_data['created_at'].isoformat(),
            "last_updated": chat_data['last_updated'].isoformat()
        })
    
    except Exception as e:
        print(f"Error getting chat messages: {e}")
        return jsonify({"error": "Failed to retrieve chat messages"}), 500

@app.route('/api/chat/new', methods=['POST'])
def create_new_chat():
    """Create a new chat session"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        # Generate new chat ID
        chat_id = str(uuid.uuid4())
        
        # Clear any existing session for this user
        if user_id in user_sessions:
            del user_sessions[user_id]
        
        return jsonify({
            "chat_id": chat_id,
            "message": "New chat session created"
        })
    
    except Exception as e:
        print(f"Error creating new chat: {e}")
        return jsonify({"error": "Failed to create new chat"}), 500

@app.route('/api/chat/delete/<chat_id>', methods=['DELETE'])
def delete_chat(chat_id):
    """Delete a specific chat"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        if (user_id in chat_history and 
            chat_id in chat_history[user_id]):
            del chat_history[user_id][chat_id]
            save_chat_history()
            return jsonify({"message": "Chat deleted successfully"})
        
        return jsonify({"error": "Chat not found"}), 404
    
    except Exception as e:
        print(f"Error deleting chat: {e}")
        return jsonify({"error": "Failed to delete chat"}), 500

@app.route('/chat', methods=['POST'])
@app.route('/api/chat', methods=['POST'])  # Add API prefix route as well
def chat_api():
    """Enhanced chat API with better conversation flow and accuracy"""
    if not model:
        return jsonify({"error": "AI model is currently unavailable. Please try again later."}), 500

    data = request.get_json()
    user_id = data.get('user_id', 'default_user')
    chat_id = data.get('chat_id', str(uuid.uuid4()))  # Generate new chat_id if not provided
    user_message = data.get('message', '').lower().strip()
    user_lat, user_lon = data.get('latitude'), data.get('longitude')

    # Add user message to history
    user_msg_obj = {
        'text': data.get('message', ''),  # Use original message (not lowercased)
        'isUser': True,
        'timestamp': datetime.now().isoformat(),
        'type': 'text'
    }
    add_message_to_history(user_id, chat_id, user_msg_obj)

    # Enhanced greeting detection
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'start']
    if any(greeting in user_message for greeting in greetings) and len(user_message) < 20:
        greeting_response = """👋 **Hello! I'm Dr. AI, your personal health assistant.**

I'm here to help you understand your symptoms and guide you to the right medical care. Think of me as your knowledgeable health companion! 

🩺 **What I can do for you:**
• Analyze your symptoms with advanced AI
• Provide detailed health information
• Recommend appropriate medical specialists
• Find nearby doctors (if you share your location)
• Offer preliminary care suggestions

📝 **Let's get started:**
Simply tell me about your symptoms in your own words. For example:
• "I have a bad headache and feel nauseous"
• "My throat is sore and I've been coughing"
• "I feel dizzy and my chest hurts"

🎯 **The more details you share, the better I can help you!**

What symptoms are you experiencing today?"""
        
        bot_msg_obj = {
            'text': greeting_response,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": greeting_response}],
            "chat_id": chat_id
        })

    # Enhanced help system
    help_keywords = ['help', 'how to use', 'instructions', 'guide', 'what can you do', 'how does this work']
    if any(keyword in user_message for keyword in help_keywords):
        help_response = """🆘 **How to Get the Best Help from Dr. AI:**

**🔄 Step-by-Step Process:**
1️⃣ **Describe your symptoms** - Be as specific as possible
   • Example: "I have a severe headache for 2 days, feel nauseous, and sensitive to light"

2️⃣ **Answer my follow-up questions** - I'll ask about related symptoms to ensure accuracy

3️⃣ **Say "that's all" or "done"** when you've shared everything

4️⃣ **Review my analysis** - I'll provide a detailed assessment with confidence levels

5️⃣ **Find specialists** - Get recommendations for doctors near you

**💡 Pro Tips for Better Results:**
• Mention how long you've had symptoms
• Describe severity (mild, moderate, severe)
• Include any triggers you've noticed
• Mention relevant medical history if applicable

**🚨 Emergency Note:** For severe symptoms like chest pain, difficulty breathing, or loss of consciousness, please call emergency services immediately!

Ready to start? What symptoms would you like to discuss?"""
        
        bot_msg_obj = {
            'text': help_response,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": help_response}],
            "chat_id": chat_id
        })

    # Enhanced thank you responses
    thank_you_keywords = ['thank you', 'thanks', 'appreciate', 'helpful', 'great']
    if any(keyword in user_message for keyword in thank_you_keywords):
        gratitude_response = """😊 **You're very welcome!**

I'm glad I could help you understand your symptoms better. Remember, I'm here whenever you need health guidance!

🎯 **Important reminders:**
• Please follow up with a healthcare professional for official diagnosis
• Keep track of your symptoms and their progression
• Don't hesitate to seek immediate care if symptoms worsen

💙 **Take care of yourself!** Your health is your most valuable asset.

Is there anything else about your health I can help you with today?"""
        
        bot_msg_obj = {
            'text': gratitude_response,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": gratitude_response}],
            "chat_id": chat_id
        })

    # Reset functionality
    if user_message in ['reset', 'start over', 'clear', 'restart']:
        user_sessions.pop(user_id, None)
        reset_response = "✨ **Fresh start!** I've cleared our conversation history.\n\nLet's begin again - what symptoms are you experiencing today?"
        
        bot_msg_obj = {
            'text': reset_response,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": reset_response}],
            "chat_id": chat_id
        })

    # Emergency keyword detection
    emergency_keywords = ['emergency', 'urgent', 'severe pain', 'can\'t breathe', 'chest pain', 'heart attack', 'stroke']
    if any(keyword in user_message for keyword in emergency_keywords):
        emergency_response = """🚨 **EMERGENCY ALERT**

If you're experiencing a medical emergency, please:
• **Call emergency services immediately** (911, 999, or your local emergency number)
• **Go to the nearest emergency room**
• **Don't delay - seek immediate medical attention**

I'm an AI assistant and cannot provide emergency medical care. Your safety is the top priority!

Once you're safe and if you need non-emergency health guidance, I'll be here to help."""
        
        bot_msg_obj = {
            'text': emergency_response,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": emergency_response}],
            "chat_id": chat_id
        })

    session = user_sessions.setdefault(user_id, {'confirmed_symptoms': [], 'interaction_count': 0})
    session['interaction_count'] += 1

    # Enhanced symptom extraction
    extracted_symptoms = extract_symptoms_nlp(user_message)
    new_symptoms = [s for s in extracted_symptoms if s not in session['confirmed_symptoms']]

    if new_symptoms:
        session['confirmed_symptoms'].extend(new_symptoms)
        last_symptom = new_symptoms[-1]
        follow_ups = get_related_symptoms(last_symptom, session['confirmed_symptoms'])

        # More conversational acknowledgment
        symptom_count = len(session['confirmed_symptoms'])
        if symptom_count == 1:
            msg = f"✅ **Got it!** I've noted that you have **{new_symptoms[0].replace('_', ' ')}**."
        else:
            symptoms_display = [s.replace('_', ' ') for s in session['confirmed_symptoms']]
            msg = f"✅ **Understood!** So far you have: **{', '.join(symptoms_display)}**."
        
        if follow_ups and len(session['confirmed_symptoms']) < 5:  # Limit follow-up questions
            follow_display = [f.replace('_', ' ') for f in follow_ups]
            msg += f"\n\n🤔 **Quick check:** Are you also experiencing any of these related symptoms?\n• {' • '.join(follow_display)}\n\n💬 You can say **'yes to [symptom]'**, **'no'**, or **'that's all'** if you've covered everything."
        else:
            msg += f"\n\n💬 **Any other symptoms?** Or say **'that's all'** when you're ready for my analysis."
        
        bot_msg_obj = {
            'text': msg,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": msg}],
            "chat_id": chat_id
        })

    # Handle completion signals
    completion_signals = ["that's all", "done", "no more", "that is all", "finish", "analyze", "complete"]
    if any(signal in user_message for signal in completion_signals):
        if session['confirmed_symptoms']:
            thinking_msg = f"🧠 **Analyzing your symptoms...**\n\nI'm processing: {', '.join([s.replace('_', ' ') for s in session['confirmed_symptoms']])}\n\nPlease wait a moment while I provide you with a comprehensive analysis..."
            
            # Add thinking message to history
            thinking_obj = {
                'text': thinking_msg,
                'isUser': False,
                'timestamp': datetime.now().isoformat(),
                'type': 'text'
            }
            add_message_to_history(user_id, chat_id, thinking_obj)
            
            # Send thinking message first, then analysis
            response_data = generate_prediction_response(session['confirmed_symptoms'], user_lat, user_lon)
            response_data["bot_response_parts"].insert(0, {"type": "text", "content": thinking_msg})
            response_data["chat_id"] = chat_id
            
            # Add all response parts to history
            for part in response_data["bot_response_parts"][1:]:  # Skip thinking message (already added)
                bot_msg_obj = {
                    'text': part.get('content', ''),
                    'isUser': False,
                    'timestamp': datetime.now().isoformat(),
                    'type': part.get('type', 'text')
                }
                if part.get('type') == 'doctors':
                    bot_msg_obj['doctorData'] = part.get('content', [])
                elif part.get('type') == 'map':
                    bot_msg_obj['mapData'] = part.get('content', {})
                
                add_message_to_history(user_id, chat_id, bot_msg_obj)
            
            user_sessions.pop(user_id, None)  # Clear session after analysis
            return jsonify(response_data)
        else:
            no_symptoms_msg = "🤔 **I don't have any symptoms to analyze yet.**\n\nCould you please describe what you're experiencing? For example:\n• 'I have a headache and feel tired'\n• 'My stomach hurts and I feel nauseous'\n• 'I have a fever and sore throat'"
            
            bot_msg_obj = {
                'text': no_symptoms_msg,
                'isUser': False,
                'timestamp': datetime.now().isoformat(),
                'type': 'text'
            }
            add_message_to_history(user_id, chat_id, bot_msg_obj)
            
            return jsonify({
                "bot_response_parts": [{"type": "text", "content": no_symptoms_msg}],
                "chat_id": chat_id
            })

    # Handle negative responses to follow-up questions
    if user_message in ['no', 'nope', 'none', 'no more symptoms']:
        if session['confirmed_symptoms']:
            understood_msg = "👍 **Understood!** \n\nAny other symptoms you'd like to mention? Or say **'that's all'** if you're ready for my analysis."
            
            bot_msg_obj = {
                'text': understood_msg,
                'isUser': False,
                'timestamp': datetime.now().isoformat(),
                'type': 'text'
            }
            add_message_to_history(user_id, chat_id, bot_msg_obj)
            
            return jsonify({
                "bot_response_parts": [{"type": "text", "content": understood_msg}],
                "chat_id": chat_id
            })
        else:
            no_symptoms_yet_msg = "🤔 **No symptoms noted yet.**\n\nWhat brings you here today? Please describe any health concerns or symptoms you're experiencing."
            
            bot_msg_obj = {
                'text': no_symptoms_yet_msg,
                'isUser': False,
                'timestamp': datetime.now().isoformat(),
                'type': 'text'
            }
            add_message_to_history(user_id, chat_id, bot_msg_obj)
            
            return jsonify({
                "bot_response_parts": [{"type": "text", "content": no_symptoms_yet_msg}],
                "chat_id": chat_id
            })

    # Enhanced fallback for unclear input
    if not session['confirmed_symptoms']:
        encouragement_responses = [
            "🔍 **I'd love to help, but I need a bit more information.**\n\nCould you describe your symptoms more specifically? What exactly are you feeling or experiencing?",
            "💬 **Let's try a different approach.**\n\nInstead of general terms, can you tell me about specific physical sensations? For example:\n• Where does it hurt?\n• How do you feel overall?\n• What's bothering you most?",
            "🎯 **I'm here to help you!**\n\nTry describing your symptoms like you would to a friend: 'I have...' or 'I feel...' or 'It hurts when...'"
        ]
        response_index = session['interaction_count'] % len(encouragement_responses)
        fallback_msg = encouragement_responses[response_index]
        
        bot_msg_obj = {
            'text': fallback_msg,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": fallback_msg}],
            "chat_id": chat_id
        })
    else:
        listening_msg = "👂 **I'm listening!**\n\nAny other symptoms to add? Or say **'that's all'** when you're ready for my analysis."
        
        bot_msg_obj = {
            'text': listening_msg,
            'isUser': False,
            'timestamp': datetime.now().isoformat(),
            'type': 'text'
        }
        add_message_to_history(user_id, chat_id, bot_msg_obj)
        
        return jsonify({
            "bot_response_parts": [{"type": "text", "content": listening_msg}],
            "chat_id": chat_id
        })

if __name__ == '__main__':
    print("🏥 Dr. AI Medical Assistant starting up...")
    print("🚀 Ready to help with symptom analysis!")
    app.run(host='0.0.0.0', port=5001, debug=True)
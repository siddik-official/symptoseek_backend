import re
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
import nltk

nltk.download('wordnet')
nltk.download('stopwords')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_symptom_text(text):
    """Normalize symptom descriptions"""
    if not isinstance(text, str):
        return ""
    
    # Lowercase and remove special chars
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    
    # Tokenize and lemmatize
    tokens = [lemmatizer.lemmatize(word) for word in text.split() 
              if word not in stop_words]
    
    return ' '.join(tokens)

def prepare_symptoms_for_prediction(raw_symptoms):
    """Process user-provided symptoms for model prediction"""
    return [clean_symptom_text(symptom) for symptom in raw_symptoms]
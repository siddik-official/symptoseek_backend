# llm_client.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"
HEADERS = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}

def query_llm(prompt):
    # If no token is provided, return a simple fallback response
    if not HUGGINGFACE_API_TOKEN or HUGGINGFACE_API_TOKEN == "YOUR_HUGGINGFACE_TOKEN":
        return f"I understand you're experiencing: {prompt.split(':')[-1].strip()}. Could you please describe your symptoms more clearly?"
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 150,
            "temperature": 0.7,
            "top_p": 0.95,
            "do_sample": True,
        }
    }
    
    try:
        response = requests.post(API_URL, headers=HEADERS, json=payload, timeout=10)
        if response.status_code != 200:
            print(f"LLM API error {response.status_code}:", response.text)
            return "Could you please describe your symptoms more clearly?"

        result = response.json()
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                generated = result[0]["generated_text"]
                # Remove the original prompt from the response
                if prompt in generated:
                    generated = generated.replace(prompt, "").strip()
                return generated if generated else "Could you please describe your symptoms more clearly?"
            else:
                return str(result[0]) if result[0] else "Could you please describe your symptoms more clearly?"
        else:
            return "Could you please describe your symptoms more clearly?"
            
    except requests.exceptions.RequestException as e:
        print(f"LLM request error: {e}")
        return "Could you please describe your symptoms more clearly?"
    except Exception as e:
        print(f"LLM processing error: {e}")
        return "Could you please describe your symptoms more clearly?"

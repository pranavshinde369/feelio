import google.generativeai as genai
import os

# --- PASTE YOUR API KEY HERE ---
GEMINI_API_KEY = "AIzaSyBa28c18_TUkmIUbqorLnZbCWigl3ftOhc"

genai.configure(api_key=GEMINI_API_KEY)

print("🔍 Checking available models for your API Key...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ FOUND: {m.name}")
except Exception as e:
    print(f"❌ Error connecting: {e}")
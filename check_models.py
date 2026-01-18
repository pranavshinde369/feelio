import google.generativeai as genai
import os

# --- API KEY (ENV) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable. Set it before running.")

genai.configure(api_key=GEMINI_API_KEY)

print("🔍 Checking available models for your API Key...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ FOUND: {m.name}")
except Exception as e:
    print(f"❌ Error connecting: {e}")
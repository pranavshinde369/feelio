import speech_recognition as sr
import google.generativeai as genai
from gtts import gTTS
import pygame
import os
import time

# --- CONFIGURATION ---
# Replace with your actual API Key
GEMINI_API_KEY = "AIzaSyBa28c18_TUkmIUbqorLnZbCWigl3ftOhc"

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Model (Using your available 2.5 Flash model)
# System instruction forces the therapist persona
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction="You are an empathetic, calm, and professional AI therapist. Keep your responses concise (1-2 sentences) so the conversation flows naturally in voice mode."
)

# Initialize Audio Mixer
pygame.mixer.init()

def listen_to_user():
    """
    Listens to the microphone and converts speech to text.
    """
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("\n🎧 Listening... (Speak now)")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        
        try:
            # Listen for up to 5 seconds of silence, or 10 seconds of speaking
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("⏳ Processing speech...")
            text = recognizer.recognize_google(audio)
            print(f"🗣️ You said: {text}")
            return text
            
        except sr.WaitTimeoutError:
            print("⚠️ No speech detected. Timing out.")
            return None
        except sr.UnknownValueError:
            print("⚠️ Could not understand audio.")
            return None
        except sr.RequestError:
            print("⚠️ Could not request results (Internet issue?).")
            return None

def get_therapist_response(user_text, chat_history):
    """
    Sends text to Gemini and gets a response.
    """
    try:
        response = chat_history.send_message(user_text)
        ai_text = response.text
        print(f"🤖 Therapist: {ai_text}")
        return ai_text
    except Exception as e:
        print(f"❌ API Error: {e}")
        return "I am having trouble processing that thought."

def speak_response(text):
    """
    Converts text to speech and plays it using a unique filename to avoid locking errors.
    """
    print("🔊 Speaking...")
    try:
        # 1. Generate a unique filename using timestamp
        timestamp = int(time.time())
        filename = f"response_{timestamp}.mp3"
        
        # 2. Generate audio file
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(filename)
        
        # 3. Play the audio
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        
        # 4. Wait for audio to finish playing
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
            
        # 5. Unload the file to release the Windows file lock
        pygame.mixer.music.unload()
        
        # 6. Delete the temp file
        try:
            os.remove(filename)
        except PermissionError:
            pass # If it fails, ignore it. It won't crash the app.
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")

def main():
    print("--- AI Therapist (Phase 1: Core Loop / Fixed) ---")
    print(f"Using Model: gemini-2.5-flash")
    
    # Start chat session
    chat_session = model.start_chat(history=[])
    
    while True:
        # 1. Input
        user_input = listen_to_user()
        
        if user_input:
            # Exit command
            if "bye" in user_input.lower() or "stop" in user_input.lower():
                speak_response("Goodbye. Take care.")
                break
            
            # 2. Process
            ai_reply = get_therapist_response(user_input, chat_session)
            
            # 3. Output
            speak_response(ai_reply)
        
        # Small pause to prevent loop overlap
        time.sleep(0.5)

if __name__ == "__main__":
    main()
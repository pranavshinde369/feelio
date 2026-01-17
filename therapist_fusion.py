import speech_recognition as sr
import google.generativeai as genai
from gtts import gTTS
import pygame
import os
import time
import cv2
from deepface import DeepFace
import threading

# --- CONFIGURATION ---
# ⚠️ PASTE YOUR API KEY HERE
GEMINI_API_KEY = "AIzaSyBa28c18_TUkmIUbqorLnZbCWigl3ftOhc"

# Configure Gemini with the "Therapist Persona"
genai.configure(api_key=GEMINI_API_KEY)

# We define the personality strictly here
# --- UPGRADED PERSONA (Solution-Focused) ---
therapist_instructions = """
You are Dr. Libra, a practical and solution-oriented AI therapist.
YOUR GOAL: Validate the user's feelings, then offer a concrete path forward.

RULES:
1. THE "VALIDATE -> SOLVE" LOOP: First, acknowledge the emotion (1 sentence). Then, immediately offer a coping strategy, a different perspective (reframing), or a small actionable step.
2. USE CBT TECHNIQUES: If the user is anxious, suggest grounding. If sad, suggest behavioral activation (small movement). If angry, suggest cooling down.
3. DETECT CONTRADICTIONS: If the user says "I'm fine" but looks SAD, say: "You're saying you're fine, but you look down. It's okay to admit if you need a solution for that sadness."
4. BE CONCISE: Keep it under 3 sentences so it speaks quickly.
5. NO GENERIC ADVICE: Avoid "drink water" or "take a deep breath" unless specific. Give psychological tools.
"""

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=therapist_instructions
)

# Initialize Audio
pygame.mixer.init()

# --- GLOBAL SHARED VARIABLES ---
current_emotion = "neutral" 
is_running = True 

def run_vision_system():
    """
    Background Thread: Constantly looks at the camera to update 'current_emotion'
    """
    global current_emotion, is_running
    
    print("📷 Vision System Starting...")
    # Note: If camera 1 doesn't work, switch back to 0
    cap = cv2.VideoCapture(0) 
    
    while is_running:
        ret, frame = cap.read()
        if not ret:
            continue
            
        try:
            # Analyze frame for emotion
            analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
            current_emotion = analysis[0]['dominant_emotion']
            
            # Visual feedback window
            cv2.putText(frame, f"Mood: {current_emotion}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow('Therapist Eyes', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        except Exception:
            pass
            
    cap.release()
    cv2.destroyAllWindows()

def listen_to_user():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print(f"\n🎧 Listening... (You look: {current_emotion})")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("⏳ Processing speech...")
            return recognizer.recognize_google(audio)
        except:
            return None

def get_therapist_response(user_text, chat_history):
    """
    The Fusion Logic: Combines Text + Vision -> Actionable Advice
    """
    global current_emotion
    
    # 🧠 FUSION PROMPT (Updated for Solutions)
    fusion_prompt = (
        f"CONTEXT: A spoken therapy session where the user wants help, not just listening. "
        f"USER SAID: '{user_text}' "
        f"USER VISUAL EMOTION: '{current_emotion}' "
        "INSTRUCTION: "
        "1. Briefly validate the feeling based on their face and words. "
        "2. Provide ONE specific, actionable solution or psychological technique to help them handle this situation right now. "
        "3. Keep it conversational and short."
    )
    
    try:
        response = chat_history.send_message(fusion_prompt)
        print(f"🤖 Dr. Libra: {response.text}")
        return response.text
    except Exception as e:
        print(f"❌ API Error: {e}")
        return "I'm having a little trouble connecting to my thoughts right now."
def speak_response(text):
    timestamp = int(time.time())
    filename = f"response_{timestamp}.mp3"
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(filename)
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
        try:
            os.remove(filename)
        except:
            pass
    except Exception as e:
        print(f"❌ TTS Error: {e}")

def main():
    global is_running
    print("--- AI THERAPIST: DR. LIBRA (Vision + Voice) ---")
    
    # 1. Start the Vision Thread
    vision_thread = threading.Thread(target=run_vision_system)
    vision_thread.start()
    
    # 2. Wait a moment for camera to warm up
    time.sleep(2)
    
    chat_session = model.start_chat(history=[])
    
    try:
        while True:
            user_input = listen_to_user()
            
            if user_input:
                if "bye" in user_input.lower() or "stop" in user_input.lower():
                    speak_response("It was good to speak with you. Take care.")
                    break
                
                ai_reply = get_therapist_response(user_input, chat_session)
                speak_response(ai_reply)
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        is_running = False
        vision_thread.join()
        print("System Closed.")

if __name__ == "__main__":
    main()
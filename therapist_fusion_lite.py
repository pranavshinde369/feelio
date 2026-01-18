import speech_recognition as sr
import google.generativeai as genai
from gtts import gTTS
import pygame
import os
import time
import threading
import re
from collections import deque

# --- CONFIGURATION ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY environment variable. Set it before running.")

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
3. DETECT CONTRADICTIONS: If the user says "I'm fine" but sounds SAD, say: "You're saying you're fine, but you sound down. It's okay to admit if you need a solution for that sadness."
4. BE CONCISE: Keep it under 3 sentences so it speaks quickly.
5. NO GENERIC ADVICE: Avoid "drink water" or "take a deep breath" unless specific. Give psychological tools.
"""

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    system_instruction=therapist_instructions
)

# Initialize Audio Mixer
pygame.mixer.init()

# --- GLOBAL SHARED VARIABLES ---
current_emotion = "neutral" 
is_running = True 
emotion_history = deque(maxlen=180)  # rolling mood timeline
session_log = []  # captures conversational turns for summary
distress_emotions = {"sad", "fear", "angry", "disgust", "surprise"}
safety_keywords = [
    "suicide",
    "kill myself",
    "end my life",
    "hurt myself",
    "self harm",
    "self-harm",
    "cut myself",
    "want to die",
    "no reason to live",
    "give up",
]


def update_emotion_history(emotion):
    """Store a timestamped emotion for later trajectory/summary."""
    emotion_history.append((time.time(), emotion))


def summarize_trajectory():
    """Describe how the emotion has shifted recently."""
    if len(emotion_history) < 4:
        return "steady so far"

    recent = [e for _, e in list(emotion_history)[-20:]]
    start, end = recent[0], recent[-1]
    if start != end:
        return f"from {start} toward {end}"

    dominant = max(set(recent), key=recent.count)
    return f"mostly {dominant}"


def detect_contradiction(user_text, emotion):
    """Flag when words say 'fine' but face shows distress."""
    text = user_text.lower()
    says_fine = any(token in text for token in ["fine", "okay", "good"])
    looks_distressed = emotion in distress_emotions
    if says_fine and looks_distressed:
        return f"User says fine but looks {emotion}. Invite gentle check-in."
    return "none noted"


def detect_high_risk(user_text):
    """Simple keyword-based safety net."""
    lowered = user_text.lower()
    return any(phrase in lowered for phrase in safety_keywords)


playbooks = {
    "sad": "Run a 5-minute activation: stand, stretch, and text one friend a kind line.",
    "fear": "Try 5-4-3-2-1 grounding with one slow exhale per step.",
    "angry": "Cool-down reset: cold water on wrists + step outside for 2 minutes before replying to anyone.",
    "disgust": "Name-then-reframe: label the trigger, then list one boundary you can set today.",
    "surprise": "Stabilize with box breathing: 4 in, 4 hold, 4 out, 4 hold for two cycles.",
    "neutral": "Micro check-in: what mattered most today? Pick one tiny action that honors it in 5 minutes.",
    "default": "Pick one concrete action in 5 minutes (move, text, or jot a thought). Keep it small and doable.",
}


def select_playbook(emotion, user_text):
    """Choose a playbook based on face + words."""
    text = user_text.lower()
    if "panic" in text or "anxious" in text:
        return "Panic kit: 3 paced breaths (inhale 4, exhale 6) plus name 3 things you see." 
    if "sleep" in text or "insomnia" in text:
        return "Sleep wind-down: lights dim, slow exhale 6s for 1 minute, then write one worry and shelve it till morning." 
    if "overwhelm" in text or "burnout" in text:
        return "Overwhelm triage: list top 3 tasks, pick one 10-minute starter and ignore the rest for 30 minutes." 
    if emotion in playbooks:
        return playbooks[emotion]
    return playbooks["default"]


def log_turn(user_text, ai_text, emotion):
    session_log.append(
        {
            "t": time.time(),
            "user": user_text,
            "ai": ai_text,
            "emotion": emotion,
        }
    )


def generate_session_summary():
    """Condense the session into feelings + actions."""
    if not session_log:
        return "No session data captured."

    timeline = [f"{entry['emotion']}" for entry in session_log[-20:]]
    summary_prompt = (
        "You are an AI therapist preparing a concise handoff. "
        "Summarize the session in 3 bullet points: (1) observed emotions trend, (2) key concerns, (3) agreed small actions. "
        "Keep it under 80 words."
        f" Recent emotions: {timeline}. "
        f" Transcript snippets: {session_log[-6:]}"
    )

    try:
        summary = model.generate_content(summary_prompt).text
        return summary
    except Exception as e:
        return f"Summary unavailable: {e}"


def listen_to_user():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print(f"\n🎧 Listening... (Current emotion: {current_emotion})")
        recognizer.adjust_for_ambient_noise(source, duration=1)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("⏳ Processing speech...")
            return recognizer.recognize_google(audio)
        except:
            return None


def get_therapist_response(user_text, chat_history, pace_hint="normal"):
    """
    Fusion Logic: combines speech + vision + playbooks into one concise intervention.
    """
    global current_emotion

    trajectory = summarize_trajectory()
    contradiction = detect_contradiction(user_text, current_emotion)
    playbook = select_playbook(current_emotion, user_text)

    fusion_prompt = (
        "CONTEXT: Short, solution-focused spoken therapy. "
        f"USER SAID: '{user_text}'. "
        f"EMOTION STATE: '{current_emotion}'. "
        f"EMOTION TRAJECTORY: {trajectory}. "
        f"CONTRADICTION FLAG: {contradiction}. "
        f"SUGGESTED PLAYBOOK: {playbook}. "
        f"PACE HINT: {pace_hint}. "
        "INSTRUCTION: 1) Validate based on words, 2) offer ONE specific tool right now, 3) keep under 3 sentences, 4) if contradiction, invite gentle clarification, 5) match the pace hint (slightly slower if requested)."
    )

    try:
        response = chat_history.send_message(fusion_prompt)
        ai_text = response.text
        print(f"🤖 Dr. Libra: {ai_text}")
        return ai_text
    except Exception as e:
        print(f"❌ API Error: {e}")
        return "I'm having a little trouble connecting to my thoughts right now."


def speak_response(text, slow=False, pre_pause=0.0):
    timestamp = int(time.time())
    filename = f"response_{timestamp}.mp3"
    try:
        if pre_pause:
            time.sleep(pre_pause)
        tts = gTTS(text=text, lang='en', slow=slow)
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
    global is_running, current_emotion
    print("--- AI THERAPIST: DR. LIBRA (Voice-Only Lite) ---")
    
    # Simulate emotion for testing (in lite mode, we don't use vision)
    current_emotion = "neutral"
    update_emotion_history(current_emotion)
    
    chat_session = model.start_chat(history=[])
    
    try:
        while True:
            user_input = listen_to_user()
            
            if user_input:
                if "bye" in user_input.lower() or "stop" in user_input.lower():
                    speak_response("It was good to speak with you. Take care.")
                    break

                if detect_high_risk(user_input):
                    crisis = (
                        "I hear you mentioning harm. Your safety matters. "
                        "If you are in danger, contact a local emergency number or a trusted person right now. "
                        "I can listen and help you plan one safe step." 
                    )
                    speak_response(crisis, slow=True, pre_pause=0.5)
                    log_turn(user_input, crisis, current_emotion)
                    continue

                word_count = len(re.findall(r"\w+", user_input))
                pace_hint = "slower" if word_count > 18 else "normal"
                pre_pause = 0.8 if pace_hint == "slower" else 0.2

                ai_reply = get_therapist_response(user_input, chat_session, pace_hint=pace_hint)
                log_turn(user_input, ai_reply, current_emotion)
                speak_response(ai_reply, slow=pace_hint == "slower", pre_pause=pre_pause)
            
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\nStopping...")
    finally:
        is_running = False
        print("System Closed.")
        session_summary = generate_session_summary()
        print("\n--- Session Summary ---")
        print(session_summary)


if __name__ == "__main__":
    main()

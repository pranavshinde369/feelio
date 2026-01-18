"""
Flask REST API for Feelio - Production Ready
Provides endpoints for frontend integration
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from collections import deque

from config import Config
from therapy_utils import (
    update_emotion_history,
    summarize_trajectory,
    detect_contradiction,
    detect_high_risk,
    select_playbook,
    build_fusion_prompt,
    build_crisis_response,
    extract_word_count,
    determine_pace_hint,
)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
CORS(app, origins=cors_origins, supports_credentials=True)

# Setup logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize Gemini
try:
    Config.validate()
    genai.configure(api_key=Config.GEMINI_API_KEY)
    logger.info("✅ Gemini API configured")
except Exception as e:
    logger.error(f"❌ Failed to configure Gemini: {e}")

# Session storage (in production, use Redis or database)
sessions = {}

THERAPIST_INSTRUCTIONS = """
You are Dr. Libra, a highly experienced Clinical Psychologist (PhD).
You do not "fix" patients; you guide them to their own insight using CBT, ACT, and Humanistic techniques.

--- YOUR CLINICAL FRAMEWORK ---

1.  **THE "HOLDING SPACE" RULE:**
    * Before offering ANY solution, you must fully "hold" the user's pain.
    * *Bad:* "You're sad? Try going for a walk."
    * *Good:* "I can hear how heavy that sadness feels right now. It makes sense you feel drained."

2.  **SOCRATIC INQUIRY (The Art of Questioning):**
    * Do not just give answers. Ask questions that challenge the user's logic.
    * *Example:* "You mentioned you are a 'failure.' What specific evidence do you have for that thought, and what evidence argues against it?"

3.  **SPOT COGNITIVE DISTORTIONS:**
    * Listen for these patterns and gently point them out:
        * *Catastrophizing:* "It sounds like your mind is jumping to the worst-case scenario. Is that guaranteed to happen?"
        * *All-or-Nothing Thinking:* "You seem to be seeing this as black or white. Is there a middle ground?"
        * *Mind Reading:* "You feel your friend hates you, but have they actually said that?"

4.  **MULTIMODAL DECODING:**
    * **Conflict:** If Face = SAD but Words = "I'm fine" -> SAY: "My sensors see pain in your eyes, even though your words say you're fine. I'm listening to your eyes right now."
    * **Silence:** If the user gives short answers, gently probe: "I notice you're quiet today. Is it hard to find the words?"

--- RESPONSE STRUCTURE ---
(Keep it conversational, not a list)
1.  **Reflection:** Mirror back what they said + the underlying emotion.
2.  **The "Deepen" Question:** Ask something to explore *why* they feel this way.
3.  **The Tool (Optional):** Only offer a tool if they seem stuck or ask for help.

--- TONE ---
* **Pacing:** Slow, thoughtful, unhurried.
* **Voice:** Warm, anchoring, steady.
* **Safety:** If SUICIDE/SELF-HARM is detected -> DROP therapy. Switch to CRISIS INTERVENTION immediately.

Keep responses concise (2-3 sentences max) and empathetic.
"""


# ========== HELPER FUNCTIONS ==========

def get_or_create_session(session_id: str) -> dict:
    """Get or create a session."""
    if session_id not in sessions:
        model = genai.GenerativeModel(
            Config.MODEL_NAME,
            system_instruction=THERAPIST_INSTRUCTIONS,
        )
        sessions[session_id] = {
            "chat": model.start_chat(history=[]),
            "emotion_history": deque(maxlen=180),
            "turns": []
        }
    return sessions[session_id]


# ========== API ENDPOINTS ==========

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint for Render."""
    return jsonify({
        "status": "healthy",
        "service": "feelio-backend",
        "version": "1.0.0"
    }), 200


@app.route("/api/session/start", methods=["POST"])
def start_session():
    """Start a new therapy session."""
    try:
        data = request.get_json() or {}
        session_id = data.get("session_id") or os.urandom(16).hex()
        
        get_or_create_session(session_id)
        
        logger.info(f"✅ Session started: {session_id}")
        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Session started successfully"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error starting session: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    """Process user message and return AI response."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        session_id = data.get("session_id")
        user_text = data.get("message", "").strip()
        emotion = data.get("emotion", "neutral")
        
        if not session_id or not user_text:
            return jsonify({
                "success": False,
                "error": "session_id and message are required"
            }), 400
        
        # Get or create session
        session = get_or_create_session(session_id)
        
        # Check for high-risk content
        if Config.ENABLE_SAFETY_NET and detect_high_risk(user_text):
            crisis_response = build_crisis_response()
            logger.warning(f"🚨 High-risk content detected in session: {session_id}")
            
            session["turns"].append({
                "user": user_text,
                "therapist": crisis_response,
                "emotion": emotion,
                "crisis": True
            })
            
            return jsonify({
                "success": True,
                "response": crisis_response,
                "emotion": emotion,
                "crisis_detected": True
            }), 200
        
        # Update emotion history
        update_emotion_history(emotion, session["emotion_history"])
        
        # Build context
        trajectory = summarize_trajectory(session["emotion_history"])
        contradiction = detect_contradiction(user_text, emotion)
        playbook = select_playbook(emotion, user_text)
        
        word_count = extract_word_count(user_text)
        pace_hint = determine_pace_hint(word_count)
        
        # Build fusion prompt with more unique context
        fusion_prompt = build_fusion_prompt(
            user_text=user_text,
            emotion=emotion,
            trajectory=trajectory,
            contradiction=contradiction,
            playbook=playbook,
            pace_hint=pace_hint,
        )
        
        # Add session turn context to make responses more unique
        turn_num = len(session["turns"]) + 1
        fusion_prompt += f"\n[CONVERSATION TURN: {turn_num}]"
        
        # Generate response with temperature for variety
        try:
            response = session["chat"].send_message(fusion_prompt)
            ai_text = response.text.strip()
            
            # Validate response
            if not ai_text or len(ai_text) < 5:
                logger.warning(f"⚠️ Empty or too short response for session: {session_id}")
                ai_text = "I'm listening. Could you tell me more about what you're feeling?"
                
        except Exception as e:
            logger.error(f"❌ Gemini API error: {e}")
            # Fallback responses based on emotion
            fallback_responses = {
                "happy": "I can hear the warmth in your words. What's brought you this joy?",
                "sad": "I sense sadness in what you're sharing. I'm here to listen more deeply.",
                "anxious": "There's some worry coming through. Let's slow down and explore what's underneath.",
                "calm": "You sound grounded right now. What's helped you get to this place?",
                "neutral": "I'm sensing you might have a lot on your mind. Where would you like to start?"
            }
            ai_text = fallback_responses.get(emotion, "I'm here to listen. Please go on.")
        
        # Log turn
        session["turns"].append({
            "user": user_text,
            "therapist": ai_text,
            "emotion": emotion,
            "crisis": False
        })
        
        logger.info(f"✅ Response generated for session: {session_id} (turn {turn_num})")
        
        return jsonify({
            "success": True,
            "response": ai_text,
            "emotion": emotion,
            "crisis_detected": False,
            "playbook": playbook
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error in chat endpoint: {e}", exc_info=True)
        fallback_text = "I'm sensing some strong emotions. Could you tell me more about what's on your mind?"
        
        return jsonify({
            "success": True,
            "response": fallback_text,
            "emotion": "neutral",
            "crisis_detected": False,
            "playbook": None,
            "fallback": True
        }), 200


@app.route("/api/session/summary", methods=["POST"])
def get_session_summary():
    """Get session summary."""
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        
        if not session_id or session_id not in sessions:
            return jsonify({
                "success": False,
                "error": "Invalid session_id"
            }), 400
        
        session = sessions[session_id]
        turns = session["turns"]
        
        if not turns:
            return jsonify({
                "success": True,
                "summary": "No conversation yet",
                "turn_count": 0
            }), 200
        
        # Build summary
        summary_lines = []
        emotion_counts = {}
        
        for turn in turns:
            emotion = turn["emotion"]
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        summary = f"Session had {len(turns)} exchanges. Primary emotions: {', '.join(emotion_counts.keys())}"
        
        return jsonify({
            "success": True,
            "summary": summary,
            "turn_count": len(turns),
            "emotions": emotion_counts
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error getting summary: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/api/session/end", methods=["POST"])
def end_session():
    """End a therapy session."""
    try:
        data = request.get_json()
        session_id = data.get("session_id")
        
        if session_id and session_id in sessions:
            del sessions[session_id]
            logger.info(f"✅ Session ended: {session_id}")
        
        return jsonify({
            "success": True,
            "message": "Session ended"
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error ending session: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ========== ERROR HANDLERS ==========

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


# ========== MAIN ==========

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting Feelio API on {host}:{port}")
    logger.info(f"Environment: {Config.APP_ENV}")
    
    app.run(
        host=host,
        port=port,
        debug=Config.DEBUG_MODE
    )
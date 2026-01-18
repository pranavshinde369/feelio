"""
Production-ready Feelio AI Therapist - Voice + Vision Fusion (Lite)
Main entry point for the application with proper error handling and logging.
"""

import logging
import sys
import signal
from typing import Optional
from collections import deque

import google.generativeai as genai

from config import Config
from audio_module import AudioManager
from therapy_utils import (
    SessionLog,
    update_emotion_history,
    summarize_trajectory,
    detect_contradiction,
    detect_high_risk,
    select_playbook,
    build_fusion_prompt,
    build_summary_prompt,
    build_crisis_response,
    extract_word_count,
    determine_pace_hint,
    get_pre_pause_duration,
)


# ========== LOGGING SETUP ==========

def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR).
    """
    logging.basicConfig(
        level=getattr(logging, log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("feelio.log"),
        ],
    )
    logger = logging.getLogger(__name__)
    logger.info(f"✅ Logging initialized at {log_level} level")


logger = logging.getLogger(__name__)


# ========== THERAPIST CLASS ==========

class FeelioTherapist:
    """Main therapist orchestrator with all differentiating features."""

    THERAPIST_INSTRUCTIONS = """
You are Dr. Libra, a practical and solution-oriented AI therapist.
YOUR GOAL: Validate the user's feelings, then offer a concrete path forward.

RULES:
1. THE "VALIDATE -> SOLVE" LOOP: First, acknowledge the emotion (1 sentence). Then, immediately offer a coping strategy, a different perspective (reframing), or a small actionable step.
2. USE CBT TECHNIQUES: If the user is anxious, suggest grounding. If sad, suggest behavioral activation (small movement). If angry, suggest cooling down.
3. DETECT CONTRADICTIONS: If the user says "I'm fine" but looks SAD, say: "You're saying you're fine, but you sound down. It's okay to admit if you need a solution for that sadness."
4. BE CONCISE: Keep it under 3 sentences so it speaks quickly.
5. NO GENERIC ADVICE: Avoid "drink water" or "take a deep breath" unless specific. Give psychological tools.
"""

    def __init__(self, config: Config):
        """
        Initialize the therapist.

        Args:
            config: Configuration object.
        """
        self.config = config
        self.session_log = SessionLog()
        self.emotion_history: deque = deque(maxlen=180)
        self.current_emotion = "neutral"
        self.is_running = True

        # Initialize Gemini
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(
            config.MODEL_NAME,
            system_instruction=self.THERAPIST_INSTRUCTIONS,
        )
        self.chat_session = self.model.start_chat(history=[])

        # Initialize audio
        self.audio = AudioManager(
            microphone_index=config.MICROPHONE_INDEX,
            speech_timeout=config.SPEECH_TIMEOUT,
            phrase_time_limit=config.SPEECH_PHRASE_LIMIT,
            ambient_noise_duration=config.AMBIENT_NOISE_DURATION,
        )

        logger.info("✅ Feelio Therapist initialized")

    def handle_signal(self, signum, frame) -> None:
        """Graceful shutdown handler."""
        logger.info("📌 Shutdown signal received")
        self.is_running = False

    def run(self) -> None:
        """Main conversation loop."""
        logger.info("--- Starting Feelio Therapist Session ---")

        # Register signal handlers
        signal.signal(signal.SIGINT, self.handle_signal)
        signal.signal(signal.SIGTERM, self.handle_signal)

        try:
            while self.is_running:
                # 1. Listen to user
                user_input = self.audio.listen_to_user()

                if not user_input:
                    continue

                # 2. Check exit commands
                if self._should_exit(user_input):
                    self.audio.speak_response("It was good to speak with you. Take care.")
                    break

                # 3. Check high-risk content
                if self.config.ENABLE_SAFETY_NET and detect_high_risk(user_input):
                    crisis_response = build_crisis_response()
                    logger.warning("🚨 High-risk content detected - activating crisis protocol")
                    self.audio.speak_response(
                        crisis_response,
                        slow=True,
                        pre_pause=0.5,
                    )
                    self.session_log.add_turn(user_input, crisis_response, self.current_emotion)
                    continue

                # 4. Generate and deliver response
                ai_response = self._generate_response(user_input)
                self.session_log.add_turn(user_input, ai_response, self.current_emotion)

                # 5. Deliver with adaptive pacing
                word_count = extract_word_count(user_input)
                pace_hint = determine_pace_hint(word_count)
                pre_pause = get_pre_pause_duration(pace_hint)

                self.audio.speak_response(
                    ai_response,
                    slow=(pace_hint == "slower"),
                    pre_pause=pre_pause,
                )

        except KeyboardInterrupt:
            logger.info("⌨️ Keyboard interrupt received")
            self.is_running = False
        except Exception as e:
            logger.error(f"❌ Fatal error in conversation loop: {e}", exc_info=True)
            self.is_running = False
        finally:
            self._cleanup()

    def _should_exit(self, user_input: str) -> bool:
        """Check if user wants to exit."""
        lowered = user_input.lower()
        return any(word in lowered for word in ["bye", "goodbye", "stop", "exit", "quit"])

    def _generate_response(self, user_text: str) -> str:
        """
        Generate AI response using fusion logic.

        Args:
            user_text: User's input.

        Returns:
            str: AI response.
        """
        try:
            # Update emotion history (simulated for lite version)
            update_emotion_history(self.current_emotion, self.emotion_history)

            # Build context
            trajectory = summarize_trajectory(self.emotion_history)
            contradiction = detect_contradiction(user_text, self.current_emotion)
            playbook = select_playbook(self.current_emotion, user_text)

            word_count = extract_word_count(user_text)
            pace_hint = determine_pace_hint(word_count)

            # Build and send fusion prompt
            fusion_prompt = build_fusion_prompt(
                user_text=user_text,
                emotion=self.current_emotion,
                trajectory=trajectory,
                contradiction=contradiction,
                playbook=playbook,
                pace_hint=pace_hint,
            )

            response = self.chat_session.send_message(fusion_prompt)
            ai_text = response.text

            logger.info(f"🤖 Response generated ({len(ai_text)} chars)")
            return ai_text

        except Exception as e:
            logger.error(f"❌ Response generation error: {e}", exc_info=True)
            return "I'm having a little trouble connecting to my thoughts right now. Try again?"

    def _cleanup(self) -> None:
        """Cleanup and generate session summary."""
        logger.info("🧹 Cleaning up...")

        # Generate and display session summary
        if len(self.session_log) > 0:
            try:
                emotion_timeline = self.session_log.get_emotion_timeline()
                recent_turns = self.session_log.get_recent_turns()

                summary_prompt = build_summary_prompt(emotion_timeline, recent_turns)
                summary = self.model.generate_content(summary_prompt).text

                print("\n" + "=" * 60)
                print("📋 SESSION SUMMARY")
                print("=" * 60)
                print(summary)
                print("=" * 60 + "\n")

                logger.info(f"Session ended. Total turns: {len(self.session_log)}")

                if self.config.LOG_SESSIONS:
                    self._save_session()

            except Exception as e:
                logger.error(f"⚠️ Could not generate summary: {e}")
        else:
            logger.info("Session ended with no conversation")

    def _save_session(self) -> None:
        """Save session to file if configured."""
        try:
            import json
            import os

            os.makedirs(self.config.SESSION_LOGS_PATH, exist_ok=True)
            timestamp = int(__import__("time").time())
            filename = os.path.join(
                self.config.SESSION_LOGS_PATH,
                f"session_{timestamp}.json"
            )

            session_data = {
                "timestamp": timestamp,
                "turns": self.session_log.get_recent_turns(count=len(self.session_log)),
            }

            with open(filename, "w") as f:
                json.dump(session_data, f, indent=2)

            logger.info(f"✅ Session saved to {filename}")

        except Exception as e:
            logger.warning(f"⚠️ Could not save session: {e}")


# ========== MAIN ==========

def main() -> int:
    """
    Main entry point.

    Returns:
        int: Exit code.
    """
    try:
        # Load and validate configuration
        setup_logging(log_level=Config.LOG_LEVEL)
        logger.info(f"Starting Feelio (ENV: {Config.APP_ENV})")
        logger.debug(f"Configuration: {Config.get_masked_config()}")

        Config.validate()

        # Initialize and run therapist
        therapist = FeelioTherapist(Config)
        therapist.run()

        logger.info("✅ Feelio session completed successfully")
        return 0

    except ValueError as e:
        logger.error(f"❌ Configuration error: {e}")
        print(f"ERROR: {e}")
        return 1
    except ImportError as e:
        logger.error(f"❌ Missing dependency: {e}")
        print(f"ERROR: Missing dependency - {e}")
        print("Run: pip install -r requirements.txt")
        return 1
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}", exc_info=True)
        print(f"ERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

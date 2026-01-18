"""
Audio module for Feelio - handles speech recognition and text-to-speech.
"""

import logging
import time
from typing import Optional
import speech_recognition as sr
from gtts import gTTS
import pygame
import os

logger = logging.getLogger(__name__)


class AudioManager:
    """Manages microphone input and speaker output."""

    def __init__(
        self,
        microphone_index: int = 0,
        speech_timeout: int = 5,
        phrase_time_limit: int = 10,
        ambient_noise_duration: int = 1,
    ):
        """
        Initialize audio manager.

        Args:
            microphone_index: Index of microphone device.
            speech_timeout: Timeout for listening in seconds.
            phrase_time_limit: Maximum time to listen for speech in seconds.
            ambient_noise_duration: Time to adjust for ambient noise in seconds.
        """
        self.microphone_index = microphone_index
        self.speech_timeout = speech_timeout
        self.phrase_time_limit = phrase_time_limit
        self.ambient_noise_duration = ambient_noise_duration
        self.recognizer = sr.Recognizer()
        pygame.mixer.init()
        logger.info("✅ AudioManager initialized")

    def listen_to_user(self) -> Optional[str]:
        """
        Listen to microphone input and convert to text using Google Speech Recognition.

        Returns:
            str: Transcribed user speech, or None if failed/timed out.
        """
        try:
            with sr.Microphone(device_index=self.microphone_index) as source:
                logger.info("🎧 Listening...")
                self.recognizer.adjust_for_ambient_noise(
                    source, duration=self.ambient_noise_duration
                )

                audio = self.recognizer.listen(
                    source,
                    timeout=self.speech_timeout,
                    phrase_time_limit=self.phrase_time_limit,
                )

                logger.debug("⏳ Processing speech...")
                text = self.recognizer.recognize_google(audio)
                logger.info(f"🗣️ Transcribed: {text}")
                return text

        except sr.WaitTimeoutError:
            logger.warning("⚠️ No speech detected (timeout)")
            return None
        except sr.UnknownValueError:
            logger.warning("⚠️ Could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error(f"❌ Speech Recognition error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Microphone error: {e}")
            return None

    def speak_response(
        self,
        text: str,
        language: str = "en",
        slow: bool = False,
        pre_pause: float = 0.0,
    ) -> bool:
        """
        Convert text to speech and play it.

        Args:
            text: The text to speak.
            language: Language code (default: "en").
            slow: If True, speak slowly.
            pre_pause: Pause before speaking in seconds.

        Returns:
            bool: True if successful, False otherwise.
        """
        timestamp = int(time.time())
        filename = f"response_{timestamp}.mp3"

        try:
            if pre_pause:
                time.sleep(pre_pause)

            logger.debug(f"🔊 Generating speech ({len(text)} chars)")
            tts = gTTS(text=text, lang=language, slow=slow)
            tts.save(filename)

            pygame.mixer.music.load(filename)
            pygame.mixer.music.play()

            while pygame.mixer.music.get_busy():
                pygame.time.Clock().tick(10)

            pygame.mixer.music.unload()

            # Clean up temp file
            try:
                os.remove(filename)
            except OSError:
                pass

            logger.debug("✅ Speech played successfully")
            return True

        except Exception as e:
            logger.error(f"❌ TTS error: {e}")
            # Try to clean up
            try:
                os.remove(filename)
            except OSError:
                pass
            return False

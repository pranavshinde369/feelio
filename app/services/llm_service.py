from google import genai
from google.genai import types
from app.config import get_settings
import json

settings = get_settings()
client = genai.Client(api_key=settings.GEMINI_API_KEY)

class LLMService:
    @staticmethod
    def generate_therapy_response(emotion: str, user_input: str | None) -> dict:
        """
        Generates empathetic text + UI commands using Gemini.
        """
        user_input = user_input or "(User is silent, just observing)"
        
        system_prompt = f"""
        You are Feelio, an adaptive AI interface.
        Current User State: {emotion.upper()}
        User Input: "{user_input}"

        Your goal is to soothe, encourage, or mirror the user's energy.
        
        Return a JSON object strictly matching this schema:
        {{
            "reply_text": "Your short empathetic verbal response (max 20 words)",
            "ui_hex_color": "A hex code suitable for the mood (e.g. #FFCDD2 for stress, #E0F2F1 for calm)",
            "animation": "one of [breathe_slow, pulse_fast, static, flow]",
            "action_suggestion": "A micro-action (e.g. 'Drop your shoulders', 'Sip water')"
        }}
        """

        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=system_prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            return response.parsed
        except Exception as e:
            print(f"LLM Error: {e}")
            # Fallback for safety
            return {
                "reply_text": "I'm here with you. Take a moment.",
                "ui_hex_color": "#E0F2F1",
                "animation": "breathe_slow",
                "action_suggestion": "Just breathe"
            }
# app/schemas.py

from pydantic import BaseModel, Field
from typing import Optional

# --- REQUEST MODEL (Input from Frontend) ---
class UserStateInput(BaseModel):
    """
    Defines the data structure the frontend MUST send to /api/process.
    """
    # The text the user typed in the chat (Optional, because they might just be silent)
    user_text: Optional[str] = Field(None, description="Raw text typed by user")
    
    # --- Vision Data ---
    # These come from MediaPipe in the browser. 
    # We expect a number between 0.0 and 1.0.
    face_sadness: float = Field(0.0, ge=0.0, le=1.0, description="Sadness probability")
    face_stress: float = Field(0.0, ge=0.0, le=1.0, description="Brows down/frown probability")
    face_joy: float = Field(0.0, ge=0.0, le=1.0, description="Smile probability")
    
    # --- Audio Data ---
    # Calculated in the browser using Web Audio API
    voice_jitter: float = Field(0.0, description="Variance in pitch/tone indicating anxiety")


# --- RESPONSE MODELS (Output to Frontend) ---

class AdaptiveUIResponse(BaseModel):
    """
    Instructions for how the UI should change appearance.
    """
    # The background color hex code (e.g., #E0F2F1)
    theme_color: str = Field(..., example="#E0F2F1")
    
    # The type of CSS animation to trigger (e.g., 'breathe_slow')
    animation_mode: str = Field(..., example="breathe_slow")
    
    # Whether to show the therapy widget/popup
    show_widget: bool = False

class TherapyResponse(BaseModel):
    """
    The main response object returned to the client.
    """
    # The final emotion decided by our Logic Engine
    detected_emotion: str
    
    # What the AI therapist says back to the user
    reply_text: str
    
    # The UI instructions (nested object from above)
    ui_adaptation: AdaptiveUIResponse
    
    # A specific physical action suggestion (e.g. "Drink water")
    suggested_action: str
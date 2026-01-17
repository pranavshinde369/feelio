from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.schemas import UserStateInput, TherapyResponse, AdaptiveUIResponse
from app.services.fusion import EmotionFusionEngine
from app.services.llm_service import LLMService

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time backend for Feelio Emotional Support System",
    version="1.0.0"
)

# CORS Config (Crucial for React connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "healthy", "service": "feelio-backend"}

@app.post("/api/process", response_model=TherapyResponse)
async def process_user_state(data: UserStateInput):
    """
    Main Loop:
    1. Fuse visual/audio/text signals -> Emotion
    2. Send emotion + text to Gemini -> Response + UI Command
    3. Return everything to Frontend
    """
    
    # Step 1: Fuse Signals
    dominant_emotion = EmotionFusionEngine.derive_state(data)
    
    # Step 2: Get AI Guidance
    ai_output = LLMService.generate_therapy_response(
        emotion=dominant_emotion,
        user_input=data.user_text
    )
    
    # Step 3: Construct Response
    return TherapyResponse(
        detected_emotion=dominant_emotion,
        reply_text=ai_output["reply_text"],
        suggested_action=ai_output["action_suggestion"],
        ui_adaptation=AdaptiveUIResponse(
            theme_color=ai_output["ui_hex_color"],
            animation_mode=ai_output["animation"],
            show_widget=True
        )
    )
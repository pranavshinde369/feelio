# Environment Variables Required

## Render (Backend)
GEMINI_API_KEY=your_actual_gemini_api_key_from_google_ai_studio
APP_ENV=production
DEBUG_MODE=False
LOG_LEVEL=INFO
ENABLE_SAFETY_NET=True
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
LOG_SESSIONS=True

## Vercel (Frontend)
VITE_API_URL=https://your-backend.onrender.com

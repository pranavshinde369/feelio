# Production Deployment Guide for Feelio

## ✅ What's Production-Ready

Feelio is now hardened for production with:

### 1. **Configuration Management** (`config.py`)
- Centralized config loading from `.env`
- Validation of critical settings on startup
- Masked API keys in logs (security)
- Support for dev/staging/production environments

### 2. **Structured Logging**
- File + console logging
- Logs stored in `feelio.log`
- Sensitive data never logged (API keys redacted)
- Appropriate log levels (DEBUG, INFO, WARNING, ERROR)

### 3. **Modular Architecture**
- `main.py` - Production entry point with graceful shutdown
- `audio_module.py` - Encapsulated audio I/O with error handling
- `therapy_utils.py` - Reusable therapy logic (testable)
- `config.py` - Centralized configuration

### 4. **Error Handling**
- Try-catch blocks in all critical sections
- Graceful degradation (continues on audio errors)
- Signal handlers for clean shutdown (Ctrl+C, SIGTERM)
- Comprehensive exception logging

### 5. **Type Hints & Documentation**
- Full type annotations on all functions
- Comprehensive docstrings
- Clear function purposes and parameters

### 6. **Session Management**
- Session logging with emotion tracking
- End-of-session summary generation
- Optional session persistence to JSON
- Crisis protocol with immediate flag

### 7. **Safety & Privacy**
- Safety keyword detection for self-harm language
- Crisis response protocol
- Session log encryption option (configurable)
- No hardcoded secrets

---

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Gemini API key
# GEMINI_API_KEY=your_key_here
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Production App
```bash
python main.py
```

---

## 📋 Configuration (`.env`)

Key variables:
- `GEMINI_API_KEY` - Your API key (required)
- `APP_ENV` - Set to "production" for deployment
- `DEBUG_MODE` - Set to False in production
- `LOG_LEVEL` - INFO for production, DEBUG for development
- `USE_VISION` - Enable/disable vision (requires TensorFlow)
- `ENABLE_SAFETY_NET` - Enable self-harm keyword detection
- `LOG_SESSIONS` - Save sessions to JSON files
- `MICROPHONE_INDEX` - Audio device index (0, 1, 2, etc.)

---

## 📊 Monitoring & Logging

All activity is logged to `feelio.log`:
```bash
# View logs in real-time
tail -f feelio.log

# Check for errors
grep "ERROR\|WARNING" feelio.log
```

---

## 🛡️ Security Checklist

- [ ] API key loaded from `.env`, never hardcoded
- [ ] `.env` file is in `.gitignore` (never commit secrets)
- [ ] Logs exclude API keys (auto-masked)
- [ ] Session files encrypted if enabled
- [ ] HTTPS for any remote communications
- [ ] Rate limiting on Gemini API calls (configure in API console)

---

## 🧪 Testing

Run the production app in test mode:
```bash
APP_ENV=development DEBUG_MODE=true python main.py
```

Expected output:
```
--- Starting Feelio (ENV: development)
Configuration: {...masked...}
✅ Configuration validated
✅ AudioManager initialized
✅ Feelio Therapist initialized
--- Starting Feelio Therapist Session ---
🎧 Listening...
```

---

## 📦 Deployment Options

### Local/Development
```bash
python main.py
```

### Docker (Coming Soon)
```bash
docker build -t feelio .
docker run --env-file .env feelio
```

### Cloud (AWS Lambda, Google Cloud, etc.)
- Use `main.py` as handler
- Ensure microphone/audio device compatibility
- Set environment variables in cloud console

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY is not set` | Copy `.env.example` → `.env`, add your key |
| Microphone not found | Check `MICROPHONE_INDEX` in `.env`, try 0, 1, 2 |
| TensorFlow DLL error | Use `main.py` (lite) instead of `therapist_fusion.py` |
| Session not saved | Ensure `SESSION_LOGS_PATH` exists and is writable |
| Slow response | Check internet; Gemini API rate limits may apply |

---

## 📈 Performance Tuning

- **Faster responses**: Reduce `SPEECH_PHRASE_LIMIT` (but may lose context)
- **Better audio**: Increase `AMBIENT_NOISE_DURATION` for noisy environments
- **Smoother pacing**: Adjust pace hint thresholds in `therapy_utils.py`

---

## 🎯 Next Steps

1. **Frontend Integration**: Use the Bolt/Lovable prompt from README
2. **Vision Support**: Upgrade to GPU machine for DeepFace emotion detection
3. **Multi-session**: Add database backend for persistent user profiles
4. **Analytics**: Track session quality, user retention, crisis interventions
5. **Mobile**: Deploy as mobile app with FastAPI backend

---

## 📞 Support

- Check `feelio.log` for detailed error traces
- Review `config.py` for all available settings
- Reference `therapy_utils.py` for the core logic

---

**Status**: ✅ Production-Ready  
**Last Updated**: 2026-01-18

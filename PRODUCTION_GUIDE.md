# Feelio - Production-Ready AI Therapist

## 📦 What You Have

A complete, production-ready multimodal AI therapist system with:

- ✅ **Voice I/O** - Speech recognition + text-to-speech
- ✅ **Solution-focused therapy** - Validates emotions then offers concrete actions
- ✅ **Session tracking** - Logs turns, generates end-of-session summaries
- ✅ **Safety protocol** - Detects self-harm keywords, crisis response
- ✅ **Adaptive pacing** - Slows down responses if user speaks fast
- ✅ **Playbook selector** - Offers specific coping strategies per emotion
- ✅ **Structured logging** - Production-grade error tracking
- ✅ **Config management** - `.env` based, no hardcoded secrets
- ✅ **Modular architecture** - Clean separation of concerns

---

## 🚀 Quick Start (3 steps)

### Step 1: Create `.env` file
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Step 2: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run
```bash
python main.py
```

That's it! The app will:
1. Listen for your voice
2. Transcribe it
3. Send to Gemini with therapy context
4. Speak the response back to you
5. Log everything in `feelio.log`

---

## 📁 Project Structure

```
feelio/
├── main.py                 # 🎯 PRODUCTION ENTRY POINT
├── config.py               # Configuration management + validation
├── audio_module.py         # Speech recognition + TTS encapsulation
├── therapy_utils.py        # Reusable therapy logic (testable, typed)
├── requirements.txt        # Python dependencies
├── .env.example            # Template for environment variables
├── .gitignore              # Git ignore rules (secrets safe)
├── DEPLOYMENT.md           # Deployment guide
├── Readme.md               # Project overview + features
│
├── therapist_fusion_lite.py # Voice-only (no TensorFlow needed)
├── therapist_core.py       # Legacy voice-only core
├── therapist_fusion.py     # Full vision+voice (requires GPU)
├── test_vision.py          # Camera emotion test
└── check_models.py         # API model probe
```

---

## 🎯 Key Features

### 1. **Solution-Focused Therapy**
- Validates emotions
- Offers specific coping strategies
- Keeps responses under 3 sentences
- Uses CBT techniques

### 2. **Multi-Channel Intelligence**
- Emotion trajectory tracking
- Contradiction detection ("You say fine, but you sound sad")
- Playbook selection based on emotion + intent
- Adaptive response pacing

### 3. **Safety Protocol**
- Real-time self-harm keyword detection
- Crisis response triggers
- Immediate escalation guidance
- Logged for audit trail

### 4. **Session Intelligence**
- Tracks emotion over time
- Records all conversation turns
- Generates end-of-session summary
- Optional session persistence

### 5. **Production Hardening**
- Structured logging (file + console)
- Graceful error handling
- Signal handlers for clean shutdown
- No secrets in logs (API keys masked)
- Type hints on all functions

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | (none) | **REQUIRED** - Your Gemini API key |
| `APP_ENV` | development | Set to "production" for deployment |
| `DEBUG_MODE` | False | Enable debug logging |
| `LOG_LEVEL` | INFO | DEBUG, INFO, WARNING, ERROR |
| `MICROPHONE_INDEX` | 0 | Audio input device (0=default) |
| `SPEECH_TIMEOUT` | 5 | Seconds to wait for user speech |
| `USE_VISION` | False | Enable vision (requires TensorFlow) |
| `ENABLE_SAFETY_NET` | True | Enable self-harm detection |
| `LOG_SESSIONS` | False | Save sessions to JSON files |
| `MODEL_NAME` | gemini-2.5-flash | Which Gemini model to use |

---

## 📊 What Happens in a Session

```
User speaks → Transcribed → Gemini processes with context
                              (emotion history, playbook, pace)
                              ↓
                         AI generates response
                              ↓
                         Spoken back to user
                              ↓
                         Logged to session + log file
                              ↓
                         (On exit) Summary generated
```

---

## 🛡️ Security & Privacy

✅ **Production hardening:**
- API keys loaded from environment (never hardcoded)
- `.env` in `.gitignore` (never committed)
- API keys redacted from logs
- Session files optional + controlled
- No telemetry or external tracking

---

## 🧪 Testing

### Test mode (verbose logging):
```bash
$env:APP_ENV="development"; $env:DEBUG_MODE="true"; python main.py
```

### Check configuration:
```bash
python -c "from config import Config; Config.validate(); print(Config.get_masked_config())"
```

### Verify dependencies:
```bash
pip install -r requirements.txt --check
```

---

## 📈 Production Deployment

### Docker (Optional)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "main.py"]
```

### Environment Variables
Set these in your deployment platform:
```
GEMINI_API_KEY=your_key
APP_ENV=production
DEBUG_MODE=false
LOG_LEVEL=INFO
```

### Monitoring
- Check `feelio.log` for all activity
- Set up log aggregation (ELK, Datadog, etc.)
- Alert on "ERROR" or "⚠️" markers

---

## 🎨 Frontend Integration

Use the **Bolt/Lovable prompt** from Readme.md to generate a sophisticated UI that connects to this backend via WebSocket or REST API.

Frontend should:
- Stream user audio to `/api/listen`
- Display Gemini responses in real-time
- Show emotion tag + trajectory sparkline
- Display current playbook
- Handle crisis protocol visually

---

## 📝 API Reference (for frontend integration)

### Core Classes

**FeelioTherapist** (in `main.py`)
```python
therapist = FeelioTherapist(config)
therapist.run()  # Start conversation loop
```

**AudioManager** (in `audio_module.py`)
```python
audio = AudioManager()
text = audio.listen_to_user()           # Returns transcribed text or None
audio.speak_response(text, slow=False)  # Play TTS
```

**SessionLog** (in `therapy_utils.py`)
```python
log = SessionLog()
log.add_turn(user_text, ai_text, emotion)
log.get_emotion_timeline()
log.get_recent_turns()
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `GEMINI_API_KEY is not set` | Edit `.env`, add your API key |
| Microphone not detected | Try `MICROPHONE_INDEX=1` or `2` in `.env` |
| TensorFlow errors | Use `main.py` (lite mode) - no vision needed |
| Slow response | Check internet; consider increasing `RESPONSE_MAX_LENGTH` |
| Session not saving | Create `session_logs/` folder, set `LOG_SESSIONS=true` |
| Permission denied on log file | Check write permissions in project directory |

---

## 📚 Code Quality

- **Type hints**: All functions have type annotations
- **Docstrings**: Comprehensive docs on every function
- **Error handling**: Try-catch blocks in all critical sections
- **Logging**: Every important action logged
- **Modularity**: Clear separation of concerns

---

## 🎯 Next Steps

1. **Run it**: `python main.py`
2. **Test it**: Say "I'm feeling overwhelmed"
3. **Frontend**: Build UI using Bolt/Lovable prompt
4. **Deploy**: Use DEPLOYMENT.md guide
5. **Monitor**: Watch `feelio.log` for issues

---

## 📞 Support

- All logs go to `feelio.log` (plus console)
- Configuration is in `config.py`
- Therapy logic is in `therapy_utils.py`
- Audio handling is in `audio_module.py`

**Status**: ✅ Production-Ready  
**Last Updated**: 2026-01-18  
**License**: MIT (or your choice)

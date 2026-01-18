# Feelio - AI Therapy Platform

An empathetic AI therapist combining voice, text, and emotion analysis using Google's Gemini AI and MediaPipe.

## 🏗️ Architecture

- **Backend**: Flask REST API (Python) → Deploy on Render
- **Frontend**: React + TypeScript + Vite → Deploy on Vercel
- **AI**: Google Gemini 2.5 Flash
- **Vision**: MediaPipe (Face + Emotion Detection)

## 🚀 Quick Start

### Backend Setup

```bash
cd feelio-be

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run development server
python app.py
```

Backend runs on `http://localhost:8080`

### Frontend Setup

```bash
cd feelio-fe

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run development server
npm run dev
```

Frontend runs on `http://localhost:5173`

## 📦 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

**Backend (Render)**:
1. Connect GitHub repo to Render
2. Set environment variables (especially `GEMINI_API_KEY`)
3. Deploy with: `gunicorn app:app`

**Frontend (Vercel)**:
1. Connect GitHub repo to Vercel
2. Set `VITE_API_URL` to your Render backend URL
3. Deploy automatically on push

## 🔑 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_api_key_here
APP_ENV=production
CORS_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Start Session
```bash
POST /api/session/start
Response: { "session_id": "abc123..." }
```

### Send Message
```bash
POST /api/chat
Body: {
  "session_id": "abc123...",
  "message": "I feel anxious",
  "emotion": "anxious"
}
Response: {
  "response": "I hear that anxiety...",
  "crisis_detected": false,
  "playbook": "grounding"
}
```

### Get Summary
```bash
POST /api/session/summary
Body: { "session_id": "abc123..." }
```

### End Session
```bash
POST /api/session/end
Body: { "session_id": "abc123..." }
```

## 🎯 Features

- ✅ Real-time AI therapy conversations
- ✅ Emotion detection (MediaPipe)
- ✅ Crisis intervention detection
- ✅ Cognitive Behavioral Therapy (CBT) techniques
- ✅ Session summaries
- ✅ Safety resources integration
- ✅ Production-ready REST API
- ✅ CORS configured for cross-origin requests

## 🛡️ Safety

- High-risk content detection
- Crisis intervention protocols
- Safety resource modal (988, Crisis Text Line, SAMHSA)
- Session logging (optional, disabled by default for privacy)
- HTTPS-only in production

## 🧪 Testing

### Backend
```bash
# Test health
curl http://localhost:8080/health

# Test session start
curl -X POST http://localhost:8080/api/session/start \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Frontend
```bash
npm run typecheck  # Type checking
npm run lint       # Linting
npm run build      # Production build
npm run preview    # Preview production build
```

## 📚 Tech Stack

### Backend
- Flask 2.2.2
- Google Generative AI (Gemini)
- MediaPipe 0.10.14
- TensorFlow 2.15.0
- Gunicorn 21.2.0
- Flask-CORS 3.0.10

### Frontend
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Lucide React (Icons)

## 🔧 Development

### Project Structure
```
feelio/
├── feelio-be/              # Backend Flask API
│   ├── app.py              # Main API server (PRODUCTION)
│   ├── main.py             # Standalone CLI version (desktop)
│   ├── config.py           # Configuration management
│   ├── therapy_utils.py    # Therapy logic & prompts
│   ├── audio_module.py     # Audio capture & TTS
│   ├── vision_module.py    # MediaPipe emotion detection
│   ├── requirements.txt    # Python dependencies
│   ├── render.yaml         # Render deployment config
│   └── .env.example        # Environment template
├── feelio-fe/              # Frontend React app
│   ├── src/
│   │   ├── App.tsx         # Main app component
│   │   ├── services/api.ts # API client
│   │   ├── components/     # UI components
│   │   └── types.ts        # TypeScript types
│   ├── package.json
│   ├── vercel.json         # Vercel deployment config
│   └── .env.example        # Environment template
├── DEPLOYMENT.md           # Detailed deployment guide
└── README.md              # This file
```

### Development Workflow

1. **Start backend**: `cd feelio-be && python app.py`
2. **Start frontend**: `cd feelio-fe && npm run dev`
3. **Make changes**: Edit files and see live reload
4. **Test**: Run tests and type checks before committing
5. **Deploy**: Push to GitHub, automatic deployments on Render/Vercel

## 🐛 Troubleshooting

### Backend Issues

**Import errors**:
```bash
pip install -r requirements.txt
```

**API key errors**:
- Check `.env` file has `GEMINI_API_KEY` set
- Verify key is valid at Google AI Studio

**CORS errors**:
- Update `CORS_ORIGINS` in `.env` to include frontend URL
- Restart backend after changes

### Frontend Issues

**API connection fails**:
- Check `VITE_API_URL` in `.env` points to backend
- Verify backend is running and healthy

**Build errors**:
```bash
npm run typecheck  # Find TypeScript errors
npm run lint       # Find linting errors
```

**Module not found**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is for educational and research purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This is an AI-powered educational tool and NOT a replacement for professional mental health services. 

**If you're experiencing a mental health crisis, please contact:**
- **988** - Suicide & Crisis Lifeline (USA)
- **911** - Emergency services
- **Crisis Text Line**: Text HOME to 741741
- **SAMHSA National Helpline**: 1-800-662-4357

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review logs in Render/Vercel dashboards

## 🎓 Learning Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Google Gemini API](https://ai.google.dev/)
- [MediaPipe](https://mediapipe.dev/)
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)

---

**Built with ❤️ using Google Gemini AI**

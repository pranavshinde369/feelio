# Feelio - Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Get Your API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create/copy your Gemini API key

### Step 2: Deploy Backend to Render
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `feelio-backend`
   - **Root Directory**: `feelio-be`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
5. Add environment variables:
   ```
   GEMINI_API_KEY=your_key_here
   APP_ENV=production
   DEBUG_MODE=False
   CORS_ORIGINS=*
   ENABLE_SAFETY_NET=True
   ```
6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. Copy your backend URL (e.g., `https://feelio-backend.onrender.com`)

### Step 3: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `feelio-fe`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable:
   ```
   VITE_API_URL=https://feelio-backend.onrender.com
   ```
   (Use your actual Render URL from Step 2)
6. Click **"Deploy"**
7. Wait for deployment (1-2 minutes)
8. Copy your frontend URL (e.g., `https://feelio.vercel.app`)

### Step 4: Update CORS
1. Go back to Render dashboard
2. Open your backend service
3. Update `CORS_ORIGINS` environment variable:
   ```
   CORS_ORIGINS=https://feelio.vercel.app,http://localhost:5173
   ```
   (Use your actual Vercel URL from Step 3)
4. Save and wait for redeploy

### Step 5: Test
1. Visit your Vercel URL
2. Open browser console (F12)
3. Check for errors
4. Try starting a session and sending a message

## ✅ Verification

Test backend health:
```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "feelio-backend",
  "version": "1.0.0"
}
```

## 🐛 Common Issues

**"CORS error"**
- Update `CORS_ORIGINS` in Render with your Vercel URL
- Restart the Render service

**"API connection failed"**
- Check `VITE_API_URL` in Vercel settings
- Verify backend is running (check health endpoint)

**"Gemini API error"**
- Verify `GEMINI_API_KEY` is correct in Render
- Check quota at Google AI Studio

**Backend is slow (30-60s)**
- Normal on Render free tier (cold starts)
- First request after inactivity takes longer
- Subsequent requests are fast

## 📊 What's Deployed

### Backend API Endpoints
- `GET /health` - Health check
- `POST /api/session/start` - Start new session
- `POST /api/chat` - Send message
- `POST /api/session/summary` - Get summary
- `POST /api/session/end` - End session

### Frontend Features
- Real-time AI therapy conversations
- Emotion tracking interface
- Session transcripts
- Safety resources modal
- Responsive design

## 🎯 Next Steps

1. **Custom Domain** (optional)
   - Add custom domain in Render/Vercel dashboards

2. **Monitor Usage**
   - Check Render dashboard for backend metrics
   - Check Vercel dashboard for frontend analytics

3. **Upgrade If Needed**
   - Render: $7/month eliminates cold starts
   - Vercel: $20/month for commercial use

## 📞 Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide
- Check [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for verification
- Review logs in Render/Vercel dashboards
- Open GitHub issue for bugs

---

**Total Time**: ~5-10 minutes  
**Cost**: $0 (free tiers)  
**Status**: Production Ready ✅

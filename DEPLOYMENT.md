# Feelio - Production Deployment Guide

## Backend Deployment (Render)

### Prerequisites
- GitHub repository connected to Render
- Gemini API key

### Steps

1. **Connect Repository to Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `feelio-be` directory as root

2. **Configure Environment Variables**
   In Render dashboard, add these environment variables:
   ```
   GEMINI_API_KEY=your_actual_api_key
   APP_ENV=production
   DEBUG_MODE=False
   LOG_LEVEL=INFO
   ENABLE_SAFETY_NET=True
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```

3. **Build Settings**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Python Version: 3.11

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy
   - Copy your backend URL (e.g., `https://feelio-backend.onrender.com`)

### Health Check
```bash
curl https://your-backend-url.onrender.com/health
```

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account
- Backend URL from Render

### Steps

1. **Install Vercel CLI (Optional)**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variable**
   Create `.env.production` in `feelio-fe`:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

3. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select `feelio-fe` as root directory
   - Add environment variable:
     - Key: `VITE_API_URL`
     - Value: `https://your-backend-url.onrender.com`
   - Click "Deploy"

4. **Deploy via CLI**
   ```bash
   cd feelio-fe
   vercel --prod
   ```

### Update Backend CORS
After deployment, update backend `CORS_ORIGINS` in Render:
```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

## Testing Production

1. **Test Backend**
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/session/start \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. **Test Frontend**
   - Open `https://your-app.vercel.app`
   - Check browser console for any errors
   - Test starting a session

## Monitoring

### Backend (Render)
- View logs in Render dashboard
- Monitor health endpoint: `/health`
- Set up alerts for crashes

### Frontend (Vercel)
- View deployment logs in Vercel dashboard
- Monitor analytics
- Check Edge Network performance

## Troubleshooting

### Backend Issues
- **500 errors**: Check Render logs for Python errors
- **CORS errors**: Verify `CORS_ORIGINS` includes your Vercel URL
- **API key errors**: Verify `GEMINI_API_KEY` is set correctly

### Frontend Issues
- **Blank screen**: Check browser console for errors
- **API connection fails**: Verify `VITE_API_URL` is set correctly
- **Build fails**: Check Vercel logs for TypeScript/build errors

## Cost Optimization

### Render (Backend)
- Free tier: 750 hours/month
- Upgrade to paid plan for always-on service
- Cold starts may occur on free tier (30-60s delay)

### Vercel (Frontend)
- Free tier: Unlimited deployments
- 100GB bandwidth/month
- Automatic global CDN

## Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] CORS is configured correctly
- [ ] API keys are kept secret
- [ ] HTTPS is enabled (automatic on both platforms)
- [ ] Rate limiting considered for production
- [ ] Session storage migrated to Redis/DB for scale
- [ ] Logging excludes sensitive data

## Scaling Considerations

1. **Session Storage**: Move from in-memory to Redis/PostgreSQL
2. **Rate Limiting**: Add Flask-Limiter for API protection
3. **Caching**: Add response caching for frequently asked questions
4. **Monitoring**: Add Sentry or similar for error tracking
5. **Database**: Add PostgreSQL for session persistence

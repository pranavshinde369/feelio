# Feelio Production Checklist

## Pre-Deployment Checklist

### Backend (Render)
- [ ] Environment variables configured in Render dashboard
  - [ ] `GEMINI_API_KEY` set (get from Google AI Studio)
  - [ ] `APP_ENV=production`
  - [ ] `DEBUG_MODE=False`
  - [ ] `CORS_ORIGINS` includes Vercel URL
  - [ ] `ENABLE_SAFETY_NET=True`
  - [ ] `LOG_LEVEL=INFO`
- [ ] GitHub repository connected
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `gunicorn app:app`
- [ ] Python version: 3.11
- [ ] Health check path: `/health`
- [ ] Auto-deploy enabled

### Frontend (Vercel)
- [ ] Environment variable configured
  - [ ] `VITE_API_URL` set to Render backend URL
- [ ] GitHub repository connected
- [ ] Root directory: `feelio-fe`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Auto-deploy enabled

## Post-Deployment Verification

### Backend Health Check
```bash
# Test health endpoint
curl https://your-backend.onrender.com/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "feelio-backend",
#   "version": "1.0.0"
# }
```

### Backend API Tests
```bash
# Test session creation
curl -X POST https://your-backend.onrender.com/api/session/start \
  -H "Content-Type: application/json" \
  -d '{}'

# Test chat endpoint
curl -X POST https://your-backend.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test",
    "message": "Hello",
    "emotion": "neutral"
  }'
```

### Frontend Verification
- [ ] Visit `https://your-app.vercel.app`
- [ ] Check browser console for errors
- [ ] Test session start (should see session ID in network tab)
- [ ] Test sending a message
- [ ] Verify AI response appears
- [ ] Check emotion display works
- [ ] Test safety modal opens
- [ ] Verify responsive design on mobile

### CORS Verification
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser console
- [ ] API responses are received correctly

## Security Checklist

- [ ] No API keys in frontend code
- [ ] All secrets in environment variables
- [ ] HTTPS enabled (automatic on Render/Vercel)
- [ ] CORS restricted to specific origins
- [ ] Input validation on backend
- [ ] Error messages don't expose sensitive info
- [ ] Session IDs are random and secure
- [ ] High-risk content detection enabled

## Performance Checklist

- [ ] Backend responds < 2s (check Render metrics)
- [ ] Frontend loads < 3s (check Vercel analytics)
- [ ] Images optimized
- [ ] Bundle size reasonable (check Vercel build log)
- [ ] No console errors or warnings

## Monitoring Setup

### Render (Backend)
- [ ] Enable email/Slack alerts for crashes
- [ ] Monitor health endpoint uptime
- [ ] Check logs for errors regularly
- [ ] Set up custom domain (optional)

### Vercel (Frontend)
- [ ] Enable Vercel Analytics (optional)
- [ ] Monitor deployment status
- [ ] Check Edge Network performance
- [ ] Set up custom domain (optional)

## Cost Monitoring

### Render Free Tier
- 750 hours/month included
- [ ] Monitor usage in dashboard
- [ ] Expect cold starts (30-60s) after inactivity
- [ ] Upgrade to paid if needed for always-on

### Vercel Free Tier
- Unlimited deployments
- 100GB bandwidth/month
- [ ] Monitor bandwidth usage
- [ ] Upgrade if limits exceeded

## Known Limitations (Free Tier)

### Backend (Render Free)
- Cold start after 15 minutes of inactivity
- May take 30-60s to respond to first request
- In-memory sessions lost on restart
- No background workers

### Frontend (Vercel Free)
- Commercial use requires Pro plan
- Limited to 100GB bandwidth/month
- No advanced analytics

## Scaling Recommendations

### When to Upgrade Backend
- Consistent traffic (eliminate cold starts)
- Need persistent session storage
- Want background jobs
- Need more memory/CPU

**Recommended upgrades:**
1. Render Starter ($7/month) - Eliminates cold starts
2. Add Redis for session storage
3. Add PostgreSQL for data persistence

### When to Upgrade Frontend
- Commercial use
- Need advanced analytics
- Exceed bandwidth limits
- Want preview deployments for PRs

**Recommended upgrade:**
- Vercel Pro ($20/month)

## Troubleshooting Guide

### Backend 500 Errors
1. Check Render logs for Python errors
2. Verify `GEMINI_API_KEY` is valid
3. Check all required env vars are set
4. Look for import/dependency errors

### Frontend Blank Screen
1. Check browser console
2. Verify `VITE_API_URL` is correct
3. Test backend health endpoint directly
4. Check Vercel build logs

### CORS Errors
1. Update `CORS_ORIGINS` in Render
2. Include both `https://` and `http://localhost:5173`
3. Restart backend service
4. Clear browser cache

### Cold Start Issues (Render Free)
- Expected on free tier
- First request after inactivity takes 30-60s
- Subsequent requests are fast
- Upgrade to paid plan to eliminate

## Production Optimization

### Backend
- [ ] Add request rate limiting (Flask-Limiter)
- [ ] Implement caching for common responses
- [ ] Add request logging with structured format
- [ ] Set up error tracking (Sentry)
- [ ] Add database for session persistence
- [ ] Implement Redis for session storage

### Frontend
- [ ] Add service worker for offline support
- [ ] Implement response caching
- [ ] Add analytics tracking
- [ ] Optimize bundle size
- [ ] Add error boundary components
- [ ] Implement retry logic for failed API calls

## Maintenance Schedule

### Daily
- [ ] Check error logs in Render
- [ ] Monitor Vercel deployment status

### Weekly
- [ ] Review API usage metrics
- [ ] Check for dependency updates
- [ ] Monitor cost/usage

### Monthly
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Check backup/restore procedures
- [ ] Review and optimize costs

## Emergency Contacts

### If Site Goes Down
1. Check Render/Vercel status pages
2. Review recent deployments
3. Check environment variables
4. Rollback to previous version if needed

### Support Resources
- Render Support: https://render.com/support
- Vercel Support: https://vercel.com/support
- Gemini API Status: https://status.ai.google.dev/

## Success Metrics

Track these to measure success:
- Backend uptime %
- Average response time
- Number of sessions created
- Crisis interventions triggered
- User satisfaction (if collecting feedback)
- Error rate
- API costs

---

**Last Updated**: January 18, 2026
**Version**: 1.0.0

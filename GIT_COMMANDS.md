# Git Commands for Deployment

## Initial Commit (if needed)
```bash
cd C:\Users\shraj\OneDrive\Desktop\feelio

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: production-ready deployment for Render and Vercel

- Add Flask REST API with Gunicorn
- Add API service layer for frontend
- Configure CORS for cross-origin requests
- Add Render and Vercel deployment configs
- Add comprehensive documentation
- Add environment variable templates
- Add health check and monitoring endpoints
- Implement crisis detection and safety features"

# Push to main
git push origin main
```

## Subsequent Updates
```bash
# After making changes
git add .
git commit -m "your commit message here"
git push origin main
```

## Create GitHub Repository (if needed)
```bash
# On GitHub, create new repository called "feelio"

# Link local to remote
git remote add origin https://github.com/YOUR_USERNAME/feelio.git
git branch -M main
git push -u origin main
```

## Verify Git Status
```bash
# Check what's tracked
git status

# Check remote
git remote -v

# Check branch
git branch
```

## Files That Should Be Committed
- ✅ All .md documentation files
- ✅ app.py (backend API)
- ✅ render.yaml (deployment config)
- ✅ vercel.json (deployment config)
- ✅ package.json (frontend dependencies)
- ✅ requirements.txt (backend dependencies)
- ✅ .env.example (template files)
- ✅ All source code files

## Files That Should NOT Be Committed
- ❌ .env (actual environment variables)
- ❌ node_modules/ (frontend dependencies)
- ❌ __pycache__/ (Python cache)
- ❌ venv/ (Python virtual environment)
- ❌ dist/ (build output)
- ❌ .vscode/ (editor settings)

These are already in .gitignore files.

## After Pushing
1. Go to render.com and connect your GitHub repo
2. Go to vercel.com and connect your GitHub repo
3. Both will auto-deploy on push to main

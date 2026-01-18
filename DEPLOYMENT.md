# Feelio Deployment Guide

This guide will help you deploy Feelio to **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render)

1.  **Push Code**: Push your code to GitHub/GitLab.
2.  **Create Service**:
    *   Go to [dashboard.render.com](https://dashboard.render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your repository.
    *   Select `feelio-be` as the **Root Directory**.
3.  **Configure**:
    *   **Name**: `feelio-backend`
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
4.  **Environment Variables** (Add these in Render Dashboard):
    *   `GEMINI_API_KEY`: *Your Google Gemini API Key*
    *   `APP_ENV`: `production`
    *   `PORT`: `8080` (Render will override this, but good to have)
    *   `CORS_ORIGINS`: `https://your-frontend.vercel.app` (Add this *after* you deploy frontend)
5.  **Deploy**: Click **Create Web Service**.
6.  **Copy URL**: Once live, copy your backend URL (e.g., `https://feelio-be.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  **Push Code**: Ensure your latest changes are pushed.
2.  **Create Project**:
    *   Go to [vercel.com](https://vercel.com/).
    *   **Add New** -> **Project**.
    *   Import your repository.
3.  **Configure**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `feelio-fe` (Edit this to point to the frontend folder)
4.  **Environment Variables**:
    *   `VITE_API_URL`: *Your Render Backend URL* (e.g., `https://feelio-be.onrender.com`)
    *   *Note*: The `vercel.json` included in `feelio-fe` handles API rewrites, so calls to `/api` will proxy to your backend.
5.  **Deploy**: Click **Deploy**.

## 3. Final Connection

1.  **Frontend**: Open your Vercel URL.
2.  **Backend Check**: The app should show "F" logo and verify connection. If "OFFLINE", check:
    *   Did you add the `VITE_API_URL` to Vercel?
    *   Did you add the frontend URL to `CORS_ORIGINS` in Render? (Optional but recommended for security).

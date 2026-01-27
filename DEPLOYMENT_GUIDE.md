# Streakfarm Telegram Mini App - Complete Deployment Guide

**Last Updated:** January 26, 2026

## Overview

This guide provides step-by-step instructions to deploy your Streakfarm Telegram Mini App to Vercel and configure all necessary environment variables and secrets.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Supabase Configuration](#supabase-configuration)
3. [Vercel Deployment](#vercel-deployment)
4. [Testing the App](#testing-the-app)
5. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub account with the repository pushed
- [ ] Supabase project created and configured
- [ ] Telegram Bot Token from BotFather
- [ ] Vercel account connected to GitHub
- [ ] All code changes applied (see `analysis_report.md`)

---

## Supabase Configuration

### Step 1: Set the TELEGRAM_BOT_TOKEN Secret

This is the **most critical step** for authentication to work.

1. Go to your **Supabase Dashboard** → Select your project
2. Navigate to **Edge Functions** (in the left sidebar)
3. Click on **Secrets** (or look for the secrets management section)
4. Click **New Secret** and add:
   - **Name:** `TELEGRAM_BOT_TOKEN`
   - **Value:** Your Telegram Bot Token (from BotFather)
   - Click **Save**

**Example:**
```
Name: TELEGRAM_BOT_TOKEN
Value: 1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
```

### Step 2: Verify Other Supabase Secrets

Ensure these secrets are also set in Supabase:
- `SUPABASE_URL` (should be auto-configured)
- `SUPABASE_SERVICE_ROLE_KEY` (should be auto-configured)

### Step 3: Deploy Supabase Functions

If you haven't already, deploy the Supabase Edge Functions:

```bash
cd supabase
supabase functions deploy telegram-auth
supabase functions deploy daily-checkin
supabase functions deploy complete-task
supabase functions deploy open-box
supabase functions deploy award-wallet-badge
# ... deploy other functions as needed
```

---

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. Go to **Vercel Dashboard** → Click **Add New** → **Project**
2. Select **Import Git Repository**
3. Find and select your `streakfarm` repository
4. Click **Import**

### Step 2: Configure Environment Variables

In the Vercel project settings, add these environment variables:

| Variable | Value | Source |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Your publishable key | Supabase Dashboard → Settings → API |
| `TELEGRAM_BOT_TOKEN` | Your bot token | BotFather |

**Steps:**
1. In Vercel project → **Settings** → **Environment Variables**
2. Add each variable with its value
3. Select which environments (Production, Preview, Development)
4. Click **Save**

### Step 3: Deploy

1. Click **Deploy** to trigger the build
2. Wait for the build to complete (should take 2-3 minutes)
3. Once successful, you'll get a deployment URL like: `https://streakfarm-xyz.vercel.app`

### Step 4: Update Telegram Bot Settings

1. Go to **BotFather** on Telegram
2. Select your bot and use `/setmenubutton`
3. Set the Web App URL to your Vercel deployment URL
4. Example: `https://streakfarm-xyz.vercel.app`

---

## Testing the App

### Test 1: Open in Browser

1. Visit your Vercel URL directly: `https://streakfarm-xyz.vercel.app`
2. You should see the splash screen with "Open in Telegram to continue"
3. Check the browser console (F12) for any errors

### Test 2: Open in Telegram

1. Open Telegram and find your bot
2. Click the menu button or use `/start`
3. The Mini App should open in a webview
4. You should see the app loading and then the main dashboard

### Test 3: Authentication Flow

1. The app should automatically authenticate using your Telegram ID
2. Check the browser console for logs like:
   - "Telegram WebApp detected"
   - "Attempting Telegram auto-login..."
   - "Telegram auth response: 200"

### Test 4: User Profile

1. After authentication, you should see the dashboard with:
   - Your Telegram username
   - Streak counter
   - Points display
   - Boxes and badges sections

---

## Troubleshooting

### Issue: "App not opening in Telegram"

**Cause:** Telegram WebApp SDK not initialized properly

**Solution:**
1. Check browser console (F12 in Telegram) for errors
2. Verify the Telegram WebApp SDK is loaded: `window.Telegram?.WebApp`
3. Check that your bot's menu button URL is correctly set

### Issue: "Authentication failed" or "Connection timeout"

**Cause:** Missing `TELEGRAM_BOT_TOKEN` in Supabase or Vercel

**Solution:**
1. Verify `TELEGRAM_BOT_TOKEN` is set in **Supabase Edge Functions Secrets**
2. Verify `TELEGRAM_BOT_TOKEN` is set in **Vercel Environment Variables**
3. Redeploy both Supabase functions and Vercel

### Issue: "Invalid Telegram authentication data"

**Cause:** Incorrect bot token or signature validation failure

**Solution:**
1. Double-check the bot token from BotFather (no spaces or typos)
2. Ensure the token is the same in both Supabase and Vercel
3. Verify the token hasn't been regenerated in BotFather

### Issue: Build fails on Vercel

**Cause:** Missing dependencies or configuration

**Solution:**
1. Check the build logs in Vercel for specific errors
2. Ensure all dependencies are in `package.json`
3. Verify `vercel.json` is in the root directory
4. Run `npm install` locally and test the build: `npm run build`

### Issue: "Rollup failed to resolve import"

**Cause:** Missing npm packages

**Solution:**
1. Run `npm install` to install all dependencies
2. Check `package.json` for all required packages
3. Commit and push to GitHub
4. Redeploy on Vercel

---

## Environment Variables Reference

### Client-Side (Vite)

These are used in the frontend and must be prefixed with `VITE_`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

### Server-Side (Supabase Edge Functions)

These are used in backend functions:

```
TELEGRAM_BOT_TOKEN=your-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## File Changes Summary

The following files were modified to fix the issues:

| File | Change | Reason |
| :--- | :--- | :--- |
| `vercel.json` | Created | Configure SPA routing on Vercel |
| `src/hooks/useTelegram.ts` | Updated | Improve Telegram SDK initialization |
| `src/providers/AuthProvider.tsx` | Updated | Fix authentication flow and add session refresh |
| `package.json` | Updated | Add missing dependencies |

---

## Next Steps

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Fix: Vercel deployment, Telegram initialization, and authentication"
   git push origin main
   ```

2. **Deploy Supabase Functions**
   ```bash
   supabase functions deploy telegram-auth
   ```

3. **Configure Supabase Secrets**
   - Add `TELEGRAM_BOT_TOKEN` to Supabase Edge Functions Secrets

4. **Configure Vercel Environment Variables**
   - Add all required environment variables

5. **Trigger Vercel Deployment**
   - Push to GitHub or manually trigger in Vercel dashboard

6. **Test the App**
   - Open in browser and Telegram
   - Check console for errors
   - Verify authentication works

---

## Support

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Review the Vercel build logs
3. Check Supabase function logs
4. Verify all environment variables are set correctly
5. Ensure the bot token is correct and hasn't been regenerated

---

**Good luck with your deployment! 🚀**

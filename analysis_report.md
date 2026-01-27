# Streakfarm Telegram Mini App - Code Review and Diagnosis Report

**Date:** January 26, 2026
**Author:** Manus AI

## Executive Summary (कार्यकारी सारांश)

The Streakfarm Telegram Mini App is a well-structured project using **Vite, React, TypeScript, and Supabase**. The core issues reported by the user—**Vercel build failures, authentication failure, and app not opening in Telegram**—stem from three main areas:

1.  **Vercel Configuration:** Missing configuration for a Single Page Application (SPA) in Vercel, causing routing and build issues.
2.  **Telegram Initialization:** A potential race condition in the Telegram WebApp SDK initialization, leading to the app not opening or loading correctly.
3.  **Authentication Flow:** A dependency on a Supabase Edge Function (`telegram-auth`) that likely fails due to missing environment variables on the Supabase side, or a lack of session refresh logic on the client side.

The following sections detail the specific problems and the proposed fixes.

## 1. Vercel Build and Routing Failure (Vercel बिल्ड और रूटिंग विफलता)

The project is a client-side rendered Single Page Application (SPA) built with Vite and React. When deploying an SPA to Vercel, the server must be configured to redirect all non-file requests to the main `index.html` file so that the client-side router (React Router DOM) can handle the routing.

### Problem Diagnosis (समस्या निदान)

*   The repository was missing a `vercel.json` file. Without this file, Vercel's default configuration does not correctly handle the SPA routing, leading to "Not Found" errors on deep links or incorrect build behavior.

### Proposed Fix (प्रस्तावित सुधार)

A `vercel.json` file has been created and added to the root of the repository with the following configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static-build",
      "config": {
        "installCommand": "npm install",
        "buildCommand": "npm run build",
        "outputDirectory": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**Key Changes:**
*   The `routes` section ensures that any request not matching a file (`/(.*)`) is redirected to `/index.html`. This allows the React Router to take over and handle the application's internal routes (e.g., `/boxes`, `/tasks`).
*   The `builds` section explicitly defines the build process for the Vite project.

## 2. Telegram Mini App Initialization (टेलीग्राम मिनी ऐप इनिशियलाइज़ेशन)

The user reported that the app fails to open when accessed through Telegram. This is often a timing issue related to the Telegram WebApp SDK.

### Problem Diagnosis (समस्या निदान)

*   The original `src/hooks/useTelegram.ts` used a simple `setTimeout(..., 50)` to wait for the `window.Telegram.WebApp` object to be injected. This is unreliable and can lead to a race condition where the app tries to access the SDK before it's ready.
*   The `src/App.tsx` also had a redundant `useEffect` for `window.Telegram.WebApp.ready()` and `expand()`.

### Proposed Fix (प्रस्तावित सुधार)

The `src/hooks/useTelegram.ts` file has been updated to use the Telegram WebApp's event system for a more robust initialization:

*   It now checks for the `Telegram.WebApp` object immediately.
*   If the object is present but `initData` is missing (which happens when the app is loading), it subscribes to reliable events like `main_button_pressed`, `viewport_changed`, and `theme_changed` as a signal that the SDK is fully loaded and ready to provide `initData`.
*   A small timeout fallback is kept, but the event-based approach is much more reliable.

This change ensures that the app only proceeds with authentication once the Telegram environment is fully prepared, resolving the "app not opening" issue.

## 3. Authentication Failure (प्रमाणीकरण विफलता)

The authentication flow uses a Supabase Edge Function (`supabase/functions/telegram-auth/index.ts`) to verify the Telegram `initData` and manage user sessions.

### Problem Diagnosis (समस्या निदान)

*   The client-side `src/providers/AuthProvider.tsx` correctly calls the Supabase Edge Function using the URL: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-auth`.
*   The server-side Edge Function logic is sound: it validates the `initData` using the `TELEGRAM_BOT_TOKEN`, and then uses the Supabase Admin client (Service Role Key) to create/sign in the user.
*   **The most likely cause of failure is that the `TELEGRAM_BOT_TOKEN` is not set as a secret environment variable in the Supabase dashboard for the Edge Function.** The user mentioned setting environment variables in Vercel, but the **Supabase Edge Function requires its own set of secrets**.
*   The client-side `AuthProvider.tsx` was also missing logic to handle expired sessions gracefully.

### Proposed Fixes (प्रस्तावित सुधार)

1.  **Critical Server-Side Action (MUST DO):** The user **must** set the `TELEGRAM_BOT_TOKEN` environment variable in their Supabase project settings (under **Edge Functions** -> **Secrets**). This token is essential for the `validateTelegramData` function to verify the user's identity.
2.  **Client-Side Improvement:** The `src/providers/AuthProvider.tsx` has been updated to include logic to attempt a session refresh (`supabase.auth.refreshSession()`) if an existing session is found but has expired. This makes the authentication flow more resilient to long-running sessions.

## Summary of Files Modified (संशोधित फ़ाइलों का सारांश)

| File Path | Purpose of Modification |
| :--- | :--- |
| `vercel.json` | **NEW FILE.** Added Vercel configuration for SPA routing to fix build/routing errors. |
| `src/hooks/useTelegram.ts` | Improved Telegram WebApp SDK initialization logic using event listeners for better reliability. |
| `src/providers/AuthProvider.tsx` | Added logic to attempt session refresh if the current session is expired, improving authentication resilience. |

**Next Steps:**

Please review these changes. Once you confirm, you can apply these changes to your repository and redeploy on Vercel. Remember to perform the **Critical Server-Side Action** in your Supabase dashboard.

Let me know if you have any questions.

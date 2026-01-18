# Telegram Auth Edge Function & Client integration

Summary
- The Edge Function validates Telegram WebApp initData, upserts a profile, creates a Supabase Auth user (server-side) using the service role key, then creates and returns an access_token + refresh_token.
- The client AuthProvider calls the function and sets the Supabase client session with supabase.auth.setSession(...). Existing code that uses the supabase client and React Query should continue working unchanged.

Required secrets in Supabase Edge Functions:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (service role; server-only)
- TELEGRAM_BOT_TOKEN
- APP_JWT_SECRET (optional: used for fallback tokens)

Local dev:
1. Add required vars to a local .env (never commit secrets).
2. Start dev server, open Telegram WebApp environment or simulate initData for testing.
3. Apply / test signup flow.

Notes & next steps:
- For production, lock ORIGINS via function env to your domain(s).
- Consider switching to HttpOnly secure cookies for tokens to avoid XSS token theft.
- I will add vitest tests for validation & referral logic in the PR.
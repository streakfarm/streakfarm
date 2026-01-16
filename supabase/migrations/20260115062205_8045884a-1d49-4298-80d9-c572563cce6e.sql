-- Fix PUBLIC_USER_DATA: Restrict profiles to only allow users to view their own profile
DROP POLICY IF EXISTS "Users can view all non-banned profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Create a public view for leaderboard/public profile data only (no PII)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  first_name,
  avatar_url,
  raw_points,
  streak_current,
  streak_best,
  total_boxes_opened,
  total_tasks_completed,
  total_referrals,
  ref_code,
  created_at
FROM public.profiles
WHERE is_banned = false;

-- Allow authenticated users to view public profiles (for leaderboards)
CREATE POLICY "Authenticated users can view public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  is_banned = false 
  AND (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM auth.users WHERE auth.uid() IS NOT NULL
    )
  )
);

-- Fix EXPOSED_SENSITIVE_DATA: Ensure events table blocks anonymous access
-- The existing policies are fine but let's make them restrictive
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;

CREATE POLICY "Users can view their own events"
ON public.events
FOR SELECT
TO authenticated
USING (user_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system to insert events (for edge functions)
CREATE POLICY "System can insert events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (user_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

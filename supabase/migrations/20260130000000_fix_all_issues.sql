-- =============================================
-- STREAKFARM - COMPREHENSIVE FIXES MIGRATION
-- Fixes: Referrals, Wallet Rewards, Performance
-- =============================================

-- =============================================
-- 1. FIX: Add trigger to auto-update total_referrals
-- =============================================
CREATE OR REPLACE FUNCTION public.update_referrer_stats()
RETURNS TRIGGER AS $$
DECLARE
  referrer_bonus INT := 1000;
  referee_bonus INT := 500;
  config_value JSONB;
BEGIN
  -- Get referral bonuses from config
  SELECT value INTO config_value 
  FROM public.admin_config 
  WHERE id = 'referral_bonuses';
  
  IF config_value IS NOT NULL THEN
    referrer_bonus := COALESCE((config_value->>'referrer')::INT, 1000);
    referee_bonus := COALESCE((config_value->>'referee')::INT, 500);
  END IF;

  -- Update referrer's total_referrals count
  UPDATE public.profiles 
  SET 
    total_referrals = COALESCE(total_referrals, 0) + 1,
    raw_points = COALESCE(raw_points, 0) + referrer_bonus,
    updated_at = NOW()
  WHERE id = NEW.referrer_id;

  -- Update referee's points (welcome bonus)
  UPDATE public.profiles 
  SET 
    raw_points = COALESCE(raw_points, 0) + referee_bonus,
    referred_by = NEW.referrer_id,
    updated_at = NOW()
  WHERE id = NEW.referee_id;

  -- Add points ledger entry for referrer
  INSERT INTO public.points_ledger (
    user_id, 
    amount, 
    balance_after, 
    source, 
    description
  )
  SELECT 
    NEW.referrer_id,
    referrer_bonus,
    raw_points,
    'referral',
    'Referral bonus - new user joined'
  FROM public.profiles 
  WHERE id = NEW.referrer_id;

  -- Add points ledger entry for referee
  INSERT INTO public.points_ledger (
    user_id, 
    amount, 
    balance_after, 
    source, 
    description
  )
  SELECT 
    NEW.referee_id,
    referee_bonus,
    raw_points,
    'referral_bonus',
    'Welcome bonus - joined via referral'
  FROM public.profiles 
  WHERE id = NEW.referee_id;

  -- Log event
  INSERT INTO public.events (
    user_id,
    event_type,
    event_data
  )
  VALUES (
    NEW.referrer_id,
    'referral_completed',
    jsonb_build_object(
      'referee_id', NEW.referee_id,
      'referrer_bonus', referrer_bonus,
      'referee_bonus', referee_bonus
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_referrer_stats_trigger ON public.referrals;

-- Create trigger
CREATE TRIGGER update_referrer_stats_trigger
  AFTER INSERT ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referrer_stats();

-- =============================================
-- 2. FIX: Add indexes for performance optimization
-- =============================================

-- Index for faster profile lookups by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id_valid 
ON public.referrals(referrer_id) 
WHERE is_valid = true;

-- Index for faster task completions
CREATE INDEX IF NOT EXISTS idx_task_completions_user_task 
ON public.task_completions(user_id, task_id);

-- Index for faster points ledger queries
CREATE INDEX IF NOT EXISTS idx_points_ledger_user_source 
ON public.points_ledger(user_id, source);

-- Index for wallet-connected users
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_connected 
ON public.profiles(wallet_connected_at) 
WHERE wallet_connected_at IS NOT NULL;

-- =============================================
-- 3. FIX: Ensure wallet_connected badge exists
-- =============================================
INSERT INTO public.badges (
  id, 
  name, 
  description, 
  icon_emoji, 
  badge_category, 
  multiplier, 
  rarity, 
  requirements,
  is_active,
  sort_order
) VALUES (
  'wallet_connected',
  'Wallet Connected',
  'Connected TON wallet to StreakFarm',
  '👛',
  'wallet',
  1.1,
  'common',
  '{"wallet_connected": true}',
  true,
  300
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_emoji = EXCLUDED.icon_emoji,
  badge_category = EXCLUDED.badge_category,
  multiplier = EXCLUDED.multiplier,
  rarity = EXCLUDED.rarity,
  is_active = true;

-- =============================================
-- 4. FIX: Ensure connect_wallet task exists
-- =============================================
INSERT INTO public.tasks (
  id,
  title,
  description,
  icon_emoji,
  task_type,
  points_reward,
  requirements,
  is_repeatable,
  requires_wallet,
  status,
  sort_order
) VALUES (
  'connect_wallet',
  'Connect Wallet',
  'Connect your TON wallet to earn rewards',
  '👛',
  'wallet',
  5000,
  '{"wallet_connected": true}',
  false,
  false,
  'active',
  300
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  points_reward = EXCLUDED.points_reward,
  status = 'active',
  is_repeatable = false;

-- =============================================
-- 5. FIX: Update admin_config with wallet_connect bonus
-- =============================================
UPDATE public.admin_config 
SET value = jsonb_set(
  COALESCE(value, '{}'::jsonb),
  '{wallet_connect}',
  '5000'::jsonb
)
WHERE id = 'referral_bonuses';

-- If referral_bonuses doesn't exist, create it
INSERT INTO public.admin_config (id, value, description)
VALUES (
  'referral_bonuses',
  '{"referrer": 1000, "referee": 500, "wallet_connect": 5000}'::jsonb,
  'Referral bonus amounts and wallet connect reward'
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. FIX: Add function to get user stats (for performance)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_stats(_profile_id UUID)
RETURNS TABLE (
  total_referrals BIGINT,
  referral_points BIGINT,
  total_tasks BIGINT,
  total_boxes BIGINT,
  current_streak INT,
  best_streak INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE((SELECT COUNT(*) FROM public.referrals WHERE referrer_id = _profile_id AND is_valid = true), 0) as total_referrals,
    COALESCE((SELECT SUM(amount) FROM public.points_ledger WHERE user_id = _profile_id AND source = 'referral'), 0) as referral_points,
    COALESCE((SELECT COUNT(*) FROM public.task_completions WHERE user_id = _profile_id), 0) as total_tasks,
    COALESCE((SELECT COUNT(*) FROM public.boxes WHERE user_id = _profile_id AND opened_at IS NOT NULL), 0) as total_boxes,
    COALESCE((SELECT streak_current FROM public.profiles WHERE id = _profile_id), 0) as current_streak,
    COALESCE((SELECT streak_best FROM public.profiles WHERE id = _profile_id), 0) as best_streak
$$;

-- =============================================
-- 7. FIX: Add function to sync wallet and complete task
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_wallet_connect(
  _profile_id UUID,
  _wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  wallet_bonus INT := 5000;
  task_points INT := 5000;
  multiplier DECIMAL := 1.0;
  new_balance BIGINT;
  badge_awarded BOOLEAN := false;
BEGIN
  -- Get profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE id = _profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check if wallet already connected
  IF profile_record.wallet_connected_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet already connected');
  END IF;

  -- Get multiplier
  SELECT COALESCE(public.calculate_user_multiplier(_profile_id), 1.0) INTO multiplier;

  -- Calculate points with multiplier
  task_points := FLOOR(task_points * multiplier);
  new_balance := COALESCE(profile_record.raw_points, 0) + wallet_bonus + task_points;

  -- Update profile
  UPDATE public.profiles 
  SET 
    wallet_address = _wallet_address,
    wallet_type = 'ton',
    wallet_connected_at = NOW(),
    raw_points = new_balance,
    updated_at = NOW()
  WHERE id = _profile_id;

  -- Award wallet_connected badge if not exists
  INSERT INTO public.user_badges (user_id, badge_id, earned_at, is_active)
  VALUES (_profile_id, 'wallet_connected', NOW(), true)
  ON CONFLICT (user_id, badge_id) DO NOTHING;

  IF FOUND THEN
    badge_awarded := true;
  END IF;

  -- Complete connect_wallet task if not completed
  INSERT INTO public.task_completions (
    user_id, 
    task_id, 
    points_awarded, 
    is_verified,
    verification_data
  )
  VALUES (
    _profile_id, 
    'connect_wallet', 
    task_points, 
    true,
    jsonb_build_object('wallet_address', _wallet_address)
  )
  ON CONFLICT (user_id, task_id) WHERE is_verified = true DO NOTHING;

  -- Add points ledger entries
  INSERT INTO public.points_ledger (user_id, amount, balance_after, source, description)
  VALUES (_profile_id, wallet_bonus, COALESCE(profile_record.raw_points, 0) + wallet_bonus, 'wallet_connect', 'Bonus for connecting TON wallet');

  IF task_points > 0 THEN
    INSERT INTO public.points_ledger (user_id, amount, balance_after, source, source_id, description)
    VALUES (_profile_id, task_points, new_balance, 'task', 'connect_wallet', 'Completed task: Connect Wallet');
  END IF;

  -- Log event
  INSERT INTO public.events (user_id, event_type, event_data)
  VALUES (
    _profile_id, 
    'wallet_connected', 
    jsonb_build_object(
      'wallet_address', _wallet_address,
      'points_awarded', wallet_bonus + task_points,
      'badge_awarded', badge_awarded
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'badge_awarded', badge_awarded,
    'points_awarded', wallet_bonus + task_points,
    'new_balance', new_balance
  );
END;
$$;

-- =============================================
-- 8. FIX: Update existing profiles with missing ref_code
-- =============================================
UPDATE public.profiles 
SET ref_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
WHERE ref_code IS NULL OR ref_code = '';

-- =============================================
-- 9. FIX: Ensure all profiles have unique ref_code
-- =============================================
WITH duplicates AS (
  SELECT ref_code, COUNT(*) as cnt
  FROM public.profiles
  GROUP BY ref_code
  HAVING COUNT(*) > 1
)
UPDATE public.profiles p
SET ref_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p.id), 1, 8))
WHERE p.ref_code IN (SELECT ref_code FROM duplicates)
AND p.id NOT IN (
  SELECT MIN(id) 
  FROM public.profiles 
  GROUP BY ref_code 
  HAVING COUNT(*) > 1
);

-- =============================================
-- 10. FIX: Add constraint for unique ref_code
-- =============================================
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS unique_ref_code;

ALTER TABLE public.profiles 
ADD CONSTRAINT unique_ref_code UNIQUE (ref_code);

-- =============================================
-- 11. FIX: Update leaderboard function for performance
-- =============================================
CREATE OR REPLACE FUNCTION public.update_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all-time rankings
  WITH ranked AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY raw_points DESC) as rank
    FROM public.profiles
    WHERE is_banned = false AND is_bot = false
  )
  UPDATE public.leaderboards l
  SET 
    rank_all_time = r.rank,
    points_all_time = p.raw_points,
    updated_at = NOW()
  FROM ranked r
  JOIN public.profiles p ON p.id = r.id
  WHERE l.user_id = r.id;

  -- Insert missing leaderboard entries
  INSERT INTO public.leaderboards (user_id, points_all_time, rank_all_time)
  SELECT 
    p.id,
    p.raw_points,
    r.rank
  FROM public.profiles p
  JOIN (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY raw_points DESC) as rank
    FROM public.profiles
    WHERE is_banned = false AND is_bot = false
  ) r ON r.id = p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.leaderboards l WHERE l.user_id = p.id
  );
END;
$$;

-- =============================================
-- 12. FIX: Grant execute permissions
-- =============================================
GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_wallet_connect(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_user_multiplier(UUID) TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================
SELECT 'All fixes applied successfully!' as status;

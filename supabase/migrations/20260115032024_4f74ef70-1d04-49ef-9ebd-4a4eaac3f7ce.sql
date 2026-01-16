-- =============================================
-- STREAKFARM DATABASE SCHEMA - PHASE 1
-- =============================================

-- 1. ENUMS
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.box_rarity AS ENUM ('common', 'rare', 'legendary');
CREATE TYPE public.badge_category AS ENUM ('streak', 'achievement', 'wallet', 'special');
CREATE TYPE public.badge_rarity AS ENUM ('common', 'rare', 'epic', 'legendary', 'mythic');
CREATE TYPE public.task_type AS ENUM ('daily', 'social', 'referral', 'wallet', 'onetime');
CREATE TYPE public.task_status AS ENUM ('active', 'inactive', 'expired');

-- 2. USER ROLES TABLE (Security-first)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. PROFILES TABLE (User data)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  first_name TEXT,
  language_code TEXT DEFAULT 'en',
  avatar_url TEXT,
  
  -- Points
  raw_points BIGINT DEFAULT 0,
  
  -- Streaks
  streak_current INT DEFAULT 0,
  streak_best INT DEFAULT 0,
  last_checkin TIMESTAMPTZ,
  
  -- Stats
  total_boxes_opened INT DEFAULT 0,
  total_tasks_completed INT DEFAULT 0,
  total_referrals INT DEFAULT 0,
  bots_reported INT DEFAULT 0,
  
  -- Wallet
  wallet_address TEXT,
  wallet_type TEXT,
  wallet_connected_at TIMESTAMPTZ,
  
  -- Multipliers (calculated from badges)
  multiplier_permanent DECIMAL DEFAULT 1.0,
  
  -- Referral
  ref_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES public.profiles(id),
  
  -- Anti-fraud
  fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  report_count INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX idx_profiles_points ON public.profiles(raw_points DESC) WHERE is_banned = FALSE AND is_bot = FALSE;
CREATE INDEX idx_profiles_ref_code ON public.profiles(ref_code);
CREATE INDEX idx_profiles_wallet ON public.profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at ASC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. BOXES TABLE
-- =============================================
CREATE TABLE public.boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  opened_at TIMESTAMPTZ,
  base_points INT NOT NULL,
  multiplier_applied DECIMAL,
  final_points INT,
  rarity box_rarity NOT NULL DEFAULT 'common',
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boxes_user_id ON public.boxes(user_id);
CREATE INDEX idx_boxes_expires_at ON public.boxes(expires_at) WHERE opened_at IS NULL AND is_expired = FALSE;
CREATE INDEX idx_boxes_opened_at ON public.boxes(opened_at DESC) WHERE opened_at IS NOT NULL;

ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;

-- 6. BADGES TABLE (Metadata)
-- =============================================
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT NOT NULL,
  image_url TEXT,
  
  badge_category badge_category NOT NULL,
  multiplier DECIMAL NOT NULL DEFAULT 1.0,
  rarity badge_rarity NOT NULL DEFAULT 'common',
  
  requirements JSONB DEFAULT '{}',
  
  max_supply INT,
  current_supply INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  can_convert_to_nft BOOLEAN DEFAULT TRUE,
  
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- 7. USER BADGES TABLE (Owned badges)
-- =============================================
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES public.badges(id) NOT NULL,
  
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  converted_to_nft BOOLEAN DEFAULT FALSE,
  nft_address TEXT,
  converted_at TIMESTAMPTZ,
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON public.user_badges(badge_id);
CREATE INDEX idx_user_badges_earned ON public.user_badges(earned_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 8. TASKS TABLE
-- =============================================
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT DEFAULT '📋',
  
  task_type task_type NOT NULL,
  status task_status DEFAULT 'active',
  
  points_reward INT NOT NULL DEFAULT 0,
  
  requirements JSONB DEFAULT '{}',
  verification_type TEXT DEFAULT 'auto',
  
  is_repeatable BOOLEAN DEFAULT FALSE,
  repeat_interval_hours INT,
  max_completions INT,
  
  requires_wallet BOOLEAN DEFAULT FALSE,
  
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 9. TASK COMPLETIONS TABLE
-- =============================================
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  task_id TEXT REFERENCES public.tasks(id) NOT NULL,
  
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  points_awarded INT NOT NULL DEFAULT 0,
  
  verification_data JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_task_completions_user ON public.task_completions(user_id);
CREATE INDEX idx_task_completions_task ON public.task_completions(task_id);
CREATE INDEX idx_task_completions_date ON public.task_completions(completed_at DESC);
CREATE UNIQUE INDEX idx_task_completions_unique ON public.task_completions(user_id, task_id) 
  WHERE is_verified = TRUE;

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- 10. REFERRALS TABLE
-- =============================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  referrer_bonus INT DEFAULT 0,
  referee_bonus INT DEFAULT 0,
  
  is_valid BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referee_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_date ON public.referrals(created_at DESC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- 11. EVENTS LOG TABLE (Audit)
-- =============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user ON public.events(user_id);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_date ON public.events(created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 12. ADMIN CONFIG TABLE (Kill switches)
-- =============================================
CREATE TABLE public.admin_config (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- 13. LEADERBOARDS CACHE TABLE
-- =============================================
CREATE TABLE public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  rank_all_time INT,
  rank_weekly INT,
  rank_referrals INT,
  rank_badges INT,
  
  points_all_time BIGINT DEFAULT 0,
  points_weekly BIGINT DEFAULT 0,
  referral_count INT DEFAULT 0,
  badge_count INT DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_all_time ON public.leaderboards(rank_all_time ASC) WHERE rank_all_time IS NOT NULL;
CREATE INDEX idx_leaderboards_weekly ON public.leaderboards(rank_weekly ASC) WHERE rank_weekly IS NOT NULL;

ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- 14. POINTS LEDGER TABLE (History)
-- =============================================
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  amount INT NOT NULL,
  balance_after BIGINT NOT NULL,
  
  source TEXT NOT NULL,
  source_id TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id);
CREATE INDEX idx_points_ledger_date ON public.points_ledger(created_at DESC);

ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- User Roles Policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Profiles Policies
CREATE POLICY "Users can view all non-banned profiles" ON public.profiles
  FOR SELECT USING (is_banned = FALSE);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Boxes Policies
CREATE POLICY "Users can view their own boxes" ON public.boxes
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own boxes" ON public.boxes
  FOR UPDATE USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all boxes" ON public.boxes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Badges Policies (public read)
CREATE POLICY "Anyone can view active badges" ON public.badges
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User Badges Policies
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all user badges" ON public.user_badges
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tasks Policies (public read for active)
CREATE POLICY "Anyone can view active tasks" ON public.tasks
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Task Completions Policies
CREATE POLICY "Users can view their own completions" ON public.task_completions
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own completions" ON public.task_completions
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all completions" ON public.task_completions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Referrals Policies
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (
    referrer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    referee_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Events Policies
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin Config Policies
CREATE POLICY "Admins can manage config" ON public.admin_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Leaderboards Policies (public read)
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage leaderboards" ON public.leaderboards
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Points Ledger Policies
CREATE POLICY "Users can view their own ledger" ON public.points_ledger
  FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all ledgers" ON public.points_ledger
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_config_updated_at
  BEFORE UPDATE ON public.admin_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON public.leaderboards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update badge supply when user earns badge
CREATE OR REPLACE FUNCTION public.update_badge_supply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.badges 
    SET current_supply = current_supply + 1 
    WHERE id = NEW.badge_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE) THEN
    UPDATE public.badges 
    SET current_supply = GREATEST(0, current_supply - 1) 
    WHERE id = COALESCE(OLD.badge_id, NEW.badge_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER badge_supply_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.update_badge_supply();

-- Function to get user's profile ID from auth.uid()
CREATE OR REPLACE FUNCTION public.get_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Function to calculate total multiplier for a user
CREATE OR REPLACE FUNCTION public.calculate_user_multiplier(_profile_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    1.0 + SUM(b.multiplier - 1.0),
    1.0
  )
  FROM public.user_badges ub
  JOIN public.badges b ON b.id = ub.badge_id
  WHERE ub.user_id = _profile_id
    AND ub.is_active = TRUE
    AND b.is_active = TRUE
$$;

-- =============================================
-- SEED DATA: BADGES
-- =============================================

INSERT INTO public.badges (id, name, description, icon_emoji, badge_category, multiplier, rarity, requirements, sort_order) VALUES
  -- Streak Badges
  ('streak_7', '7-Day Streak', 'Maintained a 7-day streak', '🔥', 'streak', 1.1, 'common', '{"streak_days":7}', 10),
  ('streak_14', '14-Day Streak', 'Maintained a 14-day streak', '🔥', 'streak', 1.2, 'rare', '{"streak_days":14}', 20),
  ('streak_30', '30-Day Streak', 'Maintained a 30-day streak', '🔥', 'streak', 1.5, 'epic', '{"streak_days":30}', 30),
  ('streak_60', '60-Day Streak', 'Maintained a 60-day streak', '🔥', 'streak', 2.0, 'epic', '{"streak_days":60}', 40),
  ('streak_90', '90-Day Streak', 'Maintained a 90-day streak', '🔥', 'streak', 2.5, 'legendary', '{"streak_days":90}', 50),
  ('streak_180', '180-Day Streak', 'Maintained a 180-day streak', '🔥', 'streak', 3.0, 'legendary', '{"streak_days":180}', 60),
  ('streak_365', '365-Day Streak', 'Maintained a full year streak', '🔥', 'streak', 5.0, 'legendary', '{"streak_days":365}', 70),
  ('streak_730', '730-Day Streak', 'Maintained two full years streak', '🔥', 'streak', 10.0, 'mythic', '{"streak_days":730}', 80),
  
  -- Achievement Badges
  ('founding_member', 'Founding Member', 'First 10,000 users', '👑', 'achievement', 2.0, 'legendary', '{"user_number_max":10000}', 100),
  ('early_adopter', 'Early Adopter', 'Joined in Month 1', '🎁', 'special', 2.5, 'legendary', '{"joined_within_days":30}', 110),
  ('launch_week', 'Launch Week Hero', 'Joined in first week', '🎉', 'special', 3.0, 'legendary', '{"joined_within_days":7}', 120),
  ('millionaire', 'Millionaire', 'Earned 1,000,000 points', '💰', 'achievement', 1.5, 'epic', '{"total_points":1000000}', 130),
  ('multi_millionaire', 'Multi-Millionaire', 'Earned 10,000,000 points', '💰', 'achievement', 2.0, 'legendary', '{"total_points":10000000}', 140),
  ('top_100', 'Elite Farmer', 'Reached top 100 on leaderboard', '🏆', 'achievement', 2.0, 'legendary', '{"leaderboard_rank":100}', 150),
  ('top_10', 'Top 10 Legend', 'Reached top 10 on leaderboard', '🏆', 'achievement', 3.0, 'legendary', '{"leaderboard_rank":10}', 160),
  ('influencer', 'Influencer', 'Referred 100+ users', '🌟', 'achievement', 1.75, 'epic', '{"referrals":100}', 170),
  ('mega_influencer', 'Mega Influencer', 'Referred 1000+ users', '🌟', 'achievement', 2.5, 'legendary', '{"referrals":1000}', 180),
  ('box_master', 'Box Master', 'Opened 1000 boxes', '📦', 'achievement', 1.3, 'rare', '{"boxes_opened":1000}', 190),
  ('lightning', 'Lightning Fast', 'Opened 10 boxes in 1 hour', '⚡', 'achievement', 1.2, 'rare', '{"boxes_per_hour":10}', 200),
  ('anti_bot_guardian', 'Anti-Bot Guardian', 'Reported 10 bots', '🛡️', 'achievement', 1.5, 'epic', '{"bots_reported":10}', 210),
  
  -- Wallet Badges
  ('wallet_connected', 'Wallet Connected', 'Connected TON wallet', '👛', 'wallet', 1.1, 'common', '{"wallet_connected":true}', 300),
  ('whale', 'Whale', 'Hold 10+ TON in wallet', '🐋', 'wallet', 2.0, 'legendary', '{"ton_balance":10}', 310),
  ('mega_whale', 'Mega Whale', 'Hold 100+ TON in wallet', '🐳', 'wallet', 3.0, 'mythic', '{"ton_balance":100}', 320),
  ('nft_holder', 'NFT Collector', 'Own any TON NFT', '💎', 'wallet', 1.5, 'epic', '{"has_nfts":true}', 330),
  
  -- Special Badges
  ('vip', 'VIP', 'Admin-awarded VIP status', '⭐', 'special', 5.0, 'mythic', '{"admin_awarded":true}', 400),
  ('holiday_special', 'Holiday Special', 'Earned during holiday season', '🎄', 'special', 2.0, 'epic', '{"seasonal":true}', 410);

-- =============================================
-- SEED DATA: TASKS
-- =============================================

INSERT INTO public.tasks (id, title, description, icon_emoji, task_type, points_reward, requirements, is_repeatable, repeat_interval_hours, sort_order) VALUES
  -- Daily Tasks
  ('daily_checkin', 'Daily Check-in', 'Check in daily to maintain your streak', '📅', 'daily', 100, '{}', TRUE, 24, 10),
  ('open_5_boxes', 'Open 5 Boxes', 'Open 5 boxes today', '📦', 'daily', 250, '{"boxes_to_open":5}', TRUE, 24, 20),
  ('open_10_boxes', 'Open 10 Boxes', 'Open 10 boxes today', '📦', 'daily', 500, '{"boxes_to_open":10}', TRUE, 24, 30),
  ('open_20_boxes', 'Open 20 Boxes', 'Open 20 boxes today', '📦', 'daily', 1000, '{"boxes_to_open":20}', TRUE, 24, 40),
  
  -- Social Tasks
  ('join_telegram', 'Join Telegram', 'Join our official Telegram group', '💬', 'social', 500, '{"telegram_group":"@streakfarm"}', FALSE, NULL, 100),
  ('follow_twitter', 'Follow Twitter', 'Follow us on Twitter/X', '🐦', 'social', 500, '{"twitter":"@streakfarm"}', FALSE, NULL, 110),
  
  -- Referral Tasks
  ('refer_1', 'First Referral', 'Invite your first friend', '👥', 'referral', 1000, '{"referrals":1}', FALSE, NULL, 200),
  ('refer_10', 'Invite 10 Friends', 'Invite 10 friends', '👥', 'referral', 5000, '{"referrals":10}', FALSE, NULL, 210),
  ('refer_50', 'Invite 50 Friends', 'Invite 50 friends', '👥', 'referral', 20000, '{"referrals":50}', FALSE, NULL, 220),
  ('refer_100', 'Invite 100 Friends', 'Invite 100 friends', '👥', 'referral', 50000, '{"referrals":100}', FALSE, NULL, 230),
  
  -- Wallet Tasks
  ('connect_wallet', 'Connect Wallet', 'Connect your TON wallet', '👛', 'wallet', 5000, '{"wallet_connected":true}', FALSE, NULL, 300),
  ('hold_1_ton', 'Hold 1 TON', 'Maintain 1+ TON in wallet', '💎', 'wallet', 2000, '{"ton_balance":1}', FALSE, NULL, 310),
  ('hold_10_ton', 'Hold 10 TON', 'Maintain 10+ TON in wallet', '🐋', 'wallet', 10000, '{"ton_balance":10}', FALSE, NULL, 320),
  ('hold_100_ton', 'Hold 100 TON', 'Maintain 100+ TON in wallet', '🐳', 'wallet', 50000, '{"ton_balance":100}', FALSE, NULL, 330);

-- =============================================
-- SEED DATA: ADMIN CONFIG
-- =============================================

INSERT INTO public.admin_config (id, value, description) VALUES
  ('game_enabled', '{"enabled": true}', 'Master switch for the game'),
  ('box_generation', '{"enabled": true, "rarity_rates": {"common": 0.949, "rare": 0.05, "legendary": 0.001}}', 'Box generation settings'),
  ('point_multipliers', '{"global": 1.0, "event": 1.0}', 'Global point multipliers'),
  ('referral_bonuses', '{"referrer": 1000, "referee": 500}', 'Referral bonus amounts'),
  ('streak_multipliers', '{"3": 1.2, "7": 1.5, "14": 2.0, "30": 2.5, "60": 3.0, "90": 4.0, "180": 5.0, "365": 10.0, "730": 15.0}', 'Streak multiplier tiers'),
  ('maintenance_mode', '{"enabled": false, "message": ""}', 'Maintenance mode settings'),
  ('launch_date', '{"date": null}', 'Official launch date for early adopter calculations');

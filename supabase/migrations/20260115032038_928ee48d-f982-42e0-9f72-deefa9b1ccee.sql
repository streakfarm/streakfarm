-- Fix function search path mutable warning for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix function search path for update_badge_supply
CREATE OR REPLACE FUNCTION public.update_badge_supply()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

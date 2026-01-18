import { createClient } from '@supabase/supabase-js';
import { supabase } from '../client';

export const profileCreated = async (profileData) => {
    const { referrer, referredId } = profileData;

    // Add 'referrals' row
    if (referrer) {
        const { data, error: insertError } = await supabase
            .from('referrals')
            .insert([{ referrer_id: referrer, referred_id: referredId }]);

        if (insertError) {
            console.error('Error inserting referral:', insertError);
        } else {
            console.log('Referral inserted:', data);
            try {
                // Attempt to call RPC 'award_referral_bonus'
                await supabase.rpc('award_referral_bonus', {
                    _referred_id: referredId,
                    _referrer_id: referrer
                });
            } catch (rpcError) {
                console.error('RPC error (award_referral_bonus):', rpcError);
            }
        }
    }
};

// Adding logging for profile creation
export const createProfile = async (profileData) => {
    console.log('Creating profile:', profileData);
    await profileCreated(profileData);
};
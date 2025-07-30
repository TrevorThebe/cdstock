// File: `lib/supabase/auth.ts`
import { supabase } from './client'; // Your Supabase client instance

export const authService = {
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Record login stats after successful auth
        await this.recordLoginStats(data.user.id);
        return data;
    },

    async recordLoginStats(userId: string) {
        const { error } = await supabase
            .from('user_login_stats')
            .insert({
                user_id: userId,
                user_agent: navigator.userAgent,
                device_info: {
                    platform: navigator.platform,
                    screen: {
                        width: window.screen.width,
                        height: window.screen.height
                    }
                }
            });

        if (error) console.error('Login stats recording failed:', error);
    },

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    async updateProfile(userId: string, updates: {
        username?: string;
        full_name?: string;
        avatar_url?: string;
    }) {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
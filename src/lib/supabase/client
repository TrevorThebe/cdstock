import { supabase } from './client';

export const authService = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Record additional login stats
    await supabase
      .from('user_login_stats')
      .insert({
        user_id: data.user.id,
        ip_address: '', // Get from request headers in Edge Function
        user_agent: navigator.userAgent,
        device_info: {
          platform: navigator.platform,
          screen: {
            width: window.screen.width,
            height: window.screen.height
          }
        }
      });

    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }
};
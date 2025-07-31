// lib/auth.ts
import { supabase } from './supabase';
import { storage } from './storage';
import { User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        throw error || new Error('Login failed');
      }

      // 2. Get user profile from your users table
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('User profile not found');
      }

      // 3. Create complete user object
      const user: User = {
        id: data.user.id,
        auth_user_id: data.user.id,
        email: data.user.email || email,
        name: userProfile?.name || data.user.user_metadata?.name || 'User',
        phone: userProfile?.phone || '',
        role: userProfile?.role || 'normal',
        isBlocked: userProfile?.is_blocked || false,
        createdAt: userProfile?.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 4. Store user in local storage
      storage.setCurrentUser(user);
      return user;

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // ... rest of your authService methods
};
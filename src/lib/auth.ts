import { supabase } from './supabase';
import { storage } from './storage';
import { User } from '@/types';

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    
    if (data.user) {
      // Get user from users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();
      
      if (userError) throw userError;
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: userRecord?.name || data.user.user_metadata?.name || 'User',
        phone: userRecord?.phone || '',
        role: userRecord?.role || 'normal',
        isBlocked: userRecord?.is_blocked || false,
        createdAt: userRecord?.created_at || data.user.created_at || new Date().toISOString(),
        updatedAt: userRecord?.updated_at || new Date().toISOString()
      };
      storage.setCurrentUser(user);
      return user;
    }
    throw new Error('Login failed');
  },

  async register(email: string, password: string, name: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });
    if (error) throw error;
    
    if (data.user) {
      // Insert into users table
      const { error: insertError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        name,
        phone,
        role: 'normal',
        is_blocked: false
      });
      
      if (insertError) throw insertError;
      
      const user: User = {
        id: data.user.id,
        email: data.user.email || '',
        name,
        phone: phone || '',
        role: 'normal',
        isBlocked: false,
        createdAt: data.user.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      storage.setCurrentUser(user);
      return user;
    }
    throw new Error('Registration failed');
  },

  getCurrentUser(): User | null {
    return storage.getCurrentUser();
  },

  async logout() {
    await supabase.auth.signOut();
    storage.clearCurrentUser();
  },

  async refreshUserData(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      phone: data.phone || '',
      role: data.role,
      isBlocked: data.is_blocked,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    };
    
    storage.setCurrentUser(user);
    return user;
  }
};
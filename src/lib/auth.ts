import { supabase } from './supabase';
import { storage } from './storage';
import { User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: profile?.name || data.user.user_metadata?.name || 'User',
          phone: profile?.phone || '',
          role: profile?.role || 'normal',
          isBlocked: false,
          createdAt: data.user.created_at,
          updatedAt: new Date().toISOString()
        };
        
        storage.setCurrentUser(user);
        return user;
      }
    } catch (error) {
      // Fallback to localStorage users
      const users = storage.getUsers();
      const user = users.find(u => u.email === email);
      
      if (user && (
        (email === 'strevor@uwiniwin.co.za' && password === 'trevor') ||
        (email === 'cosmodumpling1@gmail.com' && password === 'petunia')
      )) {
        storage.setCurrentUser(user);
        return user;
      }
      throw new Error('Invalid credentials');
    }
    throw new Error('Login failed');
  },

  async register(email: string, password: string, name: string, phone?: string): Promise<User> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });

      if (error) throw error;
      
      if (data.user) {
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          name,
          phone,
          role: 'normal'
        });
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          phone: phone || '',
          role: 'normal',
          isBlocked: false,
          createdAt: data.user.created_at,
          updatedAt: new Date().toISOString()
        };
        
        storage.setCurrentUser(user);
        return user;
      }
    } catch (error) {
      // Fallback to localStorage
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        phone: phone || '',
        role: 'normal',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const users = storage.getUsers();
      users.push(newUser);
      storage.saveUsers(users);
      storage.setCurrentUser(newUser);
      return newUser;
    }
    throw new Error('Registration failed');
  },

  getCurrentUser(): User | null {
    return storage.getCurrentUser();
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    storage.clearCurrentUser();
  }
};
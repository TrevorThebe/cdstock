import { supabase } from './supabase';
import { storage } from './storage';
import { User } from '@/types';

export const authService = {
  async login(email: string, password: string) {
    try {
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
          email: data.user.email || '',
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
      // Fallback to localStorage for predefined users
      const users = storage.getUsers();
      let user = users.find(u => u.email === email);
      
      // Check password for predefined users
      if (user && (
        (email === 'strevor@uwiniwin.co.za' && password === 'trevor') ||
        (email === 'cosmodumpling1@gmail.com' && password === 'petunia') ||
        u.id === password // Legacy fallback
      )) {
        storage.setCurrentUser(user);
        return user;
      }
      throw new Error('Invalid credentials');
    }
  },

  async register(email: string, password: string, name: string, phone?: string) {
    try {
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
        await supabase.from('user_profiles').insert({
          user_id: data.user.id,
          name,
          phone,
          role: 'normal'
        });
        
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
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
      const users = storage.getUsers();
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        phone,
        role: 'normal',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      storage.saveUsers(users);
      storage.setCurrentUser(newUser);
      return newUser;
    }
  },

  getCurrentUser(): User | null {
    return storage.getCurrentUser();
  },

  async logout() {
    await supabase.auth.signOut();
    storage.setCurrentUser(null);
  }
};
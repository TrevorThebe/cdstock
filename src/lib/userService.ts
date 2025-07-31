// lib/userService.ts
import { supabase } from './supabase';

interface User {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: 'normal' | 'admin' | 'super';
  is_blocked: boolean;
  // ... other fields
}

export const userService = {
  // Get all users (admin/super only)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update user role (admin/super only)
  async updateUserRole(userId: string, newRole: User['role']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Block/unblock user (admin/super only)
  async toggleUserBlock(userId: string, isBlocked: boolean): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ is_blocked: isBlocked })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete user (admin/super only)
  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }
};
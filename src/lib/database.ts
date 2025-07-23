import { supabase } from './supabase';
import { storage } from './storage';
import { createClient } from '@supabase/supabase-js';


//Products

export const databaseService = {
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*,locations(id,location)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getProducts error:', error);
      }
      if (data) return data;
    } catch (err) {
      console.error('getProducts exception:', err);
    }
    return storage.getProducts();
  },

  async saveProduct(product: any) {
    try {
      const { error } = await supabase
        .from('products')
        .upsert(product);
      if (error) throw error;
      return true;
    } catch {
      const products = storage.getProducts();
      const index = products.findIndex(p => p.id === product.id);
      if (index >= 0) {
        products[index] = product;
      } else {
        products.push(product);
      }
      storage.saveProducts(products);
      return false;
    }
  },

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) return data;
    } catch { }

    const users = storage.getUsers();
    return users.find(u => u.id === userId);
  },

  /*export const getChatMessagesWithProfiles = async (userId: string, recipientId: string) => {
    const { supabase } = require('@/lib/supabase');

    const { data, error } = await supabase
      .from('chat_messages_with_profiles')
      .select('*')
      .or(`and(user_id.eq.${userId},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  };
*/

  async getChatMessages(userId: string, recipientId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users!chat_messages_user_id_fkey(name, avatar_url, role)
      `)
      .or(`and(user_id.eq.${userId},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data?.map(msg => ({
      ...msg,
      user_name: msg.users?.name || 'Unknown User',
      user_avatar: msg.users?.avatar_url,
      is_admin: msg.users?.role === 'admin'
    })) || [];
  },

  async getUnreadMessageCount(userId: string) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('recipient_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return data?.length || 0;
  },

  // Notifications
  async saveNotification(notification: any) {
    const { error } = await supabase
      .from('notifications')
      .insert(notification);
    if (error) throw error;
    return true;
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        read_notifications!left(notification_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(notif => ({
      ...notif,
      is_read: notif.read_notifications?.length > 0
    })) || [];
  },

  // Get admin notification history (notifications sent by current user)
  async getAdminNotificationHistory(adminUserId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        users!notifications_user_id_fkey(name)
      `)
      .eq('sender_id', adminUserId)
      .eq('type', 'admin')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(notif => ({
      ...notif,
      recipient_name: notif.users?.name || 'Unknown User'
    })) || [];
  },
  async markNotificationRead(userId: string, notificationId: string) {
    const { error } = await supabase
      .from('read_notifications')
      .insert({ user_id: userId, notification_id: notificationId });
    if (error) throw error;
    return true;
  },

  //get all user
  getAllUsers: async () => {
    // Fetch all users from user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  createUser: async (user: any) => {
    // Insert into users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    if (userError) throw userError;

    // Insert into user_profiles table
    const profile = {
      user_id: userData.id || user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      // add other profile fields as needed
    };
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profile);
    if (profileError) throw profileError;

    return userData;
  },
};

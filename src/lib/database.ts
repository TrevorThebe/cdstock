import { supabase } from './supabase';
import { storage } from './storage';
import { createClient } from '@supabase/supabase-js';




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

  async getNotifications(userId: string) {
    // Replace this with your actual database/API call
    // Example:
    // return fetch(`/api/notifications?userId=${userId}`).then(res => res.json());
    return []; // placeholder, replace with real implementation
  },

  moveToReadNotifications: async (userId, notification) => {
    // Insert into read_notifications table
    return supabase
      .from('read_notifications')
      .insert({
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        created_at: notification.created_at,
        read_at: new Date().toISOString(),
        sender_id: notification.sender_id
      });
  },
  deleteNotification: async (userId, notificationId) => {
    // Remove from notifications table
    return supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
  },
  addToAdminUsers: async (userId: string) => {
    // Insert user into admin_users table
    return supabase
      .from('admin_users')
      .insert({ user_id: userId });
  },
};

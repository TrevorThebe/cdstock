import { supabase } from './supabase';
import { storage } from './storage';
import { createClient } from '@supabase/supabase-js';




export const databaseService = {

// Chat Messages
  async saveChatMessage(message: any) {
    if (!message.user_id || !message.recipient_id) {
      throw new Error('Invalid user IDs provided');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: message.user_id,
        recipient_id: message.recipient_id,
        message: message.message,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getChatMessages(userId: string, recipientId: string) {
    if (!userId || !recipientId) return [];
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        id, user_id, recipient_id, message, created_at,
        sender:users!user_id(name, profile_picture_url, role)
      `)
      .or(`and(user_id.eq.${userId},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data?.map(msg => ({
      ...msg,
      user_name: msg.sender?.name || 'Unknown User',
      user_avatar: msg.sender?.profile_picture_url || null,
      is_admin: msg.sender?.role === 'admin'
    })) || [];
  },

  // Notifications
  async saveNotification(notification: any) {
    const notificationData = {
      id: notification.id || crypto.randomUUID(),
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type || 'admin',
      priority: notification.priority || 'normal',
      sender_id: notification.sender_id,
      sender_name: notification.sender_name,
      created_at: notification.created_at || new Date().toISOString()
    };

    const { error } = await supabase
      .from('notifications')
      .insert(notificationData);
    if (error) throw error;
    return true;
  },

  async getNotifications(userId: string) {
    if (!userId || userId.trim() === '') return [];
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Get read status for each notification
    const { data: readNotifs } = await supabase
      .from('read_notifications')
      .select('notification_id')
      .eq('user_id', userId);
    
    const readIds = new Set(readNotifs?.map(r => r.notification_id) || []);
    
    return notifications?.map(notif => ({
      ...notif,
      is_read: readIds.has(notif.id)
    })) || [];
  },

  async markNotificationRead(userId: string, notificationId: string) {
    if (!userId || !notificationId) {
      throw new Error('Invalid parameters');
    }
    
    const { error } = await supabase
      .from('read_notifications')
      .upsert({ 
        user_id: userId, 
        notification_id: notificationId,
        read_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_id'
      });
    if (error) throw error;
    return true;
  },

  // Admin notification history
  async getAdminNotificationHistory(adminId: string) {
    if (!adminId || adminId.trim() === '') return [];
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id, title, message, priority, created_at, user_id,
        users!user_id(name, email)
      `)
      .eq('sender_id', adminId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(notif => ({
      ...notif,
      recipient_name: notif.users?.name || 'Unknown User'
    })) || [];
  },

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

  // Users - Fixed to properly query users table
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, phone, role, is_blocked, profile_picture_url, created_at, updated_at')
      .not('id', 'is', null)
      .not('email', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
  },


/*
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },*/
/*
  // Get admin notification history
  async getAdminNotificationHistory(adminUserId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        users!user_id(name)
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
  },*/

  getAllUsers: async () => {
    // Fetch all users from user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*');
    if (error) throw error;
    return data || [];
  },
// Stats tracking
  async recordUserLogin(userId: string) {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          last_login: new Date().toISOString(),
          login_count: 1
        }, {
          onConflict: 'user_id'
        });
      if (error) console.error('Error recording login:', error);
    } catch (err) {
      console.error('Stats table may not exist:', err);
    }
  },
  async recordProductChange(userId: string, productId: string, action: string) {
    if (!userId || !productId) return;
    try {
      const { error } = await supabase
        .from('product_stats')
        .insert({
          user_id: userId,
          product_id: productId,
          action: action,
          timestamp: new Date().toISOString()
        });
      if (error) console.error('Error recording product change:', error);
    } catch (err) {
      console.error('Stats table may not exist:', err);
    }
  }


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

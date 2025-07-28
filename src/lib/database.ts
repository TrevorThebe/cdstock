import { supabase } from './supabase';
import { storage } from './storage';

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

  // User Profiles
  async saveUserProfile(profile: any) {
    if (!profile.user_id || profile.user_id.trim() === '') {
      throw new Error('Invalid user ID provided');
    }

    const { error } = await supabase
      .from('users')
      .update({
        name: profile.name,
        phone: profile.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.user_id);
    
    if (error) throw error;
    return true;
  },

  async getUserProfile(userId: string) {
    if (!userId || userId.trim() === '') {
      throw new Error('Invalid user ID provided');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, phone, role, is_blocked, profile_picture_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Products
  async saveProduct(product: any) {
    const { error } = await supabase
      .from('products')
      .upsert({
        ...product,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
    return true;
  },

  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
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

  async saveUser(user: any) {
    const { error } = await supabase
      .from('users')
      .upsert({
        ...user,
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
    return true;
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
};
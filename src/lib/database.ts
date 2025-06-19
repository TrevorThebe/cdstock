import { supabase } from './supabase';
import { storage } from './storage';

export const databaseService = {
  // Chat Messages
  async saveChatMessage(message: any) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert(message);
      if (error) throw error;
      return true;
    } catch {
      const messages = storage.getChatMessages() || [];
      messages.push(message);
      storage.saveChatMessages(messages);
      return false;
    }
  },

  async getChatMessages(userId: string, recipientId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user_profiles!chat_messages_user_id_fkey(name, avatar_url, role)
        `)
        .or(`and(user_id.eq.${userId},recipient_id.eq.${recipientId}),and(user_id.eq.${recipientId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data.map(msg => ({
          ...msg,
          user_name: msg.user_profiles?.name || 'Unknown User',
          user_avatar: msg.user_profiles?.avatar_url,
          is_admin: msg.user_profiles?.role === 'admin'
        }));
      }
    } catch {}
    
    const messages = storage.getChatMessages() || [];
    return messages
      .filter(msg => 
        (msg.user_id === userId && msg.recipient_id === recipientId) ||
        (msg.user_id === recipientId && msg.recipient_id === userId)
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  // Notifications
  async saveNotification(notification: any) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      if (error) throw error;
      return true;
    } catch {
      const notifications = storage.getNotifications() || [];
      notifications.push(notification);
      storage.saveNotifications(notifications);
      return false;
    }
  },

  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          read_notifications!left(notification_id)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(notif => ({
          ...notif,
          is_read: notif.read_notifications?.length > 0
        }));
      }
    } catch {}
    
    const notifications = storage.getNotifications() || [];
    return notifications.filter(n => n.user_id === userId);
  },

  async markNotificationRead(userId: string, notificationId: string) {
    try {
      const { error } = await supabase
        .from('read_notifications')
        .insert({ user_id: userId, notification_id: notificationId });
      if (error) throw error;
      return true;
    } catch {
      const readNotifs = storage.getReadNotifications() || [];
      readNotifs.push({ user_id: userId, notification_id: notificationId });
      storage.saveReadNotifications(readNotifs);
      return false;
    }
  },

  // User Profiles
  async saveUserProfile(profile: any) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profile);
      if (error) throw error;
      return true;
    } catch {
      const users = storage.getUsers();
      const index = users.findIndex(u => u.id === profile.user_id);
      if (index >= 0) {
        users[index] = { ...users[index], ...profile };
      } else {
        users.push(profile);
      }
      storage.saveUsers(users);
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
    } catch {}
    
    const users = storage.getUsers();
    return users.find(u => u.id === userId);
  },

  // Products
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

  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) return data;
    } catch {}
    
    return storage.getProducts();
  },

  // Users
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) return data;
    } catch {}
    
    return storage.getUsers();
  },

  async saveUser(user: any) {
    try {
      const { error } = await supabase
        .from('users')
        .upsert(user);
      if (error) throw error;
      return true;
    } catch {
      const users = storage.getUsers();
      const index = users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        users[index] = user;
      } else {
        users.push(user);
      }
      storage.saveUsers(users);
      return false;
    }
  }
};
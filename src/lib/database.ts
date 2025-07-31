import { supabase } from './supabase';
import { storage } from './storage';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  sender_id?: string;
  sender_name?: string;
}

interface ReadNotification {
  user_id: string;
  notification_id: string;
  read_at: string;
}

export const databaseService = {

  // Add this new method
  async getUsers(): Promise<Array<{
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
    is_blocked: boolean;
    profile_picture_url: string | null;
    created_at: string;
    updated_at: string;
  }>> {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_blocked,
        profile_picture_url,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getUsers error:', error);
      throw error;
    }

    return data || [];
  },
  // NOTIFICATION METHODS
  async saveNotification(notification: Omit<Notification, 'id' | 'created_at'> & { id?: string }) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        id: notification.id || crypto.randomUUID(),
        ...notification,
        created_at: new Date().toISOString()
      });

    if (error) throw new Error(`Notification save failed: ${error.message}`);
    return true;
  },

  async getNotifications(userId: string, limit = 50): Promise<(Notification & { is_read: boolean })[]> {
    const { data, error } = await supabase.rpc('get_user_notifications', {
      user_id: userId,
      max_results: limit
    });

    if (error) throw new Error(`Notifications fetch failed: ${error.message}`);
    return data || [];
  },

  async markNotificationRead(userId: string, notificationId: string) {
    const { error } = await supabase.rpc('mark_notification_read', {
      user_id: userId,
      notification_id: notificationId
    });

    if (error) throw new Error(`Mark read failed: ${error.message}`);
    return true;
  },

  async markAllNotificationsRead(userId: string) {
    const { error } = await supabase.rpc('mark_all_notifications_read', {
      user_id: userId
    });

    if (error) throw new Error(`Mark all read failed: ${error.message}`);
    return true;
  },

  async deleteNotification(userId: string, notificationId: string) {
    await supabase
      .from('read_notifications')
      .delete()
      .match({ user_id: userId, notification_id: notificationId });

    const { error } = await supabase
      .from('notifications')
      .delete()
      .match({ id: notificationId, user_id: userId });

    if (error) throw new Error(`Delete failed: ${error.message}`);
    return true;
  },

  // REALTIME SUBSCRIPTIONS
  subscribeToNotifications(userId: string, callback: (payload: Notification) => void) {
    const channel = supabase.channel('notifications_' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new as Notification)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // USER PROFILE METHODS (kept from your original)
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, phone, role, is_blocked, profile_picture_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // ... include other existing methods you need ...
};

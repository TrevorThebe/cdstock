import { supabase } from './supabase';
import { storage } from './storage';


interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: string;
  is_blocked: boolean;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
}

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
  is_read?: boolean;
}

export const databaseService = {
  // USER METHODS
  async getUsers(): Promise<User[]> {
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
      console.error('Error fetching users:', error);
      throw new Error(error.message);
    }
    return data || [];
  },

  async getUserProfile(userId: string): Promise<User | null> {
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
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  // NOTIFICATION METHODS
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        read_notifications!inner(read_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw new Error(error.message);
    }

    return data.map(notif => ({
      ...notif,
      is_read: !!notif.read_notifications?.read_at
    })) || [];
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('read_notifications')
      .upsert({
        user_id: userId,
        notification_id: notificationId,
        read_at: new Date().toISOString()
      });

    if (error) throw new Error(error.message);
  },

  // REALTIME SUBSCRIPTIONS
  subscribeToNotifications(userId: string, callback: (payload: Notification) => void) {
    const channel = supabase.channel('notifications')
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
  }
};
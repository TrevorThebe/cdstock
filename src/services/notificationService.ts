import { supabase } from '@/lib/supabase';

export interface Notification {
  id?: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'message';
  created_at?: string;
  sender_id?: string;
  priority?: string;
}

export const notificationService = {
  async sendNotification(notification: Notification): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').insert([notification]);
      if (error) {
        console.error('Supabase Notification Insert Error:', error.message, error.details);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Notification Service Error:', err);
      return false;
    }
  },

  async getNotifications(user_id: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase Notification Fetch Error:', error.message, error.details);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Notification Fetch Error:', err);
      return [];
    }
  }
};
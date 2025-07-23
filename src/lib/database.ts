import { supabase } from './supabase';

export const databaseService = {
  // Chat Messages
  async saveChatMessage(message: any) {
    const { error } = await supabase
      .from('chat_messages')
      .insert(message);
    if (error) throw error;
    return true;
  },

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

  // User Profiles
  async saveUserProfile(profile: any) {
    const { error } = await supabase
      .from('users')
      .upsert(profile);
    if (error) throw error;
    return true;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Products
  async saveProduct(product: any) {
    const { error } = await supabase
      .from('products')
      .upsert(product);
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

  // Users
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async saveUser(user: any) {
    const { error } = await supabase
      .from('users')
      .upsert(user);
    if (error) throw error;
    return true;
  }
};
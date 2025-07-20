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

  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*');
      if (error) {
        console.error('Supabase getUsers error:', error);
      }
      if (data) return data;
    } catch (err) {
      console.error('getUsers exception:', err);
    }
    return storage.getUsers ? storage.getUsers() : [];
  },

  async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getNotifications error:', error);
      }
      if (data) return data;
    } catch (err) {
      console.error('getNotifications exception:', err);
    }
    return [];
  },

  async markNotificationRead(userId: string, notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);
      if (error) {
        console.error('Supabase markNotificationRead error:', error);
      }
      return !error;
    } catch (err) {
      console.error('markNotificationRead exception:', err);
      return false;
    }
  },

  async getUnreadNotificationCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) {
        console.error('Supabase getUnreadNotificationCount error:', error);
      }
      return count || 0;
    } catch (err) {
      console.error('getUnreadNotificationCount exception:', err);
      return 0;
    }
  },

  async getChatMessages(userId: string, otherUserId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(user_id.eq.${userId},recipient_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Supabase getChatMessages error:', error);
      }
      if (data) return data;
    } catch (err) {
      console.error('getChatMessages exception:', err);
    }
    return [];
  },

  async saveChatMessage(message: any) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert(message);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('saveChatMessage exception:', err);
      return false;
    }
  },

  async getUnreadChatCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
      if (error) {
        console.error('Supabase getUnreadChatCount error:', error);
      }
      return count || 0;
    } catch (err) {
      console.error('getUnreadChatCount exception:', err);
      return 0;
    }
  },

  async updateUserPassword(userId: string, newPassword: string) {
    // Supabase Auth API for password change
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) {
        console.error('Supabase updateUserPassword error:', error);
      }
      return !error;
    } catch (err) {
      console.error('updateUserPassword exception:', err);
      return false;
    }
  },

  async uploadProfilePicture(userId: string, file: File) {
    try {
      const filePath = `profile-pictures/${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      const publicUrl = data?.publicUrl || '';

      // Update profile_picture_urls in users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_picture_urls: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (err) {
      console.error('uploadProfilePicture exception:', err);
      return '';
    }
  },

  async updateUserRole(userId: string, role: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      if (error) {
        console.error('Supabase updateUserRole error:', error);
      }
      return !error;
    } catch (err) {
      console.error('updateUserRole exception:', err);
      return false;
    }
  },

  async recordProductChangeStat(userId: string, productId: string, oldQty: number, newQty: number) {
    try {
      const { error } = await supabase
        .from('product_change_stats')
        .insert({
          user_id: userId,
          product_id: productId,
          old_quantity: oldQty,
          new_quantity: newQty,
          changed_at: new Date().toISOString()
        });
      if (error) {
        console.error('Supabase recordProductChangeStat error:', error);
      }
      return !error;
    } catch (err) {
      console.error('recordProductChangeStat exception:', err);
      return false;
    }
  },

  async saveNotification(notification: any) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notification);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('saveNotification exception:', err);
      return false;
    }
  },

  async markChatMessageRead(userId: string, messageId: string) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', userId);
      if (error) {
        console.error('Supabase markChatMessageRead error:', error);
      }
      return !error;
    } catch (err) {
      console.error('markChatMessageRead exception:', err);
      return false;
    }
  },

};

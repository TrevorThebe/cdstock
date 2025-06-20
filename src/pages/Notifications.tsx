import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, Users, Trash2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initializeData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        loadNotifications(user.id);
      }
    };
    initializeData();
  }, []);

  const loadNotifications = async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    setNotifications(data || []);
  };

  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return;

    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (updateError) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
      return;
    }

    const { error: insertError } = await supabase
      .from('read_notifications')
      .insert({
        notification_id: notificationId,
        user_id: currentUser.id
      });

    if (insertError) {
      console.error('Error inserting read notification:', insertError);
    }

    toast({
      title: 'Success',
      description: 'Notification marked as read'
    });

    loadNotifications(currentUser.id);
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Notification deleted'
    });
    if (currentUser) {
      loadNotifications(currentUser.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low-stock': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'new-user': return <Users className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'low-stock': return <Badge variant="destructive">Low Stock</Badge>;
      case 'new-user': return <Badge variant="default">New User</Badge>;
      default: return <Badge variant="secondary">System</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No notifications yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`${!notification.is_read ? 'border-blue-200 bg-blue-50' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      <CardDescription>{notification.message}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getNotificationBadge(notification.type)}
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                  <Badge variant="outline" className={`text-xs ${!notification.is_read ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                    {!notification.is_read ? 'Unread' : 'Read'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
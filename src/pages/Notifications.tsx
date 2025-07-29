import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { databaseService } from '@/lib/database';
import { NotificationSender } from '@/components/notifications/NotificationSender';
import { Skeleton } from '@/components/ui/skeleton';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_read?: boolean;
}

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Memoized function to load notifications
  const loadNotifications = useCallback(async () => {
    try {
      if (!currentUser?.id) return;
      
      setRefreshing(true);
      const notifs = await databaseService.getNotifications(currentUser.id);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, toast]);

  // Initialize current user and load notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user) {
          const profile = await databaseService.getUserProfile(user.id);
          setCurrentUser({ ...user, profile });
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Load notifications when currentUser changes
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await databaseService.markNotificationRead(currentUser.id, notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await databaseService.deleteNotification(currentUser.id, notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: 'Success',
        description: 'Notification deleted',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const isAdmin = currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'super';

  if (loading && !refreshing) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
          <h1 className="text-xl lg:text-3xl font-bold">Notifications</h1>
          <Badge variant="outline" className="ml-2">
            {notifications.filter(n => !n.is_read).length} unread
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadNotifications}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isAdmin && (
        <NotificationSender currentUser={currentUser} onSend={loadNotifications} />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Notification(s)</CardTitle>
            <div className="text-sm text-muted-foreground">
              {notifications.length} total
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="secondary">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotification(notification.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <Button 
                    variant="ghost" 
                    className="mt-4"
                    onClick={loadNotifications}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Check for new notifications
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

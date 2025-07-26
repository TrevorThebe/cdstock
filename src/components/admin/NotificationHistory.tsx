import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';
import { History, Clock, User as UserIcon } from 'lucide-react';

interface NotificationHistoryProps {
  currentUser: User;
}

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  priority: string;
  created_at: string;
  recipient_name?: string;
  user_id: string;
  users?: { name: string; email: string; };
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotificationHistory();
  }, [currentUser]);

  const loadNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id, title, message, priority, created_at, user_id,
          users!user_id(name, email)
        `)
        .eq('sender_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedData = data?.map(notif => ({
        ...notif,
        recipient_name: notif.users?.name || notif.users?.email || 'Unknown User'
      })) || [];
      
      console.log('Loaded notification history:', processedData);
      setNotifications(processedData);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive" className="text-xs">High</Badge>;
      case 'medium': return <Badge variant="default" className="text-xs">Medium</Badge>;
      default: return <Badge variant="secondary" className="text-xs">Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>My Notification History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>My Notification History ({notifications.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications sent yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={`${notification.id}-${notification.user_id}`} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(notification.priority || 'normal')}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{notification.recipient_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { databaseService } from '@/lib/database';
import { storage } from '@/lib/storage';
import { User, Notification } from '@/types';
import { Bell, Clock, User as UserIcon } from 'lucide-react';

interface NotificationHistoryProps {
  currentUser: User;
}

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const loadNotifications = async () => {
    try {
      // Get all notifications from storage (admin sent notifications)
      const allNotifications = storage.getNotifications();
      // Filter to show only admin-sent notifications
      const adminNotifications = allNotifications.filter(n => n.type === 'admin');
      setNotifications(adminNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUsers = () => {
    const allUsers = storage.getUsers();
    setUsers(allUsers);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="default">Medium</Badge>;
      default: return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group notifications by title and created time to show unique sends
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const key = `${notification.title}_${notification.created_at.split('T')[0]}_${notification.created_at.split('T')[1].split(':')[0]}:${notification.created_at.split('T')[1].split(':')[1]}`;
    if (!acc[key]) {
      acc[key] = {
        ...notification,
        recipients: [notification.user_id],
        recipientCount: 1
      };
    } else {
      acc[key].recipients.push(notification.user_id);
      acc[key].recipientCount++;
    }
    return acc;
  }, {} as Record<string, any>);

  const uniqueNotifications = Object.values(groupedNotifications);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Notification History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {uniqueNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueNotifications.map((notification, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getPriorityBadge(notification.priority)}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{notification.recipientCount} recipient{notification.recipientCount > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {notification.sender_name?.split(' ').map(n => n[0]).join('') || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <span>by {notification.sender_name || 'Admin'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
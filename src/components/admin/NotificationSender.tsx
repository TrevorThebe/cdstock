import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { User } from '@/types';
import { Send, Users, Bell } from 'lucide-react';

interface NotificationSenderProps {
  currentUser: User;
}

export const NotificationSender: React.FC<NotificationSenderProps> = ({ currentUser }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await databaseService.getUsers();
      console.log('Loaded users:', allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and message',
        variant: 'destructive'
      });
      return;
    }

    if (users.length === 0) {
      toast({
        title: 'Error',
        description: 'No users found to send notifications to',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    const totalCount = users.length;

    try {
      for (const user of users) {
        const notification = {
          id: crypto.randomUUID(),
          user_id: user.id,
          title: title.trim(),
          message: message.trim(),
          priority,
          type: 'admin',
          created_at: new Date().toISOString(),
          sender_id: currentUser.id,
          sender_name: currentUser.name || currentUser.email
        };

        try {
          await databaseService.saveNotification(notification);
          successCount++;
        } catch (error) {
          console.error(`Failed to send notification to user ${user.id}:`, error);
        }
      }

      toast({
        title: 'Notifications Sent',
        description: `Successfully sent ${successCount}/${totalCount} notifications to all users`
      });

      setTitle('');
      setMessage('');
      setPriority('normal');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High Priority</Badge>;
      case 'medium': return <Badge variant="default">Medium Priority</Badge>;
      default: return <Badge variant="secondary">Normal Priority</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Send Notification to All Users</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <Input
            placeholder="Notification title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Message</label>
          <Textarea
            placeholder="Notification message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4" />
            <span>Will send to {users.length} users in the database</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            {getPriorityBadge(priority)}
          </div>
          <Button 
            onClick={handleSendNotification}
            disabled={isLoading || !title.trim() || !message.trim() || users.length === 0}
            className="flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{isLoading ? 'Sending...' : 'Send to All Users'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
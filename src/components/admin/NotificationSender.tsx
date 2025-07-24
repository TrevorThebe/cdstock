import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { databaseService } from '@/lib/database';
import { storage } from '@/lib/storage';
import { User } from '@/types';
import { Send, Users, User as UserIcon, Bell } from 'lucide-react';

interface NotificationSenderProps {
  currentUser: User;
}

export const NotificationSender: React.FC<NotificationSenderProps> = ({ currentUser }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [priority, setPriority] = useState('normal');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const allUsers = storage.getUsers();
    setUsers(allUsers);
  }, []);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and message',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let totalCount = 0;

    try {
      const targetUsers = recipient === 'all' ? users : users.filter(u => u.id === recipient);
      totalCount = targetUsers.length;

      for (const user of targetUsers) {
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: user.id,
          title: title.trim(),
          message: message.trim(),
          priority,
          type: 'admin',
          created_at: new Date().toISOString(),
          sender_id: currentUser.id,
          sender_name: currentUser.name
        };

        const success = await databaseService.saveNotification(notification);
        if (success) successCount++;
      }

      toast({
        title: 'Notifications Sent',
        description: `Successfully sent ${successCount}/${totalCount} notifications`
      });

      // Reset form
      setTitle('');
      setMessage('');
      setRecipient('all');
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
          <span>Send Notification</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Recipient</label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>All Users ({users.length})</span>
                  </div>
                </SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4" />
                      <span>{user.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            {getPriorityBadge(priority)}
          </div>
          <Button 
            onClick={handleSendNotification}
            disabled={isLoading || !title.trim() || !message.trim()}
            className="flex items-center space-x-2"
          >
            <Send className="h-4 w-4" />
            <span>{isLoading ? 'Sending...' : 'Send Notification'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
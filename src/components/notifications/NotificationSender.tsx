import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Send, Bell } from 'lucide-react';

interface NotificationSenderProps {
  currentUser?: any;
  users?: any[];
}

export const NotificationSender: React.FC<NotificationSenderProps> = ({ currentUser, users = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });
  const [recipient, setRecipient] = useState('all'); // 'all', 'admins', or user id
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      type: value as 'info' | 'warning' | 'success' | 'error'
    }));
  };

  const sendNotificationToAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      let targets: any[] = [];
      if (recipient === 'all') {
        targets = users;
      } else if (recipient === 'admins') {
        targets = users.filter(u => u.role === 'admin' || u.role === 'super');
      } else {
        targets = users.filter(u => (u.id || u.user_id) === recipient);
      }

      console.log('Sending notifications to:', targets); // Debug log

      let sentCount = 0;
      for (const user of targets) {
        const result = await supabase
          .from('notifications')
          .insert({
            user_id: user.id || user.user_id,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            sender_id: currentUser?.id
          });
        console.log('Insert result for user:', user.id || user.user_id, result); // Debug log
        sentCount++;
      }

      toast({
        title: 'Success',
        description: `Notification sent to ${sentCount} user${sentCount !== 1 ? 's' : ''}`
      });

      setFormData({
        title: '',
        message: '',
        type: 'info'
      });
      setRecipient('all');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'super';

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Only admins can send notifications to all users</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Notification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={sendNotificationToAll} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Notification message"
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recipient">Recipient</Label>
            <Select value={recipient} onValueChange={setRecipient}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admins">Admins Only</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id || user.user_id} value={user.id || user.user_id}>
                    {user.name || user.email || user.username || user.id || user.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
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
import React, { useState } from 'react';
import { notificationService, Notification } from '@/services/notificationService';

interface NotificationSenderProps {
  currentUser: { id: string; role: string };
  allUsers: { user_id: string }[];
}

export const NotificationSender: React.FC<NotificationSenderProps> = ({ currentUser, allUsers }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Notification['type']>('info');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult('Please fill in all fields.');
      return;
    }
    setLoading(true);
    let success = 0;
    for (const user of allUsers) {
      const notif: Notification = {
        user_id: user.user_id,
        title,
        message,
        type,
        sender_id: currentUser.id,
        created_at: new Date().toISOString(),
      };
      if (await notificationService.sendNotification(notif)) success++;
    }
    setResult(`Sent ${success}/${allUsers.length} notifications.`);
    setLoading(false);
    setTitle('');
    setMessage('');
  };

  if (!['admin', 'super'].includes(currentUser.role)) return <div>Only admins can send notifications.</div>;

  return (
    <div>
      <h2>Send Notification</h2>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
      <select value={type} onChange={e => setType(e.target.value as Notification['type'])}>
        <option value="info">Info</option>
        <option value="success">Success</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
        <option value="message">Message</option>
      </select>
      <button onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
      {result && <p>{result}</p>}
    </div>
  );
};


export const NotificationSender: React.FC<NotificationSenderProps> = ({ currentUser }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error'
  });
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
      // Get all users except the sender
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .neq('user_id', currentUser?.id);

      if (usersError) throw usersError;

      // Create notifications for all users
      const notifications = users?.map(user => ({
        user_id: user.user_id,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        sender_id: currentUser?.id
      })) || [];

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Notification sent to ${notifications.length} users`
      });
      
      setFormData({
        title: '',
        message: '',
        type: 'info'
      });
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
          Send Notification to All Users
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
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Send to All Users'}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};




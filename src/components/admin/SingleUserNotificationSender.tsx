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
import { Send, UserCheck } from 'lucide-react';

interface SingleUserNotificationSenderProps {
  currentUser: User;
}

export const SingleUserNotificationSender: React.FC<SingleUserNotificationSenderProps> = ({ currentUser }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await databaseService.getUsers();
      // Filter out users without valid IDs and ensure they exist in the database
      const validUsers = allUsers.filter(user => 
        user && 
        user.id && 
        user.id.trim() !== '' && 
        user.email &&
        user.email.trim() !== ''
      );
      console.log('Loaded valid users for single sender:', validUsers);
      setUsers(validUsers);
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
    if (!title.trim() || !message.trim() || !selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields and select a user',
        variant: 'destructive'
      });
      return;
    }

    // Validate that the selected user still exists in our list
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      toast({
        title: 'Error',
        description: 'Selected user is no longer valid. Please refresh and try again.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const notification = {
        id: crypto.randomUUID(),
        user_id: selectedUserId,
        title: title.trim(),
        message: message.trim(),
        priority,
        type: 'admin',
        created_at: new Date().toISOString(),
        sender_id: currentUser.id,
        sender_name: currentUser.name || currentUser.email
      };

      console.log('Sending notification to user:', selectedUserId, notification);
      await databaseService.saveNotification(notification);

      toast({
        title: 'Notification Sent',
        description: `Successfully sent notification to ${selectedUser.name || selectedUser.email}`
      });

      setTitle('');
      setMessage('');
      setPriority('normal');
      setSelectedUserId('');
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast({
        title: 'Failed to send notification',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
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

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserCheck className="h-5 w-5" />
          <span>Send Notification to Single User</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select User ({users.length} available)</label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder={users.length > 0 ? "Choose a user..." : "No users available"} />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center space-x-2">
                    <span>{user.name || user.email}</span>
                    <Badge variant="outline" className="text-xs">{user.role || 'user'}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {selectedUser && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <UserCheck className="h-4 w-4" />
              <span>Sending to: <strong>{selectedUser.name || selectedUser.email}</strong></span>
              <Badge variant="outline">{selectedUser.role || 'user'}</Badge>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            {getPriorityBadge(priority)}
          </div>
          <Button 
            onClick={handleSendNotification}
            disabled={isLoading || !title.trim() || !message.trim() || !selectedUserId || users.length === 0}
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

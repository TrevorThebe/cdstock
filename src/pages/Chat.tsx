import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  user_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
  status?: 'sending' | 'delivered' | 'failed';
}

interface User {
  id: string;
  name?: string;
  email?: string;
}

export const Chat: React.FC = () => {
  const { currentUser } = useAppContext();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available users
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .neq('id', currentUser?.id || '')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  // Load messages for selected user
  const loadMessages = async () => {
    if (!currentUser?.id || !selectedUser) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(
          `and(user_id.eq.${currentUser.id},recipient_id.eq.${selectedUser}),` +
          `and(user_id.eq.${selectedUser},recipient_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send new message with optimistic updates
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser?.id) return;
    
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      user_id: currentUser.id,
      recipient_id: selectedUser,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      status: 'sending'
    };

    try {
      setError(null);
      
      // 1. Optimistically update UI
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // 2. Verify recipient exists
      const { count, error: recipientError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('id', selectedUser);

      if (recipientError || count === 0) {
        throw new Error('Recipient user does not exist');
      }

      // 3. Send message to server
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: currentUser.id,
          recipient_id: selectedUser,
          message: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Replace optimistic message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId ? { ...data, status: 'delivered' } : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      // 5. Handle error - mark as failed and keep in UI
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId ? { ...msg, status: 'failed' } : msg
      ));
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      if (error instanceof Error && error.message.includes('Recipient')) {
        loadUsers();
      }
    }
  };

  // Real-time subscription for instant updates
  useEffect(() => {
    if (!selectedUser || !currentUser?.id) return;

    const channel = supabase
      .channel('instant_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(and(user_id.eq.${currentUser.id},recipient_id.eq.${selectedUser}),and(user_id.eq.${selectedUser},recipient_id.eq.${currentUser.id})`
        },
        (payload) => {
          // Ignore our own optimistic messages
          if (payload.new.id?.toString().startsWith('optimistic-')) return;
          
          setMessages(prev => {
            // Prevent duplicates
            const exists = prev.some(msg => msg.id === payload.new.id);
            return exists ? prev : [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, currentUser?.id]);

  // Initial data loading
  useEffect(() => {
    loadUsers();
  }, []);

  // Load messages when user changes
  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      
      <div className="mb-4">
        <Select 
          value={selectedUser} 
          onValueChange={(value) => {
            setSelectedUser(value);
            setError(null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a user to chat with" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {selectedUser ? (
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 mb-4">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent className="h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                        message.user_id === currentUser?.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-800'
                      } ${
                        message.status === 'sending' ? 'opacity-80' : ''
                      }`}>
                        {message.status === 'sending' && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        )}
                        {message.status === 'failed' && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                          {message.status === 'failed' && ' (Failed)'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              className="min-w-[40px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { UserSelector } from '@/components/chat/UserSelector';

interface ChatMessageType {
  id: string;
  user_id: string;
  recipient_id?: string;
  message: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  is_admin?: boolean;
}

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && selectedUserId) {
      loadMessages();
      setupRealtimeSubscription();
    }
  }, [currentUser, selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setCurrentUser({ ...user, profile });
    }
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedUserId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user_profiles!chat_messages_user_id_fkey(name, avatar_url, role)
      `)
      .or(`and(user_id.eq.${currentUser.id},recipient_id.eq.${selectedUserId}),and(user_id.eq.${selectedUserId},recipient_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    const messagesWithNames = data.map(msg => ({
      ...msg,
      user_name: msg.user_profiles?.name || 'Unknown User',
      user_avatar: msg.user_profiles?.avatar_url,
      is_admin: msg.user_profiles?.role === 'admin'
    }));

    setMessages(messagesWithNames);
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUserId) return;

    setLoading(true);
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: currentUser.id,
        recipient_id: selectedUserId,
        message: newMessage.trim()
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isAdmin = currentUser?.profile?.role === 'admin';

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-4rem)] lg:h-screen flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* User Selector - Mobile Toggle */}
      {isAdmin && (
        <>
          {/* Mobile User Selector Toggle */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowUserSelector(!showUserSelector)}
              className="w-full mb-4"
            >
              <Users className="h-4 w-4 mr-2" />
              {selectedUserId ? 'Change User' : 'Select User'}
            </Button>
            {showUserSelector && (
              <div className="mb-4">
                <UserSelector 
                  onUserSelect={(userId) => {
                    setSelectedUserId(userId);
                    setShowUserSelector(false);
                  }}
                  selectedUserId={selectedUserId}
                />
              </div>
            )}
          </div>
          
          {/* Desktop User Selector */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <UserSelector 
              onUserSelect={setSelectedUserId}
              selectedUserId={selectedUserId}
            />
          </div>
        </>
      )}
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center space-x-3 mb-4 lg:mb-6">
          <MessageCircle className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
          <h1 className="text-xl lg:text-3xl font-bold">Chat</h1>
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">
              {isAdmin ? 'Admin Chat' : 'Support Chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            <ScrollArea className="flex-1 p-3 lg:p-4">
              <div className="space-y-3 lg:space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    currentUserId={currentUser?.id}
                    isAdmin={message.is_admin}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {(!isAdmin || selectedUserId) && (
              <div className="p-3 lg:p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={loading || !newMessage.trim()}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {isAdmin && !selectedUserId && (
              <div className="p-4 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a user to start chatting</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { UserDropdown } from '@/components/chat/UserDropdown';
import { authService } from '@/lib/auth';
import { databaseService } from '@/lib/database';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && selectedUserId) {
      loadMessages();
    }
  }, [currentUser, selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const user = authService.getCurrentUser();
    if (user) {
      const profile = await databaseService.getUserProfile(user.id);
      setCurrentUser({ ...user, profile });
    }
  };

  const loadMessages = async () => {
    if (!currentUser || !selectedUserId) return;
    
    try {
      const msgs = await databaseService.getChatMessages(currentUser.id, selectedUserId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUserId) return;

    setLoading(true);
    try {
      const messageData = {
        id: Math.random().toString(36).substr(2, 9),
        user_id: currentUser.id,
        recipient_id: selectedUserId,
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      };

      await databaseService.saveChatMessage(messageData);
      
      // Send notification to recipient if current user is admin/super
      if (currentUser.role === 'admin' || currentUser.role === 'super') {
        const notificationData = {
          id: Math.random().toString(36).substr(2, 9),
          user_id: selectedUserId,
          title: `New message from ${currentUser.name}`,
          message: newMessage.trim(),
          type: 'message',
          priority: 'medium',
          created_at: new Date().toISOString()
        };
        await databaseService.saveNotification(notificationData);
      }
      
      setNewMessage('');
      loadMessages();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
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

  return (
    <div className="p-4 lg:p-6 h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
          <h1 className="text-xl lg:text-3xl font-bold">Chat</h1>
        </div>
        
        <UserDropdown 
          onUserSelect={setSelectedUserId}
          selectedUserId={selectedUserId}
          currentUser={currentUser}
        />
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg">
            {selectedUserId ? 'Chat Conversation' : 'Select a user to start chatting'}
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
          
          {selectedUserId && (
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
          
          {!selectedUserId && (
            <div className="p-4 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Select a user from the dropdown above to start chatting</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
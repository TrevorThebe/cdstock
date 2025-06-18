import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessageProps {
  message: {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
    user_name?: string;
    user_avatar?: string;
  };
  currentUserId?: string;
  isAdmin?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  currentUserId, 
  isAdmin 
}) => {
  const isOwnMessage = message.user_id === currentUserId;
  
  return (
    <div
      className={`flex items-start space-x-3 ${
        isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
      }`}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.user_avatar} />
        <AvatarFallback>
          {message.user_name?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage
            ? 'bg-blue-600 text-white'
            : isAdmin
            ? 'bg-purple-100 text-purple-900 border border-purple-200'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="text-sm font-medium mb-1">
          {message.user_name}
          {isAdmin && <span className="ml-2 text-xs bg-purple-500 text-white px-1 rounded">Admin</span>}
        </p>
        <p>{message.message}</p>
        <p className="text-xs opacity-70 mt-1">
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { UserSelector } from '@/components/chat/UserSelector';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { authService } from '@/lib/auth';

export default function ChatPage() {
  const currentUser = authService.getCurrentUser();
  const [selectedUserId, setSelectedUserId] = useState(null);

  if (!currentUser) return <div>Please login to use chat.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <UserSelector onUserSelect={setSelectedUserId} selectedUserId={selectedUserId} />
      {selectedUserId && (
        <div className="mt-4">
          <MessageList senderId={currentUser.id} recipientId={selectedUserId} />
          <ChatInput senderId={currentUser.id} recipientId={selectedUserId} onMessageSent={() => {}} />
        </div>
      )}
      {!selectedUserId && <div className="text-gray-500 mt-4">Select a user to start chatting.</div>}
    </div>
  );
}
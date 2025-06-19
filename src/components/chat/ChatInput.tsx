import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function ChatInput({ senderId, recipientId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('messages').insert([
      { sender_id: senderId, recipient_id: recipientId, content }
    ]);
    if (!error) {
      setContent('');
      onMessageSent && onMessageSent();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={sendMessage} className="flex gap-2 mt-2">
      <input
        className="flex-1 border p-2 rounded"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Type a message"
        disabled={loading}
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        Send
      </button>
    </form>
  );
}
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function MessageList({ senderId, recipientId }) {
  const [messages, setMessages] = useState([]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
      .order('created_at', { ascending: true });
    if (!error) setMessages(data);
  };

  useEffect(() => { if (senderId && recipientId) loadMessages(); }, [senderId, recipientId]);

  // Optional: subscribe to new messages with Supabase real-time (if enabled)
  useEffect(() => {
    if (!senderId || !recipientId) return;
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          const msg = payload.new;
          if (
            (msg.sender_id === senderId && msg.recipient_id === recipientId) ||
            (msg.sender_id === recipientId && msg.recipient_id === senderId)
          ) {
            setMessages(prev => [...prev, msg]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [senderId, recipientId]);

  return (
    <div className="flex flex-col gap-2 p-2 overflow-y-auto h-96 border rounded">
      {messages.map(msg => (
        <div key={msg.id} className={`p-2 rounded ${msg.sender_id === senderId ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'}`}>
          <span>{msg.content}</span>
          <div className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleTimeString()}</div>
        </div>
      ))}
      {messages.length === 0 && <div className="text-gray-400 text-center">No messages yet</div>}
    </div>
  );
}
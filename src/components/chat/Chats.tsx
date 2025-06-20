import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Chat {
  id: string;
  message: string;
  created_at: string;
  // Add other fields as needed
}

const Chats: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats from Supabase
  const fetchChats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setChats(data || []);
      setError(null);
    }
    setLoading(false);
  };

  // Subscribe to real-time chat updates (optional, Supabase Realtime)
  useEffect(() => {
    fetchChats();

    const subscription = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Add a new chat
  const addChat = async (message: string) => {
    const { error } = await supabase
      .from('chats')
      .insert({ message });

    if (error) setError(error.message);
  };

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <ul>
        {chats.map(chat => (
          <li key={chat.id}>
            {chat.message} <span>({chat.created_at})</span>
          </li>
        ))}
      </ul>
      <ChatInput onSend={addChat} />
    </div>
  );
};

// Example chat input component
const ChatInput: React.FC<{ onSend: (msg: string) => void }> = ({ onSend }) => {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (value.trim()) {
          onSend(value);
          setValue('');
        }
      }}
    >
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Type a message"
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default Chats;

import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabaseClient'; // Adjust if needed

/**
 * Syncs all local chat messages to Supabase, then clears local storage if successful.
 * Returns true if synced, false otherwise.
 */
export async function syncLocalChats() {
  const localMessages = storage.getChatMessages() || [];
  if (!localMessages.length) return true;

  const { error } = await supabase
    .from('chat_messages')
    .insert(localMessages);

  if (!error) {
    storage.saveChatMessages([]);
    return true;
  }
  return false;
}

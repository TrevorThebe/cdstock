import React, { useEffect } from 'react';
import { syncLocalChats } from '@/lib/syncLocalChats';

// ...your other imports and code...

export const Chat: React.FC = () => {
  // ...existing state and functions...

  useEffect(() => {
    // Try to sync on mount
    syncLocalChats();
  }, []);

  // ...rest of your component...
};

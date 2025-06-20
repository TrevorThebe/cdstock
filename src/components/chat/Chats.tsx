import React, { useEffect } from 'react';
import { syncLocalChats } from '@/lib/syncLocalChats';

// ...component code...

useEffect(() => {
  // Sync on mount
  syncLocalChats();

  // Sync when coming online
  const handleOnline = () => syncLocalChats();
  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}, []);

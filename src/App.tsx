import React, { useState } from 'react';
import { UserSelector } from '@/components/chat/UserSelector';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { authService } from '@/lib/auth';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

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

export default App;

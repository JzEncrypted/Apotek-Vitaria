import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'pharmacist';
  senderName: string;
  text?: string;
  imageUrl?: string;
  imageCaption?: string;
  audioUrl?: string;
  audioDuration?: number; // duration in seconds
  timestamp: string; // e.g., "09:42"
  status: 'sent' | 'delivered' | 'read';
}

export interface PharmacistInfo {
  name: string;
  title: string;
  sipa: string;
  avatarUrl: string;
  isOnline: boolean;
  hospitalAffiliation: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  pharmacist: PharmacistInfo;
  isTyping: boolean;
  unreadCount: number;
  sendMessage: (payload: {
    text?: string;
    imageUrl?: string;
    imageCaption?: string;
    audioUrl?: string;
    audioDuration?: number;
    sender?: 'customer' | 'pharmacist';
  }) => void;
  markAsRead: () => void;
  clearChat: () => void;
}

const DEFAULT_PHARMACIST: PharmacistInfo = {
  name: 'apt. Sarinah Cantika, S.Farm.',
  title: 'Apoteker Penanggung Jawab (APJ)',
  sipa: 'SIPA: 19950512/SIPA_33.08/2022/2045',
  avatarUrl: '/vitaria.jpg',
  isOnline: true,
  hospitalAffiliation: 'Apotek Vitaria Magelang'
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function getCurrentTimeStr(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const isTyping = false;

  // Real Database Sync with Supabase PostgreSQL
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/consultations', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch chat messages from PostgreSQL:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  // Calculate unread pharmacist messages from customer's perspective
  const unreadCount = messages.filter((m) => m.sender === 'pharmacist' && m.status !== 'read').length;

  const markAsRead = () => {
    setMessages((prev) =>
      prev.map((m) => (m.sender === 'pharmacist' ? { ...m, status: 'read' } : m))
    );
  };

  const clearChat = () => {
    setMessages([]);
  };

  const sendMessage = async ({
    text,
    imageUrl,
    imageCaption,
    audioUrl,
    audioDuration,
    sender = 'customer'
  }: {
    text?: string;
    imageUrl?: string;
    imageCaption?: string;
    audioUrl?: string;
    audioDuration?: number;
    sender?: 'customer' | 'pharmacist';
  }) => {
    const time = getCurrentTimeStr();
    const localId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const optimisticMessage: ChatMessage = {
      id: localId,
      sender,
      senderName: sender === 'customer' ? 'Anda' : DEFAULT_PHARMACIST.name,
      text: text?.trim(),
      imageUrl,
      imageCaption: imageCaption?.trim(),
      audioUrl,
      audioDuration,
      timestamp: time,
      status: sender === 'customer' ? 'sent' : 'read'
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch('/api/consultations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: text?.trim(),
          imageUrl,
          imageCaption: imageCaption?.trim(),
          audioUrl,
          audioDuration,
          sender,
          senderName: sender === 'customer' ? 'Pasien' : DEFAULT_PHARMACIST.name
        })
      });
      fetchMessages();
    } catch (err) {
      console.warn('Failed to send consultation message to PostgreSQL:', err);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        pharmacist: DEFAULT_PHARMACIST,
        isTyping,
        unreadCount,
        sendMessage,
        markAsRead,
        clearChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

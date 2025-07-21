'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface GmailMessage {
  id: string;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  subject?: string;
  threadId: string;
  isEmail: true;
}

interface UseGmailMessagesReturn {
  messages: GmailMessage[];
  loading: boolean;
  error: string | null;
  refreshMessages: () => Promise<void>;
  totalCount: number;
}

export function useGmailMessages(limit: number = 25): UseGmailMessagesReturn {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMessages = async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      console.log('Gmail Hook: Not authenticated or no email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Gmail Hook: Fetching messages...');
      const response = await fetch(`/api/gmail/conversations?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session
      });

      console.log('Gmail Hook: Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch Gmail conversations';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Gmail Hook: API Error:', errorData);
        } catch (parseError) {
          console.error('Gmail Hook: Failed to parse error response');
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Gmail Hook: Received data:', data);
      
      // Check if we have conversations
      if (!data.conversations || !Array.isArray(data.conversations)) {
        console.warn('Gmail Hook: No conversations in response');
        setMessages([]);
        setTotalCount(0);
        return;
      }

      // Transform conversations to message format for sidebar
      const gmailMessages: GmailMessage[] = data.conversations.map((conv: any) => ({
        id: conv.id,
        from: conv.name || conv.lastMessageSender || 'Unknown',
        preview: conv.lastMessage || 'No preview available',
        time: formatTime(new Date(conv.timestamp)),
        unread: (conv.unreadCount || 0) > 0,
        subject: conv.name,
        threadId: conv.id,
        isEmail: true,
      }));

      console.log('Gmail Hook: Processed messages:', gmailMessages.length);
      setMessages(gmailMessages);
      setTotalCount(data.pagination?.total || gmailMessages.length);
      
    } catch (err: any) {
      console.error('Gmail Hook: Failed to fetch Gmail messages:', err);
      setError(err.message || 'Failed to load Gmail messages');
      setMessages([]); // Clear messages on error
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    await fetchMessages();
  };

  // Initial fetch
  useEffect(() => {
    if (status === 'authenticated') {
      fetchMessages();
    }
  }, [status, session?.user?.email, limit]);

  return {
    messages,
    loading,
    error,
    refreshMessages,
    totalCount,
  };
}

// Helper function to format timestamp
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'Maintenant';
  } else if (diffMins < 60) {
    return `${diffMins}min`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    return `${diffDays}j`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
  }
}

// Hook for getting unread count specifically
export function useGmailUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/gmail/test');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.gmail?.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (status === 'authenticated') {
      fetchUnreadCount();
      
      // Refresh every 5 minutes
      const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return unreadCount;
}
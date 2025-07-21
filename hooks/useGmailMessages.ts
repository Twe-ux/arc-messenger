'use client';

import { useState, useEffect, useCallback } from 'react';
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
  updateMessageReadStatus: (messageId: string, threadId: string) => void;
  deleteCorrespondentMessages: (correspondentEmail: string | any) => Promise<void>;
  totalCount: number;
}

export function useGmailMessages(limit: number = 25): UseGmailMessagesReturn {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMessages = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      console.log('Gmail Hook: Not authenticated or no email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Gmail Hook: Fetching conversations...');
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
  }, [status, session?.user?.email, limit]); // Stable dependencies

  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  const updateMessageReadStatus = useCallback((messageId: string, threadId: string) => {
    setMessages(prev => 
      prev.map(msg => {
        if (msg.id === messageId || msg.threadId === threadId) {
          return { ...msg, unread: false };
        }
        return msg;
      })
    );
  }, []); // Empty dependency array since setMessages is stable

  const deleteCorrespondentMessages = useCallback(async (correspondentEmail: string | any) => {
    try {
      // Ensure we have a valid email string
      const emailToMatch = typeof correspondentEmail === 'string' 
        ? correspondentEmail 
        : correspondentEmail?.email || '';
      
      if (!emailToMatch) {
        console.error('Invalid correspondent email provided:', correspondentEmail);
        return;
      }
      
      console.log('Deleting messages for correspondent:', emailToMatch);
      
      // Use setMessages with functional update to avoid dependency on messages
      setMessages(currentMessages => {
        // Find all messages from this correspondent
        const messagesToDelete = currentMessages.filter(msg => 
          msg.from.toLowerCase().trim() === emailToMatch.toLowerCase().trim()
        );

        if (messagesToDelete.length === 0) {
          console.log('No messages found for correspondent:', emailToMatch);
          return currentMessages; // Return unchanged state
        }

        console.log(`Starting deletion of ${messagesToDelete.length} conversations from ${emailToMatch}`);

        // Delete each conversation/thread in the background
        const deletePromises = messagesToDelete.map(async (msg) => {
          try {
            const response = await fetch(`/api/gmail/conversations/${msg.threadId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                action: 'deleteThread',
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error(`Failed to delete thread ${msg.threadId}:`, errorData);
            } else {
              console.log(`Successfully deleted thread ${msg.threadId}`);
            }
          } catch (error) {
            console.error(`Error deleting thread ${msg.threadId}:`, error);
          }
        });

        // Execute deletions in parallel but don't wait for them to complete
        Promise.all(deletePromises).then(() => {
          console.log(`Completed deletion of ${messagesToDelete.length} conversations from ${emailToMatch}`);
        }).catch((error) => {
          console.error('Some deletions failed:', error);
        });

        // Return messages without the deleted correspondent
        return currentMessages.filter(msg => 
          msg.from.toLowerCase().trim() !== emailToMatch.toLowerCase().trim()
        );
      });

    } catch (error) {
      console.error('Error in deleteCorrespondentMessages:', error);
      throw error;
    }
  }, []); // Remove messages dependency to prevent infinite loop

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
    updateMessageReadStatus,
    deleteCorrespondentMessages,
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
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { GmailMessage } from '@/hooks/useGmailMessages';

export interface Correspondent {
  email: string;
  name: string;
  lastMessage: GmailMessage;
  messageCount: number;
  unreadCount: number;
  threadId?: string; // Thread ID for loading complete conversations
}

export interface ConversationMessage extends GmailMessage {
  content?: string;
  isOwn?: boolean;
}

interface MessageContextType {
  // Correspondent selection
  selectedCorrespondent: Correspondent | null;
  setSelectedCorrespondent: (correspondent: Correspondent | null) => void;
  
  // Messages for selected correspondent
  conversationMessages: ConversationMessage[];
  setConversationMessages: (messages: ConversationMessage[]) => void;
  loadingConversation: boolean;
  setLoadingConversation: (loading: boolean) => void;
  
  // Individual message selection for side panel
  selectedMessage: ConversationMessage | null;
  setSelectedMessage: (message: ConversationMessage | null) => void;
  messageContent: string | null;
  setMessageContent: (content: string | null) => void;
  loadingMessage: boolean;
  setLoadingMessage: (loading: boolean) => void;
  
  // Message state updates
  updateMessageReadStatus: (messageId: string, threadId: string) => void;
  deleteCorrespondent: (correspondent: Correspondent) => Promise<void>;
  
  // External sync function for Gmail hook
  setExternalSyncFunction: (fn: ((messageId: string, threadId: string) => void) | null) => void;
  setExternalDeleteFunction: (fn: ((correspondentEmail: string) => Promise<void>) | null) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: ReactNode }) {
  // Correspondent selection
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<Correspondent | null>(null);
  
  // Conversation messages
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversation, setLoadingConversation] = useState(false);
  
  // Individual message
  const [selectedMessage, setSelectedMessage] = useState<ConversationMessage | null>(null);
  const [messageContent, setMessageContent] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);

  // External sync functions from Gmail hook
  const [externalSyncFunction, setExternalSyncFunction] = useState<((messageId: string, threadId: string) => void) | null>(null);
  const [externalDeleteFunction, setExternalDeleteFunction] = useState<((correspondentEmail: string) => Promise<void>) | null>(null);

  // Function to update message read status
  const updateMessageReadStatus = (messageId: string, threadId: string) => {
    // Update conversation messages
    setConversationMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, unread: false } : msg
      )
    );
    
    // Update selected message if it matches
    setSelectedMessage(prev => 
      prev && prev.id === messageId ? { ...prev, unread: false } : prev
    );
    
    // Update correspondent unread count
    setSelectedCorrespondent(prev => 
      prev && prev.lastMessage.threadId === threadId 
        ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) }
        : prev
    );

    // Also update Gmail hook data if sync function is provided
    if (externalSyncFunction) {
      externalSyncFunction(messageId, threadId);
    }
  };

  // Function to delete correspondent and all their messages
  const deleteCorrespondent = async (correspondent: Correspondent) => {
    try {
      // Clear selected items if they belong to this correspondent
      if (selectedCorrespondent?.email === correspondent.email) {
        setSelectedCorrespondent(null);
        setConversationMessages([]);
        setSelectedMessage(null);
        setMessageContent(null);
      }

      // Call external delete function if available
      if (externalDeleteFunction) {
        await externalDeleteFunction(correspondent.email);
      }
    } catch (error) {
      console.error('Error deleting correspondent:', error);
      throw error;
    }
  };

  return (
    <MessageContext.Provider value={{
      selectedCorrespondent,
      setSelectedCorrespondent,
      conversationMessages,
      setConversationMessages,
      loadingConversation,
      setLoadingConversation,
      selectedMessage,
      setSelectedMessage,
      messageContent,
      setMessageContent,
      loadingMessage,
      setLoadingMessage,
      updateMessageReadStatus,
      deleteCorrespondent,
      setExternalSyncFunction,
      setExternalDeleteFunction,
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}
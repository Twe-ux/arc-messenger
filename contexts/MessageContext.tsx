'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { GmailMessage } from '@/hooks/useGmailMessages';

export interface Correspondent {
  email: string;
  name: string;
  lastMessage: GmailMessage;
  messageCount: number;
  unreadCount: number;
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
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ConversationData } from '@/components/chat/ConversationCard';

interface ConversationContextType {
  activeConversationId?: string;
  selectedConversation?: ConversationData;
  setActiveConversation: (conversation: ConversationData) => void;
  clearActiveConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [selectedConversation, setSelectedConversation] = useState<ConversationData | undefined>();

  const setActiveConversation = (conversation: ConversationData) => {
    setActiveConversationId(conversation.id);
    setSelectedConversation(conversation);
  };

  const clearActiveConversation = () => {
    setActiveConversationId(undefined);
    setSelectedConversation(undefined);
  };

  return (
    <ConversationContext.Provider value={{
      activeConversationId,
      selectedConversation,
      setActiveConversation,
      clearActiveConversation,
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
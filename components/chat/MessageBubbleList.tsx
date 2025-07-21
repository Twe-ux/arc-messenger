'use client';

import { ConversationMessage } from '@/contexts/MessageContext';
import { User, Clock, Mail } from 'lucide-react';

interface MessageBubbleListProps {
  messages: ConversationMessage[];
  onMessageClick: (message: ConversationMessage) => void;
  loading?: boolean;
}

export function MessageBubbleList({ messages, onMessageClick, loading }: MessageBubbleListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-gray-500">Chargement de la conversation...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center text-gray-500">
          <Mail className="mx-auto h-8 w-8 mb-2 text-gray-400" />
          <p>Aucun message dans cette conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {messages.map((message, index) => {
        const isFirstFromSender = index === 0 || messages[index - 1].from !== message.from;
        const isLastFromSender = index === messages.length - 1 || messages[index + 1].from !== message.from;
        
        return (
          <div key={message.id} className="flex items-start gap-3">
            {/* Avatar - show only for first message from sender */}
            <div className="w-8 h-8 flex-shrink-0">
              {isFirstFromSender ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-medium">
                  {message.from.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-8 h-8" /> // Spacer
              )}
            </div>
            
            {/* Message bubble */}
            <div className="flex-1 max-w-lg">
              {/* Show sender name only for first message */}
              {isFirstFromSender && (
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {message.from}
                </div>
              )}
              
              {/* Message content */}
              <div 
                onClick={() => onMessageClick(message)}
                className={`
                  cursor-pointer rounded-lg p-3 shadow-sm transition-colors hover:shadow-md
                  ${message.unread 
                    ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100' 
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }
                `}
              >
                {/* Message preview */}
                <p className="text-sm text-gray-800 leading-relaxed">
                  {message.preview || message.subject || 'Message sans aperçu'}
                </p>
                
                {/* Message metadata */}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{message.time}</span>
                  {message.unread && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                      Non lu
                    </span>
                  )}
                </div>
              </div>
              
              {/* Add more space after last message from sender */}
              {isLastFromSender && index < messages.length - 1 && (
                <div className="h-2" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
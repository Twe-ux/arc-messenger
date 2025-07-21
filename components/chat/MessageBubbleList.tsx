'use client';

import { ConversationMessage } from '@/contexts/MessageContext';
import { Clock, Mail } from 'lucide-react';

interface MessageBubbleListProps {
  messages: ConversationMessage[];
  onMessageClick: (message: ConversationMessage) => void;
  loading?: boolean;
}

export function MessageBubbleList({
  messages,
  onMessageClick,
  loading,
}: MessageBubbleListProps) {
  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-gray-500">Chargement de la conversation...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="text-center text-gray-500">
          <Mail className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p>Aucun message dans cette conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isFirstFromSender =
          index === 0 || messages[index - 1].from !== message.from || messages[index - 1].isOwn !== message.isOwn;
        const isLastFromSender =
          index === messages.length - 1 ||
          messages[index + 1].from !== message.from || messages[index + 1].isOwn !== message.isOwn;

        // Determine alignment based on message ownership
        const isOwn = message.isOwn || false;

        return (
          <div
            key={message.id}
            className={`mb-3 ${isFirstFromSender ? 'mt-4' : ''} ${index < messages.length - 1 ? 'border-b border-red-500 pb-4' : ''}`}
          >
            {/* Sender name for first message in group */}
            {isFirstFromSender && (
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                  {message.from.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {message.from}
                </span>
              </div>
            )}

            {/* Message content */}
            <div
              onClick={() => onMessageClick(message)}
              style={{
                padding: `1%`,
                marginLeft: `2.3rem`,
                marginBottom: `1rem`,
              }}
              className={`w-[700px] cursor-pointer rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-xl ${
                message.unread
                  ? 'border-2 border-blue-300 bg-blue-50 font-medium hover:bg-blue-100'
                  : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
              } `}
            >
              {/* Message preview */}
              <p
                className={`text-sm leading-relaxed ${
                  message.unread ? 'font-medium text-gray-900' : 'text-gray-700'
                }`}
              >
                {message.preview || message.subject || message.content || 'Message sans aperçu'}
              </p>

              {/* Time and status */}
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{message.time}</span>
                </div>
                {message.unread && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                    <span
                      className="h-5 w-12 rounded-full bg-blue-500 px-2 py-2 text-center text-[10px] font-semibold text-white"
                      style={{ padding: '0.25rem' }}
                    >
                      Non lu
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Add more space after last message from sender */}
            {isLastFromSender && <div className="mb-2" />}
          </div>
        );
      })}
    </div>
  );
}

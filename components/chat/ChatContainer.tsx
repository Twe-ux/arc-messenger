'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { MessageBubble, MessageData } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ConversationHeader, ConversationHeaderData } from './ConversationHeader';
import { ScrollArea } from '@/components/ui/ScrollArea';

export interface ChatContainerProps {
  conversation: ConversationHeaderData;
  messages: MessageData[];
  currentUserId: string;
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'voice') => void;
  onFileUpload?: (file: File) => void;
  onMessageReply?: (message: MessageData) => void;
  onMessageEdit?: (message: MessageData) => void;
  onMessageDelete?: (messageId: string) => void;
  onMessageReact?: (messageId: string, emoji: string) => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDeleteConversation?: () => void;
  onMute?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  isLoading?: boolean;
  className?: string;
}

// Mock typing users for demo
const mockTypingUsers = [
  { id: '2', name: 'Alice Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face' }
];

export const ChatContainer: React.FC<ChatContainerProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onFileUpload,
  onMessageReply,
  onMessageEdit,
  onMessageDelete,
  onMessageReact,
  onCall,
  onVideoCall,
  onSearch,
  onPin,
  onArchive,
  onDeleteConversation,
  onMute,
  onBack,
  showBackButton = true,
  isLoading = false,
  className,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [replyTo, setReplyTo] = useState<MessageData | null>(null);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (content: string, type?: 'text' | 'image' | 'file' | 'voice') => {
    onSendMessage(content, type);
    setReplyTo(null);
  };

  const handleMessageReply = (message: MessageData) => {
    setReplyTo(message);
    onMessageReply?.(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const handleStartVoiceRecording = () => {
    setIsVoiceRecording(true);
    // Voice recording logic would go here
  };

  const handleStopVoiceRecording = () => {
    setIsVoiceRecording(false);
    // Stop recording and process audio
  };

  // Group messages by sender and time proximity
  const groupedMessages = messages.reduce((groups: (MessageData & { showAvatar: boolean; showSenderName: boolean; isGrouped: boolean })[], message, index) => {
    const prevMessage = messages[index - 1];
    const isFromSameSender = prevMessage?.senderId === message.senderId;
    const timeDiff = prevMessage ? message.timestamp.getTime() - prevMessage.timestamp.getTime() : Infinity;
    const isWithinTimeGroup = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    const shouldGroup = isFromSameSender && isWithinTimeGroup;
    const showAvatar = !shouldGroup || !isFromSameSender;
    const showSenderName = Boolean(conversation.isGroup && !message.isOwn && showAvatar);

    groups.push({
      ...message,
      showAvatar,
      showSenderName,
      isGrouped: shouldGroup && isFromSameSender,
    });

    return groups;
  }, []);

  return (
    <div className={cn(
      'flex flex-col h-full',
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
      className
    )}>
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onBack={onBack}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onSearch={onSearch}
        onPin={onPin}
        onArchive={onArchive}
        onDelete={onDeleteConversation}
        onMute={onMute}
        showBackButton={showBackButton}
      />

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : groupedMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <span className="text-2xl">💬</span>
                </div>
                <h3 className={cn(
                  'text-lg font-medium mb-2',
                  isDarkMode ? 'text-white' : 'text-gray-900'
                )}>
                  Start the conversation
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Send a message to {conversation.name} to begin your conversation.
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {groupedMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <MessageBubble
                    message={message}
                    showAvatar={message.showAvatar}
                    showSenderName={message.showSenderName}
                    isGrouped={message.isGrouped}
                    onReply={handleMessageReply}
                    onEdit={onMessageEdit}
                    onDelete={onMessageDelete}
                    onReact={onMessageReact}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {conversation.status === 'typing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2"
              >
                <div className="flex space-x-1">
                  {mockTypingUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      {index === 0 && (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-1 bg-gray-200 rounded-full px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onFileUpload={onFileUpload}
          onStartVoiceRecording={handleStartVoiceRecording}
          onStopVoiceRecording={handleStopVoiceRecording}
          isRecording={isVoiceRecording}
          replyTo={replyTo ? {
            id: replyTo.id,
            content: replyTo.content,
            senderName: replyTo.senderName,
          } : undefined}
          onCancelReply={handleCancelReply}
          placeholder={`Message ${conversation.name}...`}
        />
      </div>
    </div>
  );
};
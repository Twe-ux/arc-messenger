'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  MoreHorizontal,
  Reply,
  Copy,
  Forward,
  Trash2,
  Edit3,
  Heart,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'video';

export interface MessageData {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  status: MessageStatus;
  type: MessageType;
  isOwn: boolean;
  isEdited?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
    duration?: number; // for voice/video
    dimensions?: { width: number; height: number }; // for images/videos
  };
}

export interface MessageBubbleProps {
  message: MessageData;
  showAvatar?: boolean;
  showSenderName?: boolean;
  isGrouped?: boolean; // If this message is grouped with previous from same sender
  onReply?: (message: MessageData) => void;
  onEdit?: (message: MessageData) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  className?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  showSenderName = false,
  isGrouped = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  className,
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = () => {
    if (!message.isOwn) return null;
    
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full" title="Failed to send" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <div className="break-words">
            {message.content}
            {message.isEdited && (
              <span className="text-xs text-gray-500 ml-2">(edited)</span>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="max-w-sm">
            <img
              src={message.metadata?.fileUrl}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
              style={{ maxHeight: '300px' }}
            />
            {message.content && (
              <div className="mt-2 break-words">{message.content}</div>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              📎
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{message.metadata?.fileName}</p>
              <p className="text-sm text-gray-500">
                {message.metadata?.fileSize ? `${Math.round(message.metadata.fileSize / 1024)} KB` : 'File'}
              </p>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
            <Button variant="ghost" size="icon" className="w-8 h-8">
              ▶️
            </Button>
            <div className="flex-1">
              <div className="w-full h-2 bg-white/20 rounded-full">
                <div className="h-2 bg-white/60 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            <span className="text-sm text-gray-300">
              {message.metadata?.duration || '0:15'}
            </span>
          </div>
        );
      default:
        return <div>{message.content}</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-2 max-w-full',
        message.isOwn ? 'justify-end' : 'justify-start',
        isGrouped && !showAvatar && 'ml-10', // Indent grouped messages
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Avatar for received messages */}
      {!message.isOwn && showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarImage src={message.senderAvatar} alt={message.senderName} />
            <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className="flex flex-col max-w-xs lg:max-w-md">
        {/* Sender name for group chats */}
        {!message.isOwn && showSenderName && (
          <span className="text-xs text-gray-500 mb-1 px-3">
            {message.senderName}
          </span>
        )}

        {/* Reply context */}
        {message.replyTo && (
          <div className="mb-1">
            <div className={cn(
              'p-2 rounded-lg border-l-4 text-sm',
              message.isOwn 
                ? 'bg-white/20 border-white/60' 
                : 'bg-gray-100 border-gray-400'
            )}>
              <p className="font-medium text-xs opacity-75">
                {message.replyTo.senderName}
              </p>
              <p className="truncate opacity-75">
                {message.replyTo.content}
              </p>
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group">
          <div
            className={cn(
              'px-3 py-2 rounded-2xl max-w-full word-wrap break-words',
              message.isOwn
                ? 'rounded-br-sm text-white'
                : 'rounded-bl-sm text-gray-900 bg-gray-100',
              message.status === 'sending' && 'opacity-70'
            )}
            style={{
              backgroundColor: message.isOwn ? colors.primary : undefined,
            }}
          >
            {renderMessageContent()}

            {/* Timestamp and status */}
            <div className={cn(
              'flex items-center justify-end gap-1 mt-1',
              message.isOwn ? 'text-white/70' : 'text-gray-500'
            )}>
              <span className="text-xs">
                {formatTime(message.timestamp)}
              </span>
              {getStatusIcon()}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className="flex items-center gap-1 px-2 py-1 bg-white rounded-full border text-xs hover:bg-gray-50 transition-colors"
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-gray-600">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons on hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'absolute top-0 flex items-center space-x-1 bg-white rounded-lg shadow-lg border p-1',
                message.isOwn ? '-left-20' : '-right-20'
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-500 hover:text-gray-700"
                onClick={() => onReact?.(message.id, '❤️')}
                title="React with heart"
              >
                <Heart className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-500 hover:text-gray-700"
                onClick={() => onReply?.(message)}
                title="Reply"
              >
                <Reply className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-gray-500 hover:text-gray-700"
                onClick={() => setShowActions(!showActions)}
                title="More actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Extended actions menu */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                'absolute top-12 bg-white rounded-lg shadow-lg border py-1 z-10 min-w-[140px]',
                message.isOwn ? '-left-20' : '-right-20'
              )}
            >
              <button
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              
              <button
                onClick={() => {/* Forward functionality */}}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Forward className="w-4 h-4" />
                <span>Forward</span>
              </button>

              {message.isOwn && (
                <button
                  onClick={() => onEdit?.(message)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}

              {message.isOwn && (
                <button
                  onClick={() => onDelete?.(message.id)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
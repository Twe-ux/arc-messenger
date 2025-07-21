'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Pin, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  Volume2, 
  VolumeX,
  Circle,
  Check,
  CheckCheck
} from 'lucide-react';

export interface ConversationData {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  messageStatus?: 'sent' | 'delivered' | 'read';
  messageType?: 'text' | 'image' | 'file' | 'voice';
  isGroup?: boolean;
  participants?: string[];
  lastMessageSender?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface ConversationCardProps {
  conversation: ConversationData;
  isActive?: boolean;
  onClick?: (conversation: ConversationData) => void;
  onPin?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onMute?: (conversationId: string) => void;
  className?: string;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  isActive = false,
  onClick,
  onPin,
  onArchive,
  onDelete,
  onMute,
  className,
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const getMessageStatusIcon = () => {
    switch (conversation.messageStatus) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getPriorityGradient = () => {
    switch (conversation.priority) {
      case 'high':
        return 'from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-150';
      case 'low':
        return 'from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-150';
      default:
        return conversation.unreadCount && conversation.unreadCount > 0
          ? 'from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-150'
          : 'from-white to-gray-50 border-gray-200 hover:from-gray-50 hover:to-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      return `${Math.floor(diffInMs / (1000 * 60))}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative p-3 rounded-xl border cursor-pointer transition-all duration-200',
        'bg-gradient-to-r',
        getPriorityGradient(),
        isActive && 'ring-2 ring-offset-2',
        conversation.isPinned && 'shadow-md',
        className
      )}
      style={{
        ...(isActive && {
          '--tw-ring-color': colors.primary,
        } as React.CSSProperties),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
      onClick={() => onClick?.(conversation)}
    >
      {/* Pinned Indicator */}
      {conversation.isPinned && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm"
        >
          <Pin className="w-2 h-2 text-white" />
        </motion.div>
      )}

      <div className="flex items-start space-x-3">
        {/* Avatar with Online Status */}
        <div className="relative flex-shrink-0">
          <Avatar className="w-12 h-12">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {conversation.isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></span>
          )}
          {conversation.isGroup && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {conversation.participants?.length || ''}
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className={cn(
                'font-medium truncate',
                conversation.unreadCount && conversation.unreadCount > 0
                  ? 'text-gray-900'
                  : 'text-gray-700'
              )}>
                {conversation.name}
              </h3>
              {conversation.isMuted && (
                <VolumeX className="w-3 h-3 text-gray-400 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              {getMessageStatusIcon()}
              <span className={cn(
                'text-xs',
                conversation.unreadCount && conversation.unreadCount > 0
                  ? 'text-gray-600 font-medium'
                  : 'text-gray-500'
              )}>
                {formatTimestamp(conversation.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {conversation.isGroup && conversation.lastMessageSender && (
                <span className="text-xs text-gray-500 mr-1">
                  {conversation.lastMessageSender}:
                </span>
              )}
              <p className={cn(
                'text-sm truncate',
                conversation.unreadCount && conversation.unreadCount > 0
                  ? 'text-gray-700 font-medium'
                  : 'text-gray-500'
              )}>
                {conversation.messageType === 'image' && '📷 '}
                {conversation.messageType === 'file' && '📎 '}
                {conversation.messageType === 'voice' && '🎵 '}
                {conversation.lastMessage}
              </p>
            </div>

            {/* Unread Count Badge */}
            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-2 px-2 py-0.5 text-xs font-semibold text-white rounded-full flex-shrink-0"
                style={{ backgroundColor: colors.primary }}
              >
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </motion.span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (shown on hover) */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          x: isHovered ? 0 : 10
        }}
        className="absolute right-2 top-2 flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin?.(conversation.id);
          }}
          className={cn(
            'p-1 rounded hover:bg-gray-100 transition-colors',
            conversation.isPinned ? 'text-yellow-500' : 'text-gray-400'
          )}
          title={conversation.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3 h-3" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMute?.(conversation.id);
          }}
          className={cn(
            'p-1 rounded hover:bg-gray-100 transition-colors',
            conversation.isMuted ? 'text-red-500' : 'text-gray-400'
          )}
          title={conversation.isMuted ? 'Unmute' : 'Mute'}
        >
          {conversation.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </motion.div>

      {/* Extended Actions Menu */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-2 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(conversation.id);
              setShowActions(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(conversation.id);
              setShowActions(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </motion.div>
      )}

      {/* Priority Indicator */}
      {conversation.priority === 'high' && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-400 rounded-r"></div>
      )}
    </motion.div>
  );
};
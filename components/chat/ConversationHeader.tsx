'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Phone, 
  Video, 
  Search, 
  MoreVertical,
  ArrowLeft,
  Pin,
  Archive,
  Trash2,
  VolumeX,
  Volume2,
  UserPlus,
  Settings,
  Star,
  Info
} from 'lucide-react';

export type ConversationStatus = 'online' | 'offline' | 'away' | 'busy' | 'typing';

export interface ConversationHeaderData {
  id: string;
  name: string;
  avatar?: string;
  status: ConversationStatus;
  lastSeen?: Date;
  isGroup?: boolean;
  participantCount?: number;
  description?: string;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
}

export interface ConversationHeaderProps {
  conversation: ConversationHeaderData;
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onSearch?: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onMute?: () => void;
  onAddParticipant?: () => void;
  onViewInfo?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onBack,
  onCall,
  onVideoCall,
  onSearch,
  onPin,
  onArchive,
  onDelete,
  onMute,
  onAddParticipant,
  onViewInfo,
  showBackButton = true,
  className,
}) => {
  const { colors, isDarkMode } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusText = () => {
    switch (conversation.status) {
      case 'online':
        return 'Online';
      case 'typing':
        return 'Typing...';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
        if (conversation.lastSeen) {
          const now = new Date();
          const lastSeen = conversation.lastSeen;
          const diffMs = now.getTime() - lastSeen.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);
          const diffDays = diffHours / 24;

          if (diffHours < 1) {
            const minutes = Math.floor(diffMs / (1000 * 60));
            return `Last seen ${minutes}m ago`;
          } else if (diffHours < 24) {
            return `Last seen ${Math.floor(diffHours)}h ago`;
          } else if (diffDays < 7) {
            return `Last seen ${Math.floor(diffDays)}d ago`;
          } else {
            return `Last seen ${lastSeen.toLocaleDateString()}`;
          }
        }
        return 'Offline';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (conversation.status) {
      case 'online':
        return 'text-green-500';
      case 'typing':
        return 'text-blue-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b transition-colors',
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        className
      )}
    >
      {/* Left section - Back button, Avatar, Name, Status */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="w-8 h-8 text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={conversation.avatar} alt={conversation.name} />
            <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!conversation.isGroup && conversation.status === 'online' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
          )}
          {conversation.isGroup && conversation.participantCount && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {conversation.participantCount > 99 ? '99+' : conversation.participantCount}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={onViewInfo}>
          <div className="flex items-center space-x-2">
            <h3 className={cn(
              'font-medium truncate',
              isDarkMode ? 'text-white' : 'text-gray-900'
            )}>
              {conversation.name}
            </h3>
            {conversation.isPinned && (
              <Pin className="w-3 h-3 text-yellow-500" />
            )}
            {conversation.isMuted && (
              <VolumeX className="w-3 h-3 text-gray-400" />
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <span className={cn('text-xs', getStatusColor())}>
              {getStatusText()}
            </span>
            {conversation.isGroup && (
              <span className="text-xs text-gray-500">
                • {conversation.participantCount} members
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center space-x-1">
        {/* Call button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onCall}
          className="w-9 h-9 text-gray-500 hover:text-gray-700"
          title="Voice call"
        >
          <Phone className="w-4 h-4" />
        </Button>

        {/* Video call button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onVideoCall}
          className="w-9 h-9 text-gray-500 hover:text-gray-700"
          title="Video call"
        >
          <Video className="w-4 h-4" />
        </Button>

        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearch}
          className="w-9 h-9 text-gray-500 hover:text-gray-700"
          title="Search in conversation"
        >
          <Search className="w-4 h-4" />
        </Button>

        {/* More options menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 text-gray-500 hover:text-gray-700"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className={cn(
                  'absolute right-0 top-12 rounded-lg shadow-lg border py-1 z-20 min-w-[180px]',
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                )}
              >
                <button
                  onClick={() => {
                    onViewInfo?.();
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3',
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                  )}
                >
                  <Info className="w-4 h-4" />
                  <span>View info</span>
                </button>

                <button
                  onClick={() => {
                    onPin?.();
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3',
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                  )}
                >
                  <Pin className="w-4 h-4" />
                  <span>{conversation.isPinned ? 'Unpin' : 'Pin'} conversation</span>
                </button>

                <button
                  onClick={() => {
                    onMute?.();
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3',
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                  )}
                >
                  {conversation.isMuted ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  <span>{conversation.isMuted ? 'Unmute' : 'Mute'} notifications</span>
                </button>

                {conversation.isGroup && (
                  <button
                    onClick={() => {
                      onAddParticipant?.();
                      setShowDropdown(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3',
                      isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                    )}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add participant</span>
                  </button>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                <button
                  onClick={() => {
                    onArchive?.();
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3',
                    isDarkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'
                  )}
                >
                  <Archive className="w-4 h-4" />
                  <span>Archive conversation</span>
                </button>

                <button
                  onClick={() => {
                    onDelete?.();
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center space-x-3',
                    isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600'
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete conversation</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};
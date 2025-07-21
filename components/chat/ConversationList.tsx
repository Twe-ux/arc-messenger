'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConversationCard, ConversationData } from './ConversationCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface ConversationListProps {
  conversations?: ConversationData[];
  activeConversationId?: string;
  onConversationSelect?: (conversation: ConversationData) => void;
  onPin?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
  onMute?: (conversationId: string) => void;
  className?: string;
}

// Mock data for demonstration
const mockConversations: ConversationData[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    lastMessage: 'Hey! How are you doing today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    unreadCount: 3,
    isOnline: true,
    isPinned: true,
    messageStatus: 'delivered',
    messageType: 'text',
    priority: 'high',
  },
  {
    id: '2',
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face',
    lastMessage: 'Thanks for the help with the project!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    unreadCount: 1,
    isOnline: false,
    messageStatus: 'read',
    messageType: 'text',
    priority: 'normal',
  },
  {
    id: '3',
    name: 'Team Development',
    lastMessage: 'Alex: Let\'s review the new features tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    unreadCount: 5,
    isGroup: true,
    participants: ['Alex', 'Sarah', 'Mike', 'Lisa'],
    lastMessageSender: 'Alex',
    messageType: 'text',
    priority: 'normal',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    lastMessage: '📷 Photo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    isOnline: true,
    messageStatus: 'sent',
    messageType: 'image',
    priority: 'low',
    isMuted: true,
  },
  {
    id: '5',
    name: 'Mike Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    lastMessage: '📎 Document.pdf',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    messageStatus: 'delivered',
    messageType: 'file',
    priority: 'normal',
    isArchived: false,
  },
];

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations = mockConversations,
  activeConversationId,
  onConversationSelect,
  onPin,
  onArchive,
  onDelete,
  onMute,
  className,
}) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned'>('all');

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'unread' && conversation.unreadCount && conversation.unreadCount > 0) ||
                         (filterType === 'pinned' && conversation.isPinned);
    
    return matchesSearch && matchesFilter && !conversation.isArchived;
  });

  // Sort conversations: pinned first, then by timestamp
  const sortedConversations = filteredConversations.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
            Conversations
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-100"
            title="New conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'pinned', label: 'Pinned' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilterType(id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filterType === id
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={{
                backgroundColor: filterType === id ? colors.primary : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedConversations.length > 0 ? (
            <motion.div className="p-2 space-y-2">
              {sortedConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <ConversationCard
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    onClick={onConversationSelect}
                    onPin={onPin}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    onMute={onMute}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-8"
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <Search className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500 max-w-sm">
                {searchQuery 
                  ? `No conversations match "${searchQuery}"`
                  : 'Start a new conversation to begin messaging.'
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{conversations.length} total</span>
          <span>
            {conversations.filter(c => c.unreadCount && c.unreadCount > 0).length} unread
          </span>
          <span>{conversations.filter(c => c.isPinned).length} pinned</span>
        </div>
      </div>
    </div>
  );
};
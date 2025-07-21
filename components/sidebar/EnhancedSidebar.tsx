'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Settings, 
  User, 
  Mail, 
  MessageSquare, 
  Heart, 
  Archive, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  MoreHorizontal,
  Circle,
  Users,
  Phone,
  Video,
  Bell
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

export interface EnhancedSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

interface ConversationType {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
  gradient?: string;
}

interface Workspace {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  isActive?: boolean;
}

const conversationTypes: ConversationType[] = [
  { 
    id: 'inbox', 
    name: 'Inbox', 
    icon: <Mail className="w-4 h-4" />, 
    count: 12,
    gradient: 'from-blue-50 to-blue-100',
    color: 'text-blue-600'
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    icon: <User className="w-4 h-4" />, 
    count: 3,
    gradient: 'from-green-50 to-green-100',
    color: 'text-green-600'
  },
  { 
    id: 'work', 
    name: 'Work', 
    icon: <MessageSquare className="w-4 h-4" />, 
    count: 8,
    gradient: 'from-orange-50 to-orange-100',
    color: 'text-orange-600'
  },
  { 
    id: 'teams', 
    name: 'Teams', 
    icon: <Users className="w-4 h-4" />, 
    count: 5,
    gradient: 'from-purple-50 to-purple-100',
    color: 'text-purple-600'
  },
  { 
    id: 'favorites', 
    name: 'Favorites', 
    icon: <Heart className="w-4 h-4" />, 
    count: 2,
    gradient: 'from-pink-50 to-pink-100',
    color: 'text-pink-600'
  },
];

const quickActions: ConversationType[] = [
  { 
    id: 'archived', 
    name: 'Archived', 
    icon: <Archive className="w-4 h-4" />,
    gradient: 'from-gray-50 to-gray-100',
    color: 'text-gray-600'
  },
  { 
    id: 'spam', 
    name: 'Spam', 
    icon: <Trash2 className="w-4 h-4" />,
    gradient: 'from-red-50 to-red-100',
    color: 'text-red-600'
  },
];

const workspaces: Workspace[] = [
  { id: 'main', name: 'Main', icon: <Circle className="w-3 h-3" />, color: '#8b5cf6', isActive: true },
  { id: 'project-a', name: 'Project A', icon: <Circle className="w-3 h-3" />, color: '#3b82f6' },
  { id: 'team-chat', name: 'Team Chat', icon: <Circle className="w-3 h-3" />, color: '#10b981' },
];

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggle,
  className,
}) => {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'conversations' | 'contacts' | 'calls'>('conversations');
  
  // Use controlled or internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  // Quick actions hover effects
  const getHoverStyles = (type: ConversationType) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (activeCategory !== type.id) {
        e.currentTarget.style.backgroundColor = colors.primaryLight;
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      if (activeCategory !== type.id) {
        e.currentTarget.style.backgroundColor = 'transparent';
      }
    },
  });

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex flex-col min-h-full transition-all duration-300 ease-out',
        className
      )}
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
      }}
    >
      {/* Header Section */}
      <div className="p-3 border-b border-white/20">
        <div className={cn(
          'flex items-center',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className="text-white hover:bg-white/10 border border-white/20 hover:border-white/40"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>

          {/* Navigation Tabs */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex bg-white/10 rounded-lg p-1"
              >
                {[
                  { id: 'conversations', icon: MessageSquare, label: 'Chats' },
                  { id: 'contacts', icon: Users, label: 'Contacts' },
                  { id: 'calls', icon: Phone, label: 'Calls' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveView(id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                      activeView === id
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-3 h-3 mx-auto" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Bar */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Conversation Types Section */}
        <AnimatePresence>
          {!isCollapsed && activeView === 'conversations' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 px-4 py-4 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
            >
              {/* Active Conversations */}
              <div>
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
                  Conversations
                </h3>
                <div className="space-y-1">
                  {conversationTypes.map((type, index) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                      onClick={() => handleCategoryClick(type.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left group',
                        activeCategory === type.id
                          ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      )}
                      {...getHoverStyles(type)}
                    >
                      <span className="flex-shrink-0 text-white">
                        {type.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium truncate block">
                          {type.name}
                        </span>
                      </div>
                      {type.count !== undefined && type.count > 0 && (
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-semibold rounded-full transition-colors',
                            activeCategory === type.id
                              ? 'bg-white text-purple-700'
                              : 'bg-white/20 text-white group-hover:bg-white/30'
                          )}
                        >
                          {type.count > 99 ? '99+' : type.count}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-1">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: (conversationTypes.length + index) * 0.03 }}
                      onClick={() => handleCategoryClick(action.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-left',
                        activeCategory === action.id
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <span className="flex-shrink-0">
                        {action.icon}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {action.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed View */}
        {isCollapsed && (
          <div className="flex flex-col items-center space-y-3 p-3">
            {conversationTypes.slice(0, 4).map((type) => (
              <button
                key={type.id}
                onClick={() => handleCategoryClick(type.id)}
                className={cn(
                  'w-10 h-10 flex items-center justify-center rounded-lg transition-all relative group',
                  activeCategory === type.id
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                )}
                title={type.name}
              >
                {type.icon}
                {type.count !== undefined && type.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {type.count > 9 ? '9+' : type.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section - User Profile & Workspaces */}
      <div className="p-4 border-t border-white/20">
        {/* Workspaces */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Workspaces
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-6 w-6 p-0"
                  title="Add workspace"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    className={cn(
                      'w-6 h-6 rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all flex-shrink-0',
                      workspace.isActive ? 'scale-110 shadow-lg' : 'hover:scale-105'
                    )}
                    style={{ backgroundColor: workspace.color }}
                    title={workspace.name}
                  >
                    {workspace.icon}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile */}
        <div className={cn(
          'flex items-center gap-3',
          isCollapsed && 'justify-center'
        )}>
          <div className="relative">
            <Avatar className="w-8 h-8 border-2 border-white/30">
              <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
              <AvatarFallback>{(user?.name || 'U').charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
          </div>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Guest User'}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {user?.email || 'guest@example.com'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10 w-8 h-8"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
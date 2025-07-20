'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Search, Settings, User, Mail, MessageSquare, Heart, Archive, Trash2, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
}

const defaultCategories: Category[] = [
  { id: 'inbox', name: 'Inbox', icon: <Mail className="w-5 h-5" />, count: 12 },
  { id: 'personal', name: 'Personal', icon: <User className="w-5 h-5" />, count: 3 },
  { id: 'work', name: 'Work', icon: <MessageSquare className="w-5 h-5" />, count: 8 },
  { id: 'favorites', name: 'Favorites', icon: <Heart className="w-5 h-5" />, count: 2 },
  { id: 'archived', name: 'Archived', icon: <Archive className="w-5 h-5" /> },
  { id: 'spam', name: 'Spam', icon: <Trash2 className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggle,
  className,
}) => {
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  
  // Use controlled or internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  // Sidebar width animation
  const sidebarWidth = useMotionValue(isCollapsed ? 80 : 320);
  const sidebarOpacity = useTransform(sidebarWidth, [80, 320], [0.8, 1]);
  
  // Resize functionality
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalCollapsed(!isCollapsed);
    }
  };

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.max(280, Math.min(400, e.clientX));
      sidebarWidth.set(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  return (
    <motion.div
      ref={sidebarRef}
      style={{ width: isCollapsed ? 80 : sidebarWidth, opacity: sidebarOpacity }}
      className={cn(
        'relative flex flex-col h-full bg-gradient-to-b from-purple-600 via-purple-700 to-purple-800',
        'border-r border-purple-500/20 shadow-xl',
        className
      )}
    >
      {/* Arc-style gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 border-b border-purple-500/20">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Arc Messenger</h1>
                <p className="text-purple-200 text-xs">Unified Communications</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleToggle}
          className="text-white hover:bg-white/10 border-0"
        >
          {isCollapsed ? (
            <Menu className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      <div className="relative p-4 border-b border-purple-500/20">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <Avatar
                src={user?.avatar}
                name={user?.name}
                size="default"
                status="online"
                showStatus
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-purple-200 text-sm truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <Avatar
                src={user?.avatar}
                name={user?.name}
                size="default"
                status="online"
                showStatus
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search */}
      <div className="relative p-4">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                className="bg-white/10 border-white/20 text-white placeholder:text-purple-200 focus-visible:ring-white/30"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div className="flex-1 px-2 pb-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="space-y-1"
            >
              {defaultCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 * index }}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                    'hover:bg-white/10 group',
                    activeCategory === category.id 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  )}
                >
                  <span className="flex-shrink-0">
                    {category.icon}
                  </span>
                  <span className="flex-1 text-left font-medium">
                    {category.name}
                  </span>
                  {category.count !== undefined && category.count > 0 && (
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-semibold rounded-full',
                      activeCategory === category.id
                        ? 'bg-white text-purple-700'
                        : 'bg-purple-500 text-white'
                    )}>
                      {category.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Category Icons */}
        <AnimatePresence mode="wait">
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {defaultCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.05 * index }}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    'w-12 h-12 flex items-center justify-center rounded-lg transition-all relative',
                    'hover:bg-white/10 group',
                    activeCategory === category.id 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-purple-200 hover:text-white'
                  )}
                  title={category.name}
                >
                  {category.icon}
                  {category.count !== undefined && category.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {category.count > 9 ? '9+' : category.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resize Handle */}
      {!isCollapsed && (
        <div
          ref={resizeRef}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-400/50 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />
      )}
    </motion.div>
  );
};
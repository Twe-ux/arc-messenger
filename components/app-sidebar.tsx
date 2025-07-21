'use client';

import { useState } from 'react';
import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  User2,
  MessageSquare,
  Users,
  Heart,
  Archive,
  Trash2,
  Pin,
  Phone,
  Video,
  Mail,
  Plus,
  MoreHorizontal,
  Volume2,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { ConversationData } from './chat/ConversationCard';

// Données des conversations pour la sidebar
const mockConversations: ConversationData[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    lastMessage: 'Hey! How are you doing today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
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
    lastMessage: 'Thanks for the help!',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unreadCount: 1,
    isOnline: false,
    messageStatus: 'read',
    messageType: 'text',
    priority: 'normal',
  },
  {
    id: '3',
    name: 'Team Development',
    lastMessage: 'Alex: Let\'s review tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unreadCount: 5,
    isGroup: true,
    participants: ['Alex', 'Sarah', 'Mike', 'Lisa'],
    lastMessageSender: 'Alex',
    messageType: 'text',
    priority: 'normal',
  },
];

const categories = [
  { name: 'Inbox', icon: Inbox, count: 12, color: 'text-blue-600' },
  { name: 'Personal', icon: User2, count: 3, color: 'text-green-600' },
  { name: 'Work', icon: MessageSquare, count: 8, color: 'text-orange-600' },
  { name: 'Teams', icon: Users, count: 5, color: 'text-purple-600' },
  { name: 'Favorites', icon: Heart, count: 2, color: 'text-pink-600' },
];

const quickActions = [
  { name: 'Archived', icon: Archive, color: 'text-gray-600' },
  { name: 'Spam', icon: Trash2, color: 'text-red-600' },
];

interface AppSidebarProps {
  activeConversationId?: string;
  onConversationSelect?: (conversation: ConversationData) => void;
}

export function AppSidebar({ activeConversationId, onConversationSelect }: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInMs / (1000 * 60))}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  };

  return (
    <Sidebar className="h-full  border-none bg-transparent text-white">
      <SidebarHeader className="border-b border-slate-700 p-4 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-6 items-center justify-center rounded-lg bg-purple-600 text-white">
            <MessageSquare className="size-3" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-white text-sm">Arc Messenger</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Arc-style Categories */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium px-3 py-2">SPACES</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category.name}>
                  <SidebarMenuButton className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg py-1.5 px-2 text-sm">
                    <category.icon className="size-4 text-slate-400" />
                    <span className="text-sm">{category.name}</span>
                    {category.count > 0 && (
                      <Badge variant="secondary" className="ml-auto bg-slate-600 text-white text-xs h-5 px-1.5">
                        {category.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Arc-style Conversations */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium px-3 py-2">CONVERSATIONS</SidebarGroupLabel>
          <SidebarGroupAction title="Add Conversation" className="text-slate-400 hover:text-white">
            <Plus className="size-3" />
          </SidebarGroupAction>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {mockConversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton
                    isActive={activeConversationId === conversation.id}
                    onClick={() => onConversationSelect?.(conversation)}
                    className="group/conversation text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg py-2 px-2 data-[active=true]:bg-purple-600 data-[active=true]:text-white"
                  >
                    <div className="relative">
                      <Avatar className="size-6">
                        <AvatarImage src={conversation.avatar} alt={conversation.name} />
                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {conversation.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-green-500 border border-white" />
                      )}
                      {conversation.isGroup && (
                        <div className="absolute -top-1 -right-1 size-3 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                          {conversation.participants?.length || ''}
                        </div>
                      )}
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <div className="flex items-center gap-1">
                        <span className="truncate font-medium">{conversation.name}</span>
                        {conversation.isPinned && <Pin className="size-3 text-yellow-500" />}
                        {conversation.isMuted && <Volume2 className="size-3 text-gray-400" />}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {conversation.isGroup && conversation.lastMessageSender && (
                          <span className="text-muted-foreground">{conversation.lastMessageSender}: </span>
                        )}
                        {conversation.messageType === 'image' && '📷 '}
                        {conversation.messageType === 'file' && '📎 '}
                        {conversation.messageType === 'voice' && '🎵 '}
                        {conversation.lastMessage}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="default" className="size-5 p-0 text-xs">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuAction className="opacity-0 group-hover/conversation:opacity-100">
                    <MoreHorizontal className="size-4" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-700 bg-slate-800/50 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg py-2">
              <Avatar className="size-5">
                <AvatarImage src="/avatar.jpg" alt="User" />
                <AvatarFallback className="bg-purple-600 text-white text-xs">JD</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium text-white">John Doe</span>
                <span className="truncate text-xs text-slate-400">john@example.com</span>
              </div>
              <div className="size-2 rounded-full bg-green-400" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
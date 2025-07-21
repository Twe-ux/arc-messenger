'use client';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useGmailMessages } from '@/hooks/useGmailMessages';
import { MessageProvider, useMessage, Correspondent, ConversationMessage } from '@/contexts/MessageContext';
import { useSession } from 'next-auth/react';
import { SwipeableCorrespondentItem } from '@/components/sidebar/SwipeableCorrespondentItem';
import {
  Archive,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Circle,
  Home,
  Inbox,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Send,
  SettingsIcon,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import React, { useState } from 'react';

// Component qui utilise le MessageContext
function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedCategory, setSelectedCategory] = useState('inbox');
  const [showFloatingSidebar, setShowFloatingSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPosition, setSettingsPosition] = useState({ x: 300, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Use session for user info
  const { data: session } = useSession();

  // Use theme context
  const {
    backgroundColor,
    setBackgroundColor,
    sidebarPosition,
    setSidebarPosition,
  } = useTheme();

  // Use Gmail messages - Increased limit to get more messages
  const {
    messages: gmailMessages,
    loading: gmailLoading,
    error: gmailError,
    refreshMessages,
    updateMessageReadStatus: updateGmailMessageReadStatus,
    deleteCorrespondentMessages,
  } = useGmailMessages(50); // Increased from 15 to 50 messages

  // Use message context
  const { 
    selectedCorrespondent, 
    setSelectedCorrespondent, 
    setConversationMessages,
    setLoadingConversation,
    setSelectedMessage, 
    setMessageContent, 
    setLoadingMessage,
    setExternalSyncFunction,
    setExternalDeleteFunction,
    deleteCorrespondent
  } = useMessage();

  // Set up Gmail hook sync functions
  React.useEffect(() => {
    setExternalSyncFunction(() => updateGmailMessageReadStatus);
    setExternalDeleteFunction(deleteCorrespondentMessages);
  }, [updateGmailMessageReadStatus]); // deleteCorrespondentMessages is now stable

  // Group messages by correspondent (conversation partners)
  const correspondents: Correspondent[] = React.useMemo(() => {
    // First, let's get the current user's email
    const currentUserEmail = session?.user?.email?.toLowerCase();
    
    const grouped = gmailMessages.reduce((acc, message) => {
      // Skip if this is somehow the current user (shouldn't happen but safety check)
      const senderEmail = message.from.toLowerCase().trim();
      if (senderEmail === currentUserEmail) {
        return acc;
      }
      
      // Group by sender email (this should be the correspondent)
      const correspondentKey = senderEmail;
      
      if (!acc[correspondentKey]) {
        acc[correspondentKey] = {
          email: senderEmail,
          name: message.from,
          lastMessage: message,
          messageCount: 1,
          unreadCount: message.unread ? 1 : 0,
          threadId: message.threadId, // Store thread ID for loading complete conversations
        };
      } else {
        // Update if this message is more recent
        const existing = acc[correspondentKey];
        const messageTime = new Date(message.time);
        const existingTime = new Date(existing.lastMessage.time);
        
        if (messageTime > existingTime) {
          existing.lastMessage = message;
          existing.threadId = message.threadId; // Update to most recent thread
        }
        existing.messageCount++;
        if (message.unread) {
          existing.unreadCount++;
        }
      }
      
      return acc;
    }, {} as Record<string, Correspondent>);
    
    // Convert to array and sort by last message time
    return Object.values(grouped).sort((a, b) => 
      new Date(b.lastMessage.time).getTime() - new Date(a.lastMessage.time).getTime()
    );
  }, [gmailMessages]);

  // Handle correspondent click to load complete Gmail thread
  const handleCorrespondentClick = async (correspondent: Correspondent) => {
    console.log('Correspondent selected:', correspondent);
    setSelectedCorrespondent(correspondent);
    setLoadingConversation(true);
    setConversationMessages([]);
    setSelectedMessage(null);

    try {
      console.log('Loading ALL messages for correspondent:', correspondent.email);

      let allMessages: any[] = [];

      // Step 1: Get individual messages from this correspondent (fast local filtering)
      console.log('Loading individual messages from local data...');
      const correspondentMessages = gmailMessages
        .filter(msg => {
          const msgFrom = msg.from.toLowerCase().trim();
          const corrEmail = correspondent.email.toLowerCase().trim();
          return msgFrom === corrEmail;
        })
        .map(msg => ({
          ...msg,
          isOwn: false,
          messageType: 'individual', // Mark as individual email
        }));

      console.log(`📧 Found ${correspondentMessages.length} individual messages from ${correspondent.email}`);
      allMessages = [...correspondentMessages];

      // Step 2: Try to load conversation thread (with sent/received messages)
      if (correspondent.threadId) {
        try {
          console.log('Loading conversation thread:', correspondent.threadId);
          const response = await fetch(`/api/gmail/conversations/${correspondent.threadId}/messages`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Thread messages loaded:', data);

            if (data.messages && Array.isArray(data.messages)) {
              // Convert thread messages to conversation format
              const threadMessages = data.messages
                .map((msg: any) => ({
                  id: msg.id + '_thread', // Unique ID to avoid conflicts
                  from: msg.senderName || msg.senderId || correspondent.name,
                  preview: msg.content?.substring(0, 200) || msg.snippet || 'No preview available',
                  time: new Date(msg.timestamp).toLocaleString(),
                  unread: false,
                  subject: msg.subject || `Thread: ${msg.senderName}`,
                  threadId: correspondent.threadId,
                  isEmail: true,
                  content: msg.content,
                  isOwn: msg.isOwn || false,
                  messageType: 'conversation', // Mark as conversation message
                }));

              console.log(`💬 Found ${threadMessages.length} conversation messages`);
              allMessages = [...allMessages, ...threadMessages];
            }
          }
        } catch (threadError) {
          console.warn('❌ Failed to load thread conversation:', threadError);
        }
      }

      // Step 3: Sort all messages by time and remove duplicates
      const uniqueMessages = allMessages
        .filter((msg, index, self) => 
          index === self.findIndex(m => m.id === msg.id || (m.content === msg.content && m.time === msg.time))
        )
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      console.log(`🎯 Final result: ${uniqueMessages.length} total messages (${correspondentMessages.length} individual + ${allMessages.length - correspondentMessages.length} conversation)`);
      
      if (uniqueMessages.length === 0) {
        console.warn('⚠️ No messages found. Debug info:');
        console.log('Correspondent email:', correspondent.email);
        console.log('Available senders:', [...new Set(gmailMessages.map(m => m.from))]);
      }

      setConversationMessages(uniqueMessages);
    } catch (error) {
      console.error('Error loading correspondent messages:', error);
      setConversationMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  };

  // Handle message click to fetch and display message content
  const handleMessageClick = async (message: any) => {
    console.log('Message clicked:', message);
    setSelectedMessage(message);
    setLoadingMessage(true);
    setMessageContent(null);

    try {
      // Fetch the full message content from Gmail API
      const response = await fetch(`/api/gmail/conversations/${message.threadId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Message content fetched:', data);
        
        // Find the specific message in the thread or use the first message
        const messageContent = data.messages && data.messages.length > 0 
          ? data.messages[0].content 
          : 'Contenu du message non disponible';
        
        setMessageContent(messageContent);
      } else {
        console.error('Failed to fetch message content');
        setMessageContent('Erreur lors du chargement du message');
      }
    } catch (error) {
      console.error('Error fetching message content:', error);
      setMessageContent('Erreur lors du chargement du message');
    } finally {
      setLoadingMessage(false);
    }
  };

  // Helper function to generate sidebar colors based on background
  const getSidebarColors = (bgColor: string) => {
    // Parse RGB values from string like "rgb(216, 180, 254)"
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      // Create darker version for borders
      const borderColor = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
      // Create lighter version for sidebar background
      const sidebarBg = `rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`;
      return { borderColor, sidebarBg };
    }
    // Fallback
    return {
      borderColor: 'rgb(168, 85, 247)',
      sidebarBg: 'rgb(196, 181, 253)',
    };
  };

  const { borderColor, sidebarBg } = getSidebarColors(backgroundColor);

  // Categories with customizable icons and notification badges
  const categories = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <Home />,
      count: 24,
      description: 'Tous les messages',
    },
    {
      id: 'personal',
      name: 'Personnel',
      icon: <User />,
      count: 8,
      description: 'Messages personnels',
    },
    {
      id: 'work',
      name: 'Travail',
      icon: <Briefcase />,
      count: 12,
      description: 'Messages professionnels',
    },
    {
      id: 'favorites',
      name: 'Favoris',
      icon: <Star />,
      count: 3,
      description: 'Messages favoris',
    },
    {
      id: 'archived',
      name: 'Archivés',
      icon: <Archive />,
      count: 45,
      description: 'Messages archivés',
    },
  ];

  // Mock data for folders with status indicators
  const folders = [
    {
      id: 'inbox',
      name: 'Boite de reception',
      icon: Inbox,
      count: 12,
      color: 'bg-blue-500',
    },
    {
      id: 'sent',
      name: 'Envoyes',
      icon: Send,
      count: 0,
      color: 'bg-green-500',
    },
    {
      id: 'starred',
      name: 'Favoris',
      icon: Star,
      count: 3,
      color: 'bg-yellow-500',
    },
    {
      id: 'archive',
      name: 'Archives',
      icon: Archive,
      count: 45,
      color: 'bg-gray-500',
    },
    {
      id: 'trash',
      name: 'Corbeille',
      icon: Trash2,
      count: 7,
      color: 'bg-red-500',
    },
  ];

  // Mock favorite contacts
  const favoriteContacts = [
    { id: 1, name: 'Alice', avatar: 'A', online: true },
    { id: 2, name: 'Bob', avatar: 'B', online: false },
    { id: 3, name: 'Charlie', avatar: 'C', online: true },
    { id: 4, name: 'Diana', avatar: 'D', online: false },
    { id: 5, name: 'Eve', avatar: 'E', online: true },
    { id: 6, name: 'Frank', avatar: 'F', online: false },
  ];

  // Use correspondents for sidebar display
  const messages = correspondents;

  // Drag functions for settings popup
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - settingsPosition.x,
      y: e.clientY - settingsPosition.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setSettingsPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      className="fixed inset-0 flex h-full w-full"
      style={{ backgroundColor }}
    >
      {/* Zone de détection pour mode collapsed */}
      {sidebarCollapsed && (
        <div
          className={`absolute top-0 z-40 h-full w-4 cursor-pointer ${
            sidebarPosition === 'left' ? 'left-0' : 'right-0'
          }`}
          onMouseEnter={() => setShowFloatingSidebar(true)}
          onMouseLeave={() => setShowFloatingSidebar(false)}
        />
      )}

      {/* Sidebar flottante en mode collapsed */}
      {sidebarCollapsed && showFloatingSidebar && (
        <div
          className={`absolute top-0 z-50 flex h-[calc(100vh-1.5rem)] w-80 flex-col gap-5 rounded-2xl border-2 shadow-2xl ${
            sidebarPosition === 'left' ? 'left-0' : 'right-0'
          }`}
          style={{
            padding: '1rem',
            margin: '0.7%',

            backgroundColor: sidebarBg,
            borderColor: borderColor,
          }}
          onMouseEnter={() => setShowFloatingSidebar(true)}
          onMouseLeave={() => setShowFloatingSidebar(false)}
        >
          {/* Contenu identique à la sidebar normale */}
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              title="Épingler la sidebar"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div
              className="flex w-full items-center"
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
              }}
            >
              <input
                type="text"
                placeholder="Rechercher..."
                className="ml-2 flex-1 rounded-lg border border-purple-400 p-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                style={{
                  width: 'calc(100% - 3rem)',
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                }}
              />
            </div>
            <div className="flex gap-1">
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Contacts favoris */}
          <div className="p-3">
            <h3
              className="text-sm font-medium text-gray-700"
              style={{ marginBottom: '0.75rem' }}
            >
              Contacts favoris
            </h3>
            <div
              className="flex flex-wrap gap-2"
              style={{ marginBottom: '.5rem' }}
            >
              {favoriteContacts.map((contact) => (
                <div key={contact.id} className="relative">
                  <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white transition-colors hover:bg-purple-600">
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-medium text-gray-700">
                Messages Gmail
              </h3>
              {gmailLoading && (
                <RefreshCw className="h-3 w-3 animate-spin text-purple-500" />
              )}
            </div>
            <button
              onClick={refreshMessages}
              className="rounded-md p-1 transition-colors hover:bg-gray-100"
              title="Actualiser les messages"
              disabled={gmailLoading}
            >
              <RefreshCw
                className={`h-3 w-3 text-gray-500 hover:text-gray-700 ${gmailLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {gmailError ? (
                <div className="py-4 text-center">
                  <div className="mb-2 text-sm text-red-500">
                    Erreur de chargement Gmail
                  </div>
                  <button
                    onClick={refreshMessages}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Réessayer
                  </button>
                </div>
              ) : messages.length === 0 && !gmailLoading ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  <Mail className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  Aucun message Gmail
                </div>
              ) : (
                <div className="space-y-0">
                  {messages.map((correspondent) => (
                    <SwipeableCorrespondentItem
                      key={correspondent.email}
                      correspondent={correspondent}
                      onCorrespondentClick={handleCorrespondentClick}
                      onDelete={deleteCorrespondent}
                    />
                  ))}

                  {gmailLoading && messages.length === 0 && (
                    <div className="py-4 text-center">
                      <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-purple-500" />
                      <div className="text-sm text-gray-600">
                        Chargement des messages Gmail...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Categories Bar */}
          <div className="">
            <div className="justify-arround flex items-center gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                title="Paramètres"
              >
                <SettingsIcon className="h-5 w-5 text-gray-600" />
              </button>
              {categories.map((category) => (
                <div key={category.id} className="group relative">
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`relative transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'flex h-8 w-8 items-center justify-center rounded-md bg-purple-200 text-purple-800 shadow-lg'
                        : 'flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-purple-200'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    {category.count > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[10px] text-white">
                        {category.count > 9 ? '9+' : category.count}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar normale */}
      <div
        className={`flex flex-col gap-5 transition-all duration-300 ${
          sidebarCollapsed ? 'hidden w-0' : 'w-80'
        } ${sidebarPosition === 'right' ? 'order-2' : 'order-1'}`}
        style={{ padding: '1rem' }}
      >
        {/* Top Controls */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div
            className="flex w-full items-center"
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
            }}
          >
            {/* <Search className="w-5 h-5 text-gray-600" /> */}
            <input
              type="text"
              placeholder="Rechercher..."
              className={`ml-2 flex-1 rounded-lg border border-purple-400 p-2 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                sidebarCollapsed ? 'hidden' : 'block'
              }`}
              style={{
                width: 'calc(100% - 3rem)',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
              }}
            />
          </div>
          {/* Navigation Arrows */}

          {!sidebarCollapsed && (
            <div className="flex gap-1">
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Favorite Contacts */}
            <div className="p-3">
              <h3
                className="text-sm font-medium text-gray-700"
                style={{ marginBottom: '0.75rem' }}
              >
                Contacts favoris
              </h3>
              <div
                className="flex flex-wrap gap-2"
                style={{ marginBottom: '.5rem' }}
              >
                {favoriteContacts.map((contact) => (
                  <div key={contact.id} className="relative">
                    <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white transition-colors hover:bg-purple-600">
                      {contact.avatar}
                    </div>
                    {contact.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Messages List */}
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-medium text-gray-700">
                  Messages Gmail
                </h3>
                {gmailLoading && (
                  <RefreshCw className="h-3 w-3 animate-spin text-purple-500" />
                )}
              </div>
              <button
                onClick={refreshMessages}
                className="rounded-md p-1 transition-colors hover:bg-gray-100"
                title="Actualiser les messages"
                disabled={gmailLoading}
              >
                <RefreshCw
                  className={`h-3 w-3 text-gray-500 hover:text-gray-700 ${gmailLoading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {gmailError ? (
                  <div className="py-4 text-center">
                    <div className="mb-2 text-sm text-red-500">
                      Erreur de chargement Gmail
                    </div>
                    <button
                      onClick={refreshMessages}
                      className="text-xs text-purple-600 hover:text-purple-800"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : messages.length === 0 && !gmailLoading ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    <Mail className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    Aucun message Gmail
                  </div>
                ) : (
                  <div className="space-y-1">
                    {messages.map((correspondent) => (
                      <div
                        key={correspondent.email}
                        onClick={() => handleCorrespondentClick(correspondent)}
                        style={{
                          marginBottom: '0.50rem',
                          height: '4rem',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          width: '100%',
                        }}
                        className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-purple-50 ${
                          correspondent.unreadCount > 0
                            ? 'border-red-500 bg-red-200'
                            : 'border-purple-900 bg-purple-100'
                        }`}
                      >
                        <div
                          className="flex items-start gap-3"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-medium">
                              {correspondent.name.charAt(0).toUpperCase()}
                            </div>
                            {correspondent.unreadCount > 0 && (
                              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                {correspondent.unreadCount > 9 ? '9+' : correspondent.unreadCount}
                              </span>
                            )}
                            <Mail className="absolute -bottom-0.5 -right-0.5 h-2 w-2 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between">
                              <span
                                className={`truncate text-sm font-medium ${
                                  correspondent.unreadCount > 0
                                    ? 'text-gray-900'
                                    : 'text-gray-600'
                                }`}
                              >
                                {correspondent.name}
                              </span>
                              <span
                                className={`text-xs ${
                                  correspondent.unreadCount > 0
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                                }`}
                              >
                                {correspondent.lastMessage.time}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p
                                className={`line-clamp-2 text-xs ${
                                  correspondent.unreadCount > 0
                                    ? 'text-gray-700'
                                    : 'text-gray-400'
                                }`}
                              >
                                {correspondent.lastMessage.preview}
                              </p>
                              <span className="text-xs text-gray-500 ml-2">
                                ({correspondent.messageCount})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {gmailLoading && messages.length === 0 && (
                      <div className="py-4 text-center">
                        <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-purple-500" />
                        <div className="text-sm text-gray-600">
                          Chargement des messages Gmail...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Categories Bar - Icons Only */}
            <div className="">
              <div className="justify-arround flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                  title="Paramètres"
                >
                  <SettingsIcon className="h-5 w-5 text-gray-600" />
                </button>
                {categories.map((category) => (
                  <div key={category.id} className="group relative">
                    <button
                      onClick={() => setSelectedCategory(category.id)}
                      className={`relative transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'flex h-8 w-8 items-center justify-center rounded-md bg-purple-200 text-purple-800 shadow-lg'
                          : 'flex h-8 w-8 items-center justify-center rounded-md text-gray-600 hover:bg-purple-200'
                      }`}
                    >
                      <span className="text-xl">{category.icon}</span>

                      {/* Notification Badge */}
                      {category.count > 0 && (
                        <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[10px] text-white">
                          {category.count > 9 ? '9+' : category.count}
                        </span>
                      )}
                    </button>

                    {/* Contextual Popup on Hover */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                      <div
                        className="min-w-37 rounded-lg border border-gray-400 bg-white p-3 shadow-2xl"
                        style={{ padding: '0.25rem' }}
                      >
                        {/* Category Info */}
                        <div
                          className="mb-3"
                          style={{
                            marginBottom: '0.75rem',
                            padding: '0.50rem',
                          }}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium text-gray-900">
                              {category.name}
                            </span>
                          </div>
                          {/* <p className="text-xs text-gray-500">{category.description}</p> */}
                        </div>

                        {/* Folders Selection */}
                        <div className="space-y-1">
                          {/* <p className="text-xs font-medium text-gray-700 mb-2">Dossiers :</p> */}
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => setSelectedFolder(folder.id)}
                              style={{
                                marginBottom: '0.5rem',
                                padding: '0.5rem',
                              }}
                              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                                selectedFolder === folder.id
                                  ? 'bg-purple-200 text-purple-900'
                                  : 'text-gray-700 hover:bg-purple-100'
                              }`}
                            >
                              <folder.icon className="h-3 w-3" />
                              <span className="flex-1 text-xs">
                                {folder.name}
                              </span>
                              {folder.count > 0 && (
                                <span className="text-xs text-gray-500">
                                  ({folder.count})
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Arrow pointer */}
                        <div
                          className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform"
                          style={{ marginTop: '-0.25rem' }}
                        >
                          <div className="h-2 w-2 rotate-45 transform border-r bg-white"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Collapsed Sidebar - Categories Icons */}
        {sidebarCollapsed && (
          <div className="flex flex-col items-center space-y-3 py-4">
            {/* Top folders */}
            {folders.slice(0, 2).map((folder) => (
              <div key={folder.id} className="relative">
                <button className="rounded-lg p-2 transition-colors hover:bg-gray-100">
                  <folder.icon className="h-5 w-5 text-gray-600" />
                </button>
                {folder.count > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {folder.count > 9 ? '9+' : folder.count}
                  </div>
                )}
              </div>
            ))}

            {/* Separator */}
            <div className="h-px w-8 bg-gray-200"></div>

            {/* Categories */}
            {categories.slice(0, 3).map((category) => (
              <div key={category.id} className="relative">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-lg p-2 transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-100'
                      : 'hover:bg-gray-100'
                  }`}
                  title={category.name}
                >
                  <span className="text-lg">{category.icon}</span>
                </button>
                {category.count > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] text-white">
                    {category.count > 9 ? '9+' : category.count}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden ${sidebarPosition === 'right' ? 'order-1' : 'order-2'}`}
      >
        {children}
      </div>

      {/* Settings Popup */}
      {showSettings && (
        <Card
          className="fixed z-50 min-w-80 rounded-lg border border-gray-300 bg-white p-6 shadow-2xl"
          style={{
            left: `${settingsPosition.x}px`,
            top: `${settingsPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab',
            padding: '1rem',
            border: `2px solid ${borderColor}`,
          }}
        >
          {/* Header with drag handle */}
          <div
            className="mb-4 flex cursor-grab items-center justify-between border-b pb-2 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h3 className="text-lg font-semibold text-gray-800">Paramètres</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-500 transition-colors hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex flex-col gap-4 space-y-6">
            {/* Sidebar Position Setting */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Position de la sidebar
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarPosition('left')}
                  style={{ padding: '0.5rem 1rem' }}
                  className={`rounded px-4 py-2 text-sm transition-colors ${
                    sidebarPosition === 'left'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Gauche
                </button>
                <button
                  onClick={() => setSidebarPosition('right')}
                  style={{ padding: '0.5rem 1rem' }}
                  className={`rounded text-sm transition-colors ${
                    sidebarPosition === 'right'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Droite
                </button>
              </div>
            </div>
            {/* Theme Color Setting */}
            <div className="flex flex-col gap-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Couleur du thème
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm"
                  placeholder="rgb(216, 180, 254)"
                />
              </div>
            </div>

            {/* Theme Presets */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Thèmes prédéfinis
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setBackgroundColor('rgb(216, 180, 254)')}
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: 'rgb(216, 180, 254)' }}
                  title="Violet par défaut"
                />
                <button
                  onClick={() => setBackgroundColor('rgb(147, 197, 253)')}
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: 'rgb(147, 197, 253)' }}
                  title="Bleu"
                />
                <button
                  onClick={() => setBackgroundColor('rgb(167, 243, 208)')}
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: 'rgb(167, 243, 208)' }}
                  title="Vert"
                />
                <button
                  onClick={() => setBackgroundColor('rgb(252, 165, 165)')}
                  className="h-8 w-8 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: 'rgb(252, 165, 165)' }}
                  title="Rouge"
                />
              </div>
            </div>

            {/* Logout Section */}
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white transition-colors hover:bg-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Layout principal avec MessageProvider
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MessageProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </MessageProvider>
  );
}

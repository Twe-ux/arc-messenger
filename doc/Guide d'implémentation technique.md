# Guide d'Implémentation Technique Détaillé

## 1. Architecture Technique Complète

### 1.1 Structure du Projet Next.js

```bash
messaging-app/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/
│   │   ├── inbox/
│   │   │   └── page.tsx
│   │   ├── chat/
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── gmail/
│   │   │   ├── sync/
│   │   │   │   └── route.ts
│   │   │   └── send/
│   │   │       └── route.ts
│   │   ├── messages/
│   │   │   └── route.ts
│   │   └── conversations/
│   │       └── route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── ConversationItem.tsx
│   │   ├── CategoryBar.tsx
│   │   └── SearchBar.tsx
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputBar.tsx
│   │   └── TypingIndicator.tsx
│   ├── email/
│   │   ├── EmailThread.tsx
│   │   ├── EmailComposer.tsx
│   │   └── EmailAttachments.tsx
│   ├── shared/
│   │   ├── SplitView.tsx
│   │   ├── ResizablePanel.tsx
│   │   ├── Avatar.tsx
│   │   └── LoadingStates.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
├── lib/
│   ├── db/
│   │   ├── mongodb.ts
│   │   └── models/
│   │       ├── User.ts
│   │       ├── Conversation.ts
│   │       └── Message.ts
│   ├── gmail/
│   │   ├── client.ts
│   │   ├── sync.ts
│   │   └── parser.ts
│   ├── socket/
│   │   ├── server.ts
│   │   └── client.ts
│   └── utils/
│       ├── encryption.ts
│       ├── date.ts
│       └── validation.ts
├── hooks/
│   ├── useSocket.ts
│   ├── useConversations.ts
│   ├── useMessages.ts
│   └── useGestures.ts
├── store/
│   ├── useAppStore.ts
│   ├── useUIStore.ts
│   └── useChatStore.ts
└── types/
    ├── index.ts
    ├── gmail.ts
    └── socket.ts
```

### 1.2 Configuration Next.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'cloudinary.com'],
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    });
    return config;
  },
};

module.exports = nextConfig;
```

### 1.3 Configuration TypeScript

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/store/*": ["./store/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 2. Implémentation des Composants Clés

### 2.1 Sidebar avec Collapse et Swipe

```typescript
// components/sidebar/Sidebar.tsx
import { useState, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { ChevronLeft, Search } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import ConversationItem from './ConversationItem';
import CategoryBar from './CategoryBar';

interface SidebarProps {
  conversations: Conversation[];
}

export default function Sidebar({ conversations }: SidebarProps) {
  const { isSidebarCollapsed, toggleSidebar, currentCategory, setCategory } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const controls = useAnimation();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Gestion du swipe pour changer de catégorie
  const bind = useGesture({
    onDrag: ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      if (Math.abs(mx) > 100 || Math.abs(vx) > 0.5) {
        if (dx > 0) {
          // Swipe vers la droite
          navigateCategory('prev');
        } else {
          // Swipe vers la gauche
          navigateCategory('next');
        }
        cancel();
      }
    },
  });

  const navigateCategory = (direction: 'prev' | 'next') => {
    const categories = ['inbox', 'personal', 'work', 'favorites', 'archived'];
    const currentIndex = categories.indexOf(currentCategory);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % categories.length
      : (currentIndex - 1 + categories.length) % categories.length;

    setCategory(categories[newIndex]);
    controls.start({ x: direction === 'next' ? -20 : 20 }).then(() => {
      controls.start({ x: 0 });
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.category === currentCategory &&
    (searchQuery === '' ||
     conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
     conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.aside
      ref={sidebarRef}
      initial={{ width: 320 }}
      animate={{
        width: isSidebarCollapsed ? 0 : 320,
        opacity: isSidebarCollapsed ? 0 : 1
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative bg-purple-50 border-r border-purple-200 flex flex-col h-full overflow-hidden"
      {...bind()}
    >
      {/* Header */}
      <div className="p-4 border-b border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-purple-600" />
          </button>
          <h1 className="text-lg font-semibold text-purple-900">Messages</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <motion.div
        className="flex-1 overflow-y-auto"
        animate={controls}
      >
        {filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation._id}
            conversation={conversation}
          />
        ))}
      </motion.div>

      {/* Category Bar */}
      <CategoryBar currentCategory={currentCategory} onCategoryChange={setCategory} />
    </motion.aside>
  );
}
```

### 2.2 Split View Redimensionnable

```typescript
// components/shared/SplitView.tsx
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplitViewProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  minSize?: number;
  defaultSize?: number;
}

export default function SplitView({
  leftPanel,
  rightPanel,
  minSize = 300,
  defaultSize = 50
}: SplitViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

    if (newLeftWidth >= (minSize / containerRect.width) * 100 &&
        newLeftWidth <= 100 - (minSize / containerRect.width) * 100) {
      setLeftWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Sauvegarder la préférence utilisateur
    localStorage.setItem('splitViewRatio', leftWidth.toString());
  };

  useEffect(() => {
    // Charger la préférence utilisateur
    const savedRatio = localStorage.getItem('splitViewRatio');
    if (savedRatio) {
      setLeftWidth(parseFloat(savedRatio));
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      <motion.div
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
        animate={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </motion.div>

      {/* Resize Handle */}
      <div
        className={`w-1 bg-gray-300 hover:bg-purple-500 cursor-col-resize transition-colors ${
          isDragging ? 'bg-purple-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-400 rounded-full" />
        </div>
      </div>

      <motion.div
        className="flex-1 h-full overflow-hidden"
        style={{ width: `${100 - leftWidth}%` }}
        animate={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </motion.div>
    </div>
  );
}
```

### 2.3 Intégration Gmail avec Sync Bidirectionnel

```typescript
// lib/gmail/client.ts
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor(tokens: { accessToken: string; refreshToken: string }) {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async syncEmails(lastSyncToken?: string) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread OR newer_than:7d',
        maxResults: 50,
      });

      const messages = await Promise.all(
        response.data.messages.map(async (message: any) => {
          const fullMessage = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          });
          return this.parseEmailMessage(fullMessage.data);
        })
      );

      return messages;
    } catch (error) {
      console.error('Gmail sync error:', error);
      throw error;
    }
  }

  private parseEmailMessage(gmailMessage: any) {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name === name)?.value || '';

    const body = this.extractBody(gmailMessage.payload);

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: new Date(parseInt(gmailMessage.internalDate)),
      body: body,
      attachments: this.extractAttachments(gmailMessage.payload),
      labels: gmailMessage.labelIds || [],
    };
  }

  private extractBody(payload: any): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    }

    return body;
  }

  private extractAttachments(payload: any): any[] {
    const attachments = [];

    const processPartForAttachments = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId,
        });
      }

      if (part.parts) {
        part.parts.forEach(processPartForAttachments);
      }
    };

    if (payload.parts) {
      payload.parts.forEach(processPartForAttachments);
    }

    return attachments;
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    threadId?: string
  ) {
    const message = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const params: any = {
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    };

    if (threadId) {
      params.requestBody.threadId = threadId;
    }

    const response = await this.gmail.users.messages.send(params);
    return response.data;
  }

  async watchForChanges(callback: (changes: any) => void) {
    // Utiliser Gmail Push Notifications API
    const response = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: process.env.GMAIL_PUBSUB_TOPIC,
        labelIds: ['INBOX'],
      },
    });

    return response.data;
  }
}
```

### 2.4 Socket.io pour le Temps Réel

```typescript
// lib/socket/server.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  // Gestion des connexions
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Joindre une conversation
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Quitter une conversation
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Envoyer un message
    socket.on(
      'send-message',
      async (data: { conversationId: string; message: any }) => {
        // Sauvegarder le message dans MongoDB
        const savedMessage = await saveMessage(data.message);

        // Émettre à tous les participants
        io.to(`conversation:${data.conversationId}`).emit(
          'new-message',
          savedMessage
        );

        // Mettre à jour le lastMessage de la conversation
        await updateConversationLastMessage(data.conversationId, savedMessage);
      }
    );

    // Indicateur de frappe
    socket.on(
      'typing',
      (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        socket.to(`conversation:${data.conversationId}`).emit('user-typing', {
          userId: data.userId,
          isTyping: data.isTyping,
        });
      }
    );

    // Marquer comme lu
    socket.on(
      'mark-as-read',
      async (data: {
        conversationId: string;
        messageIds: string[];
        userId: string;
      }) => {
        await markMessagesAsRead(data.messageIds, data.userId);

        socket.to(`conversation:${data.conversationId}`).emit('messages-read', {
          messageIds: data.messageIds,
          userId: data.userId,
        });
      }
    );

    // Statut en ligne
    socket.on('user-online', async (userId: string) => {
      await updateUserStatus(userId, 'online');
      socket.broadcast.emit('user-status-changed', {
        userId,
        status: 'online',
      });
    });

    socket.on('disconnect', async () => {
      // Gérer la déconnexion
      const userId = await getUserIdFromSocket(socket.id);
      if (userId) {
        await updateUserStatus(userId, 'offline');
        socket.broadcast.emit('user-status-changed', {
          userId,
          status: 'offline',
        });
      }
    });
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});
```

### 2.5 Hook useSocket Client

```typescript
// hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAppStore } from '@/store/useAppStore';
import { useChatStore } from '@/store/useChatStore';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAppStore();
  const { addMessage, updateTypingStatus, markMessagesAsRead } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // Initialiser la connexion Socket.io
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId: user.id,
      },
    });

    const socket = socketRef.current;

    // Event listeners
    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('user-online', user.id);
    });

    socket.on('new-message', (message) => {
      addMessage(message);
    });

    socket.on('user-typing', ({ userId, isTyping }) => {
      updateTypingStatus(userId, isTyping);
    });

    socket.on('messages-read', ({ messageIds, userId }) => {
      markMessagesAsRead(messageIds, userId);
    });

    socket.on('user-status-changed', ({ userId, status }) => {
      // Mettre à jour le statut utilisateur dans le store
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join-conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('leave-conversation', conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, message: any) => {
    socketRef.current?.emit('send-message', { conversationId, message });
  }, []);

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      socketRef.current?.emit('typing', {
        conversationId,
        userId: user?.id,
        isTyping,
      });
    },
    [user]
  );

  const markAsRead = useCallback(
    (conversationId: string, messageIds: string[]) => {
      socketRef.current?.emit('mark-as-read', {
        conversationId,
        messageIds,
        userId: user?.id,
      });
    },
    [user]
  );

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    setTyping,
    markAsRead,
  };
}
```

### 2.6 Store Zustand pour l'État Global

```typescript
// store/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: boolean;
  setUser: (user: User | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: 'light',
      notifications: true,
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      toggleNotifications: () =>
        set((state) => ({
          notifications: !state.notifications,
        })),
    }),
    {
      name: 'app-storage',
    }
  )
);

// store/useUIStore.ts
interface UIState {
  isSidebarCollapsed: boolean;
  currentCategory: string;
  splitViewRatio: number;
  activeConversationIds: string[];
  toggleSidebar: () => void;
  setCategory: (category: string) => void;
  setSplitViewRatio: (ratio: number) => void;
  setActiveConversations: (ids: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  currentCategory: 'inbox',
  splitViewRatio: 50,
  activeConversationIds: [],
  toggleSidebar: () =>
    set((state) => ({
      isSidebarCollapsed: !state.isSidebarCollapsed,
    })),
  setCategory: (category) => set({ currentCategory: category }),
  setSplitViewRatio: (ratio) => set({ splitViewRatio: ratio }),
  setActiveConversations: (ids) => set({ activeConversationIds: ids }),
}));
```

## 3. Optimisations et Performance

### 3.1 Lazy Loading et Code Splitting

```typescript
// app/(main)/layout.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Sidebar = dynamic(() => import('@/components/sidebar/Sidebar'), {
  loading: () => <SidebarSkeleton />,
});

const ChatContainer = dynamic(() => import('@/components/chat/ChatContainer'), {
  loading: () => <ChatSkeleton />,
});

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1">
        <Suspense fallback={<ChatSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
```

### 3.2 React Query pour la Gestion du Cache

```typescript
// hooks/useConversations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, createConversation } from '@/lib/api';

export function useConversations(category?: string) {
  const queryClient = useQueryClient();

  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conversations', category],
    queryFn: () => fetchConversations(category),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Optimistic update
      queryClient.setQueryData(['conversations', category], (old: any) => {
        return [...(old || []), newConversation];
      });
    },
  });

  return {
    conversations,
    isLoading,
    error,
    createConversation: createMutation.mutate,
  };
}
```

### 3.3 Service Worker pour Mode Offline

```javascript
// public/sw.js
const CACHE_NAME = 'messaging-app-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Sync des messages en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const db = await openDB();
  const unsyncedMessages = await db.getAllFromIndex('messages', 'synced', 0);

  for (const message of unsyncedMessages) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message),
        headers: { 'Content-Type': 'application/json' },
      });

      message.synced = 1;
      await db.put('messages', message);
    } catch (error) {
      console.error('Sync failed for message:', message.id);
    }
  }
}
```

## 4. Tests et Déploiement

### 4.1 Configuration des Tests

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*): '<rootDir>/$1',
    '\\.(css|less|scss|sass): 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx): 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
};

// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));
```

### 4.2 Tests Unitaires Exemples

```typescript
// __tests__/components/Sidebar.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUIStore } from '@/store/useUIStore';

jest.mock('@/store/useUIStore');

describe('Sidebar Component', () => {
  const mockConversations = [
    {
      _id: '1',
      participants: [{ name: 'John Doe', avatar: '/avatar1.jpg' }],
      lastMessage: { content: 'Hello there!', timestamp: new Date() },
      category: 'inbox',
      unreadCount: 2,
    },
  ];

  beforeEach(() => {
    (useUIStore as jest.Mock).mockReturnValue({
      isSidebarCollapsed: false,
      toggleSidebar: jest.fn(),
      currentCategory: 'inbox',
      setCategory: jest.fn(),
    });
  });

  it('renders conversations correctly', () => {
    render(<Sidebar conversations={mockConversations} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    render(<Sidebar conversations={mockConversations} />);

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    await userEvent.type(searchInput, 'John');

    expect(screen.getByText('John Doe')).toBeInTheDocument();

    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'NonExistent');

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('toggles sidebar on button click', () => {
    const toggleSidebar = jest.fn();
    (useUIStore as jest.Mock).mockReturnValue({
      isSidebarCollapsed: false,
      toggleSidebar,
      currentCategory: 'inbox',
      setCategory: jest.fn(),
    });

    render(<Sidebar conversations={mockConversations} />);

    const toggleButton = screen.getByRole('button', { name: /chevron/i });
    fireEvent.click(toggleButton);

    expect(toggleSidebar).toHaveBeenCalled();
  });
});
```

### 4.3 Tests E2E avec Playwright

```typescript
// e2e/messaging-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Messaging Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('http://localhost:3000/inbox');
  });

  test('send and receive messages', async ({ page, context }) => {
    // Ouvrir une conversation
    await page.click('[data-testid="conversation-item-1"]');

    // Taper un message
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Hello from Playwright!');
    await messageInput.press('Enter');

    // Vérifier que le message apparaît
    await expect(page.locator('text=Hello from Playwright!')).toBeVisible();

    // Simuler une réponse dans un autre navigateur
    const page2 = await context.newPage();
    await page2.goto('http://localhost:3000/inbox');
    await page2.click('[data-testid="conversation-item-1"]');

    const messageInput2 = page2.locator('[data-testid="message-input"]');
    await messageInput2.fill('Reply from second user');
    await messageInput2.press('Enter');

    // Vérifier que la réponse apparaît dans le premier navigateur
    await expect(page.locator('text=Reply from second user')).toBeVisible();
  });

  test('split view functionality', async ({ page }) => {
    // Activer le split view
    await page.click('[data-testid="split-view-button"]');

    // Ouvrir deux conversations
    await page.click('[data-testid="conversation-item-1"]');
    await page.click('[data-testid="conversation-item-2"]');

    // Vérifier que les deux conversations sont visibles
    await expect(page.locator('[data-testid="chat-panel-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-panel-2"]')).toBeVisible();

    // Tester le redimensionnement
    const resizeHandle = page.locator('[data-testid="resize-handle"]');
    await resizeHandle.dragTo(page.locator('body'), {
      targetPosition: { x: 600, y: 400 },
    });

    // Vérifier que les panneaux ont été redimensionnés
    const panel1Width = await page
      .locator('[data-testid="chat-panel-1"]')
      .evaluate((el) => el.clientWidth);
    expect(panel1Width).toBeGreaterThan(500);
  });
});
```

### 4.4 Configuration CI/CD avec GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm test -- --coverage
        env:
          MONGODB_URI: mongodb://localhost:27017/test

      - name: Run E2E tests
        run: npx playwright test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          NEXTAUTH_SECRET: test-secret

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_APP_URL: ${{ secrets.PRODUCTION_URL }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 4.5 Configuration de Production

```typescript
// next.config.production.js
module.exports = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.gmail.com wss://your-socket-server.com;",
        },
      ],
    },
  ],

  images: {
    domains: ['lh3.googleusercontent.com', 'your-cdn.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

// .env.production
NEXT_PUBLIC_APP_URL=https://your-app.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/production
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-production-secret
SOCKET_URL=wss://your-socket-server.com
REDIS_URL=redis://your-redis-instance.com
```

## 5. Monitoring et Analytics

### 5.1 Sentry pour Error Tracking

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    beforeSend(event, hint) {
      // Filtrer les erreurs sensibles
      if (event.exception) {
        const error = hint.originalException;
        // Ne pas envoyer les erreurs d'authentification
        if (error?.message?.includes('authentication')) {
          return null;
        }
      }
      return event;
    },

    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
    ],
  });
}

// Wrapper pour les API routes
export function withSentry(handler: any) {
  return async (req: any, res: any) => {
    try {
      return await handler(req, res);
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
}
```

### 5.2 Analytics avec Mixpanel

```typescript
// lib/analytics/mixpanel.ts
import mixpanel from 'mixpanel-browser';

class Analytics {
  constructor() {
    if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
      mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: 'localStorage',
      });
    }
  }

  identify(userId: string, traits?: any) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }

  track(event: string, properties?: any) {
    mixpanel.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Events spécifiques
  trackMessageSent(conversationId: string, messageType: 'chat' | 'email') {
    this.track('Message Sent', {
      conversationId,
      messageType,
    });
  }

  trackConversationOpened(conversationId: string) {
    this.track('Conversation Opened', {
      conversationId,
    });
  }

  trackFeatureUsed(feature: string) {
    this.track('Feature Used', {
      feature,
    });
  }
}

export const analytics = new Analytics();
```

### 5.3 Performance Monitoring

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  measureApiCall(endpoint: string, duration: number) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`api-${endpoint}-end`);

      // Envoyer à votre service d'analytics
      analytics.track('API Performance', {
        endpoint,
        duration,
        timestamp: Date.now(),
      });
    }
  }

  measureComponentRender(componentName: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const measure = performance.measure(
        `${componentName}-render`,
        `${componentName}-start`,
        `${componentName}-end`
      );

      if (measure.duration > 100) {
        console.warn(
          `Slow render detected: ${componentName} took ${measure.duration}ms`
        );
      }
    }
  }

  reportWebVitals(metric: any) {
    const { name, value } = metric;

    // Envoyer les métriques à votre service
    fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, value }),
    });
  }
}

// Hook pour mesurer le rendu des composants
export function usePerformance(componentName: string) {
  useEffect(() => {
    performance.mark(`${componentName}-start`);

    return () => {
      performance.mark(`${componentName}-end`);
      PerformanceMonitor.getInstance().measureComponentRender(componentName);
    };
  }, [componentName]);
}
```

C'est la fin du guide d'implémentation technique. Voulez-vous que je continue avec le Design System détaillé ?

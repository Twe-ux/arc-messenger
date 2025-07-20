import { Document, ObjectId } from 'mongoose';

// NextAuth.js types extension
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    userId?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatar?: string;
      preferences?: UserPreferences;
      status?: UserStatus;
    };
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }
}

// Additional Auth types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  privacy: {
    onlineStatus: boolean;
    readReceipts: boolean;
  };
  language: string;
  timezone: string;
}

export interface GmailTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: 'google' | 'email';
  providerId?: string;
  preferences: UserPreferences;
  status: UserStatus;
  gmailTokens?: GmailTokens;
  createdAt: Date;
  lastActiveAt: Date;
}

// User types
export interface IUser extends Document {
  _id: ObjectId;
  email: string;
  name: string;
  avatar?: string;
  provider?: 'google' | 'email';
  providerId?: string;
  gmailTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt?: Date;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      sound: boolean;
    };
    privacy: {
      onlineStatus: boolean;
      readReceipts: boolean;
    };
    language: string;
    timezone: string;
  };
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  lastActiveAt: Date;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation types
export interface IConversation extends Document {
  _id: ObjectId;
  participants: ObjectId[];
  type: 'chat' | 'email' | 'group';
  title?: string; // For group conversations
  lastMessage: {
    content: string;
    timestamp: Date;
    senderId: ObjectId;
    type: 'text' | 'image' | 'file' | 'video' | 'audio';
  };
  unreadCount: {
    [userId: string]: number;
  };
  category: 'inbox' | 'personal' | 'work' | 'favorites' | 'archived' | 'spam';
  metadata?: {
    emailThreadId?: string;
    subject?: string;
    labels?: string[];
    priority?: 'low' | 'normal' | 'high';
  };
  isArchived: boolean;
  isMuted: boolean;
  pinnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface IMessage extends Document {
  _id: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
  content: string;
  type: 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';
  attachments?: Array<{
    url: string;
    type: 'image' | 'file' | 'video' | 'audio';
    name: string;
    size: number;
    mimeType: string;
  }>;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  readBy: Array<{
    userId: ObjectId;
    readAt: Date;
  }>;
  replyTo?: ObjectId; // Reference to another message
  reactions?: Array<{
    userId: ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  editedAt?: Date;
  deletedAt?: Date;
  emailMetadata?: {
    messageId: string;
    headers: Record<string, string>;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    inReplyTo?: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Socket events types
export interface ServerToClientEvents {
  'new-message': (message: IMessage) => void;
  'message-updated': (message: IMessage) => void;
  'message-deleted': (messageId: string) => void;
  'user-typing': (data: { userId: string; conversationId: string; isTyping: boolean }) => void;
  'user-status-changed': (data: { userId: string; status: string }) => void;
  'conversation-updated': (conversation: IConversation) => void;
  'messages-read': (data: { messageIds: string[]; userId: string }) => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'send-message': (data: {
    conversationId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
    attachments?: Array<{
      url: string;
      type: string;
      name: string;
      size: number;
    }>;
    replyTo?: string;
  }) => void;
  'join-conversation': (conversationId: string) => void;
  'leave-conversation': (conversationId: string) => void;
  'typing': (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  'mark-as-read': (data: { conversationId: string; messageIds: string[]; userId: string }) => void;
  'user-online': (userId: string) => void;
  'user-offline': (userId: string) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Gmail specific types
export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  body: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  labels: string[];
  snippet: string;
  isRead: boolean;
  isImportant: boolean;
}

export interface GmailAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string[];
}

// Component prop types
export interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onReply?: (message: IMessage) => void;
  onReact?: (message: IMessage, emoji: string) => void;
  onEdit?: (message: IMessage) => void;
  onDelete?: (message: IMessage) => void;
}

export interface ConversationItemProps {
  conversation: IConversation;
  isActive?: boolean;
  onClick?: (conversation: IConversation) => void;
  onArchive?: (conversation: IConversation) => void;
  onMute?: (conversation: IConversation) => void;
  onDelete?: (conversation: IConversation) => void;
}

// Store types
export interface AppState {
  user: IUser | null;
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  notifications: boolean;
  setUser: (user: IUser | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  toggleNotifications: () => void;
}

export interface ChatState {
  conversations: IConversation[];
  messages: { [conversationId: string]: IMessage[] };
  activeConversationId: string | null;
  typingUsers: { [conversationId: string]: string[] };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setConversations: (conversations: IConversation[]) => void;
  addConversation: (conversation: IConversation) => void;
  updateConversation: (conversation: IConversation) => void;
  setMessages: (conversationId: string, messages: IMessage[]) => void;
  addMessage: (message: IMessage) => void;
  updateMessage: (message: IMessage) => void;
  deleteMessage: (messageId: string) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface MessageFormData {
  content: string;
  attachments?: File[];
  replyTo?: string;
}

// Utility types
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type UserStatus = 'online' | 'offline' | 'away' | 'busy';
export type ConversationType = 'chat' | 'email' | 'group';
export type MessageType = 'text' | 'image' | 'file' | 'video' | 'audio' | 'system';
export type Theme = 'light' | 'dark' | 'system';
export type Category = 'inbox' | 'personal' | 'work' | 'favorites' | 'archived' | 'spam';
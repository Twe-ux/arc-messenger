// Gmail API response types and our internal types

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: GmailMessagePayload;
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailMessagePayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: GmailHeader[];
  body: GmailMessageBody;
  parts?: GmailMessagePayload[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessageBody {
  attachmentId?: string;
  size: number;
  data?: string; // Base64 encoded
}

export interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility: 'show' | 'hide';
  labelListVisibility: 'labelShow' | 'labelHide';
  type: 'system' | 'user';
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
}

// Our processed email types
export interface ProcessedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: EmailParticipant;
  to: EmailParticipant[];
  cc?: EmailParticipant[];
  bcc?: EmailParticipant[];
  date: Date;
  body: EmailBody;
  attachments: EmailAttachment[];
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  snippet: string;
  internalDate: string;
  historyId: string;
}

export interface EmailParticipant {
  name?: string;
  email: string;
}

export interface EmailBody {
  text: string;
  html: string;
  snippet: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string; // Base64 encoded data for small attachments
  downloadUrl?: string; // For larger attachments
}

export interface ProcessedThread {
  id: string;
  subject: string;
  participants: EmailParticipant[];
  lastMessage: ProcessedEmail;
  messageCount: number;
  unreadCount: number;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
  snippet: string;
  lastActivity: Date;
}

// Query parameters for fetching emails
export interface EmailQuery {
  query?: string; // Gmail search query
  labelIds?: string[]; // Filter by labels
  maxResults?: number; // Number of results (1-500)
  pageToken?: string; // For pagination
  includeSpamTrash?: boolean;
  format?: 'minimal' | 'full' | 'raw' | 'metadata';
}

// Response from Gmail API
export interface EmailListResponse {
  messages: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export interface ThreadListResponse {
  threads: { id: string; snippet: string; historyId: string }[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}

// Email conversion options
export interface EmailConversionOptions {
  includeAttachments?: boolean;
  maxAttachmentSize?: number; // in bytes
  preferredFormat?: 'text' | 'html';
  cleanHtml?: boolean;
  extractImages?: boolean;
}

// Email sync status
export interface EmailSyncStatus {
  lastSyncTime: Date;
  totalEmails: number;
  syncedEmails: number;
  errors: string[];
  isActive: boolean;
  nextPageToken?: string;
  historyId?: string;
}

// Gmail watch request for push notifications
export interface GmailWatchRequest {
  labelIds?: string[];
  labelFilterAction?: 'include' | 'exclude';
  topicName: string; // Google Cloud Pub/Sub topic
}

export interface GmailWatchResponse {
  historyId: string;
  expiration: string; // Unix timestamp in milliseconds
}

// Common Gmail label IDs
export const GMAIL_LABELS = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFTS: 'DRAFT',
  SPAM: 'SPAM',
  TRASH: 'TRASH',
  UNREAD: 'UNREAD',
  STARRED: 'STARRED',
  IMPORTANT: 'IMPORTANT',
  CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
  CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
  CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
  CATEGORY_UPDATES: 'CATEGORY_UPDATES',
  CATEGORY_FORUMS: 'CATEGORY_FORUMS',
} as const;

export type GmailLabelId = typeof GMAIL_LABELS[keyof typeof GMAIL_LABELS];

// Error types
export interface GmailApiError {
  code: number;
  message: string;
  details?: any;
}

// Batch operations
export interface BatchEmailOperation {
  messageIds: string[];
  operation: 'addLabels' | 'removeLabels' | 'delete' | 'markAsRead' | 'markAsUnread';
  labelIds?: string[];
}

// Search suggestions
export interface EmailSearchSuggestion {
  query: string;
  type: 'from' | 'to' | 'subject' | 'label' | 'date' | 'has';
  description: string;
}

export { GmailClient } from './client';
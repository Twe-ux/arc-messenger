// Gmail Integration - Main exports

// Core client and authentication
export { GmailClient, createGmailClient, validateGmailScopes, GMAIL_SCOPES } from './client';

// Email service for fetching and managing emails
export { EmailService, createEmailService } from './emailService';

// Email parsing and processing
export { EmailParser } from './parser';

// Email to message conversion for chat interface
export { 
  EmailToMessageConverter, 
  convertEmailThreadToConversation,
  convertEmailsToMessages 
} from './converter';

// Push notifications
export { 
  GmailPushService, 
  SimplifiedGmailNotifications,
  createGmailPushService 
} from './pushNotifications';

// Types
export * from './types';

// Import for internal use
import { EmailService, createEmailService } from './emailService';
import { EmailToMessageConverter } from './converter';
import { EmailParser } from './parser';

/**
 * Complete Gmail integration workflow
 */
export class GmailIntegration {
  private emailService: EmailService;
  private converter: EmailToMessageConverter;
  private currentUserEmail: string;

  constructor(emailService: EmailService, currentUserEmail: string) {
    this.emailService = emailService;
    this.currentUserEmail = currentUserEmail;
    this.converter = new EmailToMessageConverter(currentUserEmail);
  }

  /**
   * Create Gmail integration instance
   */
  static async create(userEmail: string): Promise<GmailIntegration | null> {
    const emailService = await createEmailService();
    
    if (!emailService) {
      console.warn('Cannot create Gmail integration: Email service unavailable');
      return null;
    }

    return new GmailIntegration(emailService, userEmail);
  }

  /**
   * Get conversations (email threads) for chat interface
   */
  async getConversations(options?: {
    maxResults?: number;
    pageToken?: string;
    labelId?: string;
  }) {
    try {
      // Fetch email threads
      const threadsResponse = await this.emailService.fetchThreads({
        maxResults: options?.maxResults || 50,
        pageToken: options?.pageToken,
        labelIds: options?.labelId ? [options.labelId] : ['INBOX'],
      });

      // Get full thread details
      const threadsWithDetails = await Promise.all(
        threadsResponse.threads.map(async (thread) => {
          const fullThread = await this.emailService.fetchThreadById(thread.id);
          const processedThread = EmailParser.parseThread(fullThread);
          return this.converter.convertThreadToConversation(processedThread);
        })
      );

      return {
        conversations: threadsWithDetails,
        nextPageToken: threadsResponse.nextPageToken,
        total: threadsResponse.resultSizeEstimate,
      };
    } catch (error: any) {
      console.error('Failed to get conversations:', error);
      throw new Error(`Get conversations failed: ${error.message}`);
    }
  }

  /**
   * Get messages for a specific conversation (thread)
   */
  async getConversationMessages(threadId: string) {
    try {
      // Fetch full thread
      const gmailThread = await this.emailService.fetchThreadById(threadId);
      
      // Parse individual messages 
      const processedEmails = gmailThread.messages.map(msg => 
        EmailParser.parseMessage(msg)
      );
      
      // Convert emails to messages
      const messages = processedEmails.map(email => 
        this.converter.convertEmailToMessage(email)
      );

      // Parse thread for header info
      const processedThread = EmailParser.parseThread(gmailThread);

      return {
        messages,
        threadInfo: this.converter.convertThreadToHeader(processedThread),
      };
    } catch (error: any) {
      console.error(`Failed to get messages for thread ${threadId}:`, error);
      throw new Error(`Get conversation messages failed: ${error.message}`);
    }
  }

  /**
   * Search emails and return as conversations
   */
  async searchConversations(query: string, options?: {
    maxResults?: number;
    pageToken?: string;
  }) {
    try {
      // Search emails
      const searchResponse = await this.emailService.searchEmails(query, {
        maxResults: options?.maxResults || 25,
        pageToken: options?.pageToken,
      });

      // Group by thread ID
      const threadIds = [...new Set(
        searchResponse.messages.map(msg => msg.threadId)
      )];

      // Get full thread details for each unique thread
      const threadsWithDetails = await Promise.all(
        threadIds.map(async (threadId) => {
          const fullThread = await this.emailService.fetchThreadById(threadId);
          const processedThread = EmailParser.parseThread(fullThread);
          return this.converter.convertThreadToConversation(processedThread);
        })
      );

      return {
        conversations: threadsWithDetails,
        nextPageToken: searchResponse.nextPageToken,
        total: searchResponse.resultSizeEstimate,
      };
    } catch (error: any) {
      console.error('Failed to search conversations:', error);
      throw new Error(`Search conversations failed: ${error.message}`);
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(threadId: string): Promise<void> {
    try {
      const gmailThread = await this.emailService.fetchThreadById(threadId);
      const messageIds = gmailThread.messages.map(msg => msg.id);
      await this.emailService.markAsRead(messageIds);
    } catch (error: any) {
      console.error(`Failed to mark conversation ${threadId} as read:`, error);
      throw new Error(`Mark conversation as read failed: ${error.message}`);
    }
  }

  /**
   * Star/unstar conversation
   */
  async toggleConversationStar(threadId: string, starred: boolean = true): Promise<void> {
    try {
      const gmailThread = await this.emailService.fetchThreadById(threadId);
      const messageIds = gmailThread.messages.map(msg => msg.id);
      await this.emailService.toggleStar(messageIds, starred);
    } catch (error: any) {
      console.error(`Failed to toggle star for conversation ${threadId}:`, error);
      throw new Error(`Toggle conversation star failed: ${error.message}`);
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(threadId: string): Promise<void> {
    try {
      const gmailThread = await this.emailService.fetchThreadById(threadId);
      const messageIds = gmailThread.messages.map(msg => msg.id);
      
      // Remove INBOX label to archive
      const gmail = this.emailService['gmailClient'].getGmailApi();
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          removeLabelIds: ['INBOX'],
        },
      });
    } catch (error: any) {
      console.error(`Failed to archive conversation ${threadId}:`, error);
      throw new Error(`Archive conversation failed: ${error.message}`);
    }
  }

  /**
   * Delete conversation
   */
  async deleteConversation(threadId: string): Promise<void> {
    try {
      const gmailThread = await this.emailService.fetchThreadById(threadId);
      const messageIds = gmailThread.messages.map(msg => msg.id);
      await this.emailService.moveToTrash(messageIds);
    } catch (error: any) {
      console.error(`Failed to delete conversation ${threadId}:`, error);
      throw new Error(`Delete conversation failed: ${error.message}`);
    }
  }

  /**
   * Get unread conversation count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const unreadEmails = await this.emailService.fetchUnreadEmails({ maxResults: 500 });
      return unreadEmails.resultSizeEstimate;
    } catch (error: any) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Get Gmail labels for filtering
   */
  async getLabels() {
    try {
      return await this.emailService.getLabels();
    } catch (error: any) {
      console.error('Failed to get labels:', error);
      return [];
    }
  }

  /**
   * Test Gmail connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const gmailClient = this.emailService['gmailClient'];
      return await gmailClient.testConnection();
    } catch (error: any) {
      console.error('Gmail connection test failed:', error);
      return false;
    }
  }
}

/**
 * Helper function to create complete Gmail integration
 */
export async function createGmailIntegration(userEmail: string): Promise<GmailIntegration | null> {
  return await GmailIntegration.create(userEmail);
}
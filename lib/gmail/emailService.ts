import { GmailClient } from './client';
import { 
  EmailQuery, 
  EmailListResponse, 
  ThreadListResponse, 
  GmailMessage, 
  GmailThread,
  GMAIL_LABELS 
} from './types';

export class EmailService {
  constructor(private gmailClient: GmailClient) {}

  /**
   * Fetch list of emails with pagination and filtering
   */
  async fetchEmails(query: EmailQuery = {}): Promise<EmailListResponse> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const params: any = {
        userId: 'me',
        maxResults: query.maxResults || 50,
        includeSpamTrash: query.includeSpamTrash || false,
      };

      // Add search query
      if (query.query) {
        params.q = query.query;
      }

      // Add label filters
      if (query.labelIds && query.labelIds.length > 0) {
        params.labelIds = query.labelIds;
      }

      // Add pagination token
      if (query.pageToken) {
        params.pageToken = query.pageToken;
      }

      const response = await gmail.users.messages.list(params);
      
      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate || 0,
      };
    } catch (error: any) {
      console.error('Failed to fetch emails:', error);
      throw new Error(`Email fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch full email content by ID
   */
  async fetchEmailById(messageId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailMessage> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: format,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch email ${messageId}:`, error);
      throw new Error(`Email fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch multiple emails by IDs (batch operation)
   */
  async fetchEmailsBatch(messageIds: string[], format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailMessage[]> {
    try {
      const batchSize = 100; // Gmail API batch limit
      const results: GmailMessage[] = [];

      // Process in batches to avoid API limits
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => this.fetchEmailById(id, format));
        
        try {
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        } catch (error) {
          console.error(`Batch fetch failed for batch starting at ${i}:`, error);
          // Continue with next batch instead of failing completely
        }
      }

      return results;
    } catch (error: any) {
      console.error('Failed to fetch emails batch:', error);
      throw new Error(`Batch email fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch email threads with pagination
   */
  async fetchThreads(query: EmailQuery = {}): Promise<ThreadListResponse> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const params: any = {
        userId: 'me',
        maxResults: query.maxResults || 50,
        includeSpamTrash: query.includeSpamTrash || false,
      };

      if (query.query) {
        params.q = query.query;
      }

      if (query.labelIds && query.labelIds.length > 0) {
        params.labelIds = query.labelIds;
      }

      if (query.pageToken) {
        params.pageToken = query.pageToken;
      }

      const response = await gmail.users.threads.list(params);
      
      return {
        threads: response.data.threads || [],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate || 0,
      };
    } catch (error: any) {
      console.error('Failed to fetch threads:', error);
      throw new Error(`Thread fetch failed: ${error.message}`);
    }
  }

  /**
   * Fetch full thread content by ID
   */
  async fetchThreadById(threadId: string, format: 'minimal' | 'full' | 'raw' | 'metadata' = 'full'): Promise<GmailThread> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const response = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: format,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch thread ${threadId}:`, error);
      throw new Error(`Thread fetch failed: ${error.message}`);
    }
  }

  /**
   * Search emails with Gmail search syntax
   */
  async searchEmails(searchQuery: string, options: Omit<EmailQuery, 'query'> = {}): Promise<EmailListResponse> {
    return this.fetchEmails({
      ...options,
      query: searchQuery,
    });
  }

  /**
   * Fetch emails from specific label (Inbox, Sent, etc.)
   */
  async fetchEmailsByLabel(labelId: string, options: Omit<EmailQuery, 'labelIds'> = {}): Promise<EmailListResponse> {
    return this.fetchEmails({
      ...options,
      labelIds: [labelId],
    });
  }

  /**
   * Fetch unread emails
   */
  async fetchUnreadEmails(options: Omit<EmailQuery, 'query'> = {}): Promise<EmailListResponse> {
    return this.fetchEmails({
      ...options,
      query: 'is:unread',
    });
  }

  /**
   * Fetch recent emails (last 7 days)
   */
  async fetchRecentEmails(days: number = 7, options: Omit<EmailQuery, 'query'> = {}): Promise<EmailListResponse> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    return this.fetchEmails({
      ...options,
      query: `after:${dateStr}`,
    });
  }

  /**
   * Fetch emails from specific sender
   */
  async fetchEmailsFromSender(senderEmail: string, options: Omit<EmailQuery, 'query'> = {}): Promise<EmailListResponse> {
    return this.fetchEmails({
      ...options,
      query: `from:${senderEmail}`,
    });
  }

  /**
   * Fetch emails with attachments
   */
  async fetchEmailsWithAttachments(options: Omit<EmailQuery, 'query'> = {}): Promise<EmailListResponse> {
    return this.fetchEmails({
      ...options,
      query: 'has:attachment',
    });
  }

  /**
   * Get email attachment data
   */
  async getAttachment(messageId: string, attachmentId: string): Promise<any> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const response = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId,
      });

      return response.data;
    } catch (error: any) {
      console.error(`Failed to get attachment ${attachmentId}:`, error);
      throw new Error(`Attachment fetch failed: ${error.message}`);
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          removeLabelIds: [GMAIL_LABELS.UNREAD],
        },
      });
    } catch (error: any) {
      console.error('Failed to mark emails as read:', error);
      throw new Error(`Mark as read failed: ${error.message}`);
    }
  }

  /**
   * Mark email as unread
   */
  async markAsUnread(messageIds: string[]): Promise<void> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody: {
          ids: messageIds,
          addLabelIds: [GMAIL_LABELS.UNREAD],
        },
      });
    } catch (error: any) {
      console.error('Failed to mark emails as unread:', error);
      throw new Error(`Mark as unread failed: ${error.message}`);
    }
  }

  /**
   * Star/unstar emails
   */
  async toggleStar(messageIds: string[], star: boolean = true): Promise<void> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const requestBody: any = {
        ids: messageIds,
      };

      if (star) {
        requestBody.addLabelIds = [GMAIL_LABELS.STARRED];
      } else {
        requestBody.removeLabelIds = [GMAIL_LABELS.STARRED];
      }
      
      await gmail.users.messages.batchModify({
        userId: 'me',
        requestBody,
      });
    } catch (error: any) {
      console.error('Failed to toggle star:', error);
      throw new Error(`Toggle star failed: ${error.message}`);
    }
  }

  /**
   * Move emails to trash
   */
  async moveToTrash(messageIds: string[]): Promise<void> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const promises = messageIds.map(id => 
        gmail.users.messages.trash({
          userId: 'me',
          id: id,
        })
      );

      await Promise.all(promises);
    } catch (error: any) {
      console.error('Failed to move emails to trash:', error);
      throw new Error(`Move to trash failed: ${error.message}`);
    }
  }

  /**
   * Get user's Gmail labels
   */
  async getLabels(): Promise<any[]> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const response = await gmail.users.labels.list({
        userId: 'me',
      });

      return response.data.labels || [];
    } catch (error: any) {
      console.error('Failed to get labels:', error);
      throw new Error(`Get labels failed: ${error.message}`);
    }
  }

  /**
   * Get email history for sync purposes
   */
  async getHistory(startHistoryId: string, labelId?: string): Promise<any> {
    try {
      const gmail = this.gmailClient.getGmailApi();
      
      const params: any = {
        userId: 'me',
        startHistoryId: startHistoryId,
      };

      if (labelId) {
        params.labelId = labelId;
      }

      const response = await gmail.users.history.list(params);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get history:', error);
      throw new Error(`Get history failed: ${error.message}`);
    }
  }
}

/**
 * Helper function to create EmailService with authentication
 */
export async function createEmailService(): Promise<EmailService | null> {
  const gmailClient = await GmailClient.fromSession();
  
  if (!gmailClient) {
    console.warn('Cannot create EmailService: Gmail client not available');
    return null;
  }

  // Test connection
  const isConnected = await gmailClient.testConnection();
  if (!isConnected) {
    console.warn('Cannot create EmailService: Gmail connection test failed');
    return null;
  }

  return new EmailService(gmailClient);
}
import { GmailClient } from './client';
import { GmailWatchRequest, GmailWatchResponse } from './types';

/**
 * Gmail Push Notification Service using Cloud Pub/Sub
 * 
 * Note: This requires Google Cloud Pub/Sub setup:
 * 1. Create a Google Cloud project
 * 2. Enable Pub/Sub API
 * 3. Create a topic for Gmail notifications
 * 4. Set up webhook endpoint to receive notifications
 */
export class GmailPushService {
  private gmailClient: GmailClient;
  private pubsubTopic: string;

  constructor(gmailClient: GmailClient, pubsubTopic: string) {
    this.gmailClient = gmailClient;
    this.pubsubTopic = pubsubTopic;
  }

  /**
   * Start watching Gmail mailbox for changes
   */
  async startWatching(labelIds?: string[]): Promise<GmailWatchResponse> {
    try {
      const gmail = this.gmailClient.getGmailApi();

      const watchRequest: GmailWatchRequest = {
        topicName: this.pubsubTopic,
        labelIds: labelIds || ['INBOX', 'SENT'], // Watch both INBOX and SENT
        labelFilterAction: 'include',
      };

      const response = await gmail.users.watch({
        userId: 'me',
        requestBody: watchRequest,
      });

      console.log('Gmail watch started:', response.data);
      
      return {
        historyId: response.data.historyId,
        expiration: response.data.expiration,
      };
    } catch (error: any) {
      console.error('Failed to start Gmail watch:', error);
      throw new Error(`Gmail watch failed: ${error.message}`);
    }
  }

  /**
   * Stop watching Gmail mailbox
   */
  async stopWatching(): Promise<void> {
    try {
      const gmail = this.gmailClient.getGmailApi();

      await gmail.users.stop({
        userId: 'me',
      });

      console.log('Gmail watch stopped');
    } catch (error: any) {
      console.error('Failed to stop Gmail watch:', error);
      throw new Error(`Stop Gmail watch failed: ${error.message}`);
    }
  }

  /**
   * Get current watch status
   */
  async getWatchStatus(): Promise<any> {
    try {
      const gmail = this.gmailClient.getGmailApi();

      // Note: Gmail API doesn't provide a direct way to check watch status
      // This is a placeholder for future implementation or custom tracking
      console.warn('Gmail watch status check not directly supported by API');
      return null;
    } catch (error: any) {
      console.error('Failed to get Gmail watch status:', error);
      return null;
    }
  }

  /**
   * Process incoming push notification
   */
  static async processPushNotification(
    notificationData: any,
    gmailClient: GmailClient
  ): Promise<{
    hasNewMessages: boolean;
    historyId: string;
    changedMessages?: string[];
  }> {
    try {
      // Decode the push notification data
      const decodedData = notificationData.message?.data 
        ? JSON.parse(Buffer.from(notificationData.message.data, 'base64').toString())
        : {};

      const { historyId, emailAddress } = decodedData;

      if (!historyId) {
        console.warn('No historyId in push notification');
        return { hasNewMessages: false, historyId: '' };
      }

      console.log(`Processing Gmail push notification for ${emailAddress}, historyId: ${historyId}`);

      // Get the last known history ID from storage (implementation needed)
      const lastHistoryId = await getLastKnownHistoryId(emailAddress);

      if (!lastHistoryId) {
        // First notification, just store the current historyId
        await saveLastKnownHistoryId(emailAddress, historyId);
        return { hasNewMessages: false, historyId };
      }

      // Get history since last known historyId
      const history = await gmailClient.getGmailApi().users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
      });

      const hasChanges = history.data.history && history.data.history.length > 0;
      const changedMessages: string[] = [];

      if (hasChanges) {
        // Extract changed message IDs
        history.data.history.forEach((historyItem: any) => {
          if (historyItem.messagesAdded) {
            historyItem.messagesAdded.forEach((msg: any) => {
              changedMessages.push(msg.message.id);
            });
          }
          if (historyItem.messagesDeleted) {
            historyItem.messagesDeleted.forEach((msg: any) => {
              changedMessages.push(msg.message.id);
            });
          }
          if (historyItem.labelsAdded || historyItem.labelsRemoved) {
            // Handle label changes
            const labelChanges = [
              ...(historyItem.labelsAdded || []),
              ...(historyItem.labelsRemoved || []),
            ];
            labelChanges.forEach((change: any) => {
              if (change.message?.id) {
                changedMessages.push(change.message.id);
              }
            });
          }
        });
      }

      // Update last known historyId
      await saveLastKnownHistoryId(emailAddress, historyId);

      return {
        hasNewMessages: hasChanges,
        historyId,
        changedMessages: [...new Set(changedMessages)], // Remove duplicates
      };
    } catch (error: any) {
      console.error('Failed to process Gmail push notification:', error);
      throw new Error(`Push notification processing failed: ${error.message}`);
    }
  }

  /**
   * Set up webhook endpoint for receiving push notifications
   */
  static createWebhookHandler() {
    return async (req: any, res: any) => {
      try {
        // Verify that the notification is from Google
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Parse the push notification
        const notification = req.body;
        
        if (!notification.message) {
          return res.status(400).json({ error: 'Invalid notification format' });
        }

        console.log('Received Gmail push notification:', notification);

        // Process the notification (this would typically be handled by a background job)
        // For now, just acknowledge receipt
        res.status(200).json({ success: true });

        // Emit event or trigger processing (implementation depends on your architecture)
        // Example: eventEmitter.emit('gmail-notification', notification);

      } catch (error: any) {
        console.error('Gmail webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }

  /**
   * Validate Pub/Sub topic configuration
   */
  static async validatePubSubSetup(topicName: string): Promise<boolean> {
    try {
      // This would require Google Cloud Pub/Sub client library
      // For now, return true and log a warning
      console.warn('Pub/Sub validation not implemented - ensure topic exists:', topicName);
      return true;
    } catch (error: any) {
      console.error('Pub/Sub validation failed:', error);
      return false;
    }
  }
}

/**
 * Storage functions for historyId tracking
 * These should be implemented with your preferred storage solution
 */
async function getLastKnownHistoryId(emailAddress: string): Promise<string | null> {
  // TODO: Implement storage retrieval (database, Redis, etc.)
  // For now, use a simple in-memory store (not suitable for production)
  const key = `gmail_history_${emailAddress}`;
  return global.gmailHistoryStore?.[key] || null;
}

async function saveLastKnownHistoryId(emailAddress: string, historyId: string): Promise<void> {
  // TODO: Implement storage saving (database, Redis, etc.)
  // For now, use a simple in-memory store (not suitable for production)
  const key = `gmail_history_${emailAddress}`;
  
  if (!global.gmailHistoryStore) {
    global.gmailHistoryStore = {};
  }
  
  global.gmailHistoryStore[key] = historyId;
  
  console.log(`Saved historyId ${historyId} for ${emailAddress}`);
}

/**
 * Helper function to create Gmail push service
 */
export async function createGmailPushService(): Promise<GmailPushService | null> {
  const gmailClient = await GmailClient.fromSession();
  
  if (!gmailClient) {
    console.warn('Cannot create Gmail push service: No Gmail client available');
    return null;
  }

  const pubsubTopic = process.env.GMAIL_PUBSUB_TOPIC;
  if (!pubsubTopic) {
    console.warn('Cannot create Gmail push service: GMAIL_PUBSUB_TOPIC environment variable not set');
    return null;
  }

  return new GmailPushService(gmailClient, pubsubTopic);
}

/**
 * Simplified push notification setup for development
 * This creates a basic webhook endpoint without full Pub/Sub setup
 */
export class SimplifiedGmailNotifications {
  private gmailClient: GmailClient;
  private pollInterval: number;
  private intervalId?: NodeJS.Timeout;
  private lastHistoryId?: string;

  constructor(gmailClient: GmailClient, pollIntervalMs: number = 60000) {
    this.gmailClient = gmailClient;
    this.pollInterval = pollIntervalMs;
  }

  /**
   * Start polling for changes (alternative to push notifications)
   */
  async startPolling(): Promise<void> {
    try {
      // Get initial history ID
      const profile = await this.gmailClient.getProfile();
      this.lastHistoryId = profile.historyId;

      console.log(`Starting Gmail polling every ${this.pollInterval}ms`);

      this.intervalId = setInterval(async () => {
        await this.checkForChanges();
      }, this.pollInterval);

    } catch (error: any) {
      console.error('Failed to start Gmail polling:', error);
    }
  }

  /**
   * Stop polling for changes
   */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Gmail polling stopped');
    }
  }

  /**
   * Check for changes since last poll
   */
  private async checkForChanges(): Promise<void> {
    try {
      if (!this.lastHistoryId) {
        return;
      }

      const gmail = this.gmailClient.getGmailApi();
      const history = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: this.lastHistoryId,
      });

      if (history.data.history && history.data.history.length > 0) {
        console.log(`Found ${history.data.history.length} Gmail changes`);
        
        // Update history ID
        this.lastHistoryId = history.data.historyId;
        
        // Emit event or process changes
        // This is where you'd integrate with your application logic
      }

    } catch (error: any) {
      console.error('Gmail polling error:', error);
    }
  }
}

// Global type declaration for in-memory storage
declare global {
  var gmailHistoryStore: Record<string, string> | undefined;
}
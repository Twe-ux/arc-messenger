import { 
  ProcessedEmail, 
  ProcessedThread,
  EmailConversionOptions 
} from './types';
import { MessageData } from '@/components/chat/MessageBubble';
import { ConversationData } from '@/components/chat/ConversationCard';
import { ConversationHeaderData } from '@/components/chat/ConversationHeader';
import { EmailParser } from './parser';

/**
 * Convert Gmail emails to chat interface format
 */
export class EmailToMessageConverter {
  private currentUserEmail: string;

  constructor(currentUserEmail: string) {
    this.currentUserEmail = currentUserEmail;
  }

  /**
   * Convert ProcessedEmail to MessageData for chat interface
   */
  convertEmailToMessage(email: ProcessedEmail): MessageData {
    // Determine if this is the user's own message (sent by them)
    const isOwn = email.from.email.toLowerCase() === this.currentUserEmail.toLowerCase();
    
    // Format content with email-specific styling
    const content = this.formatEmailContent(email);
    
    // Generate sender info
    const senderName = isOwn ? 'You' : (email.from.name || email.from.email);
    const senderAvatar = this.generateAvatar(email.from.email, email.from.name);

    return {
      id: email.id,
      content,
      senderId: email.from.email,
      senderName,
      senderAvatar,
      timestamp: email.date,
      isOwn,
      status: 'delivered', // Emails are always delivered
      type: this.determineMessageType(email),
      isEdited: false, // Emails can't be edited
      reactions: [], // Initialize empty, can be added later
      metadata: this.createEmailMetadata(email),
    };
  }

  /**
   * Convert ProcessedThread to ConversationData for conversation list
   */
  convertThreadToConversation(thread: ProcessedThread): ConversationData {
    const title = EmailParser.extractConversationTitle(thread, this.currentUserEmail);
    const lastMessage = thread.lastMessage;
    const isOwn = lastMessage.from.email.toLowerCase() === this.currentUserEmail.toLowerCase();
    
    // Determine conversation avatar and name
    const { name, avatar } = this.getConversationDisplayInfo(thread);
    
    // Format last message preview
    const lastMessagePreview = this.formatMessagePreview(lastMessage);
    
    // Determine message status for display
    const messageStatus = this.getMessageStatus(lastMessage, isOwn);

    return {
      id: thread.id,
      name: name || title,
      avatar,
      lastMessage: lastMessagePreview,
      timestamp: thread.lastActivity.toISOString(),
      unreadCount: thread.unreadCount,
      isGroup: thread.participants.length > 2,
      participants: thread.participants.map(p => p.name || p.email),
      lastMessageSender: isOwn ? 'You' : (lastMessage.from.name || lastMessage.from.email),
      messageStatus,
      messageType: this.determineMessageType(lastMessage) as 'text' | 'image' | 'file' | 'voice',
      priority: this.determinePriority(thread),
      isPinned: thread.isStarred, // Use starred as pinned
      isMuted: false, // Gmail doesn't have mute, could be implemented via labels
      isArchived: false, // Handle via labels
      isOnline: false, // Email doesn't have online status
    };
  }

  /**
   * Convert ProcessedThread to ConversationHeaderData for chat header
   */
  convertThreadToHeader(thread: ProcessedThread): ConversationHeaderData {
    const title = EmailParser.extractConversationTitle(thread, this.currentUserEmail);
    const { name, avatar } = this.getConversationDisplayInfo(thread);
    
    return {
      id: thread.id,
      name: name || title,
      avatar,
      status: 'offline', // Emails don't have real-time status
      isGroup: thread.participants.length > 2,
      participantCount: thread.participants.length,
      description: this.generateThreadDescription(thread),
      isPinned: thread.isStarred,
      isMuted: false,
      isArchived: false,
    };
  }

  /**
   * Convert multiple emails from a thread to MessageData array
   */
  convertThreadToMessages(thread: ProcessedThread): MessageData[] {
    // Sort messages chronologically
    const sortedMessages = [...thread.lastMessage ? [thread.lastMessage] : []]
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return sortedMessages.map(email => this.convertEmailToMessage(email));
  }

  /**
   * Format email content for chat display
   */
  private formatEmailContent(email: ProcessedEmail): string {
    let content = email.body.text || email.body.html;
    
    // If we have HTML, convert to a more readable format
    if (!email.body.text && email.body.html) {
      content = this.htmlToMarkdown(email.body.html);
    }

    // Clean up the content
    content = this.cleanEmailContent(content);
    
    // Add subject if it's different from thread subject
    if (email.subject && !content.includes(email.subject)) {
      content = `**${email.subject}**\n\n${content}`;
    }

    // Add attachment info
    if (email.attachments.length > 0) {
      const attachmentInfo = email.attachments
        .map(att => `📎 ${att.filename} (${this.formatFileSize(att.size)})`)
        .join('\n');
      content += `\n\n${attachmentInfo}`;
    }

    // Add recipient info for sent emails
    if (email.from.email.toLowerCase() === this.currentUserEmail.toLowerCase() && email.to.length > 0) {
      const recipients = email.to.map(r => r.name || r.email).join(', ');
      if (email.cc && email.cc.length > 0) {
        const ccRecipients = email.cc.map(r => r.name || r.email).join(', ');
        content = `**To:** ${recipients}\n**CC:** ${ccRecipients}\n\n${content}`;
      } else {
        content = `**To:** ${recipients}\n\n${content}`;
      }
    }

    return content.trim();
  }

  /**
   * Determine message type based on email content
   */
  private determineMessageType(email: ProcessedEmail): MessageData['type'] {
    if (email.attachments.length > 0) {
      // Check if attachments are images
      const hasImages = email.attachments.some(att => 
        att.mimeType.startsWith('image/')
      );
      if (hasImages && email.attachments.length === 1) {
        return 'image';
      }
      return 'file';
    }

    return 'text';
  }

  /**
   * Create email metadata for message
   */
  private createEmailMetadata(email: ProcessedEmail): MessageData['metadata'] {
    const metadata: any = {
      emailId: email.id,
      threadId: email.threadId,
      subject: email.subject,
      isEmail: true,
      labels: email.labels,
    };

    if (email.attachments.length > 0) {
      metadata.attachments = email.attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      }));
    }

    return metadata;
  }

  /**
   * Get conversation display info (name and avatar)
   */
  private getConversationDisplayInfo(thread: ProcessedThread): { name: string; avatar?: string } {
    // For group conversations, use subject
    if (thread.participants.length > 2) {
      return {
        name: thread.subject,
        avatar: undefined, // Could generate group avatar
      };
    }

    // For 1:1 conversations, use the other participant
    const otherParticipant = thread.participants.find(
      p => p.email.toLowerCase() !== this.currentUserEmail.toLowerCase()
    );

    if (otherParticipant) {
      return {
        name: otherParticipant.name || otherParticipant.email,
        avatar: this.generateAvatar(otherParticipant.email, otherParticipant.name),
      };
    }

    return {
      name: thread.subject || 'Email Conversation',
      avatar: undefined,
    };
  }

  /**
   * Format message preview for conversation list
   */
  private formatMessagePreview(email: ProcessedEmail): string {
    let preview = email.snippet || email.body.text || '';
    
    // Clean up the preview
    preview = preview
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Add attachment indicator
    if (email.attachments.length > 0) {
      const attachmentText = email.attachments.length === 1 
        ? `📎 ${email.attachments[0].filename}`
        : `📎 ${email.attachments.length} attachments`;
      preview = attachmentText + (preview ? ' • ' + preview : '');
    }

    // Truncate if too long
    if (preview.length > 100) {
      preview = preview.substring(0, 97) + '...';
    }

    return preview || '(No content)';
  }

  /**
   * Get message status for conversation display
   */
  private getMessageStatus(email: ProcessedEmail, isOwn: boolean): ConversationData['messageStatus'] {
    if (isOwn) {
      return 'sent'; // All sent emails are considered sent
    }
    
    return email.isRead ? 'read' : 'delivered';
  }

  /**
   * Determine conversation priority
   */
  private determinePriority(thread: ProcessedThread): ConversationData['priority'] {
    if (thread.isImportant) return 'high';
    if (thread.unreadCount > 0) return 'normal';
    return 'low';
  }

  /**
   * Generate thread description
   */
  private generateThreadDescription(thread: ProcessedThread): string {
    const parts = [];
    
    if (thread.messageCount > 1) {
      parts.push(`${thread.messageCount} messages`);
    }
    
    if (thread.participants.length > 2) {
      parts.push(`${thread.participants.length} participants`);
    }

    return parts.join(' • ');
  }

  /**
   * Generate avatar URL or initials
   */
  private generateAvatar(email: string, name?: string): string | undefined {
    // For now, return undefined to use fallback initials
    // Could implement Gravatar or other avatar services
    return undefined;
  }

  /**
   * Clean email content for display
   */
  private cleanEmailContent(content: string): string {
    return content
      .replace(/^[\s>]+/gm, '') // Remove quote prefixes
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .replace(/^\s*--+\s*$/gm, '---') // Standardize separators
      .trim();
  }

  /**
   * Convert HTML to simple markdown-like format
   */
  private htmlToMarkdown(html: string): string {
    return html
      .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em\b[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u\b[^>]*>(.*?)<\/u>/gi, '_$1_')
      .replace(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(div|p|h[1-6])\b[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Create batch converter for multiple threads
   */
  static createBatchConverter(currentUserEmail: string) {
    return new EmailToMessageConverter(currentUserEmail);
  }
}

/**
 * Helper function to convert email thread to conversation data
 */
export function convertEmailThreadToConversation(
  thread: ProcessedThread, 
  currentUserEmail: string
): ConversationData {
  const converter = new EmailToMessageConverter(currentUserEmail);
  return converter.convertThreadToConversation(thread);
}

/**
 * Helper function to convert emails to messages
 */
export function convertEmailsToMessages(
  emails: ProcessedEmail[], 
  currentUserEmail: string
): MessageData[] {
  const converter = new EmailToMessageConverter(currentUserEmail);
  return emails.map(email => converter.convertEmailToMessage(email));
}
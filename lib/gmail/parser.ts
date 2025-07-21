import { 
  GmailMessage, 
  GmailMessagePayload, 
  GmailHeader,
  ProcessedEmail, 
  EmailParticipant, 
  EmailBody, 
  EmailAttachment,
  ProcessedThread,
  GmailThread,
  GMAIL_LABELS,
  EmailConversionOptions 
} from './types';

/**
 * Parse Gmail message to extract structured data
 */
export class EmailParser {
  /**
   * Parse Gmail message into ProcessedEmail format
   */
  static parseMessage(gmailMessage: GmailMessage, options: EmailConversionOptions = {}): ProcessedEmail {
    const headers = this.extractHeaders(gmailMessage.payload);
    const body = this.extractBody(gmailMessage.payload, options);
    const attachments = options.includeAttachments ? 
      this.extractAttachments(gmailMessage.payload, gmailMessage.id, options.maxAttachmentSize) : [];

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject: headers.subject || '(No Subject)',
      from: this.parseEmailAddress(headers.from || ''),
      to: this.parseEmailAddresses(headers.to || ''),
      cc: headers.cc ? this.parseEmailAddresses(headers.cc) : undefined,
      bcc: headers.bcc ? this.parseEmailAddresses(headers.bcc) : undefined,
      date: new Date(parseInt(gmailMessage.internalDate)),
      body,
      attachments,
      labels: gmailMessage.labelIds || [],
      isRead: !gmailMessage.labelIds?.includes(GMAIL_LABELS.UNREAD),
      isStarred: gmailMessage.labelIds?.includes(GMAIL_LABELS.STARRED) || false,
      isImportant: gmailMessage.labelIds?.includes(GMAIL_LABELS.IMPORTANT) || false,
      snippet: gmailMessage.snippet || '',
      internalDate: gmailMessage.internalDate,
      historyId: gmailMessage.historyId,
    };
  }

  /**
   * Parse Gmail thread into ProcessedThread format
   */
  static parseThread(gmailThread: GmailThread, options: EmailConversionOptions = {}): ProcessedThread {
    const messages = gmailThread.messages.map(msg => this.parseMessage(msg, options));
    const lastMessage = messages[messages.length - 1];
    const firstMessage = messages[0];
    
    // Get all unique participants
    const allParticipants = new Map<string, EmailParticipant>();
    messages.forEach(msg => {
      allParticipants.set(msg.from.email, msg.from);
      msg.to.forEach(p => allParticipants.set(p.email, p));
      msg.cc?.forEach(p => allParticipants.set(p.email, p));
    });

    const unreadMessages = messages.filter(msg => !msg.isRead);
    const starredMessages = messages.filter(msg => msg.isStarred);
    const importantMessages = messages.filter(msg => msg.isImportant);

    // Combine all labels from messages
    const allLabels = new Set<string>();
    messages.forEach(msg => msg.labels.forEach(label => allLabels.add(label)));

    return {
      id: gmailThread.id,
      subject: firstMessage.subject,
      participants: Array.from(allParticipants.values()),
      lastMessage,
      messageCount: messages.length,
      unreadCount: unreadMessages.length,
      isStarred: starredMessages.length > 0,
      isImportant: importantMessages.length > 0,
      labels: Array.from(allLabels),
      snippet: gmailThread.snippet || lastMessage.snippet,
      lastActivity: lastMessage.date,
    };
  }

  /**
   * Extract headers from Gmail message payload
   */
  private static extractHeaders(payload: GmailMessagePayload): Record<string, string> {
    const headers: Record<string, string> = {};
    
    payload.headers?.forEach((header: GmailHeader) => {
      headers[header.name.toLowerCase()] = header.value;
    });

    return headers;
  }

  /**
   * Extract email body from Gmail message payload
   */
  private static extractBody(payload: GmailMessagePayload, options: EmailConversionOptions): EmailBody {
    let textContent = '';
    let htmlContent = '';

    // Handle different payload structures
    if (payload.parts) {
      // Multipart message
      const textPart = this.findPartByMimeType(payload.parts, 'text/plain');
      const htmlPart = this.findPartByMimeType(payload.parts, 'text/html');

      if (textPart?.body?.data) {
        textContent = this.decodeBase64(textPart.body.data);
      }

      if (htmlPart?.body?.data) {
        htmlContent = this.decodeBase64(htmlPart.body.data);
      }
    } else {
      // Single part message
      if (payload.body?.data) {
        const content = this.decodeBase64(payload.body.data);
        
        if (payload.mimeType === 'text/html') {
          htmlContent = content;
          textContent = this.htmlToText(content);
        } else {
          textContent = content;
        }
      }
    }

    // Clean HTML if requested
    if (options.cleanHtml && htmlContent) {
      htmlContent = this.cleanHtml(htmlContent);
    }

    // Generate text from HTML if no text content
    if (!textContent && htmlContent) {
      textContent = this.htmlToText(htmlContent);
    }

    return {
      text: textContent,
      html: htmlContent,
      snippet: this.generateSnippet(textContent || htmlContent),
    };
  }

  /**
   * Extract attachments from Gmail message payload
   */
  private static extractAttachments(
    payload: GmailMessagePayload, 
    messageId: string, 
    maxSize?: number
  ): EmailAttachment[] {
    const attachments: EmailAttachment[] = [];

    const extractFromPart = (part: GmailMessagePayload) => {
      if (part.filename && part.body) {
        const size = part.body.size || 0;
        
        // Skip if attachment is too large
        if (maxSize && size > maxSize) {
          return;
        }

        const attachment: EmailAttachment = {
          id: part.body.attachmentId || part.partId || '',
          filename: part.filename,
          mimeType: part.mimeType,
          size,
        };

        // For small attachments, include the data directly
        if (part.body.data && size < 1024 * 1024) { // 1MB limit
          attachment.data = part.body.data;
        }

        attachments.push(attachment);
      }

      // Recursively check nested parts
      if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (payload.parts) {
      payload.parts.forEach(extractFromPart);
    }

    return attachments;
  }

  /**
   * Find message part by MIME type
   */
  private static findPartByMimeType(parts: GmailMessagePayload[], mimeType: string): GmailMessagePayload | null {
    for (const part of parts) {
      if (part.mimeType === mimeType) {
        return part;
      }
      
      if (part.parts) {
        const found = this.findPartByMimeType(part.parts, mimeType);
        if (found) return found;
      }
    }
    
    return null;
  }

  /**
   * Decode base64-encoded Gmail data
   */
  private static decodeBase64(data: string): string {
    try {
      // Gmail uses URL-safe base64 encoding
      const standardBase64 = data.replace(/-/g, '+').replace(/_/g, '/');
      return Buffer.from(standardBase64, 'base64').toString('utf8');
    } catch (error) {
      console.error('Failed to decode base64 data:', error);
      return '';
    }
  }

  /**
   * Parse email address with name
   */
  private static parseEmailAddress(addressString: string): EmailParticipant {
    // Handle format: "Name <email@example.com>" or just "email@example.com"
    const match = addressString.match(/^(.+)\s<(.+@.+)>$/) || 
                  addressString.match(/^(.+@.+)$/);

    if (!match) {
      return { email: addressString.trim() };
    }

    if (match.length === 3) {
      // Name and email format
      return {
        name: match[1].trim().replace(/^["']|["']$/g, ''), // Remove quotes
        email: match[2].trim(),
      };
    } else {
      // Email only format
      return { email: match[1].trim() };
    }
  }

  /**
   * Parse multiple email addresses
   */
  private static parseEmailAddresses(addressString: string): EmailParticipant[] {
    // Split by comma, but be careful with quoted names that might contain commas
    const addresses = addressString.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    return addresses.map(addr => this.parseEmailAddress(addr));
  }

  /**
   * Convert HTML to plain text
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/<br\s*\/?>/gi, '\n') // Convert line breaks
      .replace(/<\/?(div|p|h[1-6]|blockquote)\b[^>]*>/gi, '\n') // Block elements
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
      .replace(/&amp;/g, '&') // Convert HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n/g, '\n\n') // Clean up extra whitespace
      .trim();
  }

  /**
   * Clean HTML content
   */
  private static cleanHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript URLs
      .trim();
  }

  /**
   * Generate email snippet
   */
  private static generateSnippet(content: string, maxLength: number = 150): string {
    const cleaned = content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // Try to break at word boundary
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Extract email thread information for conversation grouping
   */
  static extractThreadInfo(gmailMessage: GmailMessage): {
    threadId: string;
    messageId: string;
    subject: string;
    participants: string[];
  } {
    const headers = this.extractHeaders(gmailMessage.payload);
    const from = this.parseEmailAddress(headers.from || '');
    const to = this.parseEmailAddresses(headers.to || '');
    const cc = headers.cc ? this.parseEmailAddresses(headers.cc) : [];
    
    const allParticipants = [from, ...to, ...cc].map(p => p.email);

    return {
      threadId: gmailMessage.threadId,
      messageId: gmailMessage.id,
      subject: headers.subject || '(No Subject)',
      participants: [...new Set(allParticipants)], // Remove duplicates
    };
  }

  /**
   * Check if email is automated/notification
   */
  static isAutomatedEmail(processedEmail: ProcessedEmail): boolean {
    const automatedIndicators = [
      'no-reply',
      'noreply',
      'do-not-reply',
      'automated',
      'notification',
      'alerts',
      'system',
      'admin',
      'support',
    ];

    const fromEmail = processedEmail.from.email.toLowerCase();
    const subject = processedEmail.subject.toLowerCase();

    return automatedIndicators.some(indicator => 
      fromEmail.includes(indicator) || subject.includes(indicator)
    );
  }

  /**
   * Extract conversation title from email thread
   */
  static extractConversationTitle(processedThread: ProcessedThread, currentUserEmail: string): string {
    const { subject, participants, messageCount } = processedThread;
    
    // Remove common email prefixes
    let cleanSubject = subject
      .replace(/^(Re|Fwd?|FWD):\s*/i, '')
      .trim();

    if (cleanSubject.length === 0) {
      // Fallback to participant names if no subject
      const otherParticipants = participants.filter(p => p.email !== currentUserEmail);
      if (otherParticipants.length > 0) {
        if (otherParticipants.length === 1) {
          return otherParticipants[0].name || otherParticipants[0].email;
        } else {
          return `${otherParticipants[0].name || otherParticipants[0].email} + ${otherParticipants.length - 1} others`;
        }
      }
      return 'Conversation';
    }

    // Add participant info for group conversations
    if (participants.length > 2) {
      const otherCount = participants.length - 1; // Exclude current user
      cleanSubject += ` (${otherCount} participants)`;
    }

    return cleanSubject;
  }
}
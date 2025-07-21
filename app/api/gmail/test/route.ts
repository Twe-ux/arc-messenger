import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createGmailIntegration } from '@/lib/gmail';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Create Gmail integration
    const gmailIntegration = await createGmailIntegration(session.user.email);
    
    if (!gmailIntegration) {
      return NextResponse.json(
        { error: 'Gmail integration not available - Please check OAuth setup' },
        { status: 503 }
      );
    }

    // Test connection
    const isConnected = await gmailIntegration.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Gmail connection failed - Please reauthorize' },
        { status: 503 }
      );
    }

    // Get basic information
    const [unreadCount, labels] = await Promise.all([
      gmailIntegration.getUnreadCount(),
      gmailIntegration.getLabels(),
    ]);

    // Get recent conversations (limit to 5 for testing)
    const conversations = await gmailIntegration.getConversations({
      maxResults: 5,
    });

    return NextResponse.json({
      success: true,
      user: {
        email: session.user.email,
        name: session.user.name,
      },
      gmail: {
        connected: true,
        unreadCount,
        totalLabels: labels.length,
        recentConversations: conversations.conversations.length,
        totalConversations: conversations.total,
      },
      data: {
        labels: labels.slice(0, 10), // First 10 labels
        conversations: conversations.conversations,
      },
    });

  } catch (error: any) {
    console.error('Gmail API test error:', error);
    
    return NextResponse.json(
      { 
        error: 'Gmail API test failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, threadId, query } = body;

    // Create Gmail integration
    const gmailIntegration = await createGmailIntegration(session.user.email);
    
    if (!gmailIntegration) {
      return NextResponse.json(
        { error: 'Gmail integration not available' },
        { status: 503 }
      );
    }

    let result;

    switch (action) {
      case 'getMessages':
        if (!threadId) {
          return NextResponse.json(
            { error: 'threadId is required for getMessages action' },
            { status: 400 }
          );
        }
        result = await gmailIntegration.getConversationMessages(threadId);
        break;

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'query is required for search action' },
            { status: 400 }
          );
        }
        result = await gmailIntegration.searchConversations(query, {
          maxResults: 10,
        });
        break;

      case 'markAsRead':
        if (!threadId) {
          return NextResponse.json(
            { error: 'threadId is required for markAsRead action' },
            { status: 400 }
          );
        }
        await gmailIntegration.markConversationAsRead(threadId);
        result = { success: true, action: 'markAsRead', threadId };
        break;

      case 'toggleStar':
        if (!threadId) {
          return NextResponse.json(
            { error: 'threadId is required for toggleStar action' },
            { status: 400 }
          );
        }
        const starred = body.starred !== false; // Default to true
        await gmailIntegration.toggleConversationStar(threadId, starred);
        result = { success: true, action: 'toggleStar', threadId, starred };
        break;

      case 'archive':
        if (!threadId) {
          return NextResponse.json(
            { error: 'threadId is required for archive action' },
            { status: 400 }
          );
        }
        await gmailIntegration.archiveConversation(threadId);
        result = { success: true, action: 'archive', threadId };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
    });

  } catch (error: any) {
    let requestBody;
    try {
      requestBody = await request.clone().json();
    } catch {
      requestBody = {};
    }
    
    console.error(`Gmail API ${requestBody?.action || 'POST'} error:`, error);
    
    return NextResponse.json(
      { 
        error: `Gmail API operation failed`,
        details: error.message,
        action: requestBody?.action,
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createGmailIntegration } from '@/lib/gmail';
import { ConversationData } from '@/components/chat/ConversationCard';

export async function GET(request: NextRequest) {
  console.log('📧 Gmail API: Starting conversations request...');
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('📧 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      email: session?.user?.email,
    });
    
    if (!session?.user?.email) {
      console.warn('📧 No authenticated session');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('limit') || '25');
    const pageToken = searchParams.get('pageToken') || undefined;
    const labelId = searchParams.get('label') || undefined;
    const query = searchParams.get('q') || undefined;

    console.log('📧 Query params:', { maxResults, pageToken, labelId, query });

    // Create Gmail integration
    console.log('📧 Creating Gmail integration for:', session.user.email);
    const gmailIntegration = await createGmailIntegration(session.user.email);
    
    if (!gmailIntegration) {
      console.error('📧 Gmail integration creation failed');
      return NextResponse.json(
        { 
          error: 'Gmail integration not available',
          details: 'Failed to create Gmail client. Please check your Google OAuth configuration and ensure you have the required Gmail permissions.',
          suggestion: 'Try signing out and signing in again to refresh your Gmail permissions.'
        },
        { status: 503 }
      );
    }

    console.log('📧 Gmail integration created successfully');

    let result;

    try {
      if (query) {
        console.log('📧 Searching conversations with query:', query);
        result = await gmailIntegration.searchConversations(query, {
          maxResults,
          pageToken,
        });
      } else {
        console.log('📧 Getting conversations with labelId:', labelId);
        result = await gmailIntegration.getConversations({
          maxResults,
          pageToken,
          labelId,
        });
      }
      
      console.log('📧 Gmail API result:', {
        conversationsCount: result.conversations.length,
        total: result.total,
        hasNextPage: !!result.nextPageToken,
      });
    } catch (gmailError: any) {
      console.error('📧 Gmail API operation failed:', gmailError);
      return NextResponse.json(
        { 
          error: 'Gmail API operation failed',
          details: gmailError.message,
          code: gmailError.code,
        },
        { status: 502 }
      );
    }

    // Transform for frontend consumption
    const responseData = {
      conversations: result.conversations.map((conv: ConversationData) => ({
        id: conv.id,
        name: conv.name,
        avatar: conv.avatar,
        lastMessage: conv.lastMessage,
        timestamp: conv.timestamp,
        unreadCount: conv.unreadCount || 0,
        isGroup: conv.isGroup || false,
        participants: conv.participants || [],
        lastMessageSender: conv.lastMessageSender,
        messageStatus: conv.messageStatus,
        messageType: conv.messageType || 'text',
        priority: conv.priority || 'normal',
        isPinned: conv.isPinned || false,
        isMuted: conv.isMuted || false,
        isArchived: conv.isArchived || false,
        isOnline: false, // Email doesn't have online status
      })),
      pagination: {
        nextPageToken: result.nextPageToken,
        hasMore: !!result.nextPageToken,
        total: result.total,
        currentCount: result.conversations.length,
      },
      meta: {
        query: query || null,
        labelId: labelId || null,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('📧 Sending response with', responseData.conversations.length, 'conversations');
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('📧 Gmail conversations API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gmail conversations',
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
    const { conversationIds, action } = body;

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json(
        { error: 'conversationIds array is required' },
        { status: 400 }
      );
    }

    // Create Gmail integration
    const gmailIntegration = await createGmailIntegration(session.user.email);
    
    if (!gmailIntegration) {
      return NextResponse.json(
        { error: 'Gmail integration not available' },
        { status: 503 }
      );
    }

    const results = [];
    const errors = [];

    // Process each conversation
    for (const conversationId of conversationIds) {
      try {
        let result;

        switch (action) {
          case 'markAsRead':
            await gmailIntegration.markConversationAsRead(conversationId);
            result = { id: conversationId, action: 'marked as read' };
            break;

          case 'markAsUnread':
            // Would need to implement this in the integration
            result = { id: conversationId, action: 'marked as unread' };
            break;

          case 'star':
            await gmailIntegration.toggleConversationStar(conversationId, true);
            result = { id: conversationId, action: 'starred' };
            break;

          case 'unstar':
            await gmailIntegration.toggleConversationStar(conversationId, false);
            result = { id: conversationId, action: 'unstarred' };
            break;

          case 'archive':
            await gmailIntegration.archiveConversation(conversationId);
            result = { id: conversationId, action: 'archived' };
            break;

          case 'delete':
            await gmailIntegration.deleteConversation(conversationId);
            result = { id: conversationId, action: 'deleted' };
            break;

          default:
            errors.push({
              id: conversationId,
              error: `Unknown action: ${action}`,
            });
            continue;
        }

        results.push(result);

      } catch (error: any) {
        errors.push({
          id: conversationId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      action,
      results,
      errors,
      summary: {
        total: conversationIds.length,
        successful: results.length,
        failed: errors.length,
      },
    });

  } catch (error: any) {
    console.error('Gmail conversations batch operation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform batch operation on Gmail conversations',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
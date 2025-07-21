import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createGmailIntegration } from '@/lib/gmail';
import { MessageData } from '@/components/chat/MessageBubble';

interface RouteParams {
  params: {
    threadId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { threadId } = params;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
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

    // Get conversation messages and thread info
    const result = await gmailIntegration.getConversationMessages(threadId);

    // Transform messages for frontend consumption
    const transformedMessages = result.messages.map((msg: MessageData) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      timestamp: msg.timestamp,
      isOwn: msg.isOwn,
      status: msg.status,
      type: msg.type,
      isEdited: msg.isEdited || false,
      reactions: msg.reactions || [],
      metadata: {
        ...msg.metadata,
        isEmail: true,
        emailId: msg.id,
        threadId: threadId,
      },
    }));

    // Transform thread info for frontend
    const threadInfo = {
      id: result.threadInfo.id,
      name: result.threadInfo.name,
      avatar: result.threadInfo.avatar,
      status: result.threadInfo.status,
      isGroup: result.threadInfo.isGroup,
      participantCount: result.threadInfo.participantCount,
      description: result.threadInfo.description,
      isPinned: result.threadInfo.isPinned,
      isMuted: result.threadInfo.isMuted,
      isArchived: result.threadInfo.isArchived,
    };

    return NextResponse.json({
      success: true,
      threadId,
      threadInfo,
      messages: transformedMessages,
      messageCount: transformedMessages.length,
      meta: {
        userEmail: session.user.email,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error(`Gmail messages API error for thread ${params?.threadId}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gmail conversation messages',
        details: error.message,
        threadId: params?.threadId,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const { threadId } = params;
    const body = await request.json();
    const { action, messageIds } = body;

    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
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

    let result;

    switch (action) {
      case 'markThreadAsRead':
        await gmailIntegration.markConversationAsRead(threadId);
        result = { 
          action: 'markThreadAsRead',
          threadId,
          success: true 
        };
        break;

      case 'starThread':
        const starred = body.starred !== false; // Default to true
        await gmailIntegration.toggleConversationStar(threadId, starred);
        result = { 
          action: 'starThread',
          threadId,
          starred,
          success: true 
        };
        break;

      case 'archiveThread':
        await gmailIntegration.archiveConversation(threadId);
        result = { 
          action: 'archiveThread',
          threadId,
          success: true 
        };
        break;

      case 'deleteThread':
        await gmailIntegration.deleteConversation(threadId);
        result = { 
          action: 'deleteThread',
          threadId,
          success: true 
        };
        break;

      case 'getUpdatedMessages':
        // Refresh messages for this thread
        const updatedResult = await gmailIntegration.getConversationMessages(threadId);
        result = {
          action: 'getUpdatedMessages',
          threadId,
          messages: updatedResult.messages,
          threadInfo: updatedResult.threadInfo,
          success: true
        };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      threadId,
      result,
    });

  } catch (error: any) {
    console.error(`Gmail thread action error for ${params?.threadId}:`, error);
    
    let requestBody;
    try {
      requestBody = await request.clone().json();
    } catch {
      requestBody = {};
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to perform action on Gmail conversation',
        details: error.message,
        threadId: params?.threadId,
        action: requestBody?.action,
      },
      { status: 500 }
    );
  }
}
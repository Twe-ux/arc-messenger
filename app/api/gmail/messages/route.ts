import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createGmailIntegration } from '@/lib/gmail';

export async function GET(request: NextRequest) {
  console.log('📧 Gmail Messages API: Starting individual messages request...');
  
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
    const query = searchParams.get('query') || undefined;
    const labelId = searchParams.get('labelId') || undefined;

    console.log('📧 Request parameters:', { maxResults, pageToken, query, labelId });

    // Create Gmail integration
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
      console.log('📧 Getting individual messages with labelId:', labelId);
      result = await gmailIntegration.getAllIndividualMessages({
        maxResults,
        pageToken,
        labelId,
      });
      
      console.log('📧 Gmail API result:', {
        messagesCount: result.messages.length,
        total: result.total,
        hasNextPage: !!result.nextPageToken,
      });
    } catch (gmailError: any) {
      console.error('📧 Gmail API operation failed:', gmailError);
      return NextResponse.json(
        {
          error: 'Gmail API Error',
          message: gmailError.message,
          details: 'Failed to fetch messages from Gmail. This could be due to API limits, authentication issues, or temporary Gmail service problems.',
          suggestion: 'Please try again in a moment. If the problem persists, try signing out and back in.'
        },
        { status: 502 }
      );
    }

    // Format response for frontend
    const response = {
      success: true,
      messages: result.messages.map((message: any) => ({
        id: message.id,
        from: message.from || 'Unknown Sender',
        fromName: message.fromName || message.from || 'Unknown',
        subject: message.subject || '(No Subject)',
        snippet: message.snippet || message.preview || '',
        timestamp: message.timestamp,
        unread: message.unread || false,
        labels: message.labels || [],
        hasAttachments: message.hasAttachments || false,
        threadId: message.threadId,
        isOwn: message.isOwn || false,
      })),
      pagination: {
        total: result.total,
        nextPageToken: result.nextPageToken,
        hasMore: !!result.nextPageToken,
      },
    };

    console.log('📧 Sending response:', {
      messagesCount: response.messages.length,
      hasNextPage: response.pagination.hasMore,
    });

    return NextResponse.json(response);
  
  } catch (error: any) {
    console.error('📧 Gmail Messages API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error.message || 'Unknown error occurred',
        details: 'An unexpected error occurred while processing your request.',
        suggestion: 'Please try again. If the problem persists, contact support.'
      },
      { status: 500 }
    );
  }
}
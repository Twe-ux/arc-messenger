import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Gmail Debug: Starting diagnostic...');

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('🔍 Session status:', session ? 'Authenticated' : 'Not authenticated');
    console.log('🔍 User email:', session?.user?.email);

    if (!session?.user?.email) {
      return NextResponse.json(
        { 
          error: 'Not authenticated',
          debug: {
            hasSession: !!session,
            hasUser: !!session?.user,
            hasEmail: !!session?.user?.email,
          }
        },
        { status: 401 }
      );
    }

    // Check database connection
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('🔍 Database connected');

    // Find user in database
    const user = await User.findOne({ email: session.user.email });
    console.log('🔍 User found:', !!user);
    console.log('🔍 User has Gmail tokens:', !!(user?.gmailTokens?.accessToken));

    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
        debug: {
          searchedEmail: session.user.email,
          userExists: false,
        }
      }, { status: 404 });
    }

    // Check Gmail tokens
    const hasGmailTokens = !!(user.gmailTokens?.accessToken && user.gmailTokens?.refreshToken);
    console.log('🔍 Gmail tokens status:', hasGmailTokens);

    if (!hasGmailTokens) {
      return NextResponse.json({
        error: 'Gmail tokens not found',
        debug: {
          userExists: true,
          hasGmailTokens: false,
          hasAccessToken: !!user.gmailTokens?.accessToken,
          hasRefreshToken: !!user.gmailTokens?.refreshToken,
          tokenExpiry: user.gmailTokens?.expiresAt,
        },
        suggestion: 'Please sign out and sign in again to refresh Gmail tokens'
      }, { status: 403 });
    }

    // Test environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };
    console.log('🔍 Environment variables:', envCheck);

    // Try to create Gmail client
    console.log('🔍 Testing Gmail client creation...');
    try {
      if (!user.gmailTokens) {
        throw new Error('No Gmail tokens found for user');
      }

      const { GmailClient } = await import('@/lib/gmail/client');
      const gmailClient = new GmailClient({
        accessToken: user.gmailTokens.accessToken,
        refreshToken: user.gmailTokens.refreshToken,
        expiryDate: user.gmailTokens.expiresAt ? user.gmailTokens.expiresAt.getTime() : undefined,
      });

      // Test connection
      const isConnected = await gmailClient.testConnection();
      console.log('🔍 Gmail connection test:', isConnected);

      return NextResponse.json({
        success: true,
        debug: {
          user: {
            email: session.user.email,
            hasGmailTokens: true,
            tokenExpiry: user.gmailTokens.expiresAt,
          },
          gmail: {
            clientCreated: true,
            connectionTest: isConnected,
          },
          environment: envCheck,
        },
        message: isConnected 
          ? 'Gmail integration is working correctly' 
          : 'Gmail client created but connection test failed',
      });

    } catch (gmailError: any) {
      console.error('🔍 Gmail client error:', gmailError);
      return NextResponse.json({
        error: 'Gmail client creation failed',
        debug: {
          gmailError: gmailError.message,
          stack: process.env.NODE_ENV === 'development' ? gmailError.stack : undefined,
          environment: envCheck,
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('🔍 Debug API error:', error);
    return NextResponse.json({
      error: 'Debug API failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
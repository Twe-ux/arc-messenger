import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Build the Google OAuth URL with force consent
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NEXTAUTH_URL + '/api/auth/callback/google');
    const scopes = encodeURIComponent([
      'openid',
      'email', 
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify'
    ].join(' '));

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `scope=${scopes}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `include_granted_scopes=true`;

    return NextResponse.redirect(googleAuthUrl);

  } catch (error: any) {
    console.error('Force Gmail consent error:', error);
    return NextResponse.json({
      error: 'Failed to redirect to Google OAuth',
      details: error.message,
    }, { status: 500 });
  }
}
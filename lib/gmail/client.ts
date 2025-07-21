import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Gmail API scopes required
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export interface GmailAuth {
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
}

export class GmailClient {
  private oauth2Client: any;
  private gmail: any;

  constructor(auth: GmailAuth) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    );

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
      expiry_date: auth.expiryDate,
    });

    // Initialize Gmail API
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Create Gmail client from NextAuth session
   */
  static async fromSession(): Promise<GmailClient | null> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.email) {
        console.warn('Gmail client: No authenticated session');
        return null;
      }

      // Import User model dynamically to avoid circular dependency
      const { User } = await import('@/lib/db/models/User');
      const { default: connectDB } = await import('@/lib/db/mongodb');
      
      // Connect to database and get user with Gmail tokens
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      
      if (!user || !user.gmailTokens?.accessToken || !user.gmailTokens?.refreshToken) {
        console.warn('Gmail client: User not found or missing Gmail tokens');
        return null;
      }

      return new GmailClient({
        accessToken: user.gmailTokens.accessToken,
        refreshToken: user.gmailTokens.refreshToken,
        expiryDate: user.gmailTokens.expiresAt ? user.gmailTokens.expiresAt.getTime() : undefined,
      });
    } catch (error) {
      console.error('Gmail client creation failed:', error);
      return null;
    }
  }

  /**
   * Create Gmail client with manual auth tokens
   */
  static create(auth: GmailAuth): GmailClient {
    return new GmailClient(auth);
  }

  /**
   * Test Gmail API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.gmail.users.getProfile({ userId: 'me' });
      console.log('Gmail connection test successful:', response.data.emailAddress);
      return true;
    } catch (error: any) {
      console.error('Gmail connection test failed:', error.message);
      
      // Try to refresh token if expired
      if (error.code === 401) {
        try {
          await this.refreshAccessToken();
          const retryResponse = await this.gmail.users.getProfile({ userId: 'me' });
          console.log('Gmail connection test successful after token refresh:', retryResponse.data.emailAddress);
          return true;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string | null> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      
      console.log('Gmail access token refreshed successfully');
      return credentials.access_token || null;
    } catch (error) {
      console.error('Failed to refresh Gmail access token:', error);
      return null;
    }
  }

  /**
   * Get user's Gmail profile
   */
  async getProfile(): Promise<any> {
    try {
      const response = await this.gmail.users.getProfile({ userId: 'me' });
      return response.data;
    } catch (error) {
      console.error('Failed to get Gmail profile:', error);
      throw error;
    }
  }

  /**
   * Get Gmail client for direct API calls
   */
  getGmailApi() {
    return this.gmail;
  }

  /**
   * Get OAuth2 client for token management
   */
  getOAuth2Client() {
    return this.oauth2Client;
  }

  /**
   * Check if tokens are valid and not expired
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check if we have required credentials
      const credentials = this.oauth2Client.credentials;
      if (!credentials.access_token) {
        return false;
      }

      // Check if token is expired
      if (credentials.expiry_date && credentials.expiry_date < Date.now()) {
        // Try to refresh
        const newToken = await this.refreshAccessToken();
        return !!newToken;
      }

      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.oauth2Client.credentials?.access_token || null;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.oauth2Client.credentials?.refresh_token || null;
  }
}

/**
 * Helper function to create authenticated Gmail client
 */
export async function createGmailClient(auth?: GmailAuth): Promise<GmailClient | null> {
  if (auth) {
    return GmailClient.create(auth);
  }
  
  return await GmailClient.fromSession();
}

/**
 * Helper function to validate Gmail scopes
 */
export function validateGmailScopes(grantedScopes: string[]): boolean {
  return SCOPES.every(scope => grantedScopes.includes(scope));
}

export { SCOPES as GMAIL_SCOPES };
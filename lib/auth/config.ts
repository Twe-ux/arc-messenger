import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
  // Temporarily disable MongoDB adapter to test JWT-only auth
  // adapter: MongoDBAdapter(clientPromise, {
  //   databaseName: process.env.MONGODB_DB_NAME,
  // }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify',
          prompt: 'consent',
          access_type: 'offline',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          
          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create new user with Gmail tokens
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              avatar: user.image,
              provider: 'google',
              providerId: account.providerAccountId,
              gmailTokens: account.access_token && account.refresh_token ? {
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              } : undefined,
              preferences: {
                theme: 'system',
                notifications: {
                  email: true,
                  push: true,
                  sound: true,
                },
                privacy: {
                  onlineStatus: true,
                  readReceipts: true,
                },
              },
              status: 'online',
            });
          } else {
            // Update existing user with new tokens
            if (account.access_token && account.refresh_token) {
              existingUser.gmailTokens = {
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
              };
            }
            existingUser.lastActiveAt = new Date();
            existingUser.status = 'online';
            await existingUser.save();
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.userId = user.id;
      }
      
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect to inbox
      return `${baseUrl}/inbox`;
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.userId = token.userId as string;
        
        // Get updated user data from database
        try {
          await connectDB();
          const user = await User.findOne({ email: session.user?.email });
          if (user) {
            session.user = {
              ...session.user,
              id: user._id.toString(),
              avatar: user.avatar,
              preferences: user.preferences,
              status: user.status,
            };
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Update user status to offline
      try {
        await connectDB();
        await User.findOneAndUpdate(
          { email: token.email },
          { 
            status: 'offline',
            lastActiveAt: new Date(),
          }
        );
      } catch (error) {
        console.error('Error updating user status on signout:', error);
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
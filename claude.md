# Claude Code Session Guide - Messaging App

## Project Overview

This is a web messaging application that combines WhatsApp's messaging features with Arc Browser's modern design. The app integrates Gmail (and later other email providers) to unify email and instant messaging in a single interface.

## 📋 Progression Summary

### ✅ Milestone 1: Project Foundation (COMPLETED)

**Status:** 🎯 **COMPLETED** - 2024-07-20

#### Tasks Accomplished:

**Development Environment Setup:**
- ✅ Next.js 14 project initialized with TypeScript and App Router
- ✅ ESLint and Prettier configured for code quality
- ✅ Husky pre-commit hooks set up with lint-staged
- ✅ Commitlint configured for conventional commits
- ✅ Environment files structure created (.env.example, .env.local)
- ✅ VS Code workspace settings optimized for development
- ✅ Git repository initialized with initial commit

**Project Structure:**
- ✅ Complete folder architecture following Next.js 14 App Router patterns
- ✅ Path aliases configured in tsconfig.json (@/components, @/lib, etc.)
- ✅ Base layout files created for authentication and main app
- ✅ App directory structure with (auth) and (main) route groups
- ✅ Placeholder pages for login, register, inbox, and settings
- ✅ Next.js configuration file with optimizations

**Design System Foundation:**
- ✅ Tailwind CSS 4.1 installed and configured
- ✅ Arc Browser-inspired purple theme implemented
- ✅ CSS variables for light/dark mode theming
- ✅ Global styles with Arc Browser aesthetics
- ✅ Inter font integration
- ✅ Comprehensive spacing and typography scales
- ✅ Dark mode CSS variables prepared

**Database Setup:**
- ✅ MongoDB Atlas cluster configured and connected
- ✅ Mongoose and MongoDB packages installed
- ✅ Database connection utility with proper error handling
- ✅ User schema with Gmail integration and preferences
- ✅ Conversation schema with participants and categories
- ✅ Message schema with attachments and reactions
- ✅ TypeScript definitions for all models
- ✅ Connection testing script created and validated

**Technical Achievements:**
- 🎨 **Arc Browser Design System**: Complete color palette, spacing, and typography
- 📱 **Responsive Foundation**: Mobile-first approach with breakpoint system
- 🔐 **Security Setup**: Input validation, secure configurations
- 🛠️ **Developer Experience**: Hot reload, type safety, code formatting
- 📦 **Package Management**: All dependencies for MVP features

**Files Created:** 38 files including layouts, schemas, configurations, and documentation

**Next Steps:** Ready for Milestone 2 (Authentication System) implementation

### Core Features

- Unified messaging interface for emails and instant messages
- Arc Browser-inspired purple theme with collapsible sidebar
- WhatsApp-style message bubbles and interactions
- Split view for multiple conversations
- Real-time messaging with typing indicators
- Gmail integration with bidirectional sync
- Swipe gestures for category navigation

## Tech Stack

```yaml
Frontend:
  - Framework: Next.js 14+ (App Router)
  - Styling: Tailwind CSS
  - Animations: Framer Motion
  - State: Zustand
  - Real-time: Socket.io-client
  - Data Fetching: @tanstack/react-query

Backend:
  - Database: MongoDB with Mongoose
  - Authentication: NextAuth.js
  - Email: Gmail API (Google APIs)
  - Real-time: Socket.io
  - File Storage: AWS S3 or Cloudinary

DevOps:
  - Hosting: Vercel (frontend) + MongoDB Atlas
  - Monitoring: Sentry
  - Analytics: Mixpanel
  - CI/CD: GitHub Actions
```

## Project Structure

```
messaging-app/
├── app/                    # Next.js 14 app directory
│   ├── (auth)/            # Auth routes group
│   ├── (main)/            # Main app routes
│   └── api/               # API routes
├── components/            # React components
│   ├── sidebar/          # Sidebar components
│   ├── chat/             # Chat components
│   ├── email/            # Email components
│   ├── shared/           # Shared components
│   └── ui/               # UI primitives
├── lib/                   # Utilities and integrations
│   ├── db/               # Database models
│   ├── gmail/            # Gmail integration
│   ├── socket/           # Socket.io setup
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── public/               # Static assets
```

## Key Implementation Details

### 1. Sidebar with Arc-style Design

- **File**: `components/sidebar/Sidebar.tsx`
- Purple gradient background (#8B5CF6)
- Collapsible with animated transitions
- Swipe gestures to switch categories
- Real-time search functionality
- Category bar at bottom with customizable icons

### 2. Split View Feature

- **File**: `components/shared/SplitView.tsx`
- Draggable divider between panels
- Saves user preference in localStorage
- Minimum panel size: 300px
- Smooth resize animations

### 3. Gmail Integration

- **File**: `lib/gmail/client.ts`
- OAuth2 authentication flow
- Sync emails as chat messages
- Parse attachments and inline images
- Real-time updates via Gmail Push API
- Thread conversation mapping

### 4. Real-time Messaging

- **Files**: `lib/socket/server.ts`, `hooks/useSocket.ts`
- Socket.io for bidirectional communication
- Typing indicators
- Read receipts
- Online/offline status
- Message delivery status

### 5. Message Components

- **File**: `components/chat/MessageBubble.tsx`
- WhatsApp-style bubbles (purple for sent, gray for received)
- Status indicators (sent, delivered, read)
- Support for images, files, and media
- Reply functionality
- Time stamps with hover actions

## Design System

### Colors

```css
Primary: #A855F7 (Purple 500)
Primary Dark: #7C3AED (Purple 700)
Primary Light: #D8B4FE (Purple 300)
Background: #FFFFFF (Light) / #09090B (Dark)
Secondary: #FDF2F8 (Pink 50)
Text: #18181B (Gray 900)
```

### Typography

- Font: Inter
- Sizes: 12px to 36px scale
- Weights: 300-700

### Spacing

- Base unit: 8px
- Scale: 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64px

## Database Schema

### User Model

```typescript
{
  _id: ObjectId,
  email: string,
  name: string,
  avatar?: string,
  gmailTokens?: {
    accessToken: string,
    refreshToken: string
  },
  preferences: object,
  createdAt: Date
}
```

### Conversation Model

```typescript
{
  _id: ObjectId,
  participants: ObjectId[],
  type: 'chat' | 'email',
  lastMessage: object,
  unreadCount: number,
  category: string,
  metadata?: object
}
```

### Message Model

```typescript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  content: string,
  attachments?: object[],
  status: string,
  timestamp: Date,
  emailMetadata?: object
}
```

## Common Development Tasks

### Starting Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run MongoDB locally or use Atlas
# Start development server
npm run dev

# In another terminal, start Socket.io server
npm run socket:dev
```

### Adding a New Component

1. Create component in appropriate directory
2. Use existing UI primitives from `components/ui/`
3. Follow the established color scheme and spacing
4. Add animations using Framer Motion
5. Ensure dark mode compatibility

### Implementing a New Feature

1. Update types in `types/index.ts`
2. Add API route if needed in `app/api/`
3. Create or update Zustand store
4. Implement UI components
5. Add socket events if real-time
6. Write tests

### Gmail Integration Setup

1. Create Google Cloud project
2. Enable Gmail API
3. Set up OAuth2 credentials
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Update `.env.local` with credentials

## Testing Guidelines

### Unit Tests

- Use Jest and React Testing Library
- Test components in isolation
- Mock external dependencies
- Focus on user interactions

### E2E Tests

- Use Playwright
- Test critical user flows
- Run against local environment
- Include visual regression tests

## Performance Considerations

1. **Lazy Load**: Heavy components and routes
2. **Optimize Images**: Use Next.js Image component
3. **Cache**: Implement React Query for API calls
4. **Bundle Size**: Monitor with next-bundle-analyzer
5. **Database**: Index frequently queried fields

## Security Best Practices

1. **Authentication**: Use NextAuth.js with secure sessions
2. **API**: Validate all inputs, use rate limiting
3. **Tokens**: Store securely, refresh regularly
4. **CSP**: Implement Content Security Policy
5. **HTTPS**: Always use in production

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Socket.io server deployed
- [ ] Gmail OAuth configured for production
- [ ] Sentry error tracking enabled
- [ ] Analytics tracking enabled
- [ ] SSL certificates valid
- [ ] Rate limiting configured
- [ ] Backup strategy in place

## Troubleshooting

### Common Issues

1. **Socket connection fails**

   - Check CORS configuration
   - Verify Socket.io server is running
   - Check firewall/proxy settings

2. **Gmail sync not working**

   - Verify OAuth tokens are valid
   - Check API quotas
   - Ensure push notifications are configured

3. **Sidebar animations janky**

   - Check for layout thrashing
   - Use CSS transforms instead of width
   - Implement will-change CSS property

4. **Messages not updating in real-time**
   - Verify socket connection
   - Check room subscriptions
   - Debug socket event listeners

## Code Style Guidelines

1. Use TypeScript for all new code
2. Follow ESLint configuration
3. Use conventional commits
4. Keep components under 200 lines
5. Extract reusable logic to hooks
6. Document complex functions
7. Use descriptive variable names

## Future Enhancements

1. **Phase 2**: Outlook and Yahoo integration
2. **Phase 3**: Mobile app with React Native
3. **Phase 4**: AI-powered features (summarization, smart replies)
4. **Phase 5**: Enterprise features (SSO, compliance)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Socket.io Guide](https://socket.io/docs/v4)
- [Gmail API Reference](https://developers.google.com/gmail/api)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/practices/)

## Contact & Support

For questions about this project:

- Technical Lead: [Your Name]
- Design Lead: [Designer Name]
- Product Owner: [PO Name]

---

Remember: This is a living document. Update it as the project evolves!

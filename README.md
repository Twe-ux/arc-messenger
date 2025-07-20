# 🎨 Arc Messenger

A modern messaging application that combines WhatsApp's functionality with Arc Browser's elegant design aesthetic. Built with Next.js 14, TypeScript, and MongoDB.

## ✨ Features

- **🔮 Arc Browser Design**: Beautiful purple gradient UI inspired by Arc Browser
- **💬 WhatsApp-style Messaging**: Familiar chat bubbles and interactions
- **📧 Gmail Integration**: Unified email and instant messaging interface
- **🎭 Real-time Communication**: Socket.io powered live messaging
- **🌗 Dark/Light Mode**: Seamless theme switching
- **📱 Responsive Design**: Works perfectly on all devices
- **🔍 Split View**: Multiple conversations side by side
- **🎯 Smart Categories**: Organize conversations by context

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB Atlas account or local MongoDB instance
- Google Cloud Console account (for Gmail integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd arc-messenger
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB_NAME=arc-messenger-dev

   # Authentication
   NEXTAUTH_SECRET=your_secret_key
   NEXTAUTH_URL=http://localhost:3000

   # Gmail Integration
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
arc-messenger/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── sidebar/          # Sidebar components
│   ├── chat/             # Chat components
│   ├── shared/           # Shared components
│   └── ui/               # UI primitives
├── lib/                   # Utilities and integrations
│   ├── db/               # Database models and connection
│   ├── gmail/            # Gmail API integration
│   ├── socket/           # Socket.io setup
│   └── utils/            # Helper functions
├── hooks/                 # Custom React hooks
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🎨 Design System

### Colors

- **Primary**: Purple 500 (#A855F7) - Arc Browser inspired
- **Primary Dark**: Purple 700 (#7C3AED)
- **Primary Light**: Purple 300 (#D8B4FE)
- **Background**: White / Dark Gray
- **Message Sent**: Purple tint
- **Message Received**: Light gray

### Typography

- **Font Family**: Inter
- **Sizes**: 12px to 36px scale
- **Weights**: 300 to 700

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.1
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Real-time**: Socket.io Client

### Backend

- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js
- **Email Integration**: Gmail API
- **Real-time**: Socket.io
- **File Storage**: Cloudinary/AWS S3

### Development Tools

- **Linting**: ESLint
- **Formatting**: Prettier
- **Git Hooks**: Husky
- **Commit Linting**: Commitlint
- **Testing**: Jest + Playwright

## 📝 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript compiler
npm run format          # Format code with Prettier

# Socket.io Server
npm run socket:dev      # Start Socket.io development server
```

## 🔐 Environment Variables

| Variable                 | Description                | Required |
| ------------------------ | -------------------------- | -------- |
| `MONGODB_URI`            | MongoDB connection string  | ✅       |
| `MONGODB_DB_NAME`        | Database name              | ✅       |
| `NEXTAUTH_SECRET`        | NextAuth secret key        | ✅       |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID     | ✅       |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret | ✅       |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name      | ❌       |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL       | ✅       |

## 🗃️ Database Schema

### User

```typescript
{
  email: string;
  name: string;
  avatar?: string;
  gmailTokens?: { accessToken: string; refreshToken: string };
  preferences: { theme: string; notifications: object };
  status: 'online' | 'offline' | 'away' | 'busy';
}
```

### Conversation

```typescript
{
  participants: ObjectId[];
  type: 'chat' | 'email' | 'group';
  lastMessage: object;
  unreadCount: { [userId: string]: number };
  category: string;
}
```

### Message

```typescript
{
  conversationId: ObjectId;
  senderId: ObjectId;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}
```

## 🎯 Roadmap

### Phase 1 (Current)

- [x] Project foundation and setup
- [x] Basic UI with Arc design system
- [x] Authentication system
- [x] Real-time messaging
- [x] Gmail integration

### Phase 2

- [ ] File attachments and media sharing
- [ ] Push notifications
- [ ] Search functionality
- [ ] Split view implementation
- [ ] Message reactions and replies

### Phase 3

- [ ] Outlook integration
- [ ] Advanced categorization
- [ ] Performance optimizations
- [ ] Mobile PWA features

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Arc Browser** for design inspiration
- **WhatsApp** for UX patterns
- **Vercel** for hosting and deployment
- **MongoDB** for database solutions

---

Built with ❤️ using Next.js and TypeScript

# CHW-API - Community Health Worker Platform

A comprehensive backend and mobile application platform for Community Health Workers, built with Node.js, Express, TypeScript, and React Native with Expo.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Mobile App](#mobile-app)
- [Database](#database)
- [Contributing](#contributing)
- [Deployment](#deployment)

## 📱 Project Overview

CHW-API is a full-stack platform designed to support Community Health Workers with:
- **Real-time messaging** and chat functionality
- **Community forums** for knowledge sharing
- **Group conversations** for team collaboration
- **Calendar management** with event scheduling and reminders
- **Meeting scheduling** with Jitsi integration
- **Course management** and training materials
- **Push notifications** and offline support

This is a **monorepo** containing both backend (Node.js) and mobile (React Native) applications.

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Real-time Communication**: Socket.io
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **API Documentation**: Swagger/OpenAPI (via TSOA)

### Mobile
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context + @tanstack/react-query
- **UI Library**: Lucide React Native icons, NativeWind (Tailwind)
- **Real-time**: Socket.io client
- **Audio/Video**: Jitsi Meet integration
- **Notifications**: Expo Notifications

## 📂 Project Structure

```
chw-api/
├── src/                          # Backend source code
│   ├── index.ts                 # Entry point
│   ├── config/                  # Configuration files
│   ├── controllers/             # Request handlers
│   ├── services/               # Business logic
│   ├── middlewares/            # Express middleware
│   ├── events/                 # Socket.io event handlers
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   └── verifications/          # Verification logic
├── mobile/                       # React Native mobile app
│   ├── app/                    # Expo Router screens
│   │   ├── (tabs)/            # Tabbed navigation
│   │   ├── chat/              # Chat screens
│   │   ├── group/             # Group screens
│   │   ├── community/         # Community screens
│   │   ├── meeting/           # Meeting screens
│   │   └── auth/              # Authentication screens
│   ├── components/            # Reusable components
│   ├── contexts/              # React contexts (Theme, Language, Messaging)
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # API and Socket services
│   ├── types/                 # TypeScript interfaces
│   └── utils/                 # Utility functions
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma          # Prisma schema
│   └── migrations/            # Database migrations
├── docker-compose.yaml         # Docker Compose configuration
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev             # Development Docker image
└── package.json               # Dependencies

```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18 or higher)
- **npm** or **pnpm** (recommended)
- **PostgreSQL** (v12 or higher)
- **Git**
- **Docker** (optional, for containerized development)

### Clone the Repository

```bash
git clone https://github.com/gilberthappi/chw-api.git
cd chw-api
```

## 💾 Installation

### 1. Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

### 2. Set Up Database

Ensure PostgreSQL is running, then:
```bash
# Run migrations
npx prisma migrate dev --name init

# Seed the database (optional)
pnpm run seed
```

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chw_api
DATABASE_POOL_SIZE=10

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:8081,http://localhost:19000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Jitsi (for meeting integration)
JITSI_API_URL=https://meet.jitsi.example.com

# Storage (AWS S3 or similar)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### Mobile Environment Variables

Create a `.env.local` in the `mobile/` directory:

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000

# Jitsi Meeting
EXPO_PUBLIC_JITSI_SERVER_URL=https://meeting.ebumenyi.online

# Feature Flags
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=true
EXPO_PUBLIC_ENABLE_OFFLINE_MODE=true
```

## 🏃 Running the Application

### Backend Development

```bash
# Start development server with hot reload
pnpm run dev

# Build TypeScript
pnpm run build

# Start production server
pnpm start
```

The API will be available at `http://localhost:3000`

### Mobile Development

```bash
cd mobile

# Start Expo development server
npm run start
# or
pnpm start

# Scan QR code with Expo Go app on your phone
# or press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

### Docker Development

```bash
# Start all services (API + PostgreSQL)
docker-compose -f docker-compose.dev.yaml up

# Rebuild images
docker-compose -f docker-compose.dev.yaml up --build

# Stop services
docker-compose -f docker-compose.dev.yaml down
```

## ✨ Key Features

### 1. Real-time Messaging
- **Direct messages** between users
- **Group conversations** for team collaboration
- **Community rooms** for public discussions
- WebSocket-based communication via Socket.io
- Message status indicators (sent, delivered, read)

### 2. User Management
- Registration and authentication (JWT)
- User profiles with avatars
- Online/offline status tracking
- User search and discovery

### 3. Calendar & Scheduling
- Create, update, and delete events
- Multiple event types: Training, Reminder, Deadline
- Event frequency (daily, weekly, one-time)
- Reminders with customizable minutes before event
- All-day events support
- Kinyarwanda month/weekday labels

### 4. Notifications
- Push notifications for messages and events
- In-app notification center
- Notification history
- Dismissible notifications

### 5. Meeting Integration
- Schedule meetings with Jitsi Meet
- Real-time meeting access via WebView
- Meeting recordings support
- Participant management

### 6. Courses & Training
- Course management with chapters
- Video and document hosting
- Progress tracking
- Certificate generation
- Course reviews and ratings

## 📡 API Documentation

### Swagger Documentation

Once the server is running, access the API documentation at:
```
http://localhost:3000/docs
```

### Key API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh JWT token

#### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile

#### Conversations
- `GET /conversations` - Get user conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/:id` - Get conversation details

#### Messages
- `GET /conversations/:id/messages` - Get conversation messages
- `POST /conversations/:id/messages` - Send message

#### Calendar
- `GET /calendar/events` - Get user events
- `POST /calendar/events` - Create event
- `PUT /calendar/events/:id` - Update event
- `DELETE /calendar/events/:id` - Delete event

## 📱 Mobile App Features

### Screen Structure

```
app/
├── (tabs)/                # Tab-based navigation
│   ├── home              # Home/Dashboard
│   ├── community         # Community hub
│   ├── courses           # Course listing
│   ├── profile           # User profile
│   └── meeting           # Upcoming meetings
├── chat/
│   ├── [id]             # Chat room
│   └── create           # Start new chat
├── group/
│   ├── [id]             # Group room
│   └── create           # Create group
├── community/
│   ├── [id]             # Community room
│   └── create           # Create community
├── auth/
│   ├── login            # Login screen
│   └── register         # Registration
└── meeting/
    └── [meetingId]      # Meeting WebView
```

### Key Components

- **Header**: Navigation with notifications
- **ChatScreen**: Real-time messaging interface
- **CalendarScreen**: Event management
- **CommunityMessages**: Community discussion threads
- **EventFormModal**: Event creation/editing
- **UpdateManager**: App update notifications

### State Management

- **ThemeContext**: Dark/light mode
- **LanguageContext**: i18n support (English, Kinyarwanda, French)
- **MessagingContext**: Socket.io connection and conversation management
- **@tanstack/react-query**: Server state (HTTP queries only)

## 🗄 Database

### Using Prisma

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio

# Seed database
npm run seed
```

### Key Models

- **User**: User accounts and profiles
- **Conversation**: Direct messages, groups, communities
- **Message**: Chat messages with attachments
- **CalendarEvent**: Scheduled events with reminders
- **Notification**: User notifications
- **Course**: Training courses with chapters

## 🤝 Contributing

### Development Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

3. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Name files in kebab-case (e.g., `my-component.tsx`)

## 🚀 Deployment

### Production Build

```bash
# Backend
npm run build
npm start

# Mobile
cd mobile
npm run build
```

### Docker Deployment

```bash
# Build production image
docker build -t chw-api:latest .

# Run container
docker run -p 3000:3000 chw-api:latest
```

### Environment Variables for Production

- Set `NODE_ENV=production`
- Use strong JWT_SECRET
- Configure production database URL
- Set up CORS properly
- Enable HTTPS

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Socket.io Guide](https://socket.io/docs/)

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# On Linux/Mac
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Database connection error**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

**Mobile app not connecting to backend**
- Verify API_URL in mobile/.env.local
- Check backend is running
- Ensure CORS is configured
- Check firewall settings

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with detailed information
3. Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Last Updated**: March 5, 2026
**Version**: 1.0.0
**Maintained by**: CHW Development Team

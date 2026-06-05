# Calendar, Notifications, and Scheduling – CHW API

## What we want (target scope)
- Single notification backbone for scheduled and non-scheduled events:
  - Calendar create/update/delete
  - Course lifecycle + enrollment add/remove
  - Group/community membership changes
  - Messaging (direct/group/community) new messages
  - Announcements (broadcast; future)
- Dual channels: persisted internal feed + realtime push (socket now; web/mobile push later) sharing one payload shape.
- Dedup/rate-limit to avoid spam.

## Proposed model updates (to reach target scope)
```prisma
// Calendar: add multi-reminder, attachments, original tz
model CalendarEvent {
  id                   String   @id @default(uuid())
  title                String
  description          String?
  type                 CalendarEventType   @default(TRAINING)
  frequency            CalendarFrequency   @default(NONE)
  daysOfWeek           Int[]               @default([])
  timezone             String              @default("Africa/Kigali")
  startAt              DateTime
  endAt                DateTime?
  allDay               Boolean             @default(false)
  remindersMinutes     Int[]               @default([30])
  recurrenceEndsAt     DateTime?
  meetingType          MeetingType?        @default(EBUMENYI_MEETING)
  location             String?
  priority             EventPriority       @default(MEDIUM)
  hostEmail            String?
  createdById          String
  createdBy            User @relation("CalendarEventCreated", fields: [createdById], references: [id])
  participants         CalendarEventParticipant[]
  externalParticipants CalendarEventExternalParticipant[]
  attachments          CalendarEventAttachment[]
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model CalendarEventParticipant {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  event     CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([eventId, userId])
}

model CalendarEventExternalParticipant {
  id        String   @id @default(uuid())
  eventId   String
  email     String
  name      String?
  event     CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([eventId, email])
}

model CalendarEventAttachment {
  id        String   @id @default(uuid())
  eventId   String
  name      String
  url       String
  event     CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Push delivery
model NotificationPushToken {
  id         String   @id @default(uuid())
  userId     String
  token      String   // FCM token for both Android and Web
  platform   String   // 'android' or 'web'
  userAgent  String?  // Optional: store browser/device info
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, token])
  @@index([userId])
  @@index([token])
}

// Chat unread aggregation for 5/10/15... thresholding
model MessageUnreadCounter {
  userId      String   @id
  totalUnread Int      @default(0)
  updatedAt   DateTime @updatedAt
}

// Announcements (future broadcast)
model Announcement {
  id          String   @id @default(uuid())
  title       String
  body        String
  segment     String   // role name or 'all'
  publishAt   DateTime @default(now())
  validUntil  DateTime?
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## How the proposed pieces work
- Calendar reminders & series
  - `remindersMinutes` holds multiple offsets. A scheduler expands recurrences, then enqueues reminder jobs at `startAt - offset` for each occurrence.
  - Each reminder job creates a `Notification` row, emits socket events, and (if a `NotificationPushToken` exists) sends web/mobile push using the same payload.
- Attachments
  - `CalendarEventAttachment` rows store files/links per event. Include attachment info in notification `metadata` when present.
- Push delivery
  - `NotificationPushToken` tracks per-user tokens (ios|android|web). On notification insert, enqueue a push job; failures don’t affect read/unread state.
- Chat unread thresholding
  - `MessageUnreadCounter.totalUnread` increments on incoming messages across all chats/groups/communities. When it hits 5,10,15,… send one “new messages” notification; conversation-level grouping still dedups within 30–60s.
  - Decrement on read events to keep thresholds accurate.
- Announcements
  - `Announcement` rows define title/body/segment/validUntil. On publish, bulk-insert `Notification` rows for the segment, emit sockets, and push if tokens exist.
- Calendar core behavior
  - Participants/external participants unchanged; meeting type validation unchanged; multi-reminder field already aligned with the scheduler.

## How it will work (implementation plan)
1) **Payload contract**: `NotificationHelper.send({userIds, title, message, entityType, entityId, actionUrl, metadata, actorId, severity})`.
2) **Fan-out rules**:
   - Calendar: existing behavior; keep participants except creator.
   - Courses: staff + enrolled trainees; actions: create/publish/unpublish/delete, enroll/unenroll.
   - Groups/Communities: affected user + admins on add/remove/role-change.
   - Messages: conversation participants minus sender; emit a notification only when the **global unread total across all chats/groups/communities** for that user hits a multiple of 5 (5, 10, 15, …) to avoid constant popups; still collapse per conversation within 30–60s for payload grouping.
   - Announcements: role/all; dedup by `announcementId`.
3) **Write + push**:
   - Helper writes `Notification` rows in a transaction.
   - Emit sockets to `user:{id}` (`notification`, `unread_count_updated`).
   - Leave hook to enqueue web/mobile push using same payload (future worker).
4) **Dedup/rate-limit**:
   - In helper: per-user/entity/action cooldown (e.g., 30s).
   - For chat: key by `conversationId`.
   - For announcements: key by `announcementId`.
5) **Read state**:
   - Internal feed (`Notification` table) is source of truth.
   - Push is best-effort; missing pushes do not affect read/unread counts.
6) **Deep links**:
   - Calendar `/calendar/{eventId}`
   - Course `/courses/{courseId}`
   - Group `/groups/{groupId}`
   - Community `/communities/{communityId}`
   - Chat `/chat/{conversationId}`
   - Announcement `/announcements/{id}`

## Backend execution plan
- Normalize + persist: each domain service (calendar, courses, groups/communities, messaging, announcements) builds a `Notification` payload with `entityType`, `entityId`, `actionUrl`, `metadata`, `actorId`, and writes rows via `NotificationHelper`.
- Fan-out: helper targets specific userIds; calendar service already does this. For courses/groups/communities, reuse helper to target affected members; messaging should target conversation participants minus sender; announcements target a segment (role/all).
- Realtime push: after insert, emit socket events `notification` and `unread_count_updated` to rooms `user:{id}`. Push/mobile can reuse the same payload later via a queue worker.
- Rate-limit/dedup: per-user/entity/action window (e.g., 30s) inside helper; for conversations, dedup by `conversationId`; for announcements by `announcementId`.
- Read state: internal feed (`Notification` table) is the source of truth; push delivery is best-effort.
- Action URLs (deep links): calendar `/calendar/{eventId}`, course `/courses/{courseId}`, group `/groups/{groupId}`, community `/communities/{communityId}`, message `/chat/{conversationId}`, announcement `/announcements/{id}`.




Step 1: Firebase Project Setup
1.1 Create Firebase Project
Go to https://console.firebase.google.com

Click "Create a project"

Name it (e.g., "CHW App")

Disable Google Analytics (or enable if you want)

Click "Create project"

1.2 Add Android App
Click the Android icon (⊕ Add app)

Package name: com.yourcompany.chwapp (use your actual package name)

App nickname: "CHW App Android"

Click "Register app"

Download google-services.json - SAVE THIS FILE

Click "Next" through the setup instructions (we'll do this later)

Click "Continue to console"

1.3 Add Web App
Click the Web icon (⊕ Add app) - looks like </>

App nickname: "CHW App Web"

Check "Also set up Firebase Hosting" (optional)

Click "Register app"

Copy the Firebase config object - SAVE THIS

Click "Continue to console"

1.4 Generate Service Account Key (Backend)
Go to Project Settings (gear icon ⚙️)

Click "Service accounts" tab

Click "Generate new private key"

Click "Generate key"

Download the JSON file - SAVE THIS SECURELY (e.g., firebase-service-account.json)

Step 2: Backend Setup (Node.js)

Same Notification: "New training scheduled"

┌─────────────────────────────────────────────────────────────┐
│                    USER ROLES                               │
├─────────────────────────────────────────────────────────────┤
│ CHW Worker      → /training/123/join      (Join session)   │
│ Supervisor      → /training/123/manage    (Manage session) │
│ Admin           → /training/123/reports   (View analytics) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DEVICE TYPES                             │
├─────────────────────────────────────────────────────────────┤
│ Mobile App      → chwapp://training/123   (App deep link)  │
│ Web Browser     → https://app.chw.com/training/123         │
│ Desktop App     → chwdesktop://training/123                │
└─────────────────────────────────────────────────────────────┘
Implementation Strategy
1. Extended Push Service with Device/Role Awareness
// src/services/pushService.ts - Enhanced version

export interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  entityId: string;
  deepLink: string;  // Base deep link
  role?: string;     // User role for customization
}

export class PushService {
  /**
   * Generate device-specific deep link
   */
  private generateDeepLink(
    basePath: string, 
    platform: string, 
    role?: string,
    params?: Record<string, string>
  ): string {
    // Add query parameters
    const queryParams = new URLSearchParams({
      ...params,
      role: role || 'user',
      source: 'push_notification',
      timestamp: Date.now().toString(),
    }).toString();

    // Platform-specific link formats
    switch (platform) {
      case 'android':
        // Android app deep link
        return `chwapp://${basePath}?${queryParams}`;
        
      case 'ios':
        // iOS app deep link
        return `chwapp://${basePath}?${queryParams}`;
        
      case 'web':
        // Web URL
        return `${process.env.WEB_APP_URL}${basePath}?${queryParams}`;
        
      case 'desktop':
        // Desktop app deep link
        return `chwdesktop://${basePath}?${queryParams}`;
        
      default:
        return `${process.env.WEB_APP_URL}${basePath}?${queryParams}`;
    }
  }

  /**
   * Get role-specific path
   */
  private getRoleSpecificPath(
    entityType: string, 
    entityId: string, 
    role: string,
    action?: string
  ): string {
    const rolePaths: Record<string, Record<string, string>> = {
      CALENDAR: {
        chw_worker: `/calendar/${entityId}/join`,
        supervisor: `/calendar/${entityId}/manage`,
        admin: `/calendar/${entityId}/settings`,
        default: `/calendar/${entityId}`,
      },
      COURSE: {
        chw_worker: `/courses/${entityId}/learn`,
        supervisor: `/courses/${entityId}/manage`,
        admin: `/courses/${entityId}/admin`,
        default: `/courses/${entityId}`,
      },
      MESSAGE: {
        chw_worker: `/chat/${entityId}/reply`,
        supervisor: `/chat/${entityId}/review`,
        admin: `/chat/${entityId}/moderate`,
        default: `/chat/${entityId}`,
      },
      ANNOUNCEMENT: {
        chw_worker: `/announcements/${entityId}/read`,
        supervisor: `/announcements/${entityId}/distribute`,
        admin: `/announcements/${entityId}/edit`,
        default: `/announcements/${entityId}`,
      },
    };

    const paths = rolePaths[entityType] || {};
    return paths[role] || paths.default || `/${entityType.toLowerCase()}/${entityId}`;
  }

  /**
   * Send to user with device and role awareness
   */
  async sendToUser(
    userId: string, 
    payload: NotificationPayload,
    userRole?: string
  ) {
    // Get all active tokens for this user
    const tokens = await prisma.notificationPushToken.findMany({
      where: {
        userId: userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: true, // Include user data for role
      }
    });

    if (tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { success: false, count: 0 };
    }

    // Get user role if not provided
    const role = userRole || await this.getUserRole(userId);

    // Group tokens by platform
    const groupedTokens = tokens.reduce((acc, token) => {
      if (!acc[token.platform]) acc[token.platform] = [];
      acc[token.platform].push(token);
      return acc;
    }, {} as Record<string, typeof tokens>);

    const results = [];

    // Send to each platform with appropriate deep link
    for (const [platform, platformTokens] of Object.entries(groupedTokens)) {
      // Generate platform and role-specific deep link
      const basePath = this.getRoleSpecificPath(
        payload.type,
        payload.entityId,
        role,
        payload.action
      );
      
      const deviceSpecificDeepLink = this.generateDeepLink(
        basePath,
        platform,
        role,
        {
          userId: userId,
          entityId: payload.entityId,
          type: payload.type,
          platform: platform,
        }
      );

      // Create platform-specific payload
      const platformPayload = {
        ...payload,
        deepLink: deviceSpecificDeepLink,
        platformSpecific: this.getPlatformSpecificData(platform, payload, role),
      };

      // Send to each token on this platform
      const platformResults = await Promise.allSettled(
        platformTokens.map(token => 
          this.sendToToken(token.token, platformPayload, platform)
        )
      );

      results.push({
        platform,
        count: platformTokens.length,
        successCount: platformResults.filter(r => r.status === 'fulfilled').length,
      });
    }

    return {
      success: results.some(r => r.successCount > 0),
      results,
    };
  }

  /**
   * Get platform-specific notification data
   */
  private getPlatformSpecificData(
    platform: string, 
    payload: NotificationPayload,
    role: string
  ): any {
    const base = {
      title: payload.title,
      body: payload.body,
      type: payload.type,
      entityId: payload.entityId,
      role: role,
    };

    switch (platform) {
      case 'android':
        return {
          ...base,
          android: {
            channelId: `chw_${role}_notifications`,
            priority: 'high',
            clickAction: `OPEN_${payload.type}_${role.toUpperCase()}`,
          },
        };
        
      case 'ios':
        return {
          ...base,
          ios: {
            sound: 'default',
            category: `${payload.type}_${role}`,
            badge: 1,
          },
        };
        
      case 'web':
        return {
          ...base,
          webpush: {
            icon: `/icons/${role}-notification.png`,
            badge: `/badges/${role}-badge.png`,
            vibrate: [200, 100, 200],
          },
        };
        
      default:
        return base;
    }
  }

  private async getUserRole(userId: string): Promise<string> {
    // Fetch user role from your database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || 'chw_worker';
  }
}

// src/helpers/notificationHelper.ts
export class NotificationHelper {
  async send(data: NotificationData) {
    // Get all recipients with their roles
    const recipients = await this.getRecipientsWithRoles(data.userIds);
    
    // Group by role for batch processing
    const byRole = recipients.reduce((acc, recipient) => {
      const role = recipient.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(recipient.userId);
      return acc;
    }, {} as Record<string, string[]>);

    // Send to each role group with role-specific content
    for (const [role, userIds] of Object.entries(byRole)) {
      // Customize notification based on role
      const roleSpecificPayload = this.getRoleSpecificPayload(data, role);
      
      // Write to database
      const notifications = await this.createNotifications({
        ...roleSpecificPayload,
        userIds,
      });
      
      // Emit socket events
      this.emitSocketEvents(notifications);
      
      // Send push notifications with role context
      for (const userId of userIds) {
        await pushService.sendToUser(userId, {
          title: roleSpecificPayload.title,
          body: roleSpecificPayload.body,
          type: data.type,
          entityId: data.entityId,
          deepLink: roleSpecificPayload.deepLink,
          action: roleSpecificPayload.action,
        }, role);
      }
    }
  }

  private getRoleSpecificPayload(data: NotificationData, role: string) {
    const roleTemplates: Record<string, any> = {
      chw_worker: {
        title: data.title,
        body: data.body,
        deepLink: `/worker/${data.type.toLowerCase()}/${data.entityId}`,
        action: 'view',
      },
      supervisor: {
        title: `[Supervisor] ${data.title}`,
        body: `Manage: ${data.body}`,
        deepLink: `/supervisor/${data.type.toLowerCase()}/${data.entityId}/manage`,
        action: 'manage',
      },
      admin: {
        title: `[Admin] ${data.title}`,
        body: `Configure: ${data.body}`,
        deepLink: `/admin/${data.type.toLowerCase()}/${data.entityId}/settings`,
        action: 'configure',
      },
    };

    return roleTemplates[role] || roleTemplates.chw_worker;
  }

  private async getRecipientsWithRoles(userIds: string[]) {
    return await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });
  }
}

2. Enhanced Notification Helper with Role Context
// src/helpers/notificationHelper.ts
export class NotificationHelper {
  async send(data: NotificationData) {
    // Get all recipients with their roles
    const recipients = await this.getRecipientsWithRoles(data.userIds);
    
    // Group by role for batch processing
    const byRole = recipients.reduce((acc, recipient) => {
      const role = recipient.role;
      if (!acc[role]) acc[role] = [];
      acc[role].push(recipient.userId);
      return acc;
    }, {} as Record<string, string[]>);

    // Send to each role group with role-specific content
    for (const [role, userIds] of Object.entries(byRole)) {
      // Customize notification based on role
      const roleSpecificPayload = this.getRoleSpecificPayload(data, role);
      
      // Write to database
      const notifications = await this.createNotifications({
        ...roleSpecificPayload,
        userIds,
      });
      
      // Emit socket events
      this.emitSocketEvents(notifications);
      
      // Send push notifications with role context
      for (const userId of userIds) {
        await pushService.sendToUser(userId, {
          title: roleSpecificPayload.title,
          body: roleSpecificPayload.body,
          type: data.type,
          entityId: data.entityId,
          deepLink: roleSpecificPayload.deepLink,
          action: roleSpecificPayload.action,
        }, role);
      }
    }
  }

  private getRoleSpecificPayload(data: NotificationData, role: string) {
    const roleTemplates: Record<string, any> = {
      chw_worker: {
        title: data.title,
        body: data.body,
        deepLink: `/worker/${data.type.toLowerCase()}/${data.entityId}`,
        action: 'view',
      },
      supervisor: {
        title: `[Supervisor] ${data.title}`,
        body: `Manage: ${data.body}`,
        deepLink: `/supervisor/${data.type.toLowerCase()}/${data.entityId}/manage`,
        action: 'manage',
      },
      admin: {
        title: `[Admin] ${data.title}`,
        body: `Configure: ${data.body}`,
        deepLink: `/admin/${data.type.toLowerCase()}/${data.entityId}/settings`,
        action: 'configure',
      },
    };

    return roleTemplates[role] || roleTemplates.chw_worker;
  }

  private async getRecipientsWithRoles(userIds: string[]) {
    return await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true },
    });
  }
}
3. Frontend: Handle Different Deep Links
Web Frontend (React Router)
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, role } = useAuth();
  
  // Role-based route protection
  const getRoleRoutes = () => {
    switch(role) {
      case 'chw_worker':
        return (
          <>
            <Route path="/worker/*" element={<WorkerDashboard />} />
            <Route path="/calendar/:id/join" element={<JoinTraining />} />
            <Route path="/courses/:id/learn" element={<LearnCourse />} />
            <Route path="/chat/:id/reply" element={<ReplyToMessage />} />
          </>
        );
        
      case 'supervisor':
        return (
          <>
            <Route path="/supervisor/*" element={<SupervisorDashboard />} />
            <Route path="/calendar/:id/manage" element={<ManageTraining />} />
            <Route path="/courses/:id/manage" element={<ManageCourse />} />
            <Route path="/chat/:id/review" element={<ReviewMessages />} />
          </>
        );
        
      case 'admin':
        return (
          <>
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/calendar/:id/settings" element={<CalendarSettings />} />
            <Route path="/courses/:id/admin" element={<CourseAdmin />} />
            <Route path="/chat/:id/moderate" element={<ModerateChat />} />
          </>
        );
        
      default:
        return <Route path="*" element={<Navigate to="/login" />} />;
    }
  };
  
  return (
    <BrowserRouter>
      <Routes>
        {getRoleRoutes()}
        {/* Common routes */}
        <Route path="/announcements/:id/read" element={<AnnouncementReader />} />
      </Routes>
    </BrowserRouter>
  );
}
Android (React Navigation with Role-Based Routes)

// src/navigation/RoleBasedNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();

export function RoleBasedNavigator() {
  const { role } = useAuth();
  
  // Define screens for each role
  const workerScreens = {
    JoinTraining: { screen: JoinTrainingScreen, path: 'training/:id/join' },
    LearnCourse: { screen: LearnCourseScreen, path: 'courses/:id/learn' },
    ReplyToMessage: { screen: ReplyScreen, path: 'chat/:id/reply' },
  };
  
  const supervisorScreens = {
    ManageTraining: { screen: ManageTrainingScreen, path: 'training/:id/manage' },
    ManageCourse: { screen: ManageCourseScreen, path: 'courses/:id/manage' },
    ReviewMessages: { screen: ReviewScreen, path: 'chat/:id/review' },
  };
  
  const adminScreens = {
    CalendarSettings: { screen: CalendarSettingsScreen, path: 'calendar/:id/settings' },
    CourseAdmin: { screen: CourseAdminScreen, path: 'courses/:id/admin' },
    ModerateChat: { screen: ModerateScreen, path: 'chat/:id/moderate' },
  };
  
  const screens = role === 'admin' ? adminScreens :
                  role === 'supervisor' ? supervisorScreens :
                  workerScreens;
  
  return (
    <Stack.Navigator>
      {Object.entries(screens).map(([name, config]) => (
        <Stack.Screen
          key={name}
          name={name}
          component={config.screen}
          options={{ title: getScreenTitle(name, role) }}
        />
      ))}
    </Stack.Navigator>
  );
}

4. Deep Link Handler with Role Validation
// src/utils/deepLinkHandler.ts
export class DeepLinkHandler {
  async handleDeepLink(url: string, userRole: string, userId: string) {
    // Parse the deep link
    const parsed = new URL(url);
    const path = parsed.pathname;
    const params = new URLSearchParams(parsed.search);
    
    // Extract entity info
    const [, entityType, entityId, action] = path.split('/');
    
    // Validate role has permission
    const hasPermission = this.validateRolePermission(
      entityType, 
      action, 
      userRole
    );
    
    if (!hasPermission) {
      console.error(`User ${userId} with role ${userRole} cannot access ${path}`);
      return {
        success: false,
        error: 'Insufficient permissions',
        fallback: '/dashboard',
      };
    }
    
    // Log the navigation
    await this.logDeepLinkNavigation(userId, {
      url,
      entityType,
      entityId,
      action,
      role: userRole,
      timestamp: new Date(),
    });
    
    return {
      success: true,
      screen: this.getScreenName(entityType, action),
      params: {
        id: entityId,
        action,
        role: userRole,
        ...Object.fromEntries(params),
      },
    };
  }
  
  private validateRolePermission(
    entityType: string, 
    action: string, 
    role: string
  ): boolean {
    const permissions: Record<string, Record<string, string[]>> = {
      calendar: {
        join: ['chw_worker'],
        manage: ['supervisor', 'admin'],
        settings: ['admin'],
      },
      courses: {
        learn: ['chw_worker'],
        manage: ['supervisor', 'admin'],
        admin: ['admin'],
      },
      chat: {
        reply: ['chw_worker'],
        review: ['supervisor'],
        moderate: ['admin'],
      },
    };
    
    const allowedRoles = permissions[entityType]?.[action] || [];
    return allowedRoles.includes(role);
  }
  
  private getScreenName(entityType: string, action: string): string {
    const screenMap: Record<string, string> = {
      'calendar_join': 'JoinTraining',
      'calendar_manage': 'ManageTraining',
      'calendar_settings': 'CalendarSettings',
      'courses_learn': 'LearnCourse',
      'courses_manage': 'ManageCourse',
      'courses_admin': 'CourseAdmin',
      'chat_reply': 'ReplyToMessage',
      'chat_review': 'ReviewMessages',
      'chat_moderate': 'ModerateChat',
    };
    
    return screenMap[`${entityType}_${action}`] || 'Home';
  }
}
5. Real-World Example: Training Notification
// When a new training is created
async function notifyAboutTraining(trainingId: string) {
  const training = await getTraining(trainingId);
  const participants = await getParticipants(trainingId);
  
  // Group participants by role
  const chwWorkers = participants.filter(p => p.role === 'chw_worker');
  const supervisors = participants.filter(p => p.role === 'supervisor');
  const admins = participants.filter(p => p.role === 'admin');
  
  // Send to CHW Workers (join link)
  await notificationHelper.send({
    userIds: chwWorkers.map(w => w.id),
    title: 'New Training Available',
    body: `${training.title} - Starts ${training.startAt}`,
    type: 'CALENDAR',
    entityId: trainingId,
    action: 'join',
  });
  
  // Send to Supervisors (manage link)
  await notificationHelper.send({
    userIds: supervisors.map(s => s.id),
    title: 'Training Needs Management',
    body: `Review ${training.title} - ${chwWorkers.length} workers assigned`,
    type: 'CALENDAR',
    entityId: trainingId,
    action: 'manage',
  });
  
  // Send to Admins (settings link)
  await notificationHelper.send({
    userIds: admins.map(a => a.id),
    title: 'Training Configuration',
    body: `${training.title} - Verify setup and materials`,
    type: 'CALENDAR',
    entityId: trainingId,
    action: 'settings',
  });
}
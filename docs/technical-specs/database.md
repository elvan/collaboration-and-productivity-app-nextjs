# Database Schema Design

## Overview

The database design uses a multi-database approach to optimize for different data types and access patterns:

1. **PostgreSQL** - Primary database for structured data
2. **MongoDB** - Document storage for flexible content
3. **Redis** - Caching and real-time features

## PostgreSQL Schema

### Core Entities

```prisma
// Users and Authentication
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String
  avatar        String?
  status        UserStatus
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  teams         TeamMember[]
  workspaces    WorkspaceMember[]
  tasks         Task[]
  comments      Comment[]
  activities    Activity[]
}

// Workspaces
model Workspace {
  id            String    @id @default(cuid())
  name          String
  description   String?
  settings      Json
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  members       WorkspaceMember[]
  projects      Project[]
  teams         Team[]
}

// Projects
model Project {
  id            String    @id @default(cuid())
  name          String
  description   String?
  status        ProjectStatus
  startDate     DateTime?
  endDate       DateTime?
  workspaceId   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  tasks         Task[]
  sprints       Sprint[]
  documents     Document[]
}

// Tasks
model Task {
  id            String    @id @default(cuid())
  title         String
  description   String?
  status        TaskStatus
  priority      Priority
  startDate     DateTime?
  dueDate       DateTime?
  estimate      Float?
  projectId     String
  assigneeId    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  project       Project   @relation(fields: [projectId], references: [id])
  assignee      User?     @relation(fields: [assigneeId], references: [id])
  sprint        Sprint?   @relation(fields: [sprintId], references: [id])
  dependencies  TaskDependency[]
  customFields  CustomFieldValue[]
  comments      Comment[]
  attachments   Attachment[]
}

// Sprints
model Sprint {
  id            String    @id @default(cuid())
  name          String
  goal          String?
  startDate     DateTime
  endDate       DateTime
  status        SprintStatus
  projectId     String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  project       Project   @relation(fields: [projectId], references: [id])
  tasks         Task[]
}
```

### Collaboration

```prisma
// Documents
model Document {
  id            String    @id @default(cuid())
  title         String
  content       String    @db.Text
  version       Int       @default(1)
  projectId     String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  project       Project   @relation(fields: [projectId], references: [id])
  versions      DocumentVersion[]
  comments      Comment[]
}

// Comments
model Comment {
  id            String    @id @default(cuid())
  content       String
  userId        String
  taskId        String?
  documentId    String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  user          User      @relation(fields: [userId], references: [id])
  task          Task?     @relation(fields: [taskId], references: [id])
  document      Document? @relation(fields: [documentId], references: [id])
}

// Chat
model ChatRoom {
  id            String    @id @default(cuid())
  name          String?
  type          ChatRoomType
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  messages      ChatMessage[]
  participants  ChatParticipant[]
}
```

### Automation

```prisma
// Workflows
model Workflow {
  id            String    @id @default(cuid())
  name          String
  description   String?
  enabled       Boolean   @default(true)
  trigger       Json
  conditions    Json
  actions       Json
  workspaceId   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  executions    WorkflowExecution[]
}

// Forms
model Form {
  id            String    @id @default(cuid())
  title         String
  description   String?
  fields        Json
  workspaceId   String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  workspace     Workspace @relation(fields: [workspaceId], references: [id])
  submissions   FormSubmission[]
}
```

## MongoDB Collections

### Document Content
```typescript
interface DocumentContent {
  _id: ObjectId;
  documentId: string;  // Reference to PostgreSQL document
  content: object;     // Rich text content
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Whiteboard Data
```typescript
interface WhiteboardData {
  _id: ObjectId;
  whiteboardId: string;
  elements: object[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity Logs
```typescript
interface ActivityLog {
  _id: ObjectId;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: object;
  timestamp: Date;
}
```

## Redis Data Structures

### Real-time Presence
```
// User presence
user:presence:{userId} -> {
  status: "online" | "away" | "offline",
  lastSeen: timestamp
}

// Document collaboration
doc:active:{docId} -> Set<userId>
```

### Caching
```
// User sessions
session:{sessionId} -> {
  userId: string,
  permissions: string[],
  expires: timestamp
}

// Frequently accessed data
cache:user:{userId} -> UserData
cache:project:{projectId} -> ProjectData
```

### Real-time Messaging
```
// Chat messages
chat:room:{roomId}:messages -> List<Message>
chat:user:{userId}:unread -> Set<MessageId>
```

## Indexing Strategy

### PostgreSQL Indexes
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Projects
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### MongoDB Indexes
```javascript
// Document content
db.documentContent.createIndex({ "documentId": 1 });
db.documentContent.createIndex({ "version": 1 });

// Activity logs
db.activityLogs.createIndex({ "userId": 1 });
db.activityLogs.createIndex({ "timestamp": -1 });
```

## Data Migration Strategy

1. **Version Control**
   - Schema versions in metadata table
   - Migration scripts in version control
   - Rollback procedures

2. **Zero-downtime Migrations**
   - Backward compatible changes
   - Gradual rollout
   - Feature flags

3. **Data Integrity**
   - Validation procedures
   - Data consistency checks
   - Backup procedures

## Backup Strategy

1. **PostgreSQL**
   - Daily full backups
   - Continuous WAL archiving
   - Point-in-time recovery

2. **MongoDB**
   - Daily full backups
   - Oplog tailing
   - Replica sets

3. **Redis**
   - RDB snapshots
   - AOF persistence
   - Replica synchronization

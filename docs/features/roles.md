# Role Management System

## Overview

The role management system implements a flexible Role-Based Access Control (RBAC) model that supports system-wide roles, context-based roles, and granular permissions.

## Role Types

### System Roles

```typescript
enum SystemRole {
  ADMIN = "Admin",
  USER = "User",
  GUEST = "Guest"
}
```

Each system role has predefined permissions:

- **Admin**: Full system access
- **User**: Standard access to projects and tasks
- **Guest**: Read-only access to projects and tasks

### Context-Based Roles

```typescript
enum RoleContext {
  SYSTEM = "system",
  WORKSPACE = "workspace",
  TEAM = "team",
  PROJECT = "project"
}
```

Roles can be assigned at different levels:
- System-wide roles
- Workspace-specific roles
- Team-specific roles
- Project-specific roles

## Permission System

### Permission Types

```typescript
enum PermissionAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE"
}

enum PermissionResource {
  USERS = "USERS",
  ROLES = "ROLES",
  PROJECTS = "PROJECTS",
  TASKS = "TASKS",
  // ... other resources
}
```

### Permission Assignment

Permissions are assigned to roles, not directly to users. This simplifies permission management and provides better scalability.

Example permission assignment:
```typescript
// Admin role permissions
Object.values(PermissionResource).flatMap((resource) =>
  Object.values(PermissionAction).map((action) => ({
    action,
    resource,
  }))
)

// User role permissions
[
  { action: "READ", resource: "PROJECTS" },
  { action: "CREATE", resource: "TASKS" },
  { action: "READ", resource: "TASKS" },
  { action: "UPDATE", resource: "TASKS" },
  { action: "DELETE", resource: "TASKS" },
]
```

## Implementation Details

### Role Creation

Roles are created through Prisma schema:

```prisma
model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  isSystem    Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  permissions Permission[]
  UserRole    UserRole[]
}
```

### Role Assignment

Users can be assigned roles through the UserRole relation:

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
  role      Role     @relation(fields: [roleId], references: [id])

  @@unique([userId, roleId])
}
```

### Role Verification

Role checks are performed in multiple places:

1. **Middleware**:
```typescript
if (req.nextUrl.pathname.startsWith("/admin")) {
  const userRole = token?.role as string | undefined
  if (userRole !== SystemRole.ADMIN) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
}
```

2. **API Routes**:
```typescript
const accessError = await requireAdminAccess()
if (accessError) return accessError
```

3. **Component Level**:
```typescript
if (!isAdminRole(session?.user?.role)) {
  return null // or redirect
}
```

## Planned Enhancements

### Phase 1: Role Management UI
- Role listing page
- Role creation/editing interface
- Permission management UI
- Role assignment interface

### Phase 2: Advanced Features
- Role cloning functionality
- Role templates
- Role analytics and reporting
- Audit logging for role changes

### Phase 3: Permission Enhancements
- Permission groups
- Custom permission rules
- Permission inheritance
- Conflict resolution

## Best Practices

1. **Role Assignment**
   - Assign roles at the most specific context level
   - Use system roles sparingly
   - Document role assignments

2. **Permission Management**
   - Follow principle of least privilege
   - Group related permissions
   - Regular permission audits

3. **Security**
   - Validate roles server-side
   - Log role changes
   - Regular security reviews

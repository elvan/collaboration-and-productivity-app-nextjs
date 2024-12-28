# API Reference

## Authentication

### POST /api/auth/[...nextauth]
NextAuth.js authentication endpoints for login, logout, and session management.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "string"
  },
  "expires": "string"
}
```

## Admin Routes

### GET /api/admin/users
Get a list of users with optional filtering and pagination.

**Query Parameters:**
- `search`: string (optional) - Search by name or email
- `role`: string (optional) - Filter by role
- `page`: number (default: 1)
- `pageSize`: number (default: 10)
- `sortBy`: string (default: "createdAt")
- `sortOrder`: "asc" | "desc" (default: "desc")

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "roles": [
        {
          "id": "string",
          "name": "string",
          "context": {
            "type": "string",
            "id": "string"
          }
        }
      ],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

### GET /api/admin/roles
Get a list of all roles.

**Response:**
```json
{
  "roles": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "isSystem": "boolean",
      "permissions": [
        {
          "action": "string",
          "resource": "string"
        }
      ],
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

### POST /api/admin/roles
Create a new role.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "permissions": [
    {
      "action": "string",
      "resource": "string"
    }
  ]
}
```

### PATCH /api/admin/users
Bulk update users.

**Request Body:**
```json
{
  "userIds": ["string"],
  "action": "string",
  "data": {
    "roleId": "string",
    "status": "string"
  }
}
```

## Error Responses

All API endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "error": "Validation failed",
  "details": {
    "field": ["error message"]
  }
}
```

### 500 Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Authentication

All admin routes require:
1. Valid session token
2. Admin role
3. Appropriate permissions

Include the authentication token in the `Authorization` header:
```
Authorization: Bearer {token}
```

## Pagination

Paginated endpoints return metadata in the response:
```json
{
  "data": [],
  "pagination": {
    "total": "number",
    "page": "number",
    "pageSize": "number",
    "totalPages": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

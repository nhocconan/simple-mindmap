# MindMap Pro

A modern, secure, and scalable mind mapping application with web and mobile support.

## Features

- **Beautiful Mind Maps**: Create stunning visual mind maps with drag-and-drop interface
- **Offline-First Editing**: Edit locally, save when ready - never lose your work
- **Collaboration**: Share mind maps with friends and colleagues
- **User Management**: Complete authentication with JWT tokens
- **Admin Panel**: Manage users, mindmaps, settings, logs, and cache
- **Mobile Ready**: Responsive design with PWA support for iOS/Android
- **Export**: Download mindmaps as PNG or PDF
- **Dark Mode**: Beautiful dark theme support
- **Security**: reCAPTCHA, rate limiting, CORS, helmet protection

## Mindmap Editor Features

- ✅ **Add/Edit Nodes**: Double-click to edit, automatic editing for new nodes
- ✅ **Node Styling**: Customizable node colors (12 options) and text colors (4 options)
- ✅ **Connections**: Easy drag-and-drop connections between nodes
- ✅ **Keyboard Shortcuts**:
  - `Tab`: Add child node
  - `Enter`: Add sibling node
  - `Delete/Backspace`: Delete selected nodes
  - `Ctrl/Cmd+D`: Duplicate selected nodes
  - `Ctrl/Cmd+Z`: Undo
  - `Ctrl/Cmd+Y`: Redo
  - `Ctrl/Cmd+S`: Save
  - `C`: Toggle connection mode
- ✅ **Expand/Collapse**: Collapse node branches for better organization
- ✅ **History**: Undo/Redo support (50 steps)

## Tech Stack

### Backend
- **NestJS** - Scalable Node.js framework
- **PostgreSQL** - Robust relational database
- **Prisma** - Modern ORM with type safety
- **Redis** - Caching and session management
- **JWT** - Secure authentication

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **React Flow** - Mind map visualization
- **Zustand** - State management

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy with rate limiting
- **Docker Compose** - Container orchestration

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)

### Production Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd mindmap-copilot
```

2. Copy environment file and configure:
```bash
cp .env.example .env
# Edit .env with your production values
```

3. Generate secure secrets:
```bash
# Generate JWT secrets
openssl rand -base64 64
```

4. Start with Docker Compose:
```bash
docker-compose up -d --build
```

5. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- Nginx proxy: http://localhost:80

### Default Admin Credentials
- Email: `admin@mindmap.app`
- Password: `Admin@123!`

**⚠️ Change these credentials immediately after first login!**

## Local Development

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, access Swagger documentation at:
- http://localhost:4000/api/docs

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `REDIS_PASSWORD` | Redis password |
| `JWT_SECRET` | JWT signing secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret | - |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | 587 |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |

## Admin Panel Features

Access the admin panel at `/admin` (requires ADMIN role):

- **Dashboard**: Overview statistics and recent activity
- **Users**: Manage user accounts, roles, and status (with pagination and filtering)
- **Mindmaps**: View, edit, and delete all mindmaps (with read-only preview)
- **Settings**: Configure reCAPTCHA, SMTP, cache, and general settings
- **Logs**: View activity logs with filtering and pagination
- **Cache**: Monitor and clear Redis cache

## Security Features

1. **Authentication**
   - JWT with short-lived access tokens (1 hour)
   - Refresh tokens (7 days)
   - Password hashing with bcrypt (12 rounds)

2. **Rate Limiting**
   - API: 100 requests/minute
   - Login: 5 attempts/minute (at Nginx level)

3. **Protection**
   - Helmet security headers
   - CORS configuration
   - Input validation with class-validator
   - SQL injection prevention via Prisma

4. **Optional**
   - Google reCAPTCHA v2/v3
   - Email verification
   - Password reset via email

## Project Structure

```
mindmap-copilot/
├── backend/
│   ├── src/
│   │   ├── admin/          # Admin module (CRUD for all entities)
│   │   ├── auth/           # Authentication
│   │   ├── common/         # Shared services (Redis, email, logging)
│   │   ├── logs/           # Activity logging
│   │   ├── mindmaps/       # Mindmap CRUD
│   │   └── users/          # User management
│   └── prisma/             # Database schema
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   │   ├── admin/      # Admin panel with mindmap viewer
│   │   │   ├── dashboard/  # User dashboard
│   │   │   └── mindmap/    # Mindmap editor
│   │   ├── components/     # React components
│   │   │   ├── mindmap/    # Mindmap node component
│   │   │   └── ui/         # shadcn components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities (API client, auth store)
│   └── public/             # Static assets
├── nginx/                  # Nginx configuration
└── docker-compose.yml      # Container orchestration
```

## Recent Bug Fixes (2025-12-24)

### 1. Node Editing Issue
**Problem**: Could not edit node text after double-clicking or when adding new nodes. Typing had no effect.

**Fix**: Implemented proper state management with `onLabelChange` callback to update ReactFlow nodes. Changed from textarea to input for better focus handling and added proper event propagation stopping.

### 2. Admin Mindmap View
**Problem**: Admin couldn't view user mindmaps - clicking "View" redirected to login page.

**Fix**: Created dedicated admin mindmap view route at `/admin/mindmap/[id]` with read-only access. Admin can now view any user's mindmap without logging in as that user.

### 3. Auto-Save Behavior
**Problem**: Mindmap was saving too frequently with every node interaction, causing performance issues.

**Fix**: Implemented offline-first approach:
- Changes are tracked locally in component state
- History (undo/redo) works offline
- Save only happens when user clicks "Save" button or presses Ctrl/Cmd+S
- Visual indicator shows unsaved changes

### 4. Hard Refresh Auth Issue
**Problem**: Pressing Cmd-R (hard refresh) would redirect to login page even while authenticated.

**Fix**: Created `AuthProvider` component that properly waits for Zustand hydration from localStorage before checking auth state. All protected pages now use `isHydrated` check before redirecting.

### 5. Admin User Password Update
**Problem**: Admin couldn't update user passwords from the admin panel.

**Fix**: Added password field to user edit modal. Password is optional when editing (leave empty to keep current). Validation hints shown for password requirements.

### 6. Missing PWA Icons
**Problem**: Console errors for missing icon-192.png and icon-512.png.

**Fix**: Created placeholder PNG icons in `frontend/public/` directory.

### 7. Missing Forgot Password Page
**Problem**: 404 error when clicking "Forgot password?" link on login page.

**Fix**: Created `/forgot-password` page with email input form and success state UI.

## Mobile Support

The application is built as a Progressive Web App (PWA):

1. **iOS**: Open in Safari → Share → Add to Home Screen
2. **Android**: Chrome will prompt to install, or use Menu → Add to Home Screen

For the best mindmap editing experience, we recommend using a tablet or desktop with a larger screen.

## Scaling

The architecture supports horizontal scaling:

1. **Backend**: Stateless design allows multiple instances behind load balancer
2. **Database**: PostgreSQL supports replication
3. **Cache**: Redis can be clustered
4. **Frontend**: Static export possible for CDN deployment

## Maintenance

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name your_migration_name
```

### Cache Management
Access Admin Panel → Cache tab to view stats and clear cache.

### Logs
- Application logs: `docker-compose logs -f backend frontend`
- Nginx logs: `docker-compose logs -f nginx`
- Activity logs: Available in Admin Panel → Logs tab

## License

MIT License - see LICENSE file for details

---

**Version**: 1.0.0  
**Last Updated**: 2025-12-24

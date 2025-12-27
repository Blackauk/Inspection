# PPM System - Plant & Equipment Maintenance System

A full-stack MVP for tracking plant & equipment maintenance with hierarchy support, scheduled checks, work orders, role-based access control, and offline capabilities. Built to be wrapped as a native mobile app with Capacitor.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend**: Node.js + Fastify + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Offline**: PWA + IndexedDB (idb library)
- **Testing**: Vitest
- **Mobile**: Capacitor-ready (see `docs/mobile-wrap.md`)

## Quick Start (Live Preview)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Database

```bash
npm run db:up
```

### 3. Setup Database

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Everything (API + Web)

```bash
npm run dev
```

This runs both API and Web concurrently. Open your browser:

- **Web App**: http://localhost:5173
- **API Health**: http://localhost:3001/health
- **Health Page**: http://localhost:5173/health

### 5. Login

Use these test accounts:
- **Admin**: `admin@demo.com` / `admin123`
- **Supervisor**: `supervisor@demo.com` / `supervisor123`
- **Fitter**: `fitter@demo.com` / `fitter123`
- **Viewer**: `viewer@demo.com` / `viewer123`

## Project Structure

```
ppm-system/
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # React web application (PWA + Capacitor-ready)
├── packages/
│   └── shared/       # Shared types and Zod schemas
├── docs/
│   └── mobile-wrap.md # Capacitor wrapping guide
├── docker-compose.yml
└── package.json      # Root package.json for monorepo
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (via Docker)

## Detailed Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies (automatic with workspaces)
```

### 2. Start PostgreSQL Database

```bash
npm run db:up
# or
docker-compose up -d
```

This will start PostgreSQL on port 5432 with:
- Database: `ppm_db`
- User: `ppm_user`
- Password: `ppm_password`

### 3. Configure API Environment

Create `apps/api/.env` file:

```env
DATABASE_URL="postgresql://ppm_user:ppm_password@localhost:5432/ppm_db?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
PORT=3001
NODE_ENV=development
```

### 4. Run Database Migrations

```bash
npm run db:migrate
# or
cd apps/api && npm run db:migrate
```

### 5. Seed Database

```bash
npm run db:seed
# or
cd apps/api && npm run db:seed
```

This creates:
- Demo company, project, sites, zones
- Test users (see Quick Start above)
- Sample assets, work orders, schedules, and check templates

### 6. Development Scripts

```bash
# Run both API + Web concurrently (recommended)
npm run dev

# Run individually
npm run dev:api    # API on http://localhost:3001
npm run dev:web    # Web on http://localhost:5173

# Database commands
npm run db:up      # Start PostgreSQL
npm run db:down    # Stop PostgreSQL
npm run db:migrate # Run migrations
npm run db:seed    # Seed data
npm run db:studio  # Open Prisma Studio
```

## Live Preview URLs

After running `npm run dev`:

- **Web App**: http://localhost:5173
- **API Server**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health
- **Web Health Page**: http://localhost:5173/health

## Features

### Multi-Tenant Structure
- Company → Project → Site → Zone hierarchy

### Assets
- Asset hierarchy via `parent_asset_id` (TBM → subsystems → components)
- Automatic code generation: `PREFIX-000001` format
- Status tracking: InUse, OutOfUse, OffHirePending, OffHired, Quarantined
- Categories: Plant | Equipment
- Ownership: Owned | Hired

### Work Orders
- Types: PPM, Inspection, Breakdown, Defect, Calibration, FireSuppression, LOLER, PUWER
- Status workflow: Open → Assigned → InProgress → Completed → ApprovedClosed
- Role-based permissions for status changes

### Scheduled Checks
- Time-based (daily/weekly/monthly) and Hours-based schedules
- Auto-generated occurrences
- Check templates with mixed question types (YesNo, Number, Text)
- Offline-capable submissions

### Role-Based Access Control
- **Viewer**: Read-only access
- **Fitter**: Create jobs, raise issues, update asset status, complete checks, mark work orders Completed
- **Supervisor**: Site-scoped; assign/reassign, approve/close work orders
- **Manager**: All sites; reporting; can approve/close
- **Admin**: Full access; user/site setup; prefix config

### Offline Capabilities
- PWA support
- IndexedDB queue for offline actions
- Automatic sync when back online
- Exponential backoff retry mechanism
- Sync status indicator in UI

## API Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /me` - Get current user

### Assets
- `GET /assets` - List assets (with filters)
- `GET /assets/:id` - Get asset detail
- `GET /assets/:id/hierarchy` - Get asset hierarchy tree
- `POST /assets` - Create asset
- `PATCH /assets/:id/status` - Update asset status

### Work Orders
- `GET /work-orders` - List work orders
- `GET /work-orders/:id` - Get work order detail
- `POST /work-orders` - Create work order
- `PATCH /work-orders/:id/status` - Update status
- `POST /work-orders/:id/assign` - Assign work order
- `POST /work-orders/:id/notes` - Add note

### Checks
- `GET /check-occurrences/due` - Get due check occurrences
- `POST /check-submissions` - Submit check answers
- `GET /check-templates` - List check templates
- `POST /check-templates` - Create check template

### Schedules
- `GET /schedules` - List schedules
- `POST /schedules` - Create schedule
- `POST /schedules/:id/generate-occurrences` - Generate occurrences

## Testing

Run tests:

```bash
# From root
npm test

# Or from specific workspace
cd apps/api
npm test
```

Tests include:
- Asset code generation (sequential increments per prefix)
- Permission checks (supervisor cannot access other sites, manager can access all)

## Development

### Building

```bash
npm run build
```

### Database Management

```bash
# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset
```

## Mobile App Wrapping

The web app is designed to be wrapped as a native mobile app using Capacitor. See `docs/mobile-wrap.md` for detailed instructions.

Quick steps:
1. Install Capacitor: `cd apps/web && npm install @capacitor/core @capacitor/cli`
2. Initialize: `npx cap init`
3. Add platform: `npx cap add android` or `npx cap add ios`
4. Build: `npm run build`
5. Copy: `npx cap copy`
6. Open: `npx cap open android` or `npx cap open ios`

## Production Deployment

### Standard Production Deployment

1. Set environment variables in production
2. Build both apps: `npm run build`
3. Run migrations on production database
4. Start API server: `npm start` (from apps/api)
5. Serve web app static files (from apps/web/dist)

For mobile app:
- Set `VITE_API_URL` to your production API URL
- Build and sync with Capacitor
- Deploy to App Store / Play Store

### Deploy to GitHub Pages

The web app is configured to deploy to GitHub Pages at: **https://blackauk.github.io/PM-System/**

#### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys on every push to the `main` branch.

**GitHub Settings Configuration:**
1. Go to **Settings** → **Pages** in your GitHub repository
2. Under **Source**, select: **GitHub Actions**
3. The workflow will automatically run on push to `main` and deploy to GitHub Pages

**Live URL:** https://blackauk.github.io/PM-System/

#### Manual Deployment

If you prefer to deploy manually:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```
   
   Or from the web app directory:
   ```bash
   cd apps/web
   npm run deploy
   ```

   This will:
   - Build the app (`npm run build`)
   - Deploy the `dist/` folder to the `gh-pages` branch

3. **Configure GitHub Pages:**
   - Go to **Settings** → **Pages** in your GitHub repository
   - Under **Source**, select: **Deploy from a branch**
   - Branch: **gh-pages** (root)

#### Important Notes

- **Routing**: The app uses HashRouter (instead of BrowserRouter) for GitHub Pages compatibility. URLs will look like `https://blackauk.github.io/PM-System/#/dashboard` instead of `https://blackauk.github.io/PM-System/dashboard`. This ensures all routes work correctly, including on page refresh.

- **Base Path**: The app is configured with base path `/PM-System/` for GitHub Pages. This is set in `apps/web/vite.config.ts`.

- **Local Development**: Local development (`npm run dev`) is unaffected and works normally at `http://localhost:5173`.

- **API Backend**: The GitHub Pages deployment is a frontend-only deployment. For a full-stack deployment, you'll need to deploy the API separately and configure `VITE_API_URL`.

## Notes

- File uploads are stored locally in `apps/api/uploads` (can be switched to S3 later)
- Refresh tokens are stored in httpOnly cookies
- Asset code generation uses database transactions for thread-safety
- Offline queue syncs automatically every 30 seconds when online
- API base URL is configurable via `VITE_API_URL` environment variable
- All API calls go through a single `apiClient` wrapper for easy URL switching
- React Router is configured to work in WebView (Capacitor)

## Troubleshooting

### Port already in use
- Change ports in `apps/api/.env` (PORT) and `apps/web/vite.config.ts` (server.port)

### Database connection issues
- Ensure Docker is running: `docker ps`
- Check database is up: `npm run db:up`
- Verify DATABASE_URL in `apps/api/.env`

### CORS errors
- API CORS is configured for `http://localhost:5173` in development
- For mobile testing, update CORS origin in `apps/api/src/index.ts`

### Build errors
- Run `npm install` in root and each workspace
- Clear node_modules and reinstall if needed

## License

MIT



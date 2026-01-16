# Binaural Sleep App

## Overview

A sleep-focused web application that generates binaural beat audio for brainwave entrainment. Users select pre-defined sleep programs that guide them through multiple stages (relaxation, deep sleep, etc.) using scientifically-designed frequency progressions. The app uses the Web Audio API to generate real-time binaural beats with different frequencies in each ear, along with animated visualizations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme optimized for sleep/nighttime use
- **Animations**: Framer Motion for page transitions and UI animations
- **Audio**: Native Web Audio API (AudioContext) for pure binaural beat generation
- **Visualizations**: HTML5 Canvas API for real-time wave/orb animations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation
- **Build Process**: esbuild for server bundling, Vite for client bundling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema**: Two main tables - `programs` (sleep programs) and `sleep_stages` (frequency stages within programs)
- **Migrations**: Drizzle Kit for schema management (`npm run db:push`)

### Key Data Model
Sleep programs contain multiple stages, each defining:
- Carrier frequency (left ear base tone)
- Binaural beat frequency (difference between ears)
- Duration in seconds
- Start/end frequencies for gradual transitions

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including audio controls, visualizer
    hooks/        # Custom hooks (audio engine, data fetching)
    pages/        # Route pages (Home, Player)
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle schema definitions
  routes.ts       # API route type definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### Frontend Libraries
- **@tanstack/react-query**: Async state management and caching
- **Radix UI**: Accessible component primitives (dialogs, sliders, tooltips, etc.)
- **Framer Motion**: Animation library for smooth transitions
- **Lucide React**: Icon library
- **Zod**: Runtime type validation shared between client and server

### Build Tools
- **Vite**: Frontend dev server and bundler with HMR
- **esbuild**: Fast server-side bundling for production
- **tsx**: TypeScript execution for development
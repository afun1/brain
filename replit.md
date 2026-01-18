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

### Unified Console Interface
The app uses a single-page console with four tabbed modes:

1. **Custom Mode** - Manual frequency adjustment
   - Carrier (Solfeggio) frequency: 60-1000 Hz with presets (174, 285, 396, 417, 432, 528, 639, 741, 852, 963 Hz)
   - Binaural beat frequency: 0.5-40 Hz with presets (0.5, 1, 2, 4, 6, 8, 10, 12 Hz)
   - Swap carrier between left/right ear
   - Real-time frequency adjustment while audio is playing
   - Individual left/right channel controls to mute channels and experience single tones

2. **Learning Mode** - Meditation/focus enhancement
   - Target state selection: Alpha (8-12 Hz) or Theta (4-8 Hz)
   - Optional wind-down phase: gradual transition from beta (15 Hz) to alpha
   - Duration options: 10, 15, 20, 30, 45, or 60 minutes
   - Dynamically generated stages based on settings
   - Progress tracking with current stage display
   - **Text-to-Speech Learning**: Paste text from books/articles, convert to audio via OpenAI TTS, play at accelerated speeds (0.5x-10x) for enhanced learning during alpha/theta states

3. **Daytime Mode** - Focus/alertness enhancement for active use
   - Target state selection: Beta (15-30 Hz) for focus or Gamma (30+ Hz) for peak flow
   - Optional ramp-up phase: gradual transition from low beta (12 Hz) to target
   - Duration options for work sessions: 15, 25, 45, 60, 90, or 120 minutes
   - Beta mode: steady 20 Hz for sustained concentration
   - Gamma mode: alternating 40-42 Hz across stages for engagement
   - Mode switching automatically stops other audio engines to prevent overlap

4. **Sleep Programs** - Pre-built sleep journeys
   - **8-Hour Full Night Rest** - Customizable carrier frequencies
     - 10 user-defined frequency slots (60-1000 Hz)
     - Frequencies cycle every ~48 minutes across the 8-hour program
     - "Fill Solfeggio" preset loads all 10 Solfeggio frequencies
     - Settings saved to localStorage for persistence
   - **8-Hour Solfeggio Healing Cycles** - Preset Solfeggio frequencies mapped to 5 sleep cycles
   - Optional 15-minute beta wake-up sequence
   - Multi-stage frequency progressions with gradual transitions

### Audio Players
Three independent audio players for ambient sound:

1. **Background Music Player**
   - Load audio files via drag-drop or file picker
   - Playlist management with reordering
   - A=440Hz / A=432Hz tuning toggle
   - Loop and shuffle modes
   - Export playlists as .m3u or .pls files

2. **Affirmations Player**
   - All features from Background Music player
   - Audio Recording via MediaRecorder API
   - Subliminal Track Conversion (1-20% volume, default 5%)
   - Recorded affirmations saved as WAV files
   - Note: Recordings persist in browser session only (lost on refresh)

3. **Stereo Confusion Player**
   - Dual playlist system for left and right audio channels
   - Web Audio API with StereoPannerNode for proper stereo routing (pan -1 left, pan +1 right)
   - Independent file uploads for each ear
   - Per-channel volume controls plus master volume
   - Synchronized playback controls (play/pause/seek/next/prev)
   - Loop mode for continuous playback
   - Creates "stereo confusion" effect by playing different content in each ear

### Solfeggio Frequencies (used in 8-Hour program)
| Frequency | Chakra/Purpose |
|-----------|----------------|
| 174 Hz | Foundation - Security & Stability |
| 285 Hz | Healing - Tissue & Cell Restoration |
| 396 Hz | Root Chakra - Release Fear/Guilt |
| 417 Hz | Sacral - Break Negative Patterns |
| 432 Hz | Universal Harmony - Natural Tuning |
| 528 Hz | Love Frequency - DNA Repair |
| 639 Hz | Heart Chakra - Relationships |
| 741 Hz | Throat - Clarity & Awakening |
| 852 Hz | Third Eye - Intuition |
| 963 Hz | Crown Chakra - Cosmic Connection |

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including audio controls, visualizer
    hooks/        # Custom hooks (audio engine, data fetching)
    pages/        # Route pages (Home, Player, Custom)
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
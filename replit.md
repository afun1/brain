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
- Start/end frequencies for quick transitions (~60 seconds) then hold

### Audio Engine Behavior
- **Quick Transitions**: Frequency changes occur over ~60 seconds (or 1/3 of short stages)
- **Hold Steady**: After transition, frequencies hold at target for remainder of stage
- **Rationale**: Long gradual ramps (10-30 min) felt sluggish; quick transitions let users experience target frequencies sooner without jarring jumps

### Unified Console Interface
The app uses a single-page console with five tabbed modes:

1. **Custom Mode** - Manual frequency adjustment with two sub-modes:
   
   **Simple Mode:**
   - Carrier (Solfeggio) frequency: 60-1000 Hz with presets (174, 285, 396, 417, 432, 528, 639, 741, 852, 963 Hz)
   - Binaural beat frequency: 0.5-40 Hz with presets (0.5, 1, 2, 4, 6, 8, 10, 12 Hz)
   - Swap carrier between left/right ear
   - Real-time frequency adjustment while audio is playing
   - Individual left/right channel controls to mute channels and experience single tones
   
   **Progression Builder:**
   - Build custom frequency progressions with up to 20 slots
   - Each slot defines: Left Hz, Right Hz, and Duration (minutes)
   - Auto-calculates beat frequency (difference) and shows brain wave type (Delta/Theta/Alpha/Beta/Gamma)
   - Reorder slots with up/down buttons
   - Enable/disable individual slots without deleting
   - Duplicate slots to create variations
   - Save progressions to browser storage with custom names
   - Load previously saved progressions
   - Export progressions as JSON files for backup/sharing
   - Import progressions from JSON files
   - Real-time playback with current slot indicator and elapsed time display

2. **Learning Mode** - Meditation/focus enhancement
   - Target state selection: Alpha (8-12 Hz) or Theta (4-8 Hz)
   - Optional wind-down phase: gradual transition from beta (15 Hz) to alpha
   - Duration options: 10, 15, 20, 30, 45, or 60 minutes
   - Dynamically generated stages based on settings
   - Progress tracking with current stage display
   - **PDF Reader with Multiple Reading Modes**: 
     - Load PDF books/documents via drag-drop or file picker
     - Page navigation and zoom controls
     - **Word Lookup**: Click any word to see its definition
       - Uses free dictionary API (dictionaryapi.dev)
       - Shows phonetic pronunciation, part of speech, definitions
       - Audio pronunciation playback when available
       - Example sentences and synonyms
     - **TTS Read Mode**: 
       - Reads aloud with synchronized word highlighting (flash, not slide)
       - Adjustable read speed (0.5x-5x) for dyslexia support
       - Auto-advances pages as reading progresses
     - **RSVP Mode (Rapid Serial Visual Presentation)**:
       - Words flash center-screen at speeds from 100-3000 WPM
       - Chunk size options (1-5 words at a time)
       - Eliminates eye movement for faster reading
     - **Page Flash Mode (PhotoReading/Subliminal)**:
       - Auto-flips pages at configurable speed (0.1-3 seconds per page)
       - For peripheral vision absorption in Alpha/Theta state
       - Based on PhotoReading Whole Mind System techniques
     - Alpha state (10 Hz) recommended for reading with eyes open (research-backed)
   - **Text-to-Speech Learning**: Paste text from books/articles, convert to audio via OpenAI TTS, play at accelerated speeds (0.5x-10x) for enhanced learning during alpha/theta states
   - **Language Learning** - Bilingual audio learning with translation
     - Paste text in English to translate into any of 24+ languages
     - Supported languages: Spanish, French, German, Italian, Portuguese, Dutch, Russian, Chinese (Simplified/Traditional), Japanese, Korean, Arabic, Hindi, Hebrew, Turkish, Polish, Vietnamese, Thai, Greek, Swedish, Norwegian, Danish, Finnish, Czech
     - Sentence-by-sentence audio playback: hear foreign language first, then English translation
     - Configurable pause between sentences (0.5-5 seconds) for repetition practice
     - Playback speed control (0.5x-3x) for pronunciation learning
     - 6 voice options (Alloy, Echo, Fable, Onyx, Nova, Shimmer) via OpenAI TTS
     - Visual highlighting shows which sentence is playing (original vs translation)
     - Voice selection clears cached audio to ensure playback matches selected voice
     - Backend translation API using GPT-4o-mini with sentence-level processing

3. **Healing Mode** - Deep delta frequencies for cellular repair and recovery
   - Target state selection: 
     - Restoration (3 Hz) - General recovery and immune support
     - Deep Healing (1.5 Hz) - Maximum tissue repair and regeneration
     - Pain Relief (2 Hz) - Cortisol reduction and pain management
   - Optional wind-down phase: Alpha (10 Hz) → Theta (6 Hz) → Target delta
   - Duration options: 30, 45, 60, 90, or 120 minutes
   - **10-slot Carrier Frequency System** (like Sleep Mode)
     - User-defined Solfeggio frequencies (60-1000 Hz)
     - Per-slot duration controls
     - "Fill Solfeggio" preset for all 10 healing frequencies
     - Visual time coverage meter
   - **10-slot Brainwave Frequency System**
     - User-defined delta frequencies (0.5-4 Hz)
     - Per-slot duration controls
     - "Fill Delta" preset cycles through therapeutic delta range
     - Delta presets: 0.5 (Ultra Deep), 1-2 (Deep Delta), 2-3 (Recovery/Restoration), 3-4 (Immune/Theta Edge)
   - Based on 2024 research: minimum 20-30 min sessions, 7+ days for measurable benefits
   - Settings persisted to localStorage

4. **Daytime Mode** - Focus/alertness enhancement for active use
   - **Focus Modes**:
     - Beta (20 Hz) - Sustained concentration for focused work
     - Gamma (40-42 Hz) - Peak flow state, alternating for engagement
   - **Workout Modes** (research-backed):
     - Pre-Workout (15-25 Hz) - Progressive energy build-up before exercise
     - Cardio (22 Hz) - Sustained beta for endurance activities
     - HIIT/Strength (38-40 Hz) - Alternating high/low intensity intervals
     - Recovery (10 Hz) - Alpha waves for between sets or cooldown
   - Optional ramp-up phase: gradual transition from low beta (12 Hz) to target
   - Duration options for work/workout sessions: 15, 25, 45, 60, 90, or 120 minutes
   - Mode switching automatically stops other audio engines to prevent overlap

5. **Sleep Programs** - Pre-built sleep journeys
   - **Click-to-Seek Hypnogram** - Click anywhere on the sleep chart to jump to that point in the program
   - **Dynamic Sleep Duration** - 5h to 10h options based on circadian rhythm research
     - Each duration maps to optimal sleep cycles (3-6 cycles)
     - All durations end in true REM state (9 Hz) for refreshed wake-up from dreams
     - "Final REM (Dreams)" stage (10 min at 9 Hz) ensures user wakes from dream state, not theta
     - Stage durations scaled proportionally to selected duration
     - Settings persisted to localStorage
   - **8-Hour Full Night Rest** - Customizable carrier frequencies
     - 10 user-defined frequency slots (60-1000 Hz, blank by default)
     - Fully dynamic frequency input: type any number directly (validated on blur)
     - Per-slot duration control in minutes (blank by default for easy entry)
     - Visual time coverage meter showing colored segments as percentage of selected duration
     - "Clear All" button resets both frequencies and durations to blank
     - "Fill Solfeggio" preset loads all 10 Solfeggio frequencies with equal durations
     - Settings saved to localStorage for persistence
   - **8-Hour Solfeggio Healing Cycles** - Preset Solfeggio frequencies mapped to 5 sleep cycles
   - Optional 17-minute beta wake-up sequence (+17 min added after base sleep duration)
     - Gentle "Dream Fade" REM→Alpha transition (2 min, 9→10 Hz)
     - Progressive beta increase: Low Beta (10→14), Mid Beta (14→18), Alert (18→20 Hz)
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
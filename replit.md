# Binaural Sleep App

## Overview

The Binaural Sleep App is a web-based application designed to enhance sleep quality, focus, and overall well-being through the generation of real-time binaural beat audio. It utilizes scientifically designed frequency progressions for brainwave entrainment, guiding users through various mental states from relaxation and deep sleep to focused work and meditative states. The application features multiple modes for custom audio generation, learning, healing, daytime focus, and pre-built sleep programs, all supported by animated visualizations and independent ambient audio players. The project aims to provide a comprehensive, personalized sound therapy experience leveraging the Web Audio API for high-fidelity audio generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for server state, React hooks for local state.
- **UI Components**: shadcn/ui built on Radix UI, styled with Tailwind CSS (dark theme optimized for night use).
- **Animations**: Framer Motion for UI transitions.
- **Audio Generation**: Native Web Audio API for real-time binaural beat generation.
- **Visualizations**: HTML5 Canvas API for dynamic animations.

### Backend Architecture
- **Runtime**: Node.js with Express.
- **Language**: TypeScript with ESM modules.
- **API Design**: RESTful endpoints with Zod validation.
- **Build Process**: esbuild for server, Vite for client.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM.
- **Schema**: `programs`, `sleep_stages`, and `beta_feedback` tables.
- **Migrations**: Drizzle Kit for schema management.

### Feature Specifications
- **Unified Console Interface**: Five tabbed modes:
    - **Custom Mode**: Manual frequency adjustment (Simple Mode) and progression builder (Progression Builder) with up to 20 slots, save/load/export functionality, and real-time playback.
    - **Learning Mode**: Target state selection (Alpha/Theta), duration options, PDF reader with Word Lookup, TTS Read Mode (with synchronized highlighting and speed control), RSVP Mode (Rapid Serial Visual Presentation), Page Flash Mode, Text-to-Speech learning (via OpenAI TTS), and Language Learning (bilingual audio with translation via GPT-4o-mini).
    - **Healing Mode**: Target state selection (Restoration, Deep Healing, Pain Relief), duration options, 10-slot Carrier Frequency System, and 10-slot Brainwave Frequency System with predefined delta presets.
    - **Daytime Mode**: Focus Modes (Beta/Gamma) and Workout Modes (Pre-Workout, Cardio, HIIT/Strength, Recovery) with optional ramp-up phases and duration controls.
    - **Sleep Programs**: Pre-built sleep journeys with click-to-seek hypnogram, dynamic sleep duration (5h-10h), optional Pre-Sleep Wind-Down, Pre-Wake Delta Boost, and Beta Wake-Up sequences. Includes 8-Hour Full Night Rest with customizable carrier frequencies and 8-Hour Solfeggio Healing Cycles.
- **Audio Engine Behavior**: Quick transitions (approx. 60 seconds) then hold steady at target frequencies.
- **Independent Audio Players**:
    - **Background Music Player**: Supports drag-drop audio, playlist management, A=440Hz/A=432Hz tuning, loop/shuffle, and playlist export.
    - **Affirmations Player**: Includes all Background Music player features, plus audio recording (MediaRecorder API), subliminal track conversion, and WAV file saving (browser session only).
    - **Stereo Confusion Player**: Dual playlist system for left and right channels with independent file uploads, per-channel volume controls, and synchronized playback using StereoPannerNode.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Drizzle ORM**: For database interactions.
- **@tanstack/react-query**: For async state management.
- **Radix UI**: For accessible UI components.
- **Framer Motion**: For animations.
- **Lucide React**: For icons.
- **Zod**: For runtime type validation.
- **Vite**: Frontend build tool.
- **esbuild**: Backend build tool.
- **tsx**: TypeScript execution for development.
- **OpenAI TTS API**: For Text-to-Speech functionality.
- **GPT-4o-mini**: For backend translation services.
- **dictionaryapi.dev**: For word lookup in Learning Mode.
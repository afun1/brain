# Brain Entrainer 🧠

Advanced binaural beat audio therapy application for sleep optimization, focus enhancement, and healing through scientifically-designed brainwave entrainment.

![Brain Entrainer](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)

## ✨ Features

### 🎵 Audio Modes

- **Custom Mode**: Manual frequency control or progression builder with up to 30 customizable slots
- **Sleep Programs**: Pre-built 5-10 hour sleep journeys with dynamic hypnograms
- **Learning Mode**: Study enhancement with Alpha/Theta states, PDF reader, TTS, and language learning
- **Healing Mode**: Restoration protocols using delta frequencies and Solfeggio tones
- **Daytime Mode**: Focus (Beta/Gamma) and workout optimization modes

### 🎧 Independent Audio Players

- **Background Music Player**: Playlist management with A=440Hz/A=432Hz tuning
- **Affirmations Player**: Record, convert to subliminal tracks, and export
- **Stereo Confusion Player**: Dual-channel playlist system for advanced entrainment

### 🌐 Community Features

- **Community Library**: Share and download custom progressions
- **Rating System**: 5-star ratings and download tracking
- **Anonymous Sharing**: Optional attribution for privacy

### 🔧 Technical Highlights

- Real-time binaural beat generation using Web Audio API
- Dynamic frequency progressions with smooth transitions
- Canvas-based wave visualizations
- Progressive Web App (PWA) with offline support
- Dark theme optimized for nighttime use

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- OpenAI API key (for TTS and translation features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/brain-entrainer.git
cd brain-entrainer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

## 📋 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/brain_entrainer

# Session Secret
SESSION_SECRET=your-secure-random-string-here

# OpenAI (for TTS and translation)
OPENAI_API_KEY=sk-your-openai-api-key

# Replit Auth (optional)
REPLIT_DEPLOYMENT=false
```

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **Tailwind CSS** + **shadcn/ui** for beautiful UI
- **Framer Motion** for smooth animations
- **TanStack Query** for server state management
- **Wouter** for lightweight routing

### Backend
- **Node.js** + **Express**
- **PostgreSQL** with **Drizzle ORM**
- **OpenAI API** for TTS and GPT-4o-mini
- **Web Audio API** for real-time audio synthesis

## 📦 Build & Deploy

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The `vercel.json` configuration is already set up for seamless deployment.

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type check
npm run typecheck    # Type check without emitting
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
npm run db:push      # Push database schema
npm run db:studio    # Open Drizzle Studio
```

### Project Structure

```
brain-entrainer/
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
│   └── public/          # Static assets
├── server/              # Backend Express app
│   ├── routes.ts        # API routes
│   ├── db.ts           # Database connection
│   └── replit_integrations/ # External integrations
├── shared/              # Shared types and schemas
└── script/              # Build scripts
```

## 🧪 Testing

Testing infrastructure coming soon! Contributions welcome.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Binaural beat research and frequency protocols
- shadcn/ui for beautiful UI components
- The open-source community

## 📧 Support

For support, please open an issue on GitHub or contact the maintainers.

## ⚠️ Disclaimer

This application is for informational and experimental purposes only. Binaural beats are not a substitute for professional medical advice, diagnosis, or treatment. Consult with qualified healthcare professionals for medical concerns.

---

Built with ❤️ for better sleep, focus, and well-being.

import { useRoute } from "wouter";
import { useProgram } from "@/hooks/use-programs";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioControls } from "@/components/AudioControls";
import { Loader2, Moon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PlayerPage() {
  const [, params] = useRoute("/program/:id");
  const programId = parseInt(params?.id || "0");
  const { data: program, isLoading, error } = useProgram(programId);

  // Audio Hook
  const audio = useAudioEngine(program?.stages || []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-light tracking-widest text-sm">LOADING FREQUENCIES...</p>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-display text-white">Signal Lost</h2>
          <p className="text-muted-foreground">Unable to load the sleep program.</p>
        </div>
      </div>
    );
  }

  // Calculate current stage name based on elapsed time
  let currentStageName = "Preparing...";
  let timeScanner = 0;
  for (const stage of program.stages) {
    if (audio.elapsedTime >= timeScanner && audio.elapsedTime < timeScanner + stage.durationSeconds) {
      currentStageName = stage.name;
      break;
    }
    timeScanner += stage.durationSeconds;
  }
  if (audio.elapsedTime >= audio.totalDuration && audio.totalDuration > 0) {
    currentStageName = "Session Complete";
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center">
      
      {/* Background Visualizer */}
      <WaveVisualizer isPlaying={audio.isPlaying} beatFrequency={audio.currentBeat} />
      
      {/* Header Info */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute top-8 left-0 right-0 z-10 flex flex-col items-center text-center px-4"
      >
        <div className="flex items-center gap-2 mb-2 text-primary/80">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs tracking-[0.2em] uppercase font-semibold">Binaural Therapy</span>
          <Sparkles className="w-4 h-4" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-white mb-2 text-glow">
          {program.name}
        </h1>
        <p className="text-muted-foreground font-light max-w-md mx-auto">
          {program.description}
        </p>
      </motion.div>

      {/* Center Stage Info */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full px-4 mb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageName}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-breathe">
              <Moon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white/90 tracking-wide">
              {currentStageName}
            </h2>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground/60 font-mono">
              <span>{Math.round(audio.currentBeat * 10) / 10} Hz Beat</span>
              <span>•</span>
              <span>{Math.round(audio.currentCarrier)} Hz Carrier</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Controls */}
      <AudioControls 
        isPlaying={audio.isPlaying}
        onTogglePlay={audio.togglePlay}
        volume={audio.volume}
        onVolumeChange={audio.setVolume}
        currentTime={audio.elapsedTime}
        totalDuration={audio.totalDuration}
        currentCarrier={audio.currentCarrier}
        currentBeat={audio.currentBeat}
      />
    </div>
  );
}

import { Play, Pause, Volume2, SkipBack, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";
import { motion } from "framer-motion";

interface AudioControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  currentTime: number;
  totalDuration: number;
  currentCarrier: number;
  currentBeat: number;
}

export function AudioControls({
  isPlaying,
  onTogglePlay,
  volume,
  onVolumeChange,
  currentTime,
  totalDuration,
  currentCarrier,
  currentBeat
}: AudioControlsProps) {
  
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 md:p-8 z-20">
      <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        
        {/* Frequency Info Display */}
        <div className="flex justify-between items-center text-xs md:text-sm font-mono text-muted-foreground/80 px-2">
          <div className="flex flex-col items-center">
            <span className="text-primary font-bold">{Math.round(currentCarrier)} Hz</span>
            <span>Left Ear (Carrier)</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex flex-col items-center">
            <span className="text-accent font-bold animate-pulse">{currentBeat.toFixed(1)} Hz</span>
            <span>Binaural Beat</span>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2" />
          <div className="flex flex-col items-center">
            <span className="text-primary font-bold">{Math.round(currentCarrier + currentBeat)} Hz</span>
            <span>Right Ear</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${progress}%` }}
              layoutId="progress"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-3 w-32 group">
            <Volume2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-secondary rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
          </div>

          {/* Main Play Button */}
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white transition-colors hover:bg-transparent"
              onClick={() => {}} // Reset not implemented for simplicity
              disabled
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTogglePlay}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_40px_rgba(167,139,250,0.3)] hover:shadow-[0_0_60px_rgba(167,139,250,0.5)] transition-shadow"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-primary-foreground fill-current" />
              ) : (
                <Play className="w-8 h-8 text-primary-foreground fill-current ml-1" />
              )}
            </motion.button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-white transition-colors hover:bg-transparent"
            >
              <Info className="w-6 h-6" />
            </Button>
          </div>

          <div className="w-32" /> {/* Spacer for balance */}
        </div>
      </div>
    </div>
  );
}


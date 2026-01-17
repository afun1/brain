import { useState } from "react";
import { usePrograms } from "@/hooks/use-programs";
import { useCustomAudio } from "@/hooks/use-custom-audio";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioFilePlayer } from "@/components/AudioFilePlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, Volume2, Sliders, Music, Headphones, 
  ArrowLeftRight, Moon, SkipForward, SkipBack 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { SleepStage } from "@shared/schema";

const SOLFEGGIO_PRESETS = [
  { freq: 174, label: "174", name: "Foundation" },
  { freq: 285, label: "285", name: "Healing" },
  { freq: 396, label: "396", name: "Root" },
  { freq: 417, label: "417", name: "Sacral" },
  { freq: 432, label: "432", name: "Harmony" },
  { freq: 528, label: "528", name: "Love" },
  { freq: 639, label: "639", name: "Heart" },
  { freq: 741, label: "741", name: "Throat" },
  { freq: 852, label: "852", name: "Third Eye" },
  { freq: 963, label: "963", name: "Crown" },
];

const BEAT_PRESETS = [
  { freq: 0.5, label: "0.5", name: "Deep Delta" },
  { freq: 1, label: "1", name: "Delta" },
  { freq: 2, label: "2", name: "Delta" },
  { freq: 4, label: "4", name: "Theta" },
  { freq: 6, label: "6", name: "Theta" },
  { freq: 8, label: "8", name: "Alpha" },
  { freq: 10, label: "10", name: "Alpha" },
  { freq: 12, label: "12", name: "Beta" },
];

type Mode = "custom" | "program";

export default function ConsolePage() {
  const { data: programs } = usePrograms();
  const customAudio = useCustomAudio();
  const [mode, setMode] = useState<Mode>("custom");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  
  const selectedProgram = programs?.find(p => p.id === selectedProgramId);
  const programAudio = useAudioEngine(selectedProgram?.stages as SleepStage[] || []);

  const isPlaying = mode === "custom" ? customAudio.isPlaying : programAudio.isPlaying;
  const beatFreq = mode === "custom" ? customAudio.beatFreq : programAudio.currentBeat;

  const getCurrentStageName = () => {
    if (!selectedProgram || mode !== "program") return "";
    let timeScanner = 0;
    for (const stage of selectedProgram.stages) {
      if (programAudio.elapsedTime >= timeScanner && programAudio.elapsedTime < timeScanner + stage.durationSeconds) {
        return stage.name;
      }
      timeScanner += stage.durationSeconds;
    }
    if (programAudio.elapsedTime >= programAudio.totalDuration && programAudio.totalDuration > 0) {
      return "Complete";
    }
    return "Ready";
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgramSelect = (programId: number) => {
    if (programAudio.isPlaying) {
      programAudio.togglePlay();
    }
    setSelectedProgramId(programId);
    setMode("program");
  };

  const handleTogglePlay = () => {
    if (mode === "custom") {
      customAudio.togglePlay();
    } else {
      programAudio.togglePlay();
    }
  };

  const handleVolumeChange = (val: number) => {
    if (mode === "custom") {
      customAudio.setVolume(val);
    } else {
      programAudio.setVolume(val);
    }
  };

  const currentVolume = mode === "custom" ? customAudio.volume : programAudio.volume;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <WaveVisualizer isPlaying={isPlaying} beatFrequency={beatFreq} />

      <header className="relative z-10 flex items-center justify-center gap-3 p-4 border-b border-white/10">
        <Moon className="w-5 h-5 text-primary" />
        <span className="text-sm tracking-widest uppercase font-semibold text-primary/80">Binaural Sleep Console</span>
      </header>

      <main className="flex-1 relative z-10 flex flex-col px-4 py-4 pb-48 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="custom" className="gap-2" data-testid="tab-custom">
                <Sliders className="w-4 h-4" />
                Custom Mode
              </TabsTrigger>
              <TabsTrigger value="program" className="gap-2" data-testid="tab-program">
                <Headphones className="w-4 h-4" />
                Sleep Programs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`p-3 rounded-xl border ${customAudio.carrierSide === 'left' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'left' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-left-freq">
                      {customAudio.leftFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground">Left</div>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="text-xl font-bold text-accent animate-pulse" data-testid="text-beat-freq">
                      {customAudio.beatFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground">Beat</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${customAudio.carrierSide === 'right' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'right' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-right-freq">
                      {customAudio.rightFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground">Right</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => customAudio.setCarrierSide(customAudio.carrierSide === 'left' ? 'right' : 'left')}
                    className="gap-2"
                    data-testid="button-swap-sides"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Swap to {customAudio.carrierSide === 'left' ? 'Right' : 'Left'}
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-white">Carrier (Solfeggio)</label>
                    <span className="text-xs text-muted-foreground font-mono">{customAudio.carrierFreq} Hz</span>
                  </div>
                  <Slider
                    value={[customAudio.carrierFreq]}
                    onValueChange={([val]) => customAudio.setCarrierFreq(val)}
                    min={60}
                    max={1000}
                    step={1}
                    className="mb-2"
                    data-testid="slider-carrier"
                  />
                  <div className="flex flex-wrap gap-1">
                    {SOLFEGGIO_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={customAudio.carrierFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => customAudio.setCarrierFreq(preset.freq)}
                        className="text-xs px-2 h-7"
                        data-testid={`button-preset-carrier-${preset.freq}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-white">Binaural Beat</label>
                    <span className="text-xs text-muted-foreground font-mono">{customAudio.beatFreq} Hz</span>
                  </div>
                  <Slider
                    value={[customAudio.beatFreq]}
                    onValueChange={([val]) => customAudio.setBeatFreq(val)}
                    min={0.5}
                    max={40}
                    step={0.5}
                    className="mb-2"
                    data-testid="slider-beat"
                  />
                  <div className="flex flex-wrap gap-1">
                    {BEAT_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={customAudio.beatFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => customAudio.setBeatFreq(preset.freq)}
                        className="text-xs px-2 h-7"
                        data-testid={`button-preset-beat-${preset.freq}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="program" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {programs?.map((program) => (
                    <Button
                      key={program.id}
                      variant={selectedProgramId === program.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleProgramSelect(program.id)}
                      className="text-xs h-auto py-2 flex flex-col items-start text-left"
                      data-testid={`button-program-${program.id}`}
                    >
                      <span className="font-semibold">{program.name}</span>
                      {program.isDefault && (
                        <span className="text-[10px] opacity-70">Recommended</span>
                      )}
                    </Button>
                  ))}
                </div>

                {selectedProgram && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedProgram.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="text-center py-4">
                        <h3 className="text-lg font-display text-white mb-1">{selectedProgram.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3">{selectedProgram.description}</p>
                        
                        <div className="flex items-center justify-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xl font-bold text-accent" data-testid="text-current-stage">
                              {getCurrentStageName()}
                            </div>
                            <div className="text-xs text-muted-foreground">Current Stage</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTime(programAudio.elapsedTime)}</span>
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${programAudio.totalDuration > 0 ? (programAudio.elapsedTime / programAudio.totalDuration) * 100 : 0}%` }}
                          />
                        </div>
                        <span>{formatTime(programAudio.totalDuration)}</span>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                        <span>{Math.round(programAudio.currentBeat * 10) / 10} Hz Beat</span>
                        <span>•</span>
                        <span>{Math.round(programAudio.currentCarrier)} Hz Carrier</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {!selectedProgram && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Select a sleep program above
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-4">
            <AudioFilePlayer 
              title="Background Music" 
              icon="music" 
              storageKey="playlist:music"
              testIdPrefix="music-player"
            />
            <AudioFilePlayer 
              title="Affirmations" 
              icon="affirmation" 
              storageKey="playlist:affirmations"
              testIdPrefix="affirmation-player"
            />
          </div>

          <div className="glass-panel rounded-xl p-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong className="text-white">Delta (0.5-4 Hz):</strong> Deep sleep, healing</p>
              <p><strong className="text-white">Theta (4-8 Hz):</strong> Meditation, REM</p>
              <p><strong className="text-white">Alpha (8-12 Hz):</strong> Relaxation</p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
        <div className="max-w-xl mx-auto glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[currentVolume]}
              onValueChange={([val]) => handleVolumeChange(val)}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              data-testid="slider-volume"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleTogglePlay}
            disabled={mode === "program" && !selectedProgram}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_30px_rgba(167,139,250,0.3)] hover:shadow-[0_0_50px_rgba(167,139,250,0.5)] transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground fill-current" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground fill-current ml-0.5" />
            )}
          </motion.button>

          <div className="flex-1 flex justify-end">
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-mono" data-testid="text-mode-indicator">
                {mode === "custom" ? "Custom" : selectedProgram?.name || "Program"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

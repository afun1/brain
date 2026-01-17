import { useState, useMemo } from "react";
import { usePrograms } from "@/hooks/use-programs";
import { useCustomAudio } from "@/hooks/use-custom-audio";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioFilePlayer } from "@/components/AudioFilePlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, Volume2, Sliders, Headphones, 
  ArrowLeftRight, Moon, Brain, Timer
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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

type Mode = "custom" | "program" | "learning";
type LearningTarget = "alpha" | "theta";

const DURATION_OPTIONS = [
  { minutes: 10, label: "10 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 20, label: "20 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 hour" },
];

export default function ConsolePage() {
  const { data: programs } = usePrograms();
  const customAudio = useCustomAudio();
  const [mode, setMode] = useState<Mode>("custom");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  
  // Learning Mode state
  const [learningTarget, setLearningTarget] = useState<LearningTarget>("alpha");
  const [learningDuration, setLearningDuration] = useState(20); // minutes
  const [includeWindDown, setIncludeWindDown] = useState(true);
  
  const selectedProgram = programs?.find(p => p.id === selectedProgramId);
  const programAudio = useAudioEngine(selectedProgram?.stages as SleepStage[] || []);
  
  // Generate learning mode stages dynamically
  const learningStages = useMemo((): SleepStage[] => {
    const stages: SleepStage[] = [];
    const totalSeconds = learningDuration * 60;
    const windDownSeconds = includeWindDown ? Math.min(300, totalSeconds * 0.15) : 0; // 5 min or 15% max
    const mainSeconds = totalSeconds - windDownSeconds;
    
    // Wind-down phase: from beta (15Hz) to alpha (10Hz)
    if (includeWindDown && windDownSeconds > 0) {
      stages.push({
        id: 1,
        programId: 0,
        name: "Wind Down",
        startBeatFreq: 15,
        endBeatFreq: 10,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(windDownSeconds),
        order: 1,
      });
    }
    
    if (learningTarget === "alpha") {
      // Stay in alpha (8-12Hz, targeting 10Hz)
      stages.push({
        id: 2,
        programId: 0,
        name: "Alpha State",
        startBeatFreq: 10,
        endBeatFreq: 10,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(mainSeconds),
        order: 2,
      });
    } else {
      // Go to theta: transition from alpha to theta
      const transitionSeconds = Math.min(180, mainSeconds * 0.2); // 3 min or 20% max
      const thetaSeconds = mainSeconds - transitionSeconds;
      
      stages.push({
        id: 2,
        programId: 0,
        name: "Alpha to Theta",
        startBeatFreq: 10,
        endBeatFreq: 6,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(transitionSeconds),
        order: 2,
      });
      
      stages.push({
        id: 3,
        programId: 0,
        name: "Deep Theta",
        startBeatFreq: 6,
        endBeatFreq: 6,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(thetaSeconds),
        order: 3,
      });
    }
    
    return stages;
  }, [learningTarget, learningDuration, includeWindDown]);
  
  const learningAudio = useAudioEngine(learningStages);

  const isPlaying = mode === "custom" 
    ? customAudio.isPlaying 
    : mode === "program" 
      ? programAudio.isPlaying 
      : learningAudio.isPlaying;
  const beatFreq = mode === "custom" 
    ? customAudio.beatFreq 
    : mode === "program" 
      ? programAudio.currentBeat 
      : learningAudio.currentBeat;

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
    programAudio.reset();
    setSelectedProgramId(programId);
    setMode("program");
  };
  
  const getLearningCurrentStage = () => {
    if (mode !== "learning") return "";
    let timeScanner = 0;
    for (const stage of learningStages) {
      if (learningAudio.elapsedTime >= timeScanner && learningAudio.elapsedTime < timeScanner + stage.durationSeconds) {
        return stage.name;
      }
      timeScanner += stage.durationSeconds;
    }
    if (learningAudio.elapsedTime >= learningAudio.totalDuration && learningAudio.totalDuration > 0) {
      return "Complete";
    }
    return "Ready";
  };

  const handleTogglePlay = () => {
    if (mode === "custom") {
      customAudio.togglePlay();
    } else if (mode === "program") {
      programAudio.togglePlay();
    } else {
      learningAudio.togglePlay();
    }
  };

  const handleVolumeChange = (val: number) => {
    if (mode === "custom") {
      customAudio.setVolume(val);
    } else if (mode === "program") {
      programAudio.setVolume(val);
    } else {
      learningAudio.setVolume(val);
    }
  };

  const currentVolume = mode === "custom" 
    ? customAudio.volume 
    : mode === "program" 
      ? programAudio.volume 
      : learningAudio.volume;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <WaveVisualizer isPlaying={isPlaying} beatFrequency={beatFreq} />

      <header className="relative z-10 flex items-center justify-center gap-3 p-4 border-b border-white/10">
        <Moon className="w-5 h-5 text-primary" />
        <span className="text-sm tracking-widest uppercase font-semibold text-primary/80" data-testid="text-header-title">Binaural Sleep Console</span>
      </header>

      <main className="flex-1 relative z-10 flex flex-col px-4 py-4 pb-48 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="custom" className="gap-2" data-testid="tab-custom">
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Custom</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2" data-testid="tab-learning">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger value="program" className="gap-2" data-testid="tab-program">
                <Headphones className="w-4 h-4" />
                <span className="hidden sm:inline">Sleep</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className={`p-3 rounded-xl border ${customAudio.carrierSide === 'left' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'left' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-left-freq">
                      {customAudio.leftFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="label-left-ear">Left</div>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="text-xl font-bold text-accent animate-pulse" data-testid="text-beat-freq">
                      {customAudio.beatFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="label-beat-display">Beat</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${customAudio.carrierSide === 'right' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'right' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-right-freq">
                      {customAudio.rightFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="label-right-ear">Right</div>
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
                    <label className="text-xs font-medium text-white" data-testid="label-carrier">Carrier (Solfeggio)</label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-carrier-value">{customAudio.carrierFreq} Hz</span>
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
                    <label className="text-xs font-medium text-white" data-testid="label-beat">Binaural Beat</label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-beat-value">{customAudio.beatFreq} Hz</span>
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

            <TabsContent value="learning" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-display text-white" data-testid="text-learning-title">Learning Mode</h3>
                  <p className="text-xs text-muted-foreground" data-testid="text-learning-description">
                    Optimize your focus with alpha or theta brainwave states
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-white" data-testid="label-target-state">Target State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={learningTarget === "alpha" ? "default" : "outline"}
                      onClick={() => {
                        learningAudio.reset();
                        setLearningTarget("alpha");
                      }}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      data-testid="button-target-alpha"
                    >
                      <span className="font-semibold">Alpha (8-12 Hz)</span>
                      <span className="text-[10px] opacity-70">Relaxed focus, learning</span>
                    </Button>
                    <Button
                      variant={learningTarget === "theta" ? "default" : "outline"}
                      onClick={() => {
                        learningAudio.reset();
                        setLearningTarget("theta");
                      }}
                      className="h-auto py-3 flex flex-col items-center gap-1"
                      data-testid="button-target-theta"
                    >
                      <span className="font-semibold">Theta (4-8 Hz)</span>
                      <span className="text-[10px] opacity-70">Deep meditation, creativity</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white" data-testid="label-wind-down">Wind Down</label>
                    <Button
                      variant={includeWindDown ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        learningAudio.reset();
                        setIncludeWindDown(!includeWindDown);
                      }}
                      className="h-7 text-xs"
                      data-testid="button-toggle-winddown"
                    >
                      {includeWindDown ? "On" : "Off"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground" data-testid="text-winddown-description">
                    Gradual transition from beta (alert) to your target state
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-white" data-testid="label-duration">Duration</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <Button
                        key={opt.minutes}
                        variant={learningDuration === opt.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          learningAudio.reset();
                          setLearningDuration(opt.minutes);
                        }}
                        className="text-xs px-3 h-8"
                        data-testid={`button-duration-${opt.minutes}`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${learningTarget}-${learningDuration}-${includeWindDown}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="text-center py-2">
                      <div className="text-xl font-bold text-accent" data-testid="text-learning-stage">
                        {getLearningCurrentStage()}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="label-learning-current-stage">Current Stage</div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid="text-learning-elapsed">{formatTime(learningAudio.elapsedTime)}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="progress-bar-learning">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${learningAudio.totalDuration > 0 ? (learningAudio.elapsedTime / learningAudio.totalDuration) * 100 : 0}%` }}
                        />
                      </div>
                      <span data-testid="text-learning-total">{formatTime(learningAudio.totalDuration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                      <span data-testid="text-learning-beat">{Math.round(learningAudio.currentBeat * 10) / 10} Hz Beat</span>
                      <span>•</span>
                      <span data-testid="text-learning-carrier">{Math.round(learningAudio.currentCarrier)} Hz Carrier</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
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
                        <h3 className="text-lg font-display text-white mb-1" data-testid="text-program-name">{selectedProgram.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3" data-testid="text-program-description">{selectedProgram.description}</p>
                        
                        <div className="flex items-center justify-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xl font-bold text-accent" data-testid="text-current-stage">
                              {getCurrentStageName()}
                            </div>
                            <div className="text-xs text-muted-foreground" data-testid="label-current-stage">Current Stage</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span data-testid="text-elapsed-time">{formatTime(programAudio.elapsedTime)}</span>
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="progress-bar">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${programAudio.totalDuration > 0 ? (programAudio.elapsedTime / programAudio.totalDuration) * 100 : 0}%` }}
                          />
                        </div>
                        <span data-testid="text-total-time">{formatTime(programAudio.totalDuration)}</span>
                      </div>

                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                        <span data-testid="text-program-beat">{Math.round(programAudio.currentBeat * 10) / 10} Hz Beat</span>
                        <span>•</span>
                        <span data-testid="text-program-carrier">{Math.round(programAudio.currentCarrier)} Hz Carrier</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {!selectedProgram && (
                  <div className="text-center py-8 text-muted-foreground text-sm" data-testid="text-program-empty-state">
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
              showRecorder={true}
            />
          </div>

          <div className="glass-panel rounded-xl p-3" data-testid="section-frequency-legend">
            <div className="text-xs text-muted-foreground space-y-1">
              <p data-testid="text-legend-delta"><strong className="text-white">Delta (0.5-4 Hz):</strong> Deep sleep, healing</p>
              <p data-testid="text-legend-theta"><strong className="text-white">Theta (4-8 Hz):</strong> Meditation, REM</p>
              <p data-testid="text-legend-alpha"><strong className="text-white">Alpha (8-12 Hz):</strong> Relaxation</p>
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

          <Button
            size="icon"
            onClick={handleTogglePlay}
            disabled={mode === "program" && !selectedProgram}
            className="rounded-full w-12 h-12"
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>

          <div className="flex-1 flex justify-end">
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-mono" data-testid="text-mode-indicator">
                {mode === "custom" 
                  ? "Custom" 
                  : mode === "learning" 
                    ? `Learning: ${learningTarget === "alpha" ? "Alpha" : "Theta"}`
                    : selectedProgram?.name || "Program"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useCustomAudio } from "@/hooks/use-custom-audio";
import { useProgressionAudio } from "@/hooks/use-progression-audio";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioFilePlayer } from "@/components/AudioFilePlayer";
import { ProgressionBuilder } from "@/components/ProgressionBuilder";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Volume2, Sliders, ArrowLeft, ArrowLeftRight, ListOrdered } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const SOLFEGGIO_PRESETS = [
  { freq: 174, label: "174 Hz", name: "Foundation" },
  { freq: 285, label: "285 Hz", name: "Healing" },
  { freq: 396, label: "396 Hz", name: "Root Chakra" },
  { freq: 417, label: "417 Hz", name: "Sacral" },
  { freq: 432, label: "432 Hz", name: "Harmony" },
  { freq: 528, label: "528 Hz", name: "Love/DNA" },
  { freq: 639, label: "639 Hz", name: "Heart" },
  { freq: 741, label: "741 Hz", name: "Throat" },
  { freq: 852, label: "852 Hz", name: "Third Eye" },
  { freq: 963, label: "963 Hz", name: "Crown" },
];

const BEAT_PRESETS = [
  { freq: 0.5, label: "0.5 Hz", name: "Deep Delta" },
  { freq: 1, label: "1 Hz", name: "Delta" },
  { freq: 2, label: "2 Hz", name: "Delta" },
  { freq: 4, label: "4 Hz", name: "Theta" },
  { freq: 6, label: "6 Hz", name: "Theta" },
  { freq: 8, label: "8 Hz", name: "Alpha" },
  { freq: 10, label: "10 Hz", name: "Alpha" },
  { freq: 12, label: "12 Hz", name: "Beta" },
  { freq: 15, label: "15 Hz", name: "Beta" },
  { freq: 20, label: "20 Hz", name: "High Beta" },
];

export default function CustomPage() {
  const [mode, setMode] = useState<'simple' | 'progression'>('simple');
  const audio = useCustomAudio();
  const progression = useProgressionAudio();

  const isAnyPlaying = audio.isPlaying || progression.isPlaying;
  const currentBeat = progression.isPlaying && progression.currentSlot
    ? progression.currentSlot.rightHz - progression.currentSlot.leftHz
    : audio.beatFreq;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <WaveVisualizer isPlaying={isAnyPlaying} beatFrequency={currentBeat} />

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-primary/80">
          <Sliders className="w-4 h-4" />
          <span className="text-sm tracking-widest uppercase font-semibold">Custom Frequencies</span>
        </div>
        <div className="w-20" />
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-start px-4 py-8 pb-48 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-8"
        >
          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-display text-white mb-2">Custom Frequency Mode</h1>
            <p className="text-muted-foreground">Create your own binaural beat experience</p>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as 'simple' | 'progression')} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="simple" className="gap-2" data-testid="tab-simple">
                <Sliders className="w-4 h-4" />
                Simple Mode
              </TabsTrigger>
              <TabsTrigger value="progression" className="gap-2" data-testid="tab-progression">
                <ListOrdered className="w-4 h-4" />
                Progression Builder
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'simple' && (
            <>
              <div className="glass-panel rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className={`p-4 rounded-xl border ${audio.carrierSide === 'left' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-2xl md:text-3xl font-bold ${audio.carrierSide === 'left' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-left-freq">
                      {audio.leftFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Left Ear {audio.carrierSide === 'left' ? '(Carrier)' : '(Calculated)'}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="text-2xl md:text-3xl font-bold text-accent animate-pulse" data-testid="text-beat-freq">
                      {audio.beatFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Binaural Beat</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${audio.carrierSide === 'right' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`text-2xl md:text-3xl font-bold ${audio.carrierSide === 'right' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-right-freq">
                      {audio.rightFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Right Ear {audio.carrierSide === 'right' ? '(Carrier)' : '(Calculated)'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => audio.setCarrierSide(audio.carrierSide === 'left' ? 'right' : 'left')}
                    className="gap-2"
                    data-testid="button-swap-sides"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Swap Carrier to {audio.carrierSide === 'left' ? 'Right' : 'Left'} Ear
                  </Button>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-white">
                      {audio.carrierSide === 'left' ? 'Left' : 'Right'} Ear (Carrier Frequency)
                    </label>
                    <span className="text-sm text-muted-foreground font-mono">{audio.carrierFreq} Hz</span>
                  </div>
                  <Slider
                    value={[audio.carrierFreq]}
                    onValueChange={([val]) => audio.setCarrierFreq(val)}
                    min={60}
                    max={1000}
                    step={1}
                    className="mb-4"
                    data-testid="slider-carrier"
                  />
                  <div className="flex flex-wrap gap-2">
                    {SOLFEGGIO_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={audio.carrierFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => audio.setCarrierFreq(preset.freq)}
                        className="text-xs"
                        data-testid={`button-preset-carrier-${preset.freq}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-white">Binaural Beat Frequency</label>
                    <span className="text-sm text-muted-foreground font-mono">{audio.beatFreq} Hz</span>
                  </div>
                  <Slider
                    value={[audio.beatFreq]}
                    onValueChange={([val]) => audio.setBeatFreq(val)}
                    min={0.5}
                    max={40}
                    step={0.5}
                    className="mb-4"
                    data-testid="slider-beat"
                  />
                  <div className="flex flex-wrap gap-2">
                    {BEAT_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={audio.beatFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => audio.setBeatFreq(preset.freq)}
                        className="text-xs"
                        data-testid={`button-preset-beat-${preset.freq}`}
                      >
                        {preset.label} <span className="ml-1 opacity-60">({preset.name})</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong className="text-white">Delta (0.5-4 Hz):</strong> Deep sleep, healing, regeneration</p>
                  <p><strong className="text-white">Theta (4-8 Hz):</strong> Meditation, creativity, REM sleep</p>
                  <p><strong className="text-white">Alpha (8-12 Hz):</strong> Relaxation, calm focus</p>
                  <p><strong className="text-white">Beta (12-30 Hz):</strong> Alertness, concentration</p>
                </div>
              </div>
            </>
          )}

          {mode === 'progression' && (
            <ProgressionBuilder
              onPlay={progression.play}
              onStop={progression.stop}
              isPlaying={progression.isPlaying}
              currentSlotIndex={progression.currentSlotIndex}
              elapsedTime={progression.elapsedTime}
              volume={progression.volume}
              onVolumeChange={progression.setVolume}
            />
          )}

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
        </motion.div>
      </main>

      {mode === 'simple' && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-20">
          <div className="max-w-xl mx-auto glass-panel rounded-3xl p-6 flex items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider
                value={[audio.volume]}
                onValueChange={([val]) => audio.setVolume(val)}
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
              onClick={audio.togglePlay}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-[0_0_40px_rgba(167,139,250,0.3)] hover:shadow-[0_0_60px_rgba(167,139,250,0.5)] transition-shadow"
              data-testid="button-play-pause"
            >
              {audio.isPlaying ? (
                <Pause className="w-6 h-6 text-primary-foreground fill-current" />
              ) : (
                <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
              )}
            </motion.button>

            <div className="flex-1" />
          </div>
        </div>
      )}
    </div>
  );
}

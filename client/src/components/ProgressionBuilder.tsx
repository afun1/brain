import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Save, Upload, Download, 
  RotateCcw, Volume2, ChevronDown, ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ProgressionSlot {
  id: string;
  leftHz: number;
  rightHz: number;
  durationMinutes: number;
  enabled: boolean;
}

export interface SavedProgression {
  name: string;
  slots: ProgressionSlot[];
  createdAt: string;
}

const STORAGE_KEY = "binaural-progressions";
const MAX_SLOTS = 20;

// Slot colors matching night mode
const SLOT_COLORS = [
  "border-red-500/50", "border-orange-500/50", "border-amber-500/50", "border-yellow-500/50", "border-lime-500/50",
  "border-green-500/50", "border-emerald-500/50", "border-cyan-500/50", "border-blue-500/50", "border-purple-500/50",
  "border-pink-500/50", "border-rose-500/50", "border-indigo-500/50", "border-violet-500/50", "border-fuchsia-500/50",
  "border-teal-500/50", "border-sky-500/50", "border-blue-400/50", "border-green-400/50", "border-amber-400/50"
];

const METER_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-cyan-500", "bg-blue-500", "bg-purple-500",
  "bg-pink-500", "bg-rose-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500",
  "bg-teal-500", "bg-sky-500", "bg-blue-400", "bg-green-400", "bg-amber-400"
];

function getBrainWaveType(beatHz: number): { type: string; color: string } {
  const absBeat = Math.abs(beatHz);
  if (absBeat <= 4) return { type: "δ", color: "text-purple-400" };
  if (absBeat <= 8) return { type: "θ", color: "text-blue-400" };
  if (absBeat <= 12) return { type: "α", color: "text-green-400" };
  if (absBeat <= 30) return { type: "β", color: "text-yellow-400" };
  return { type: "γ", color: "text-red-400" };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptySlot(): ProgressionSlot {
  return {
    id: generateId(),
    leftHz: 0,
    rightHz: 0,
    durationMinutes: 0,
    enabled: true,
  };
}

function createInitialSlots(): ProgressionSlot[] {
  return Array.from({ length: MAX_SLOTS }, () => createEmptySlot());
}

interface ProgressionBuilderProps {
  onPlay: (slots: ProgressionSlot[]) => void;
  onStop: () => void;
  isPlaying: boolean;
  currentSlotIndex: number;
  elapsedTime: number;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export function ProgressionBuilder({
  onPlay,
  onStop,
  isPlaying,
  currentSlotIndex,
  elapsedTime,
  volume,
  onVolumeChange,
}: ProgressionBuilderProps) {
  const { toast } = useToast();
  const [slots, setSlots] = useState<ProgressionSlot[]>(createInitialSlots());
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Input state for controlled inputs (allows blank values)
  const [leftInputs, setLeftInputs] = useState<string[]>(Array(MAX_SLOTS).fill(''));
  const [rightInputs, setRightInputs] = useState<string[]>(Array(MAX_SLOTS).fill(''));
  const [durationInputs, setDurationInputs] = useState<string[]>(Array(MAX_SLOTS).fill(''));

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedProgressions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved progressions:", e);
      }
    }
  }, []);

  const saveToStorage = useCallback((progressions: SavedProgression[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressions));
    setSavedProgressions(progressions);
  }, []);

  const updateSlot = (index: number, field: keyof ProgressionSlot, value: number | boolean) => {
    setSlots(slots.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleLeftChange = (index: number, value: string) => {
    const newInputs = [...leftInputs];
    newInputs[index] = value;
    setLeftInputs(newInputs);
  };

  const handleLeftBlur = (index: number) => {
    const value = parseFloat(leftInputs[index]) || 0;
    updateSlot(index, 'leftHz', value);
  };

  const handleRightChange = (index: number, value: string) => {
    const newInputs = [...rightInputs];
    newInputs[index] = value;
    setRightInputs(newInputs);
  };

  const handleRightBlur = (index: number) => {
    const value = parseFloat(rightInputs[index]) || 0;
    updateSlot(index, 'rightHz', value);
  };

  const handleDurationChange = (index: number, value: string) => {
    const newInputs = [...durationInputs];
    newInputs[index] = value;
    setDurationInputs(newInputs);
  };

  const handleDurationBlur = (index: number) => {
    const value = parseInt(durationInputs[index]) || 0;
    updateSlot(index, 'durationMinutes', value);
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your progression." });
      return;
    }
    const newProgression: SavedProgression = {
      name: saveName.trim(),
      slots: slots.filter(s => s.leftHz > 0 || s.rightHz > 0 || s.durationMinutes > 0),
      createdAt: new Date().toISOString(),
    };
    const existing = savedProgressions.filter(p => p.name !== newProgression.name);
    saveToStorage([...existing, newProgression]);
    setSaveDialogOpen(false);
    setSaveName("");
    toast({ title: "Saved!", description: `"${newProgression.name}" saved successfully.` });
  };

  const loadProgression = (prog: SavedProgression) => {
    // Reset all slots first
    const newSlots = createInitialSlots();
    const newLeftInputs = Array(MAX_SLOTS).fill('');
    const newRightInputs = Array(MAX_SLOTS).fill('');
    const newDurationInputs = Array(MAX_SLOTS).fill('');
    
    // Fill in saved slots
    prog.slots.forEach((slot, idx) => {
      if (idx < MAX_SLOTS) {
        newSlots[idx] = { ...slot, id: generateId() };
        newLeftInputs[idx] = slot.leftHz > 0 ? slot.leftHz.toString() : '';
        newRightInputs[idx] = slot.rightHz > 0 ? slot.rightHz.toString() : '';
        newDurationInputs[idx] = slot.durationMinutes > 0 ? slot.durationMinutes.toString() : '';
      }
    });
    
    setSlots(newSlots);
    setLeftInputs(newLeftInputs);
    setRightInputs(newRightInputs);
    setDurationInputs(newDurationInputs);
    toast({ title: "Loaded!", description: `"${prog.name}" loaded.` });
  };

  const deleteProgression = (name: string) => {
    const updated = savedProgressions.filter(p => p.name !== name);
    saveToStorage(updated);
    toast({ title: "Deleted", description: `"${name}" removed.` });
  };

  const exportToFile = () => {
    const activeSlots = slots.filter(s => s.leftHz > 0 || s.rightHz > 0 || s.durationMinutes > 0);
    const data = JSON.stringify({ slots: activeSlots }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progression.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.slots && Array.isArray(data.slots)) {
          const newSlots = createInitialSlots();
          const newLeftInputs = Array(MAX_SLOTS).fill('');
          const newRightInputs = Array(MAX_SLOTS).fill('');
          const newDurationInputs = Array(MAX_SLOTS).fill('');
          
          data.slots.forEach((slot: ProgressionSlot, idx: number) => {
            if (idx < MAX_SLOTS) {
              newSlots[idx] = { ...slot, id: generateId(), enabled: true };
              newLeftInputs[idx] = slot.leftHz > 0 ? slot.leftHz.toString() : '';
              newRightInputs[idx] = slot.rightHz > 0 ? slot.rightHz.toString() : '';
              newDurationInputs[idx] = slot.durationMinutes > 0 ? slot.durationMinutes.toString() : '';
            }
          });
          
          setSlots(newSlots);
          setLeftInputs(newLeftInputs);
          setRightInputs(newRightInputs);
          setDurationInputs(newDurationInputs);
          toast({ title: "Imported!", description: "Progression loaded from file." });
        }
      } catch (err) {
        toast({ title: "Import failed", description: "Invalid file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resetToDefault = () => {
    setSlots(createInitialSlots());
    setLeftInputs(Array(MAX_SLOTS).fill(''));
    setRightInputs(Array(MAX_SLOTS).fill(''));
    setDurationInputs(Array(MAX_SLOTS).fill(''));
    toast({ title: "Reset", description: "All slots cleared." });
  };

  const handlePlayStop = () => {
    if (isPlaying) {
      onStop();
    } else {
      const activeSlots = slots.filter(s => s.leftHz > 0 && s.rightHz > 0 && s.durationMinutes > 0 && s.enabled);
      if (activeSlots.length === 0) {
        toast({ title: "No active slots", description: "Add at least one slot with frequencies and duration." });
        return;
      }
      onPlay(activeSlots);
    }
  };

  const enabledSlots = slots.filter(s => s.enabled && s.leftHz > 0 && s.rightHz > 0 && s.durationMinutes > 0);
  const totalDuration = enabledSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Get active slots for meter display
  const activeSlotData = slots.map((slot, idx) => ({
    index: idx,
    duration: slot.durationMinutes,
    leftHz: slot.leftHz,
    rightHz: slot.rightHz,
    enabled: slot.enabled && slot.leftHz > 0 && slot.rightHz > 0 && slot.durationMinutes > 0
  })).filter(s => s.enabled);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="glass-panel border-white/10" data-testid="progression-builder">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
            Progression Builder
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </CardTitle>
          {isPlaying && (
            <div className="text-xs text-accent animate-pulse">
              Playing slot {currentSlotIndex + 1} | {formatTime(elapsedTime)}
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">
          {MAX_SLOTS} slots for custom frequency progressions
        </p>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-3">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs" data-testid="button-save-progression">
                  <Save className="w-3 h-3 mr-1" /> Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Progression</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="progression-name">Name</Label>
                  <Input
                    id="progression-name"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="My Progression"
                    className="mt-2"
                    data-testid="input-progression-name"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSave} data-testid="button-confirm-save">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={savedProgressions.length === 0} className="text-xs" data-testid="button-load-progression">
                  <Upload className="w-3 h-3 mr-1" /> Load
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {savedProgressions.map((prog) => (
                  <DropdownMenuItem
                    key={prog.name}
                    className="flex items-center justify-between gap-4"
                  >
                    <span 
                      className="flex-1 cursor-pointer" 
                      onClick={() => loadProgression(prog)}
                      data-testid={`menu-item-load-${prog.name}`}
                    >
                      {prog.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProgression(prog.name);
                      }}
                      data-testid={`button-delete-${prog.name}`}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={exportToFile} className="text-xs" data-testid="button-export">
              <Download className="w-3 h-3 mr-1" /> Export
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs" data-testid="button-import">
              <Upload className="w-3 h-3 mr-1" /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
            />

            <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-xs" data-testid="button-reset">
              <RotateCcw className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>

          {/* Time Coverage Meter */}
          <div data-testid="time-coverage-meter">
            <div className="flex h-6 rounded-md overflow-hidden border border-white/20">
              {activeSlotData.length > 0 ? (
                activeSlotData.map((slot) => {
                  const percent = totalDuration > 0 ? (slot.duration / totalDuration) * 100 : 0;
                  return (
                    <div
                      key={slot.index}
                      className={`${METER_COLORS[slot.index]} transition-all duration-300 flex items-center justify-center ${
                        isPlaying && currentSlotIndex === activeSlotData.findIndex(s => s.index === slot.index) ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${percent}%` }}
                      title={`Slot ${slot.index + 1}: L=${slot.leftHz}Hz R=${slot.rightHz}Hz - ${slot.duration}min`}
                      data-testid={`meter-segment-${slot.index}`}
                    >
                      {percent >= 4 && (
                        <span className="text-[8px] text-white/90 font-medium">{slot.index + 1}</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-full bg-white/5 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">No active slots</span>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
              <span>{enabledSlots.length} active slots</span>
              <span>Total: {totalDuration} min</span>
            </div>
          </div>

          {/* Slot Grid - Horizontal layout like night mode */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5" data-testid="slots-grid">
            {slots.map((slot, idx) => {
              const beatHz = slot.rightHz - slot.leftHz;
              const { type, color } = getBrainWaveType(beatHz);
              const isActive = slot.leftHz > 0 && slot.rightHz > 0 && slot.durationMinutes > 0;
              const isCurrentSlot = isPlaying && enabledSlots[currentSlotIndex]?.id === slot.id;
              
              return (
                <div
                  key={slot.id}
                  className={`flex flex-col items-center p-1.5 rounded-lg border ${SLOT_COLORS[idx]} bg-white/5 transition-all ${
                    isCurrentSlot ? 'ring-2 ring-primary bg-primary/20' : ''
                  } ${!isActive ? 'opacity-50' : ''}`}
                  data-testid={`slot-${idx}`}
                >
                  <div className="text-[9px] text-muted-foreground mb-0.5">#{idx + 1}</div>
                  
                  {/* Left Hz */}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={leftInputs[idx]}
                    onChange={(e) => handleLeftChange(idx, e.target.value)}
                    onBlur={() => handleLeftBlur(idx)}
                    placeholder="L"
                    className="w-full py-0.5 text-center text-[10px] bg-zinc-900 border border-white/20 rounded text-white focus:border-primary focus:outline-none mb-0.5"
                    data-testid={`input-left-hz-${idx}`}
                  />
                  
                  {/* Right Hz */}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rightInputs[idx]}
                    onChange={(e) => handleRightChange(idx, e.target.value)}
                    onBlur={() => handleRightBlur(idx)}
                    placeholder="R"
                    className="w-full py-0.5 text-center text-[10px] bg-zinc-900 border border-white/20 rounded text-white focus:border-primary focus:outline-none mb-0.5"
                    data-testid={`input-right-hz-${idx}`}
                  />
                  
                  {/* Duration */}
                  <div className="flex items-center gap-0.5 w-full">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationInputs[idx]}
                      onChange={(e) => handleDurationChange(idx, e.target.value)}
                      onBlur={() => handleDurationBlur(idx)}
                      placeholder="m"
                      className="w-full py-0.5 text-center text-[10px] bg-zinc-800 border border-white/10 rounded text-white focus:border-primary focus:outline-none"
                      data-testid={`input-duration-${idx}`}
                    />
                  </div>
                  
                  {/* Beat indicator */}
                  {isActive && (
                    <div className={`text-[8px] font-medium mt-0.5 ${color}`}>
                      {beatHz > 0 ? '+' : ''}{beatHz.toFixed(1)} {type}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={([v]) => onVolumeChange(v)}
                max={1}
                step={0.01}
                className="w-24"
                data-testid="slider-volume"
              />
              <span className="text-[10px] text-muted-foreground w-8">{Math.round(volume * 100)}%</span>
            </div>

            <Button
              variant={isPlaying ? "destructive" : "default"}
              size="sm"
              onClick={handlePlayStop}
              className="gap-2"
              data-testid="button-play-progression"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" /> Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Play Progression
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

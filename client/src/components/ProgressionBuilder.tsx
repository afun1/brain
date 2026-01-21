import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Plus, Trash2, Copy, Save, Upload, Download, 
  RotateCcw, Volume2, ChevronDown, ChevronUp, GripVertical
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

function getBrainWaveType(beatHz: number): { type: string; color: string } {
  const absBeat = Math.abs(beatHz);
  if (absBeat <= 4) return { type: "Delta", color: "text-purple-400" };
  if (absBeat <= 8) return { type: "Theta", color: "text-blue-400" };
  if (absBeat <= 12) return { type: "Alpha", color: "text-green-400" };
  if (absBeat <= 30) return { type: "Beta", color: "text-yellow-400" };
  return { type: "Gamma", color: "text-red-400" };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createDefaultSlot(): ProgressionSlot {
  return {
    id: generateId(),
    leftHz: 200,
    rightHz: 210,
    durationMinutes: 5,
    enabled: true,
  };
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
  const [slots, setSlots] = useState<ProgressionSlot[]>([createDefaultSlot()]);
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) {
      toast({ title: "Maximum slots reached", description: `You can have up to ${MAX_SLOTS} slots.` });
      return;
    }
    setSlots([...slots, createDefaultSlot()]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) {
      toast({ title: "Cannot remove", description: "You need at least one slot." });
      return;
    }
    setSlots(slots.filter(s => s.id !== id));
  };

  const duplicateSlot = (id: string) => {
    if (slots.length >= MAX_SLOTS) {
      toast({ title: "Maximum slots reached", description: `You can have up to ${MAX_SLOTS} slots.` });
      return;
    }
    const index = slots.findIndex(s => s.id === id);
    if (index === -1) return;
    const newSlot = { ...slots[index], id: generateId() };
    const newSlots = [...slots];
    newSlots.splice(index + 1, 0, newSlot);
    setSlots(newSlots);
  };

  const updateSlot = (id: string, field: keyof ProgressionSlot, value: number | boolean) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const moveSlot = (id: string, direction: 'up' | 'down') => {
    const index = slots.findIndex(s => s.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slots.length - 1) return;
    
    const newSlots = [...slots];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlots[index], newSlots[targetIndex]] = [newSlots[targetIndex], newSlots[index]];
    setSlots(newSlots);
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your progression." });
      return;
    }
    const newProgression: SavedProgression = {
      name: saveName.trim(),
      slots: slots,
      createdAt: new Date().toISOString(),
    };
    const existingIndex = savedProgressions.findIndex(p => p.name === saveName.trim());
    let updated: SavedProgression[];
    if (existingIndex >= 0) {
      updated = [...savedProgressions];
      updated[existingIndex] = newProgression;
    } else {
      updated = [...savedProgressions, newProgression];
    }
    saveToStorage(updated);
    setSaveDialogOpen(false);
    setSaveName("");
    toast({ title: "Saved", description: `"${saveName}" saved successfully.` });
  };

  const loadProgression = (progression: SavedProgression) => {
    setSlots(progression.slots.map(s => ({ ...s, id: generateId() })));
    toast({ title: "Loaded", description: `"${progression.name}" loaded.` });
  };

  const deleteProgression = (name: string) => {
    const updated = savedProgressions.filter(p => p.name !== name);
    saveToStorage(updated);
    toast({ title: "Deleted", description: `"${name}" deleted.` });
  };

  const exportToFile = () => {
    const data = {
      version: 1,
      name: "Binaural Progression",
      exportedAt: new Date().toISOString(),
      slots: slots,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `binaural-progression-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Progression exported to file." });
  };

  const importFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.slots && Array.isArray(data.slots)) {
          const importedSlots = data.slots.map((s: any) => ({
            id: generateId(),
            leftHz: Number(s.leftHz) || 200,
            rightHz: Number(s.rightHz) || 210,
            durationMinutes: Number(s.durationMinutes) || 5,
            enabled: s.enabled !== false,
          }));
          setSlots(importedSlots.slice(0, MAX_SLOTS));
          toast({ title: "Imported", description: `${importedSlots.length} slots imported.` });
        } else {
          throw new Error("Invalid format");
        }
      } catch (err) {
        toast({ title: "Import failed", description: "Invalid progression file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetToDefault = () => {
    setSlots([createDefaultSlot()]);
    toast({ title: "Reset", description: "Progression reset to default." });
  };

  const totalDuration = slots.filter(s => s.enabled).reduce((acc, s) => acc + s.durationMinutes, 0);
  const enabledSlots = slots.filter(s => s.enabled);

  const handlePlay = () => {
    if (enabledSlots.length === 0) {
      toast({ title: "No slots enabled", description: "Enable at least one slot to play." });
      return;
    }
    onPlay(enabledSlots);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            Progression Builder
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              data-testid="button-toggle-collapse"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Build custom frequency progressions with up to {MAX_SLOTS} steps
        </p>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
            <Button variant="outline" size="sm" onClick={addSlot} data-testid="button-add-slot">
              <Plus className="w-4 h-4 mr-1" /> Add Slot
            </Button>
            
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-save-progression">
                  <Save className="w-4 h-4 mr-1" /> Save
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
                    placeholder="My Sleep Progression"
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
                <Button variant="outline" size="sm" disabled={savedProgressions.length === 0} data-testid="button-load-progression">
                  <Upload className="w-4 h-4 mr-1" /> Load
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
                      className="h-6 w-6"
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

            <Button variant="outline" size="sm" onClick={exportToFile} data-testid="button-export">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-import">
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
            />

            <Button variant="ghost" size="sm" onClick={resetToDefault} data-testid="button-reset">
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {slots.map((slot, index) => {
              const beatHz = slot.rightHz - slot.leftHz;
              const { type, color } = getBrainWaveType(beatHz);
              const isCurrentSlot = isPlaying && index === currentSlotIndex;
              
              return (
                <div
                  key={slot.id}
                  className={`flex flex-wrap items-center gap-2 p-3 rounded-lg border transition-colors ${
                    isCurrentSlot 
                      ? 'bg-primary/20 border-primary' 
                      : slot.enabled 
                        ? 'bg-card border-border' 
                        : 'bg-muted/30 border-border/50 opacity-60'
                  }`}
                  data-testid={`slot-${index}`}
                >
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSlot(slot.id, 'up')}
                      disabled={index === 0}
                      data-testid={`button-move-up-${index}`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => moveSlot(slot.id, 'down')}
                      disabled={index === slots.length - 1}
                      data-testid={`button-move-down-${index}`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>

                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">L:</Label>
                    <Input
                      type="number"
                      value={slot.leftHz}
                      onChange={(e) => updateSlot(slot.id, 'leftHz', Number(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                      min={20}
                      max={1000}
                      data-testid={`input-left-hz-${index}`}
                    />
                    <span className="text-xs text-muted-foreground">Hz</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">R:</Label>
                    <Input
                      type="number"
                      value={slot.rightHz}
                      onChange={(e) => updateSlot(slot.id, 'rightHz', Number(e.target.value) || 0)}
                      className="w-20 h-8 text-sm"
                      min={20}
                      max={1000}
                      data-testid={`input-right-hz-${index}`}
                    />
                    <span className="text-xs text-muted-foreground">Hz</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Time:</Label>
                    <Input
                      type="number"
                      value={slot.durationMinutes}
                      onChange={(e) => updateSlot(slot.id, 'durationMinutes', Number(e.target.value) || 1)}
                      className="w-16 h-8 text-sm"
                      min={1}
                      max={120}
                      data-testid={`input-duration-${index}`}
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>

                  <div className={`text-xs font-medium px-2 py-1 rounded ${color} bg-white/5`}>
                    {beatHz > 0 ? '+' : ''}{beatHz} Hz ({type})
                  </div>

                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateSlot(slot.id, 'enabled', !slot.enabled)}
                      data-testid={`button-toggle-${index}`}
                    >
                      {slot.enabled ? (
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => duplicateSlot(slot.id)}
                      data-testid={`button-duplicate-${index}`}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeSlot(slot.id)}
                      data-testid={`button-remove-${index}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{enabledSlots.length}</span> slots enabled | 
              Total: <span className="font-medium text-foreground">{totalDuration}</span> minutes
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-32">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <Slider
                  value={[volume]}
                  onValueChange={([val]) => onVolumeChange(val)}
                  min={0}
                  max={1}
                  step={0.01}
                  data-testid="slider-progression-volume"
                />
              </div>

              <Button
                size="lg"
                onClick={isPlaying ? onStop : handlePlay}
                className="gap-2"
                data-testid="button-play-progression"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" /> Play Progression
                  </>
                )}
              </Button>
            </div>
          </div>

          {isPlaying && currentSlotIndex >= 0 && currentSlotIndex < enabledSlots.length && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between text-sm">
                <span>
                  Playing slot {currentSlotIndex + 1} of {enabledSlots.length}
                </span>
                <span className="font-mono">
                  {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} / 
                  {enabledSlots[currentSlotIndex].durationMinutes}:00
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

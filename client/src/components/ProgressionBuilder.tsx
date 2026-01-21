import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, Pause, Save, Upload, Download, 
  RotateCcw, Volume2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Share2, Library
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CommunityLibrary } from "./CommunityLibrary";

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
  carrierChannel?: 'L' | 'R';
  variance?: 'higher' | 'lower';
  globalBeat?: number;
}

const STORAGE_KEY = "binaural-progressions";
const MAX_SLOTS = 30;
const DEFAULT_VISIBLE_SLOTS = 20;

const SLOT_COLORS = [
  "border-red-500/50", "border-orange-500/50", "border-amber-500/50", "border-yellow-500/50", "border-lime-500/50",
  "border-green-500/50", "border-emerald-500/50", "border-cyan-500/50", "border-blue-500/50", "border-purple-500/50",
  "border-pink-500/50", "border-rose-500/50", "border-indigo-500/50", "border-violet-500/50", "border-fuchsia-500/50",
  "border-teal-500/50", "border-sky-500/50", "border-blue-400/50", "border-green-400/50", "border-amber-400/50",
  "border-red-400/50", "border-orange-400/50", "border-amber-400/50", "border-yellow-400/50", "border-lime-400/50",
  "border-green-400/50", "border-emerald-400/50", "border-cyan-400/50", "border-blue-300/50", "border-purple-400/50"
];

const METER_COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
  "bg-green-500", "bg-emerald-500", "bg-cyan-500", "bg-blue-500", "bg-purple-500",
  "bg-pink-500", "bg-rose-500", "bg-indigo-500", "bg-violet-500", "bg-fuchsia-500",
  "bg-teal-500", "bg-sky-500", "bg-blue-400", "bg-green-400", "bg-amber-400",
  "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-yellow-400", "bg-lime-400",
  "bg-green-400", "bg-emerald-400", "bg-cyan-400", "bg-blue-300", "bg-purple-400"
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
  const { user, isAuthenticated } = useAuth();
  const [slots, setSlots] = useState<ProgressionSlot[]>(createInitialSlots());
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Carrier channel and variance settings
  const [carrierChannel, setCarrierChannel] = useState<'L' | 'R'>('L');
  const [variance, setVariance] = useState<'higher' | 'lower'>('higher');
  
  // Show extended slots (21-30)
  const [showExtendedSlots, setShowExtendedSlots] = useState(false);
  
  // Share to Library state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareCategory, setShareCategory] = useState("Sleep");
  const [shareAnonymous, setShareAnonymous] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Community Library state
  const [libraryOpen, setLibraryOpen] = useState(false);
  
  // Input state for controlled inputs (carrier, beat, duration per slot)
  const [carrierInputs, setCarrierInputs] = useState<string[]>(Array(MAX_SLOTS).fill(''));
  const [beatInputs, setBeatInputs] = useState<string[]>(Array(MAX_SLOTS).fill(''));
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

  // Calculate L and R Hz from carrier, beat, and settings
  const calculateFrequencies = (carrierHz: number, beatHz: number): { leftHz: number; rightHz: number } => {
    if (carrierHz <= 0 || beatHz <= 0) {
      return { leftHz: 0, rightHz: 0 };
    }
    
    const variableHz = variance === 'higher' ? carrierHz + beatHz : carrierHz - beatHz;
    
    if (carrierChannel === 'L') {
      return { leftHz: carrierHz, rightHz: variableHz };
    } else {
      return { leftHz: variableHz, rightHz: carrierHz };
    }
  };

  const updateSlotFromInputs = (index: number, carrier: number, beat: number, duration: number) => {
    const { leftHz, rightHz } = calculateFrequencies(carrier, beat);
    setSlots(slots.map((s, i) => i === index ? { ...s, leftHz, rightHz, durationMinutes: duration } : s));
  };

  const handleCarrierChange = (index: number, value: string) => {
    const newInputs = [...carrierInputs];
    newInputs[index] = value;
    setCarrierInputs(newInputs);
  };

  const handleCarrierBlur = (index: number) => {
    const carrier = parseFloat(carrierInputs[index]) || 0;
    const beat = parseFloat(beatInputs[index]) || 0;
    const duration = parseInt(durationInputs[index]) || 0;
    updateSlotFromInputs(index, carrier, beat, duration);
  };

  const handleBeatChange = (index: number, value: string) => {
    const newInputs = [...beatInputs];
    newInputs[index] = value;
    setBeatInputs(newInputs);
  };

  const handleBeatBlur = (index: number) => {
    const carrier = parseFloat(carrierInputs[index]) || 0;
    const beat = parseFloat(beatInputs[index]) || 0;
    const duration = parseInt(durationInputs[index]) || 0;
    updateSlotFromInputs(index, carrier, beat, duration);
  };

  const handleDurationChange = (index: number, value: string) => {
    const newInputs = [...durationInputs];
    newInputs[index] = value;
    setDurationInputs(newInputs);
  };

  const handleDurationBlur = (index: number) => {
    const carrier = parseFloat(carrierInputs[index]) || 0;
    const beat = parseFloat(beatInputs[index]) || 0;
    const duration = parseInt(durationInputs[index]) || 0;
    updateSlotFromInputs(index, carrier, beat, duration);
  };

  // Recalculate all slots when carrier channel or variance changes
  useEffect(() => {
    const newSlots = slots.map((slot, idx) => {
      const carrier = parseFloat(carrierInputs[idx]) || 0;
      const beat = parseFloat(beatInputs[idx]) || 0;
      const { leftHz, rightHz } = calculateFrequencies(carrier, beat);
      return { ...slot, leftHz, rightHz };
    });
    setSlots(newSlots);
  }, [carrierChannel, variance]);

  const handleSave = () => {
    if (!saveName.trim()) {
      toast({ title: "Name required", description: "Please enter a name for your progression." });
      return;
    }
    const newProgression: SavedProgression = {
      name: saveName.trim(),
      slots: slots.filter(s => s.leftHz > 0 || s.rightHz > 0 || s.durationMinutes > 0),
      createdAt: new Date().toISOString(),
      carrierChannel,
      variance,
    };
    const existing = savedProgressions.filter(p => p.name !== newProgression.name);
    saveToStorage([...existing, newProgression]);
    setSaveDialogOpen(false);
    setSaveName("");
    toast({ title: "Saved!", description: `"${newProgression.name}" saved successfully.` });
  };

  const loadProgression = (prog: SavedProgression) => {
    const newSlots = createInitialSlots();
    const newCarrierInputs = Array(MAX_SLOTS).fill('');
    const newBeatInputs = Array(MAX_SLOTS).fill('');
    const newDurationInputs = Array(MAX_SLOTS).fill('');
    
    // Set carrier channel and variance from saved progression
    if (prog.carrierChannel) setCarrierChannel(prog.carrierChannel);
    if (prog.variance) setVariance(prog.variance);
    
    prog.slots.forEach((slot, idx) => {
      if (idx < MAX_SLOTS) {
        newSlots[idx] = { ...slot, id: generateId() };
        // Calculate carrier and beat from leftHz/rightHz based on saved settings
        const savedCarrierChannel = prog.carrierChannel || 'L';
        const savedVariance = prog.variance || 'higher';
        const carrier = savedCarrierChannel === 'L' ? slot.leftHz : slot.rightHz;
        const variable = savedCarrierChannel === 'L' ? slot.rightHz : slot.leftHz;
        const beat = savedVariance === 'higher' ? variable - carrier : carrier - variable;
        
        newCarrierInputs[idx] = carrier > 0 ? carrier.toString() : '';
        newBeatInputs[idx] = beat > 0 ? beat.toString() : '';
        newDurationInputs[idx] = slot.durationMinutes > 0 ? slot.durationMinutes.toString() : '';
      }
    });
    
    setSlots(newSlots);
    setCarrierInputs(newCarrierInputs);
    setBeatInputs(newBeatInputs);
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
    if (activeSlots.length === 0) {
      toast({ title: "Nothing to export", description: "Add some slots first.", variant: "destructive" });
      return;
    }
    const data = JSON.stringify({ slots: activeSlots, carrierChannel, variance }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progression.json";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "Progression saved to progression.json" });
  };

  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.slots && Array.isArray(data.slots)) {
          const prog: SavedProgression = {
            name: "Imported",
            slots: data.slots,
            createdAt: new Date().toISOString(),
            carrierChannel: data.carrierChannel || 'L',
            variance: data.variance || 'higher',
          };
          loadProgression(prog);
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
    setCarrierInputs(Array(MAX_SLOTS).fill(''));
    setBeatInputs(Array(MAX_SLOTS).fill(''));
    setDurationInputs(Array(MAX_SLOTS).fill(''));
    toast({ title: "Reset", description: "All slots cleared." });
  };

  const handleLoadFromLibrary = (prog: SavedProgression) => {
    loadProgression(prog);
  };

  const handleShareToLibrary = async () => {
    if (!shareTitle.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your progression." });
      return;
    }

    const activeSlots = slots.filter(s => s.leftHz > 0 || s.rightHz > 0 || s.durationMinutes > 0);
    if (activeSlots.length === 0) {
      toast({ title: "No slots to share", description: "Add some slots first.", variant: "destructive" });
      return;
    }

    setIsSharing(true);
    try {
      await apiRequest("POST", "/api/library", {
        title: shareTitle.trim(),
        description: shareDescription.trim() || null,
        category: shareCategory,
        isAnonymous: shareAnonymous,
        slots: activeSlots,
        carrierChannel,
        variance,
        totalMinutes: activeSlots.reduce((sum, s) => sum + s.durationMinutes, 0),
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/library'] });
      setShareDialogOpen(false);
      setShareTitle("");
      setShareDescription("");
      setShareCategory("Sleep");
      setShareAnonymous(false);
      toast({ title: "Shared!", description: "Your progression is now available in the Community Library." });
    } catch (error) {
      toast({ title: "Share failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const handlePlayStop = () => {
    if (isPlaying) {
      onStop();
    } else {
      const activeSlots = slots.filter(s => s.leftHz > 0 && s.rightHz > 0 && s.durationMinutes > 0 && s.enabled);
      if (activeSlots.length === 0) {
        toast({ title: "No active slots", description: "Add at least one slot with carrier, beat, and duration." });
        return;
      }
      onPlay(activeSlots);
    }
  };

  const enabledSlots = slots.filter(s => s.enabled && s.leftHz > 0 && s.rightHz > 0 && s.durationMinutes > 0);
  const totalDuration = enabledSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

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

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-accent border-accent/50 hover:bg-accent/10" 
                  data-testid="button-share-library"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast({ title: "Login required", description: "Please log in to share progressions." });
                      window.location.href = "/api/login";
                      return;
                    }
                  }}
                >
                  <Share2 className="w-3 h-3 mr-1" /> Share to Library
                </Button>
              </DialogTrigger>
              {isAuthenticated && (
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share to Community Library</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="share-title">Title</Label>
                      <Input
                        id="share-title"
                        value={shareTitle}
                        onChange={(e) => setShareTitle(e.target.value)}
                        placeholder="My Sleep Progression"
                        className="mt-1"
                        data-testid="input-share-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="share-description">Description (optional)</Label>
                      <Textarea
                        id="share-description"
                        value={shareDescription}
                        onChange={(e) => setShareDescription(e.target.value)}
                        placeholder="Describe what this progression does..."
                        className="mt-1 h-20"
                        data-testid="input-share-description"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={shareCategory} onValueChange={setShareCategory}>
                        <SelectTrigger className="mt-1" data-testid="select-share-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sleep">Sleep</SelectItem>
                          <SelectItem value="Power Nap">Power Nap</SelectItem>
                          <SelectItem value="Focus">Focus</SelectItem>
                          <SelectItem value="Meditation">Meditation</SelectItem>
                          <SelectItem value="Healing">Healing</SelectItem>
                          <SelectItem value="Workout">Workout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="share-anonymous"
                        checked={shareAnonymous}
                        onCheckedChange={(checked) => setShareAnonymous(checked === true)}
                        data-testid="checkbox-anonymous"
                      />
                      <Label htmlFor="share-anonymous" className="text-sm font-normal cursor-pointer">
                        Share anonymously (hide my name)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your progression will be shared with the community. Others can download and rate it.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleShareToLibrary} disabled={isSharing} data-testid="button-confirm-share">
                      {isSharing ? "Sharing..." : "Share"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              )}
            </Dialog>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLibraryOpen(true)} 
              className="text-xs"
              data-testid="button-browse-library"
            >
              <Library className="w-3 h-3 mr-1" /> Browse Library
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

          {/* Carrier Channel, Global Beat, and Variance Controls */}
          <div className="flex flex-wrap items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10" data-testid="carrier-settings">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Carrier:</span>
              <div className="flex">
                <Button
                  variant={carrierChannel === 'L' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCarrierChannel('L')}
                  className="text-xs rounded-r-none px-3"
                  data-testid="button-carrier-left"
                >
                  L
                </Button>
                <Button
                  variant={carrierChannel === 'R' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCarrierChannel('R')}
                  className="text-xs rounded-l-none px-3"
                  data-testid="button-carrier-right"
                >
                  R
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Variance:</span>
              <div className="flex">
                <Button
                  variant={variance === 'higher' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVariance('higher')}
                  className="text-xs rounded-r-none px-2 gap-1"
                  data-testid="button-variance-higher"
                >
                  <ArrowUp className="w-3 h-3" /> Higher
                </Button>
                <Button
                  variant={variance === 'lower' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVariance('lower')}
                  className="text-xs rounded-l-none px-2 gap-1"
                  data-testid="button-variance-lower"
                >
                  <ArrowDown className="w-3 h-3" /> Lower
                </Button>
              </div>
            </div>
            
            <div className="text-[9px] text-muted-foreground ml-auto">
              {carrierChannel === 'L' ? 'L' : 'R'}=carrier, {carrierChannel === 'L' ? 'R' : 'L'}=carrier {variance === 'higher' ? '+' : '-'} beat
            </div>
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

          {/* Slot Grid - Horizontal layout with Carrier, Beat, Variance, Duration */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5" data-testid="slots-grid">
            {slots.slice(0, showExtendedSlots ? MAX_SLOTS : DEFAULT_VISIBLE_SLOTS).map((slot, idx) => {
              const carrier = parseFloat(carrierInputs[idx]) || 0;
              const beat = parseFloat(beatInputs[idx]) || 0;
              const variableHz = beat > 0 && carrier > 0 
                ? (variance === 'higher' ? carrier + beat : carrier - beat) 
                : 0;
              const { type, color } = getBrainWaveType(beat);
              const isActive = slot.leftHz > 0 && slot.rightHz > 0 && slot.durationMinutes > 0;
              const isCurrentSlot = isPlaying && enabledSlots[currentSlotIndex]?.id === slot.id;
              
              return (
                <div
                  key={slot.id}
                  className={`flex flex-col items-center p-1.5 rounded-lg border ${SLOT_COLORS[idx % SLOT_COLORS.length]} bg-white/5 transition-all ${
                    isCurrentSlot ? 'ring-2 ring-primary bg-primary/20' : ''
                  } ${!isActive ? 'opacity-50' : ''}`}
                  data-testid={`slot-${idx}`}
                >
                  <div className="text-[9px] text-muted-foreground mb-0.5">#{idx + 1}</div>
                  
                  {/* Carrier Hz */}
                  <div className="w-full mb-0.5">
                    <div className="text-[7px] text-center text-accent/70 mb-0.5">{carrierChannel} Hz</div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={carrierInputs[idx]}
                      onChange={(e) => handleCarrierChange(idx, e.target.value)}
                      onBlur={() => handleCarrierBlur(idx)}
                      placeholder=""
                      className="w-full py-0.5 text-center text-[10px] bg-zinc-900 border border-accent/30 rounded text-white focus:border-primary focus:outline-none"
                      data-testid={`input-carrier-${idx}`}
                    />
                  </div>
                  
                  {/* Beat Hz (editable per slot) */}
                  <div className="w-full mb-0.5">
                    <div className="text-[7px] text-center text-purple-400/70 mb-0.5">Beat</div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={beatInputs[idx]}
                      onChange={(e) => handleBeatChange(idx, e.target.value)}
                      onBlur={() => handleBeatBlur(idx)}
                      placeholder=""
                      className="w-full py-0.5 text-center text-[10px] bg-zinc-900 border border-purple-400/30 rounded text-white focus:border-primary focus:outline-none"
                      data-testid={`input-beat-${idx}`}
                    />
                  </div>
                  
                  {/* Variable Hz (calculated, read-only display) */}
                  {carrier > 0 && beat > 0 && (
                    <div className="w-full mb-0.5">
                      <div className="text-[7px] text-center text-muted-foreground/70 mb-0.5">{carrierChannel === 'L' ? 'R' : 'L'} Hz</div>
                      <div className={`w-full py-0.5 text-center text-[10px] bg-zinc-800/50 border border-white/10 rounded ${color}`}>
                        {variableHz.toFixed(1)}
                      </div>
                    </div>
                  )}
                  
                  {/* Duration */}
                  <div className="w-full">
                    <div className="text-[7px] text-center text-muted-foreground/70 mb-0.5">Min</div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationInputs[idx]}
                      onChange={(e) => handleDurationChange(idx, e.target.value)}
                      onBlur={() => handleDurationBlur(idx)}
                      placeholder=""
                      className="w-full py-0.5 text-center text-[10px] bg-zinc-800 border border-white/10 rounded text-white focus:border-primary focus:outline-none"
                      data-testid={`input-duration-${idx}`}
                    />
                  </div>
                  
                  {/* Brain wave type indicator */}
                  {isActive && (
                    <div className={`mt-1 text-[8px] font-medium ${color}`}>
                      {beat} {type}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Toggle Extended Slots */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExtendedSlots(!showExtendedSlots)}
              className="text-xs text-muted-foreground gap-1"
              data-testid="button-toggle-extended-slots"
            >
              {showExtendedSlots ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide slots 21-30
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show 10 more slots
                </>
              )}
            </Button>
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
      
      <CommunityLibrary 
        isOpen={libraryOpen} 
        onOpenChange={setLibraryOpen}
        onLoadProgression={handleLoadFromLibrary}
      />
    </Card>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Headphones, Play, Pause, Square, Volume2, 
  Upload, ChevronDown, ChevronUp, SkipBack, SkipForward,
  Trash2, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
}

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 4, label: "4x" },
  { value: 5, label: "5x" },
  { value: 7.5, label: "7.5x" },
  { value: 10, label: "10x" },
  { value: 12, label: "12x" },
  { value: 15, label: "15x" },
  { value: 16, label: "16x (Max)" },
];

export function AudiobookPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tracksRef = useRef(tracks);
  const currentIndexRef = useRef(currentIndex);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newTracks: AudioTrack[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        newTracks.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          file,
          url,
          duration: 0,
        });
      }
    });

    if (newTracks.length > 0) {
      setTracks(prev => [...prev, ...newTracks]);
      toast({ title: `Added ${newTracks.length} audiobook file(s)` });
    } else {
      toast({ title: "No audio files found", description: "Please drop audio files (MP3, M4A, etc.)", variant: "destructive" });
    }
  }, [toast]);

  // Keep refs in sync
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const currentTrack = tracks[currentIndex] || null;

  // Initialize audio element with event handlers
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      const idx = currentIndexRef.current;
      const trackList = tracksRef.current;
      if (idx < trackList.length - 1) {
        setCurrentIndex(idx + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Cleanup all object URLs on component unmount using ref
  useEffect(() => {
    return () => {
      tracksRef.current.forEach(track => {
        URL.revokeObjectURL(track.url);
      });
    };
  }, []);

  // Load new track when currentTrack changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // Reset time/duration before loading new track
      setCurrentTime(0);
      setDuration(0);
      audioRef.current.src = currentTrack.url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: AudioTrack[] = [];
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        newTracks.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          file,
          url,
          duration: 0,
        });
      }
    });

    if (newTracks.length > 0) {
      setTracks(prev => [...prev, ...newTracks]);
      toast({ title: `Added ${newTracks.length} audiobook file(s)` });
    }

    e.target.value = "";
  }, [toast]);

  const handlePlay = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  }, [currentTrack]);

  const handlePause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < tracks.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, tracks.length]);

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const handleRemoveTrack = useCallback((index: number) => {
    setTracks(prev => {
      const track = prev[index];
      if (track) {
        URL.revokeObjectURL(track.url);
      }
      const newTracks = prev.filter((_, i) => i !== index);
      if (index <= currentIndex && currentIndex > 0) {
        setCurrentIndex(curr => curr - 1);
      }
      return newTracks;
    });
  }, [currentIndex]);

  const handleSelectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const effectiveDuration = duration / speed;
  const effectiveRemaining = (duration - currentTime) / speed;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between text-xs"
          data-testid="button-toggle-audiobook-panel"
        >
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            <span>Audiobook Player</span>
            {isPlaying && <Badge variant="secondary" className="text-[9px] px-1">Playing</Badge>}
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-3">
        <div 
          className={`glass-panel rounded-xl p-3 space-y-3 transition-colors ${isDragOver ? 'ring-2 ring-primary bg-primary/10' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="dropzone-audiobook"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              {isDragOver 
                ? "Drop audio files here..."
                : "Drag & drop or click to add audiobooks for high-speed learning"}
            </p>
            <label className="cursor-pointer">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="audio/*" 
                multiple
                className="hidden" 
                onChange={handleFileSelect}
                data-testid="input-audiobook-upload"
              />
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" asChild>
                <span>
                  <Upload className="w-3 h-3" />
                  Add Files
                </span>
              </Button>
            </label>
          </div>

          {tracks.length > 0 && (
            <>
              <ScrollArea className="h-[100px] rounded-md border p-2">
                <div className="space-y-1">
                  {tracks.map((track, index) => (
                    <div 
                      key={track.id}
                      className={`flex items-center justify-between gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors ${
                        index === currentIndex 
                          ? "bg-primary/20 text-primary" 
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectTrack(index)}
                      data-testid={`track-audiobook-${index}`}
                    >
                      <span className="truncate flex-1">{track.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrack(index);
                        }}
                        data-testid={`button-remove-audiobook-${index}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {currentTrack && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-center truncate px-2">
                    {currentTrack.name}
                  </div>

                  <div className="space-y-1">
                    <Slider
                      value={[currentTime]}
                      min={0}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                      data-testid="slider-audiobook-seek"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>-{formatTime(duration - currentTime)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      data-testid="button-audiobook-prev"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    {isPlaying ? (
                      <Button
                        variant="default"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handlePause}
                        data-testid="button-audiobook-pause"
                      >
                        <Pause className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handlePlay}
                        data-testid="button-audiobook-play"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleStop}
                      data-testid="button-audiobook-stop"
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleNext}
                      disabled={currentIndex >= tracks.length - 1}
                      data-testid="button-audiobook-next"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Speed
              </label>
              <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-audiobook-speed">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {SPEED_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                Volume
              </label>
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setVolume(v[0])}
                className="w-full"
                data-testid="slider-audiobook-volume"
              />
            </div>
          </div>

          {speed > 1 && duration > 0 && (
            <div className="text-[10px] text-center text-muted-foreground bg-primary/5 rounded p-2">
              <span className="font-medium">At {speed}x:</span> {formatTime(effectiveDuration)} total • {formatTime(effectiveRemaining)} remaining
            </div>
          )}

          {tracks.length === 0 && (
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground cursor-pointer transition-colors ${isDragOver ? 'border-primary bg-primary/10' : 'hover:border-primary/50'}`}
              onClick={() => fileInputRef.current?.click()}
              data-testid="dropzone-audiobook-empty"
            >
              <Headphones className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>{isDragOver ? "Drop files here..." : "Drag & drop or click to add audiobooks"}</p>
              <p className="text-[10px] mt-1">MP3, M4A, WAV, etc.</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Mic, Play, Pause, Square, Volume2, 
  Upload, ChevronDown, ChevronUp, Loader2, BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const VOICE_OPTIONS = [
  { value: "alloy", label: "Alloy", description: "Neutral" },
  { value: "echo", label: "Echo", description: "Male" },
  { value: "fable", label: "Fable", description: "British" },
  { value: "onyx", label: "Onyx", description: "Deep Male" },
  { value: "nova", label: "Nova", description: "Female" },
  { value: "shimmer", label: "Shimmer", description: "Female" },
];

const SPEED_OPTIONS = [
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1, label: "1x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
  { value: 4, label: "4x" },
  { value: 5, label: "5x" },
  { value: 7.5, label: "7.5x" },
  { value: 10, label: "10x" },
];

export function TTSLearningPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(80);
  const [isConverting, setIsConverting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const splitTextIntoChunks = (text: string, maxLength: number = 3500): string[] => {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  };

  const handleConvert = useCallback(async () => {
    if (!text.trim()) {
      toast({ title: "Please enter some text to convert", variant: "destructive" });
      return;
    }

    setIsConverting(true);
    try {
      const chunks = splitTextIntoChunks(text);
      
      let response: Response;
      if (chunks.length === 1) {
        response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: chunks[0], voice }),
        });
      } else {
        response = await fetch("/api/tts/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunks, voice }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to convert text to speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      setIsAudioReady(false);
      toast({ title: "Audio ready! Press play to listen.", variant: "default" });
    } catch (error) {
      toast({ 
        title: "Conversion failed", 
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsConverting(false);
    }
  }, [text, voice, audioUrl, toast]);

  const handlePlay = useCallback(async () => {
    if (audioRef.current) {
      try {
        if (!isAudioReady) {
          audioRef.current.load();
          await new Promise<void>((resolve, reject) => {
            const onCanPlay = () => {
              audioRef.current?.removeEventListener("canplaythrough", onCanPlay);
              audioRef.current?.removeEventListener("error", onError);
              resolve();
            };
            const onError = () => {
              audioRef.current?.removeEventListener("canplaythrough", onCanPlay);
              audioRef.current?.removeEventListener("error", onError);
              reject(new Error("Failed to load audio"));
            };
            audioRef.current?.addEventListener("canplaythrough", onCanPlay);
            audioRef.current?.addEventListener("error", onError);
          });
          setIsAudioReady(true);
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Playback failed:", error);
        toast({ 
          title: "Playback failed", 
          description: "Please try clicking play again",
          variant: "destructive" 
        });
      }
    }
  }, [toast, isAudioReady]);

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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      toast({ title: `Loaded: ${file.name}` });
    };
    reader.readAsText(file);
  }, [toast]);

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

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between text-xs"
          data-testid="button-toggle-tts-panel"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Text-to-Speech Learning</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3 space-y-3">
        <div className="glass-panel rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              Paste text from books or articles to convert to audio for accelerated learning
            </p>
            <label className="cursor-pointer">
              <input 
                type="file" 
                accept=".txt,.md" 
                className="hidden" 
                onChange={handleFileUpload}
                data-testid="input-file-upload"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <span><Upload className="w-3 h-3" /></span>
              </Button>
            </label>
          </div>

          <Textarea
            placeholder="Paste your text content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[80px] text-xs resize-none bg-background/50"
            data-testid="textarea-tts-content"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger className="h-8 text-xs" data-testid="select-voice">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label} ({v.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleConvert}
              disabled={isConverting || !text.trim()}
              size="sm"
              className="text-xs"
              data-testid="button-convert-tts"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Converting...
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-1" />
                  Convert
                </>
              )}
            </Button>
          </div>

          {audioUrl && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="auto"
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onCanPlayThrough={() => setIsAudioReady(true)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
                onError={(e) => {
                  console.error("Audio error:", e);
                  toast({ title: "Audio error", description: "Failed to load audio", variant: "destructive" });
                }}
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={isPlaying ? handlePause : handlePlay}
                  data-testid="button-tts-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleStop}
                  data-testid="button-tts-stop"
                >
                  <Square className="w-3 h-3" />
                </Button>

                <div className="flex-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span data-testid="text-tts-elapsed">{formatTime(currentTime)}</span>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="progress-bar-tts">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <span data-testid="text-tts-duration">{formatTime(duration / speed)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Playback Speed</label>
                  <Select value={speed.toString()} onValueChange={(v) => setSpeed(parseFloat(v))}>
                    <SelectTrigger className="h-7 text-xs" data-testid="select-speed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SPEED_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value.toString()}>
                          {s.label}
                        </SelectItem>
                      ))}
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
                    onValueChange={([v]) => setVolume(v)}
                    min={0}
                    max={100}
                    step={1}
                    className="h-7"
                    data-testid="slider-volume"
                  />
                </div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/60">
                Listen at {speed}x speed while in {speed <= 2 ? "alpha" : "theta"} brainwave state for enhanced learning
              </p>
            </div>
          )}

          {text && (
            <p className="text-[10px] text-right text-muted-foreground">
              {text.length} characters • ~{Math.ceil(text.length / 150)} min audio
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

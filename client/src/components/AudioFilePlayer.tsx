import { useRef } from "react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, Upload, X, Music, MessageCircle } from "lucide-react";

interface AudioFilePlayerProps {
  title: string;
  icon: "music" | "affirmation";
  testIdPrefix: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioFilePlayer({ title, icon, testIdPrefix }: AudioFilePlayerProps) {
  const player = useAudioPlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      player.loadFile(file);
    }
  };

  const IconComponent = icon === "music" ? Music : MessageCircle;

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-white">{title}</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid={`${testIdPrefix}-file-input`}
      />

      {!player.isLoaded ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="w-full gap-2"
          data-testid={`${testIdPrefix}-upload-btn`}
        >
          <Upload className="w-4 h-4" />
          Choose Audio File
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.togglePlay}
              className="h-8 w-8 shrink-0"
              data-testid={`${testIdPrefix}-play-btn`}
            >
              {player.isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white truncate" data-testid={`${testIdPrefix}-filename`}>
                {player.fileName}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTime(player.currentTime)} / {formatTime(player.duration)}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={player.clear}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              data-testid={`${testIdPrefix}-clear-btn`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Slider
            value={[player.currentTime]}
            onValueChange={([val]) => player.seek(val)}
            min={0}
            max={player.duration || 100}
            step={0.1}
            className="w-full"
            data-testid={`${testIdPrefix}-seek-slider`}
          />

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[player.volume]}
              onValueChange={([val]) => player.setVolume(val)}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              data-testid={`${testIdPrefix}-volume-slider`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

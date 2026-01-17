import { useRef } from "react";
import { usePlaylistAudioPlayer } from "@/hooks/use-playlist-audio-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, Upload, X, Music, MessageCircle, 
  SkipBack, SkipForward, Repeat, Repeat1, ChevronUp, ChevronDown, Trash2
} from "lucide-react";

interface AudioFilePlayerProps {
  title: string;
  icon: "music" | "affirmation";
  storageKey: string;
  testIdPrefix: string;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioFilePlayer({ title, icon, storageKey, testIdPrefix }: AudioFilePlayerProps) {
  const player = usePlaylistAudioPlayer(storageKey);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      player.addFiles(files);
    }
    e.target.value = "";
  };

  const IconComponent = icon === "music" ? Music : MessageCircle;

  const loopIcon = player.loopMode === 'track' ? (
    <Repeat1 className="w-4 h-4" />
  ) : (
    <Repeat className="w-4 h-4" />
  );

  const loopLabel = player.loopMode === 'off' ? 'Loop Off' : 
                    player.loopMode === 'playlist' ? 'Loop All' : 'Loop Track';

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">{title}</span>
          {player.tracks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({player.tracks.length} track{player.tracks.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        {player.tracks.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={player.clearPlaylist}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            data-testid={`${testIdPrefix}-clear-all-btn`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid={`${testIdPrefix}-file-input`}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="w-full gap-2"
        data-testid={`${testIdPrefix}-upload-btn`}
      >
        <Upload className="w-4 h-4" />
        {player.tracks.length === 0 ? 'Add Audio Files' : 'Add More Files'}
      </Button>

      {player.tracks.length > 0 && (
        <>
          <ScrollArea className="h-32 rounded-md border border-white/10 bg-black/20">
            <div className="p-2 space-y-1">
              {player.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    index === player.currentIndex 
                      ? 'bg-primary/20 border border-primary/30' 
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => player.selectTrack(index)}
                  data-testid={`${testIdPrefix}-track-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${index === player.currentIndex ? 'text-primary' : 'text-white'}`}>
                      {track.name}
                    </div>
                    {track.duration && (
                      <div className="text-xs text-muted-foreground">
                        {formatTime(track.duration)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); player.moveTrack(index, index - 1); }}
                      disabled={index === 0}
                      data-testid={`${testIdPrefix}-move-up-${index}`}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); player.moveTrack(index, index + 1); }}
                      disabled={index === player.tracks.length - 1}
                      data-testid={`${testIdPrefix}-move-down-${index}`}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); player.removeTrack(track.id); }}
                      data-testid={`${testIdPrefix}-remove-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2">
            {player.currentTrack && (
              <div className="text-xs text-center text-muted-foreground truncate">
                Now Playing: <span className="text-white">{player.currentTrack.name}</span>
              </div>
            )}

            <Slider
              value={[player.currentTime]}
              onValueChange={([val]) => player.seek(val)}
              min={0}
              max={player.duration || 100}
              step={0.1}
              className="w-full"
              data-testid={`${testIdPrefix}-seek-slider`}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.cycleLoopMode}
              className={`h-8 w-8 ${player.loopMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}`}
              title={loopLabel}
              data-testid={`${testIdPrefix}-loop-btn`}
            >
              {loopIcon}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={player.prev}
              className="h-8 w-8"
              data-testid={`${testIdPrefix}-prev-btn`}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={player.togglePlay}
              className="h-10 w-10"
              data-testid={`${testIdPrefix}-play-btn`}
            >
              {player.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={player.next}
              className="h-8 w-8"
              data-testid={`${testIdPrefix}-next-btn`}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

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
        </>
      )}
    </div>
  );
}

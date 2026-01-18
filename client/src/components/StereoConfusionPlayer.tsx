import { useRef } from "react";
import { useStereoPlaylistPlayer, StereoTrack } from "@/hooks/use-stereo-playlist-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, Upload, X, Headphones,
  SkipBack, SkipForward, Repeat, Repeat1, ChevronUp, ChevronDown, Trash2
} from "lucide-react";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface ChannelPlaylistProps {
  title: string;
  tracks: StereoTrack[];
  currentTrack: StereoTrack | null;
  currentIndex: number;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveTrack: (id: string) => void;
  onSelectTrack: (index: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  testIdPrefix: string;
  side: "left" | "right";
}

function ChannelPlaylist({ 
  title, tracks, currentTrack, currentIndex, 
  onAddFiles, onRemoveTrack, onSelectTrack,
  volume, onVolumeChange, testIdPrefix, side
}: ChannelPlaylistProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddFiles(files);
    }
    e.target.value = "";
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${side === 'left' ? 'bg-blue-500' : 'bg-orange-500'}`} />
          <span className="text-xs font-medium text-white">{title}</span>
          {tracks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({tracks.length})
            </span>
          )}
        </div>
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
        className="w-full gap-2 text-xs"
        data-testid={`${testIdPrefix}-upload-btn`}
      >
        <Upload className="w-3 h-3" />
        {tracks.length === 0 ? 'Add Files' : 'Add More'}
      </Button>

      <ScrollArea className="h-24 rounded-md border border-white/10 bg-black/20">
        <div className="p-1.5 space-y-0.5">
          {tracks.length === 0 ? (
            <div className="text-xs text-center text-muted-foreground py-4">
              No tracks yet
            </div>
          ) : (
            tracks.map((track, index) => (
              <div
                key={track.id}
                className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors ${
                  index === currentIndex 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'hover:bg-white/5'
                }`}
                onClick={() => onSelectTrack(index)}
                data-testid={`${testIdPrefix}-track-${index}`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-xs truncate ${index === currentIndex ? 'text-primary' : 'text-white'}`}>
                    {track.name}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground shrink-0"
                  onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }}
                  data-testid={`${testIdPrefix}-remove-${index}`}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Volume2 className="w-3 h-3 text-muted-foreground shrink-0" />
        <Slider
          value={[volume]}
          onValueChange={([val]) => onVolumeChange(val)}
          min={0}
          max={1}
          step={0.01}
          className="flex-1"
          data-testid={`${testIdPrefix}-volume-slider`}
        />
      </div>

      {currentTrack && (
        <div className="text-xs text-center text-muted-foreground truncate">
          <span className={side === 'left' ? 'text-blue-400' : 'text-orange-400'}>
            {currentTrack.name}
          </span>
        </div>
      )}
    </div>
  );
}

export function StereoConfusionPlayer() {
  const player = useStereoPlaylistPlayer();

  const loopIcon = player.loopMode === 'track' ? (
    <Repeat1 className="w-4 h-4" />
  ) : (
    <Repeat className="w-4 h-4" />
  );

  const loopLabel = player.loopMode === 'off' ? 'Loop Off' : 
                    player.loopMode === 'playlist' ? 'Loop All' : 'Loop Track';

  const hasAnyTracks = player.leftTracks.length > 0 || player.rightTracks.length > 0;

  return (
    <div className="glass-panel rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Headphones className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white">Stereo Confusion</span>
        </div>
        {hasAnyTracks && (
          <Button
            variant="ghost"
            size="icon"
            onClick={player.clearAll}
            className="h-7 w-7 text-muted-foreground"
            data-testid="stereo-clear-all-btn"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center mb-2">
        Play different audio in each ear for subliminal confusion effect
      </div>

      <div className="flex gap-3">
        <ChannelPlaylist
          title="Left Ear"
          tracks={player.leftTracks}
          currentTrack={player.leftTrack}
          currentIndex={player.leftIndex}
          onAddFiles={player.addLeftFiles}
          onRemoveTrack={player.removeLeftTrack}
          onSelectTrack={player.selectLeftTrack}
          volume={player.leftVolume}
          onVolumeChange={player.setLeftVolume}
          testIdPrefix="stereo-left"
          side="left"
        />

        <div className="w-px bg-white/10" />

        <ChannelPlaylist
          title="Right Ear"
          tracks={player.rightTracks}
          currentTrack={player.rightTrack}
          currentIndex={player.rightIndex}
          onAddFiles={player.addRightFiles}
          onRemoveTrack={player.removeRightTrack}
          onSelectTrack={player.selectRightTrack}
          volume={player.rightVolume}
          onVolumeChange={player.setRightVolume}
          testIdPrefix="stereo-right"
          side="right"
        />
      </div>

      {hasAnyTracks && (
        <>
          <div className="space-y-2 pt-2 border-t border-white/10">
            <Slider
              value={[player.currentTime]}
              onValueChange={([val]) => player.seek(val)}
              min={0}
              max={player.duration || 100}
              step={0.1}
              className="w-full"
              data-testid="stereo-seek-slider"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.cycleLoopMode}
              className={player.loopMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}
              title={loopLabel}
              data-testid="stereo-loop-btn"
            >
              {loopIcon}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={player.prevBoth}
              data-testid="stereo-prev-btn"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={player.togglePlay}
              data-testid="stereo-play-btn"
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
              onClick={player.nextBoth}
              data-testid="stereo-next-btn"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Master</span>
            <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[player.volume]}
              onValueChange={([val]) => player.setVolume(val)}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              data-testid="stereo-master-volume-slider"
            />
          </div>
        </>
      )}
    </div>
  );
}

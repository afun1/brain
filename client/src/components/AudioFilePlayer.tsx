import { useRef } from "react";
import { usePlaylistAudioPlayer, PlaylistTrack } from "@/hooks/use-playlist-audio-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Volume2, Upload, X, Music, MessageCircle, 
  SkipBack, SkipForward, Repeat, Repeat1, ChevronUp, ChevronDown, Trash2,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "./AudioRecorder";

interface AudioFilePlayerProps {
  title: string;
  icon: "music" | "affirmation";
  storageKey: string;
  testIdPrefix: string;
  showRecorder?: boolean;
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateM3U(tracks: PlaylistTrack[], playlistTitle: string): string {
  const lines: string[] = [];
  lines.push("#EXTM3U");
  lines.push(`#PLAYLIST:${playlistTitle}`);
  lines.push("# NOTE: Replace the file names below with full paths to your audio files");
  lines.push("# Example: C:\\Music\\song.mp3 or /home/user/Music/song.mp3");
  lines.push("");
  
  tracks.forEach(track => {
    const duration = track.duration ? Math.round(track.duration) : -1;
    lines.push(`#EXTINF:${duration},${track.name}`);
    lines.push(track.name);
  });
  
  return lines.join("\r\n");
}

function generatePLS(tracks: PlaylistTrack[], playlistTitle: string): string {
  const lines: string[] = [];
  lines.push("[playlist]");
  lines.push(`PlaylistName=${playlistTitle}`);
  lines.push("; NOTE: Replace file names with full paths to your audio files");
  lines.push("; Example: C:\\Music\\song.mp3 or /home/user/Music/song.mp3");
  lines.push("");
  
  tracks.forEach((track, index) => {
    const num = index + 1;
    lines.push(`File${num}=${track.name}`);
    lines.push(`Title${num}=${track.name}`);
    if (track.duration) {
      lines.push(`Length${num}=${Math.round(track.duration)}`);
    }
  });
  
  lines.push(`NumberOfEntries=${tracks.length}`);
  lines.push("Version=2");
  
  return lines.join("\r\n");
}

async function savePlaylistFile(content: string, defaultName: string, extension: string, mimeType: string): Promise<boolean> {
  try {
    if ('showSaveFilePicker' in window) {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${defaultName}.${extension}`,
        types: [{
          description: `${extension.toUpperCase()} Playlist`,
          accept: { [mimeType]: [`.${extension}`] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      return true;
    } else {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${defaultName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return false;
    throw err;
  }
}

export function AudioFilePlayer({ title, icon, storageKey, testIdPrefix, showRecorder = false }: AudioFilePlayerProps) {
  const player = usePlaylistAudioPlayer(storageKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleRecordingSave = (file: File, name: string) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    player.addFiles(dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      player.addFiles(files);
    }
    e.target.value = "";
  };

  const handleExportM3U = async () => {
    if (player.tracks.length === 0) return;
    try {
      const content = generateM3U(player.tracks, title);
      const saved = await savePlaylistFile(content, title.replace(/\s+/g, '_'), 'm3u', 'audio/x-mpegurl');
      if (saved) {
        toast({ 
          title: "Template saved", 
          description: "Open the file in a text editor to add your file paths" 
        });
      }
    } catch (err) {
      toast({ title: "Export failed", description: "Could not save playlist file", variant: "destructive" });
    }
  };

  const handleExportPLS = async () => {
    if (player.tracks.length === 0) return;
    try {
      const content = generatePLS(player.tracks, title);
      const saved = await savePlaylistFile(content, title.replace(/\s+/g, '_'), 'pls', 'audio/x-scpls');
      if (saved) {
        toast({ 
          title: "Template saved", 
          description: "Open the file in a text editor to add your file paths" 
        });
      }
    } catch (err) {
      toast({ title: "Export failed", description: "Could not save playlist file", variant: "destructive" });
    }
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
            className="h-7 w-7 text-muted-foreground"
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

      {showRecorder && (
        <>
          <AudioRecorder
            onSaveRecording={handleRecordingSave}
            onSaveSubliminal={handleRecordingSave}
            testIdPrefix={`${testIdPrefix}-recorder`}
          />
          <div className="h-px bg-white/10" />
        </>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 gap-2"
          data-testid={`${testIdPrefix}-upload-btn`}
        >
          <Upload className="w-4 h-4" />
          {player.tracks.length === 0 ? 'Add Files' : 'Add More'}
        </Button>
        
        {player.tracks.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportM3U}
              className="gap-1"
              title="Export as .m3u playlist"
              data-testid={`${testIdPrefix}-export-m3u-btn`}
            >
              <Download className="w-3.5 h-3.5" />
              .m3u
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPLS}
              className="gap-1"
              title="Export as .pls playlist"
              data-testid={`${testIdPrefix}-export-pls-btn`}
            >
              <Download className="w-3.5 h-3.5" />
              .pls
            </Button>
          </>
        )}
      </div>

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
                      className="h-6 w-6 text-muted-foreground"
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

          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.cycleLoopMode}
              className={player.loopMode !== 'off' ? 'text-primary' : 'text-muted-foreground'}
              title={loopLabel}
              data-testid={`${testIdPrefix}-loop-btn`}
            >
              {loopIcon}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={player.prev}
              data-testid={`${testIdPrefix}-prev-btn`}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={player.togglePlay}
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
              data-testid={`${testIdPrefix}-next-btn`}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={player.toggleTuning}
              className={player.tuning === 432 ? 'text-primary border-primary' : ''}
              title={`Tuning: A=${player.tuning} Hz (click to toggle)`}
              data-testid={`${testIdPrefix}-tuning-btn`}
            >
              A={player.tuning} Hz
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

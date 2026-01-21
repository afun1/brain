import { useRef, useState, useCallback, useEffect } from "react";
import { usePlaylistAudioPlayer, PlaylistTrack } from "@/hooks/use-playlist-audio-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, Pause, Volume2, Upload, X, Music, MessageCircle, 
  SkipBack, SkipForward, Repeat, Repeat1, Trash2,
  Download, Shuffle, GripVertical, GripHorizontal
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [listHeight, setListHeight] = useState(128);
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const toggleTrackSelection = useCallback((trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }, []);

  const selectAllTracks = useCallback(() => {
    setSelectedTracks(new Set(player.tracks.map(t => t.id)));
  }, [player.tracks]);

  const clearSelection = useCallback(() => {
    setSelectedTracks(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    selectedTracks.forEach(id => {
      player.removeTrack(id);
    });
    setSelectedTracks(new Set());
  }, [selectedTracks, player]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, startHeight: listHeight };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeRef.current) {
        const delta = e.clientY - resizeRef.current.startY;
        const newHeight = Math.max(80, Math.min(400, resizeRef.current.startHeight + delta));
        setListHeight(newHeight);
      }
    };
    
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [listHeight]);

  useEffect(() => {
    const trackIds = new Set(player.tracks.map(t => t.id));
    setSelectedTracks(prev => {
      const filtered = new Set(Array.from(prev).filter(id => trackIds.has(id)));
      if (filtered.size !== prev.size) return filtered;
      return prev;
    });
  }, [player.tracks]);

  const handleTrackDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, []);

  const handleTrackDrag = useCallback((e: React.DragEvent) => {
    if (e.clientY === 0 && e.clientX === 0) return;
    
    const container = scrollContainerRef.current;
    if (!container || draggedIndex === null) return;

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 50;
    const scrollSpeed = 4;

    const distFromTop = e.clientY - rect.top;
    const distFromBottom = rect.bottom - e.clientY;

    const maxScroll = container.scrollHeight - container.clientHeight;
    
    if (distFromTop >= 0 && distFromTop < edgeThreshold && container.scrollTop > 0) {
      container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
    } else if (distFromBottom >= 0 && distFromBottom < edgeThreshold && container.scrollTop < maxScroll) {
      container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
    }
  }, [draggedIndex]);

  const handleTrackDragOver = useCallback((e: React.DragEvent, index: number) => {
    // Check if this is an external file drop (not internal reorder)
    if (e.dataTransfer.types.includes('Files')) {
      // Let it bubble up to the parent drop zone
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && index !== draggedIndex) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleTrackDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleTrackDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    // Check if this is an external file drop (not internal reorder)
    if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
      // Handle external file drop directly
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      if (audioFiles.length > 0) {
        const dt = new DataTransfer();
        audioFiles.forEach(f => dt.items.add(f));
        player.addFiles(dt.files);
      }
      return;
    }
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      player.moveTrack(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, player]);

  const handleTrackDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log('Drop event triggered', e.dataTransfer.files.length, 'files');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      console.log('Files found:', Array.from(files).map(f => f.name));
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      console.log('Audio files after filter:', audioFiles.length);
      if (audioFiles.length > 0) {
        player.addFiles(audioFiles);
      }
    }
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
    <div 
      className={`glass-panel rounded-xl p-4 space-y-3 transition-colors ${
        isDragOver ? 'ring-2 ring-primary bg-primary/10' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`${testIdPrefix}-drop-zone`}
    >
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
          <div className="flex items-center gap-1">
            {selectedTracks.size > 0 ? (
              <>
                <span className="text-xs text-muted-foreground mr-1">
                  {selectedTracks.size} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-7 px-2 text-xs text-muted-foreground"
                  data-testid={`${testIdPrefix}-clear-selection-btn`}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteSelected}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  data-testid={`${testIdPrefix}-delete-selected-btn`}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllTracks}
                  className="h-7 px-2 text-xs text-muted-foreground"
                  data-testid={`${testIdPrefix}-select-all-btn`}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={player.clearPlaylist}
                  className="h-7 w-7 text-muted-foreground"
                  data-testid={`${testIdPrefix}-clear-all-btn`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.m3u,.m3u8,.pls"
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

      {player.tracks.length === 0 && (
        <div 
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-white/20 hover:border-white/40'
          }`}
          onClick={() => fileInputRef.current?.click()}
          data-testid={`${testIdPrefix}-upload-area`}
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drop audio files here or click to browse
          </p>
        </div>
      )}

      {player.tracks.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 gap-2"
            data-testid={`${testIdPrefix}-upload-btn`}
          >
            <Upload className="w-4 h-4" />
            Add More
          </Button>
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
        </div>
      )}

      {player.tracks.length > 0 && (
        <>
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="rounded-md border border-white/10 bg-black/20 overflow-y-auto"
              style={{ height: `${listHeight}px` }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-2 space-y-1">
                {player.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={(e) => handleTrackDragStart(e, index)}
                    onDrag={handleTrackDrag}
                    onDragOver={(e) => handleTrackDragOver(e, index)}
                    onDragLeave={handleTrackDragLeave}
                    onDrop={(e) => handleTrackDrop(e, index)}
                    onDragEnd={handleTrackDragEnd}
                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all ${
                      draggedIndex === index
                        ? 'opacity-50 bg-primary/10'
                        : dragOverIndex === index
                        ? 'bg-primary/30 border-2 border-dashed border-primary'
                        : index === player.currentIndex 
                        ? 'bg-primary/20 border border-primary/30' 
                        : selectedTracks.has(track.id)
                        ? 'bg-white/10 border border-white/20'
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => player.selectTrack(index)}
                    data-testid={`${testIdPrefix}-track-${index}`}
                  >
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded"
                      onMouseDown={(e) => e.stopPropagation()}
                      data-testid={`${testIdPrefix}-drag-handle-${index}`}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <Checkbox
                      checked={selectedTracks.has(track.id)}
                      onClick={(e) => toggleTrackSelection(track.id, e)}
                      className="shrink-0"
                      data-testid={`${testIdPrefix}-checkbox-${index}`}
                    />
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
                  </div>
                ))}
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-ns-resize hover:bg-white/10 rounded-b-md transition-colors"
              onMouseDown={handleResizeStart}
              data-testid={`${testIdPrefix}-resize-handle`}
            >
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

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
              onClick={player.toggleShuffle}
              className={player.shuffle ? 'text-primary' : 'text-muted-foreground'}
              title={player.shuffle ? 'Shuffle On' : 'Shuffle Off'}
              data-testid={`${testIdPrefix}-shuffle-btn`}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            
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

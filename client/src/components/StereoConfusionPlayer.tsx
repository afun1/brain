import { useRef, useState, useCallback, useEffect } from "react";
import { useStereoPlaylistPlayer, StereoTrack } from "@/hooks/use-stereo-playlist-player";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, Pause, Volume2, Upload, X, Headphones,
  SkipBack, SkipForward, Repeat, Repeat1, Trash2, Copy, Shuffle, GripHorizontal, GripVertical
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
  onRemoveMultiple: (ids: string[]) => void;
  onMoveTrack: (fromIndex: number, toIndex: number) => void;
  onSelectTrack: (index: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
  testIdPrefix: string;
  side: "left" | "right";
}

function ChannelPlaylist({ 
  title, tracks, currentTrack, currentIndex, 
  onAddFiles, onRemoveTrack, onRemoveMultiple, onMoveTrack, onSelectTrack,
  volume, onVolumeChange, testIdPrefix, side
}: ChannelPlaylistProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [listHeight, setListHeight] = useState(96);
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
    setSelectedTracks(new Set(tracks.map(t => t.id)));
  }, [tracks]);

  const clearSelection = useCallback(() => {
    setSelectedTracks(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    onRemoveMultiple(Array.from(selectedTracks));
    setSelectedTracks(new Set());
  }, [selectedTracks, onRemoveMultiple]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startY: e.clientY, startHeight: listHeight };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizeRef.current) {
        const delta = e.clientY - resizeRef.current.startY;
        const newHeight = Math.max(60, Math.min(300, resizeRef.current.startHeight + delta));
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
    const trackIds = new Set(tracks.map(t => t.id));
    setSelectedTracks(prev => {
      const filtered = new Set(Array.from(prev).filter(id => trackIds.has(id)));
      if (filtered.size !== prev.size) return filtered;
      return prev;
    });
  }, [tracks]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

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

  const scrollDirectionRef = useRef<'up' | 'down' | null>(null);

  const checkAutoScroll = useCallback((e: React.DragEvent) => {
    const container = scrollContainerRef.current;
    if (!container || draggedIndex === null) return;

    const rect = container.getBoundingClientRect();
    const edgeThreshold = 40;
    const scrollSpeed = 3;

    const distFromTop = e.clientY - rect.top;
    const distFromBottom = rect.bottom - e.clientY;

    const maxScroll = container.scrollHeight - container.clientHeight;
    const canScrollUp = container.scrollTop > 0;
    const canScrollDown = container.scrollTop < maxScroll;

    if (distFromTop < edgeThreshold && canScrollUp) {
      if (scrollDirectionRef.current !== 'up') {
        stopAutoScroll();
        scrollDirectionRef.current = 'up';
        const scroll = () => {
          if (container.scrollTop > 0) {
            container.scrollTop -= scrollSpeed;
            autoScrollRef.current = requestAnimationFrame(scroll);
          } else {
            scrollDirectionRef.current = null;
          }
        };
        autoScrollRef.current = requestAnimationFrame(scroll);
      }
    } else if (distFromBottom < edgeThreshold && canScrollDown) {
      if (scrollDirectionRef.current !== 'down') {
        stopAutoScroll();
        scrollDirectionRef.current = 'down';
        const scroll = () => {
          const currentMax = container.scrollHeight - container.clientHeight;
          if (container.scrollTop < currentMax) {
            container.scrollTop += scrollSpeed;
            autoScrollRef.current = requestAnimationFrame(scroll);
          } else {
            scrollDirectionRef.current = null;
          }
        };
        autoScrollRef.current = requestAnimationFrame(scroll);
      }
    } else {
      if (scrollDirectionRef.current !== null) {
        stopAutoScroll();
        scrollDirectionRef.current = null;
      }
    }
  }, [draggedIndex, stopAutoScroll]);

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
    checkAutoScroll(e);
  }, [draggedIndex, checkAutoScroll]);

  const handleScrollAreaDragOver = useCallback((e: React.DragEvent) => {
    // Allow file drops to bubble up to parent drop zone
    if (e.dataTransfer.types.includes('Files')) {
      return;
    }
    e.preventDefault();
    checkAutoScroll(e);
  }, [checkAutoScroll]);

  const handleTrackDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleScrollAreaDragLeave = useCallback(() => {
    stopAutoScroll();
    scrollDirectionRef.current = null;
  }, [stopAutoScroll]);

  const handleScrollAreaDrop = useCallback((e: React.DragEvent) => {
    // Handle external file drops on the scroll area
    if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      stopAutoScroll();
      scrollDirectionRef.current = null;
      const files = e.dataTransfer.files;
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      if (audioFiles.length > 0) {
        onAddFiles(audioFiles);
      }
    }
  }, [stopAutoScroll, onAddFiles]);

  const handleTrackDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    // Check if this is an external file drop (not internal reorder)
    if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
      // Handle external file drop directly
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      stopAutoScroll();
      scrollDirectionRef.current = null;
      const files = e.dataTransfer.files;
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      if (audioFiles.length > 0) {
        onAddFiles(audioFiles);
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    e.preventDefault();
    stopAutoScroll();
    scrollDirectionRef.current = null;
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onMoveTrack(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, onMoveTrack, stopAutoScroll, onAddFiles]);

  const handleTrackDragEnd = useCallback(() => {
    stopAutoScroll();
    scrollDirectionRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [stopAutoScroll]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddFiles(files);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      if (audioFiles.length > 0) {
        onAddFiles(audioFiles);
      }
    }
  };

  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${side === 'left' ? 'bg-blue-500' : 'bg-orange-500'}`} />
          <span className="text-xs font-medium text-white">{title}</span>
          {tracks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({tracks.length})
            </span>
          )}
        </div>
        {tracks.length > 0 && (
          <div className="flex items-center gap-0.5">
            {selectedTracks.size > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-5 px-1 text-xs text-muted-foreground"
                  data-testid={`${testIdPrefix}-clear-selection-btn`}
                >
                  Clear
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteSelected}
                  className="h-5 px-1 text-xs text-destructive hover:text-destructive"
                  data-testid={`${testIdPrefix}-delete-selected-btn`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTracks}
                className="h-5 px-1 text-xs text-muted-foreground"
                data-testid={`${testIdPrefix}-select-all-btn`}
              >
                All
              </Button>
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

      <div
        className={`border-2 border-dashed rounded-md p-2 transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-white/20 hover:border-white/40'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid={`${testIdPrefix}-drop-zone`}
      >
        <div className="flex flex-col items-center gap-1 py-1">
          <Upload className={`w-4 h-4 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}>
            {tracks.length === 0 ? 'Drop or click' : 'Add more'}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="rounded-md border border-white/10 bg-black/20 overflow-y-auto"
          style={{ height: `${listHeight}px` }}
          onDragOver={handleScrollAreaDragOver}
          onDragLeave={handleScrollAreaDragLeave}
          onDrop={handleScrollAreaDrop}
        >
          <div className="p-1.5 space-y-0.5">
            {tracks.length === 0 ? (
              <div className="text-xs text-center text-muted-foreground py-4">
                No tracks yet
              </div>
            ) : (
              tracks.map((track, index) => (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => handleTrackDragStart(e, index)}
                  onDrag={handleTrackDrag}
                  onDragOver={(e) => handleTrackDragOver(e, index)}
                  onDragLeave={handleTrackDragLeave}
                  onDrop={(e) => handleTrackDrop(e, index)}
                  onDragEnd={handleTrackDragEnd}
                  className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 bg-primary/10'
                      : dragOverIndex === index
                      ? 'bg-primary/30 border-2 border-dashed border-primary'
                      : index === currentIndex 
                      ? 'bg-primary/20 border border-primary/30' 
                      : selectedTracks.has(track.id)
                      ? 'bg-white/10 border border-white/20'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => onSelectTrack(index)}
                  data-testid={`${testIdPrefix}-track-${index}`}
                >
                  <div
                    className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-white/10 rounded"
                    onMouseDown={(e) => e.stopPropagation()}
                    data-testid={`${testIdPrefix}-drag-handle-${index}`}
                  >
                    <GripVertical className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                  <Checkbox
                    checked={selectedTracks.has(track.id)}
                    onClick={(e) => toggleTrackSelection(track.id, e)}
                    className="shrink-0 h-3.5 w-3.5"
                    data-testid={`${testIdPrefix}-checkbox-${index}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${index === currentIndex ? 'text-primary' : 'text-white'}`}>
                      {track.name}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-2 flex items-center justify-center cursor-ns-resize hover:bg-white/10 rounded-b-md transition-colors"
          onMouseDown={handleResizeStart}
          data-testid={`${testIdPrefix}-resize-handle`}
        >
          <GripHorizontal className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

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
  const bothFileInputRef = useRef<HTMLInputElement>(null);
  const [isBothDragOver, setIsBothDragOver] = useState(false);

  const loopIcon = player.loopMode === 'track' ? (
    <Repeat1 className="w-4 h-4" />
  ) : (
    <Repeat className="w-4 h-4" />
  );

  const loopLabel = player.loopMode === 'off' ? 'Loop Off' : 
                    player.loopMode === 'playlist' ? 'Loop All' : 'Loop Track';

  const hasAnyTracks = player.leftTracks.length > 0 || player.rightTracks.length > 0;

  const handleBothFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      player.addBothFiles(files);
    }
    e.target.value = "";
  };

  const handleBothDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBothDragOver(true);
  };

  const handleBothDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBothDragOver(false);
  };

  const handleBothDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBothDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        /\.(mp3|wav|ogg|m4a|flac|aac|wma|m3u|m3u8|pls)$/i.test(file.name)
      );
      if (audioFiles.length > 0) {
        player.addBothFiles(audioFiles);
      }
    }
  };

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

      <input
        ref={bothFileInputRef}
        type="file"
        accept="audio/*,.m3u,.m3u8,.pls"
        multiple
        onChange={handleBothFileSelect}
        className="hidden"
        data-testid="stereo-both-file-input"
      />

      <div
        className={`border-2 border-dashed rounded-md p-3 transition-colors cursor-pointer ${
          isBothDragOver 
            ? 'border-green-500 bg-green-500/10' 
            : 'border-green-500/30 hover:border-green-500/60'
        }`}
        onDragOver={handleBothDragOver}
        onDragLeave={handleBothDragLeave}
        onDrop={handleBothDrop}
        onClick={() => bothFileInputRef.current?.click()}
        data-testid="stereo-both-drop-zone"
      >
        <div className="flex items-center justify-center gap-2">
          <Copy className={`w-4 h-4 ${isBothDragOver ? 'text-green-400' : 'text-green-500/70'}`} />
          <span className={`text-xs ${isBothDragOver ? 'text-green-400' : 'text-green-500/70'}`}>
            Drop files to add to BOTH ears
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <ChannelPlaylist
          title="Left Ear"
          tracks={player.leftTracks}
          currentTrack={player.leftTrack}
          currentIndex={player.leftIndex}
          onAddFiles={player.addLeftFiles}
          onRemoveTrack={player.removeLeftTrack}
          onRemoveMultiple={player.removeLeftMultiple}
          onMoveTrack={player.moveLeftTrack}
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
          onRemoveMultiple={player.removeRightMultiple}
          onMoveTrack={player.moveRightTrack}
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
              onClick={player.toggleShuffle}
              className={player.shuffle ? 'text-primary' : 'text-muted-foreground'}
              title={player.shuffle ? 'Shuffle On' : 'Shuffle Off'}
              data-testid="stereo-shuffle-btn"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            
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

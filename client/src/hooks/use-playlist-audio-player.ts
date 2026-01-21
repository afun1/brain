import { useRef, useState, useCallback, useEffect } from "react";

export interface PlaylistTrack {
  id: string;
  name: string;
  file?: File;
  objectUrl: string;
  duration?: number;
  isUrl?: boolean; // True if objectUrl is an external URL, not a blob URL
}

// Parse M3U playlist file content
function parseM3U(content: string): { name: string; url: string }[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const entries: { name: string; url: string }[] = [];
  let currentName = '';
  
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      // Format: #EXTINF:duration,title
      const match = line.match(/#EXTINF:[^,]*,(.+)/);
      if (match) {
        currentName = match[1].trim();
      }
    } else if (!line.startsWith('#')) {
      // This is a file path or URL
      const url = line;
      const name = currentName || url.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
      entries.push({ name, url });
      currentName = '';
    }
  }
  
  return entries;
}

// Parse PLS playlist file content
function parsePLS(content: string): { name: string; url: string }[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const entries: { name: string; url: string }[] = [];
  const files: Record<number, string> = {};
  const titles: Record<number, string> = {};
  
  for (const line of lines) {
    const fileMatch = line.match(/^File(\d+)=(.+)/i);
    if (fileMatch) {
      files[parseInt(fileMatch[1])] = fileMatch[2];
    }
    const titleMatch = line.match(/^Title(\d+)=(.+)/i);
    if (titleMatch) {
      titles[parseInt(titleMatch[1])] = titleMatch[2];
    }
  }
  
  for (const num of Object.keys(files).map(Number).sort((a, b) => a - b)) {
    const url = files[num];
    const name = titles[num] || url.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'Unknown';
    entries.push({ name, url });
  }
  
  return entries;
}

type LoopMode = 'off' | 'playlist' | 'track';
type Tuning = 440 | 432;

interface PersistedSettings {
  loopMode: LoopMode;
  volume: number;
  tuning?: Tuning;
  shuffle?: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function usePlaylistAudioPlayer(storageKey: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>('playlist');
  const [tuning, setTuningState] = useState<Tuning>(440);
  const [shuffle, setShuffle] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [shuffleActive, setShuffleActive] = useState(false);

  const currentTrack = tracks[currentIndex] || null;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const settings: PersistedSettings = JSON.parse(saved);
        setLoopMode(settings.loopMode || 'playlist');
        setVolumeState(settings.volume ?? 0.5);
        setTuningState(settings.tuning ?? 440);
        setShuffle(settings.shuffle ?? false);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    const settings: PersistedSettings = { loopMode, volume, tuning, shuffle };
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [loopMode, volume, tuning, shuffle, storageKey]);

  // Apply playback rate based on tuning (432/440 = ~0.9818 for A=432 Hz)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = tuning === 432 ? 432 / 440 : 1.0;
    }
  }, [tuning]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      tracks.forEach(track => {
        URL.revokeObjectURL(track.objectUrl);
      });
    };
  }, []);

  const loadTrack = useCallback((track: PlaylistTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = audioRef.current || new Audio();
    audio.src = track.objectUrl;
    audio.volume = volume;
    audio.loop = loopMode === 'track';
    audio.playbackRate = tuning === 432 ? 432 / 440 : 1.0;
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, duration: audio.duration } : t
      ));
    };
    
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    audio.onended = () => {
      if (loopMode === 'track') return;
      
      setTracks(currentTracks => {
        if (shuffleActive && shuffledIndices.length > 0) {
          const currentShufflePos = shuffledIndices.indexOf(currentIndex);
          if (currentShufflePos === -1) {
            if (loopMode === 'playlist') {
              if (shuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setShuffledIndices(newIndices);
                setCurrentIndex(newIndices[0] ?? 0);
              } else {
                setShuffleActive(false);
                setCurrentIndex(0);
              }
            } else {
              setIsPlaying(false);
            }
          } else {
            const nextShufflePos = currentShufflePos + 1;
            if (nextShufflePos < shuffledIndices.length) {
              setCurrentIndex(shuffledIndices[nextShufflePos] ?? 0);
            } else if (loopMode === 'playlist') {
              if (shuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setShuffledIndices(newIndices);
                setCurrentIndex(newIndices[0] ?? 0);
              } else {
                setShuffleActive(false);
                setCurrentIndex(0);
              }
            } else {
              setIsPlaying(false);
            }
          }
        } else {
          const nextIdx = currentIndex + 1;
          if (nextIdx < currentTracks.length) {
            setCurrentIndex(nextIdx);
          } else if (loopMode === 'playlist' && currentTracks.length > 0) {
            if (shuffle && !shuffleActive) {
              const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
              setShuffledIndices(newIndices);
              setShuffleActive(true);
              setCurrentIndex(newIndices[0] ?? 0);
            } else {
              setCurrentIndex(0);
            }
          } else {
            setIsPlaying(false);
          }
        }
        return currentTracks;
      });
    };

    audioRef.current = audio;
    setCurrentTime(0);
  }, [volume, loopMode, currentIndex, tuning, shuffle, shuffleActive, shuffledIndices]);

  useEffect(() => {
    if (currentTrack) {
      loadTrack(currentTrack);
      if (isPlaying) {
        audioRef.current?.play().catch(() => {});
      }
    }
  }, [currentIndex, tracks.length > 0 ? tracks[currentIndex]?.id : null]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newTracks: PlaylistTrack[] = [];
    
    for (const file of fileArray) {
      const fileName = file.name.toLowerCase();
      
      // Check if it's a playlist file
      if (fileName.endsWith('.m3u') || fileName.endsWith('.m3u8')) {
        try {
          const content = await file.text();
          const entries = parseM3U(content);
          for (const entry of entries) {
            // Check if it's a URL we can play
            if (entry.url.startsWith('http://') || entry.url.startsWith('https://')) {
              newTracks.push({
                id: generateId(),
                name: entry.name,
                objectUrl: entry.url,
                isUrl: true,
              });
            }
            // For local paths, we can't access them directly in browser
            // But we'll still add them as entries so user sees what's in the playlist
          }
        } catch (e) {
          console.error('Failed to parse M3U file:', e);
        }
      } else if (fileName.endsWith('.pls')) {
        try {
          const content = await file.text();
          const entries = parsePLS(content);
          for (const entry of entries) {
            if (entry.url.startsWith('http://') || entry.url.startsWith('https://')) {
              newTracks.push({
                id: generateId(),
                name: entry.name,
                objectUrl: entry.url,
                isUrl: true,
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse PLS file:', e);
        }
      } else {
        // Regular audio file
        const id = generateId();
        const objectUrl = URL.createObjectURL(file);
        newTracks.push({
          id,
          name: file.name.replace(/\.[^/.]+$/, ""),
          file,
          objectUrl,
        });
      }
    }
    
    if (newTracks.length > 0) {
      setTracks(prev => [...prev, ...newTracks]);
      
      if (tracks.length === 0) {
        setCurrentIndex(0);
      }
    }
  }, [tracks.length]);

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => {
      const trackToRemove = prev.find(t => t.id === id);
      if (trackToRemove && !trackToRemove.isUrl) {
        URL.revokeObjectURL(trackToRemove.objectUrl);
      }
      
      const index = prev.findIndex(t => t.id === id);
      const newTracks = prev.filter(t => t.id !== id);
      
      if (index <= currentIndex && currentIndex > 0) {
        setCurrentIndex(curr => Math.max(0, curr - 1));
      }
      if (index === currentIndex && isPlaying) {
        if (newTracks.length === 0) {
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
          }
        }
      }
      
      return newTracks;
    });
  }, [currentIndex, isPlaying]);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= tracks.length) return;
    
    setTracks(prev => {
      const newTracks = [...prev];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      
      if (fromIndex === currentIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex(curr => curr - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex(curr => curr + 1);
      }
      
      return newTracks;
    });
  }, [tracks.length, currentIndex]);

  const selectTrack = useCallback((index: number) => {
    if (index >= 0 && index < tracks.length) {
      setCurrentIndex(index);
      if (isPlaying) {
        setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
      }
    }
  }, [tracks.length, isPlaying]);

  const play = useCallback(() => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [tracks.length]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const getNextIndex = useCallback((): number => {
    if (tracks.length === 0) return 0;
    if (shuffleActive && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      if (currentShufflePos === -1) {
        return shuffledIndices[0] ?? 0;
      }
      const nextShufflePos = (currentShufflePos + 1) % shuffledIndices.length;
      return shuffledIndices[nextShufflePos] ?? 0;
    }
    return (currentIndex + 1) % tracks.length;
  }, [tracks.length, currentIndex, shuffleActive, shuffledIndices]);

  const getPrevIndex = useCallback((): number => {
    if (tracks.length === 0) return 0;
    if (shuffleActive && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentIndex);
      if (currentShufflePos === -1) {
        return shuffledIndices[shuffledIndices.length - 1] ?? 0;
      }
      const prevShufflePos = (currentShufflePos - 1 + shuffledIndices.length) % shuffledIndices.length;
      return shuffledIndices[prevShufflePos] ?? 0;
    }
    return (currentIndex - 1 + tracks.length) % tracks.length;
  }, [tracks.length, currentIndex, shuffleActive, shuffledIndices]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex(getNextIndex());
  }, [tracks.length, getNextIndex]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex(getPrevIndex());
  }, [tracks.length, getPrevIndex]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const cycleLoopMode = useCallback(() => {
    setLoopMode(prev => {
      const next = prev === 'off' ? 'playlist' : prev === 'playlist' ? 'track' : 'off';
      if (audioRef.current) {
        audioRef.current.loop = next === 'track';
      }
      return next;
    });
  }, []);

  const clearPlaylist = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    tracks.forEach(track => {
      URL.revokeObjectURL(track.objectUrl);
    });
    setTracks([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [tracks]);

  const toggleTuning = useCallback(() => {
    setTuningState(prev => prev === 440 ? 432 : 440);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      if (prev) {
        setShuffleActive(false);
        setShuffledIndices([]);
      }
      return !prev;
    });
  }, []);

  return {
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    volume,
    currentTime,
    duration,
    loopMode,
    tuning,
    shuffle,
    addFiles,
    removeTrack,
    moveTrack,
    selectTrack,
    play,
    pause,
    togglePlay,
    next,
    prev,
    setVolume,
    seek,
    cycleLoopMode,
    clearPlaylist,
    toggleTuning,
    toggleShuffle,
  };
}

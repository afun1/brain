import { useRef, useState, useCallback, useEffect } from "react";

export interface PlaylistTrack {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  duration?: number;
}

type LoopMode = 'off' | 'playlist' | 'track';
type Tuning = 440 | 432;

interface PersistedSettings {
  loopMode: LoopMode;
  volume: number;
  tuning?: Tuning;
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

  const currentTrack = tracks[currentIndex] || null;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const settings: PersistedSettings = JSON.parse(saved);
        setLoopMode(settings.loopMode || 'playlist');
        setVolumeState(settings.volume ?? 0.5);
        setTuningState(settings.tuning ?? 440);
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    const settings: PersistedSettings = { loopMode, volume, tuning };
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [loopMode, volume, tuning, storageKey]);

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
        const nextIndex = currentIndex + 1;
        if (nextIndex < currentTracks.length) {
          setCurrentIndex(nextIndex);
        } else if (loopMode === 'playlist' && currentTracks.length > 0) {
          setCurrentIndex(0);
        } else {
          setIsPlaying(false);
        }
        return currentTracks;
      });
    };

    audioRef.current = audio;
    setCurrentTime(0);
  }, [volume, loopMode, currentIndex, tuning]);

  useEffect(() => {
    if (currentTrack) {
      loadTrack(currentTrack);
      if (isPlaying) {
        audioRef.current?.play().catch(() => {});
      }
    }
  }, [currentIndex, tracks.length > 0 ? tracks[currentIndex]?.id : null]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newTracks: PlaylistTrack[] = Array.from(files).map(file => {
      const id = generateId();
      const objectUrl = URL.createObjectURL(file);
      return {
        id,
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        objectUrl,
      };
    });
    
    setTracks(prev => [...prev, ...newTracks]);
    
    if (tracks.length === 0 && newTracks.length > 0) {
      setCurrentIndex(0);
    }
  }, [tracks.length]);

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => {
      const trackToRemove = prev.find(t => t.id === id);
      if (trackToRemove) {
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

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentIndex(nextIndex);
  }, [tracks.length, currentIndex]);

  const prev = useCallback(() => {
    if (tracks.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prevIndex);
  }, [tracks.length, currentIndex]);

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
  };
}

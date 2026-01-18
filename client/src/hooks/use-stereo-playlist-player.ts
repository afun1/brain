import { useRef, useState, useCallback, useEffect } from "react";

export interface StereoTrack {
  id: string;
  name: string;
  file: File;
  objectUrl: string;
  duration?: number;
}

type LoopMode = 'off' | 'playlist' | 'track';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useStereoPlaylistPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftAudioRef = useRef<HTMLAudioElement | null>(null);
  const rightAudioRef = useRef<HTMLAudioElement | null>(null);
  const leftSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rightSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const leftPannerRef = useRef<StereoPannerNode | null>(null);
  const rightPannerRef = useRef<StereoPannerNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);

  const [leftTracks, setLeftTracks] = useState<StereoTrack[]>([]);
  const [rightTracks, setRightTracks] = useState<StereoTrack[]>([]);
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [leftVolume, setLeftVolumeState] = useState(1);
  const [rightVolume, setRightVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>('playlist');
  const [shuffle, setShuffle] = useState(false);
  const [leftShuffledIndices, setLeftShuffledIndices] = useState<number[]>([]);
  const [rightShuffledIndices, setRightShuffledIndices] = useState<number[]>([]);

  const leftTrack = leftTracks[leftIndex] || null;
  const rightTrack = rightTracks[rightIndex] || null;

  const initializeAudioSystem = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const ctx = audioContextRef.current;
    
    if (!leftAudioRef.current) {
      leftAudioRef.current = new Audio();
      const source = ctx.createMediaElementSource(leftAudioRef.current);
      const panner = ctx.createStereoPanner();
      const gain = ctx.createGain();
      
      panner.pan.value = -1;
      gain.gain.value = leftVolume * volume;
      
      source.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
      
      leftSourceRef.current = source;
      leftPannerRef.current = panner;
      leftGainRef.current = gain;
    }
    
    if (!rightAudioRef.current) {
      rightAudioRef.current = new Audio();
      const source = ctx.createMediaElementSource(rightAudioRef.current);
      const panner = ctx.createStereoPanner();
      const gain = ctx.createGain();
      
      panner.pan.value = 1;
      gain.gain.value = rightVolume * volume;
      
      source.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);
      
      rightSourceRef.current = source;
      rightPannerRef.current = panner;
      rightGainRef.current = gain;
    }
    
    isInitializedRef.current = true;
  }, [leftVolume, rightVolume, volume]);

  const cleanupAudioNodes = useCallback(() => {
    if (leftSourceRef.current) {
      leftSourceRef.current.disconnect();
      leftSourceRef.current = null;
    }
    if (rightSourceRef.current) {
      rightSourceRef.current.disconnect();
      rightSourceRef.current = null;
    }
    if (leftPannerRef.current) {
      leftPannerRef.current.disconnect();
      leftPannerRef.current = null;
    }
    if (rightPannerRef.current) {
      rightPannerRef.current.disconnect();
      rightPannerRef.current = null;
    }
    if (leftGainRef.current) {
      leftGainRef.current.disconnect();
      leftGainRef.current = null;
    }
    if (rightGainRef.current) {
      rightGainRef.current.disconnect();
      rightGainRef.current = null;
    }
    if (leftAudioRef.current) {
      leftAudioRef.current.pause();
      leftAudioRef.current.src = "";
      leftAudioRef.current = null;
    }
    if (rightAudioRef.current) {
      rightAudioRef.current.pause();
      rightAudioRef.current.src = "";
      rightAudioRef.current = null;
    }
    isInitializedRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudioNodes();
      leftTracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
      rightTracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (leftGainRef.current) {
      leftGainRef.current.gain.setTargetAtTime(leftVolume * volume, audioContextRef.current?.currentTime || 0, 0.01);
    }
    if (rightGainRef.current) {
      rightGainRef.current.gain.setTargetAtTime(rightVolume * volume, audioContextRef.current?.currentTime || 0, 0.01);
    }
  }, [volume, leftVolume, rightVolume]);

  useEffect(() => {
    if (shuffle) {
      if (leftTracks.length > 0) {
        const indices = Array.from({ length: leftTracks.length }, (_, i) => i);
        setLeftShuffledIndices(shuffleArray(indices));
      }
      if (rightTracks.length > 0) {
        const indices = Array.from({ length: rightTracks.length }, (_, i) => i);
        setRightShuffledIndices(shuffleArray(indices));
      }
    }
  }, [shuffle, leftTracks.length, rightTracks.length]);

  const loadLeftTrack = useCallback((track: StereoTrack) => {
    if (!leftAudioRef.current) return;
    
    const audio = leftAudioRef.current;
    audio.pause();
    audio.src = track.objectUrl;
    audio.loop = loopMode === 'track';
    
    audio.onloadedmetadata = () => {
      setLeftTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, duration: audio.duration } : t
      ));
      const leftDur = audio.duration || 0;
      const rightDur = rightAudioRef.current?.duration || 0;
      setDuration(Math.max(leftDur, rightDur));
    };
    
    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    audio.onended = () => {
      if (loopMode === 'track') return;
      
      setLeftTracks(currentTracks => {
        if (shuffle && leftShuffledIndices.length > 0) {
          const currentShufflePos = leftShuffledIndices.indexOf(leftIndex);
          if (currentShufflePos === -1) {
            if (loopMode === 'playlist') {
              setLeftIndex(leftShuffledIndices[0] ?? 0);
            }
          } else {
            const nextShufflePos = currentShufflePos + 1;
            if (nextShufflePos < leftShuffledIndices.length) {
              setLeftIndex(leftShuffledIndices[nextShufflePos] ?? 0);
            } else if (loopMode === 'playlist') {
              setLeftIndex(leftShuffledIndices[0] ?? 0);
            }
          }
        } else {
          const nextIdx = leftIndex + 1;
          if (nextIdx < currentTracks.length) {
            setLeftIndex(nextIdx);
          } else if (loopMode === 'playlist' && currentTracks.length > 0) {
            setLeftIndex(0);
          }
        }
        return currentTracks;
      });
    };
  }, [loopMode, leftIndex, shuffle, leftShuffledIndices]);

  const loadRightTrack = useCallback((track: StereoTrack) => {
    if (!rightAudioRef.current) return;
    
    const audio = rightAudioRef.current;
    audio.pause();
    audio.src = track.objectUrl;
    audio.loop = loopMode === 'track';
    
    audio.onloadedmetadata = () => {
      setRightTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, duration: audio.duration } : t
      ));
      const rightDur = audio.duration || 0;
      const leftDur = leftAudioRef.current?.duration || 0;
      setDuration(Math.max(leftDur, rightDur));
    };
    
    audio.onended = () => {
      if (loopMode === 'track') return;
      
      setRightTracks(currentTracks => {
        if (shuffle && rightShuffledIndices.length > 0) {
          const currentShufflePos = rightShuffledIndices.indexOf(rightIndex);
          if (currentShufflePos === -1) {
            if (loopMode === 'playlist') {
              setRightIndex(rightShuffledIndices[0] ?? 0);
            }
          } else {
            const nextShufflePos = currentShufflePos + 1;
            if (nextShufflePos < rightShuffledIndices.length) {
              setRightIndex(rightShuffledIndices[nextShufflePos] ?? 0);
            } else if (loopMode === 'playlist') {
              setRightIndex(rightShuffledIndices[0] ?? 0);
            }
          }
        } else {
          const nextIdx = rightIndex + 1;
          if (nextIdx < currentTracks.length) {
            setRightIndex(nextIdx);
          } else if (loopMode === 'playlist' && currentTracks.length > 0) {
            setRightIndex(0);
          }
        }
        return currentTracks;
      });
    };
  }, [loopMode, rightIndex, shuffle, rightShuffledIndices]);

  useEffect(() => {
    if (leftTrack && isInitializedRef.current && leftAudioRef.current) {
      loadLeftTrack(leftTrack);
      if (isPlaying) {
        leftAudioRef.current.play().catch(() => {});
      }
    }
  }, [leftIndex, leftTracks.length > 0 ? leftTracks[leftIndex]?.id : null]);

  useEffect(() => {
    if (rightTrack && isInitializedRef.current && rightAudioRef.current) {
      loadRightTrack(rightTrack);
      if (isPlaying) {
        rightAudioRef.current.play().catch(() => {});
      }
    }
  }, [rightIndex, rightTracks.length > 0 ? rightTracks[rightIndex]?.id : null]);

  const addLeftFiles = useCallback((files: FileList | File[]) => {
    const newTracks: StereoTrack[] = Array.from(files).map(file => ({
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    
    setLeftTracks(prev => [...prev, ...newTracks]);
    
    if (leftTracks.length === 0 && newTracks.length > 0) {
      setLeftIndex(0);
    }
  }, [leftTracks.length]);

  const addRightFiles = useCallback((files: FileList | File[]) => {
    const newTracks: StereoTrack[] = Array.from(files).map(file => ({
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    
    setRightTracks(prev => [...prev, ...newTracks]);
    
    if (rightTracks.length === 0 && newTracks.length > 0) {
      setRightIndex(0);
    }
  }, [rightTracks.length]);

  const addBothFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    const leftNewTracks: StereoTrack[] = fileArray.map(file => ({
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    
    const rightNewTracks: StereoTrack[] = fileArray.map(file => ({
      id: generateId(),
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      objectUrl: URL.createObjectURL(file),
    }));
    
    setLeftTracks(prev => [...prev, ...leftNewTracks]);
    setRightTracks(prev => [...prev, ...rightNewTracks]);
    
    if (leftTracks.length === 0 && leftNewTracks.length > 0) {
      setLeftIndex(0);
    }
    if (rightTracks.length === 0 && rightNewTracks.length > 0) {
      setRightIndex(0);
    }
  }, [leftTracks.length, rightTracks.length]);

  const removeLeftTrack = useCallback((id: string) => {
    setLeftTracks(prev => {
      const trackToRemove = prev.find(t => t.id === id);
      if (trackToRemove) {
        URL.revokeObjectURL(trackToRemove.objectUrl);
      }
      
      const index = prev.findIndex(t => t.id === id);
      const newTracks = prev.filter(t => t.id !== id);
      
      if (index <= leftIndex && leftIndex > 0) {
        setLeftIndex(curr => Math.max(0, curr - 1));
      }
      if (index === leftIndex && isPlaying) {
        if (newTracks.length === 0 && leftAudioRef.current) {
          leftAudioRef.current.pause();
          leftAudioRef.current.src = "";
        }
      }
      
      return newTracks;
    });
  }, [leftIndex, isPlaying]);

  const removeRightTrack = useCallback((id: string) => {
    setRightTracks(prev => {
      const trackToRemove = prev.find(t => t.id === id);
      if (trackToRemove) {
        URL.revokeObjectURL(trackToRemove.objectUrl);
      }
      
      const index = prev.findIndex(t => t.id === id);
      const newTracks = prev.filter(t => t.id !== id);
      
      if (index <= rightIndex && rightIndex > 0) {
        setRightIndex(curr => Math.max(0, curr - 1));
      }
      if (index === rightIndex && isPlaying) {
        if (newTracks.length === 0 && rightAudioRef.current) {
          rightAudioRef.current.pause();
          rightAudioRef.current.src = "";
        }
      }
      
      return newTracks;
    });
  }, [rightIndex, isPlaying]);

  const selectLeftTrack = useCallback((index: number) => {
    if (index >= 0 && index < leftTracks.length) {
      setLeftIndex(index);
      if (isPlaying && leftAudioRef.current) {
        setTimeout(() => leftAudioRef.current?.play().catch(() => {}), 50);
      }
    }
  }, [leftTracks.length, isPlaying]);

  const selectRightTrack = useCallback((index: number) => {
    if (index >= 0 && index < rightTracks.length) {
      setRightIndex(index);
      if (isPlaying && rightAudioRef.current) {
        setTimeout(() => rightAudioRef.current?.play().catch(() => {}), 50);
      }
    }
  }, [rightTracks.length, isPlaying]);

  const play = useCallback(async () => {
    const hasLeft = leftTracks.length > 0;
    const hasRight = rightTracks.length > 0;
    
    if (!hasLeft && !hasRight) return;
    
    await initializeAudioSystem();
    
    if (hasLeft && leftTrack && leftAudioRef.current) {
      loadLeftTrack(leftTrack);
    }
    if (hasRight && rightTrack && rightAudioRef.current) {
      loadRightTrack(rightTrack);
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const syncTime = 0;
    if (leftAudioRef.current && hasLeft) {
      leftAudioRef.current.currentTime = syncTime;
    }
    if (rightAudioRef.current && hasRight) {
      rightAudioRef.current.currentTime = syncTime;
    }
    
    const playPromises: Promise<void>[] = [];
    if (hasLeft && leftAudioRef.current) {
      playPromises.push(leftAudioRef.current.play().catch(() => {}));
    }
    if (hasRight && rightAudioRef.current) {
      playPromises.push(rightAudioRef.current.play().catch(() => {}));
    }
    
    await Promise.all(playPromises);
    setIsPlaying(true);
  }, [leftTracks.length, rightTracks.length, leftTrack, rightTrack, initializeAudioSystem, loadLeftTrack, loadRightTrack]);

  const pause = useCallback(() => {
    if (leftAudioRef.current) leftAudioRef.current.pause();
    if (rightAudioRef.current) rightAudioRef.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const nextBoth = useCallback(() => {
    if (leftTracks.length > 0) {
      if (shuffle && leftShuffledIndices.length > 0) {
        const currentPos = leftShuffledIndices.indexOf(leftIndex);
        if (currentPos === -1) {
          setLeftIndex(leftShuffledIndices[0] ?? 0);
        } else {
          const nextPos = (currentPos + 1) % leftShuffledIndices.length;
          setLeftIndex(leftShuffledIndices[nextPos] ?? 0);
        }
      } else {
        setLeftIndex((leftIndex + 1) % leftTracks.length);
      }
    }
    if (rightTracks.length > 0) {
      if (shuffle && rightShuffledIndices.length > 0) {
        const currentPos = rightShuffledIndices.indexOf(rightIndex);
        if (currentPos === -1) {
          setRightIndex(rightShuffledIndices[0] ?? 0);
        } else {
          const nextPos = (currentPos + 1) % rightShuffledIndices.length;
          setRightIndex(rightShuffledIndices[nextPos] ?? 0);
        }
      } else {
        setRightIndex((rightIndex + 1) % rightTracks.length);
      }
    }
    
    if (leftAudioRef.current) leftAudioRef.current.currentTime = 0;
    if (rightAudioRef.current) rightAudioRef.current.currentTime = 0;
    setCurrentTime(0);
  }, [leftTracks.length, rightTracks.length, leftIndex, rightIndex, shuffle, leftShuffledIndices, rightShuffledIndices]);

  const prevBoth = useCallback(() => {
    if (leftAudioRef.current && leftAudioRef.current.currentTime > 3) {
      leftAudioRef.current.currentTime = 0;
      if (rightAudioRef.current) rightAudioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (leftTracks.length > 0) {
      if (shuffle && leftShuffledIndices.length > 0) {
        const currentPos = leftShuffledIndices.indexOf(leftIndex);
        if (currentPos === -1) {
          setLeftIndex(leftShuffledIndices[leftShuffledIndices.length - 1] ?? 0);
        } else {
          const prevPos = (currentPos - 1 + leftShuffledIndices.length) % leftShuffledIndices.length;
          setLeftIndex(leftShuffledIndices[prevPos] ?? 0);
        }
      } else {
        setLeftIndex((leftIndex - 1 + leftTracks.length) % leftTracks.length);
      }
    }
    if (rightTracks.length > 0) {
      if (shuffle && rightShuffledIndices.length > 0) {
        const currentPos = rightShuffledIndices.indexOf(rightIndex);
        if (currentPos === -1) {
          setRightIndex(rightShuffledIndices[rightShuffledIndices.length - 1] ?? 0);
        } else {
          const prevPos = (currentPos - 1 + rightShuffledIndices.length) % rightShuffledIndices.length;
          setRightIndex(rightShuffledIndices[prevPos] ?? 0);
        }
      } else {
        setRightIndex((rightIndex - 1 + rightTracks.length) % rightTracks.length);
      }
    }
    
    if (leftAudioRef.current) leftAudioRef.current.currentTime = 0;
    if (rightAudioRef.current) rightAudioRef.current.currentTime = 0;
    setCurrentTime(0);
  }, [leftTracks.length, rightTracks.length, leftIndex, rightIndex, shuffle, leftShuffledIndices, rightShuffledIndices]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
  }, []);

  const setLeftVolume = useCallback((val: number) => {
    setLeftVolumeState(val);
  }, []);

  const setRightVolume = useCallback((val: number) => {
    setRightVolumeState(val);
  }, []);

  const seek = useCallback((time: number) => {
    if (leftAudioRef.current) {
      leftAudioRef.current.currentTime = time;
    }
    if (rightAudioRef.current) {
      rightAudioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  }, []);

  const cycleLoopMode = useCallback(() => {
    setLoopMode(prev => {
      const next = prev === 'off' ? 'playlist' : prev === 'playlist' ? 'track' : 'off';
      if (leftAudioRef.current) leftAudioRef.current.loop = next === 'track';
      if (rightAudioRef.current) rightAudioRef.current.loop = next === 'track';
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    cleanupAudioNodes();
    leftTracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
    rightTracks.forEach(track => URL.revokeObjectURL(track.objectUrl));
    setLeftTracks([]);
    setRightTracks([]);
    setLeftIndex(0);
    setRightIndex(0);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [leftTracks, rightTracks, cleanupAudioNodes]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      if (!prev) {
        if (leftTracks.length > 0) {
          const indices = Array.from({ length: leftTracks.length }, (_, i) => i);
          setLeftShuffledIndices(shuffleArray(indices));
        }
        if (rightTracks.length > 0) {
          const indices = Array.from({ length: rightTracks.length }, (_, i) => i);
          setRightShuffledIndices(shuffleArray(indices));
        }
      }
      return !prev;
    });
  }, [leftTracks.length, rightTracks.length]);

  return {
    leftTracks,
    rightTracks,
    leftTrack,
    rightTrack,
    leftIndex,
    rightIndex,
    isPlaying,
    volume,
    leftVolume,
    rightVolume,
    currentTime,
    duration,
    loopMode,
    shuffle,
    addLeftFiles,
    addRightFiles,
    addBothFiles,
    removeLeftTrack,
    removeRightTrack,
    selectLeftTrack,
    selectRightTrack,
    play,
    pause,
    togglePlay,
    nextBoth,
    prevBoth,
    setVolume,
    setLeftVolume,
    setRightVolume,
    seek,
    cycleLoopMode,
    clearAll,
    toggleShuffle,
  };
}

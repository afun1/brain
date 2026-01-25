import { useRef, useState, useCallback, useEffect } from "react";

export interface StereoTrack {
  id: string;
  name: string;
  file?: File;
  objectUrl: string;
  duration?: number;
  isUrl?: boolean;
}

type LoopMode = 'off' | 'playlist' | 'track';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Parse M3U playlist file content
function parseM3U(content: string): { name: string; url: string }[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  const entries: { name: string; url: string }[] = [];
  let currentName = '';
  
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const match = line.match(/#EXTINF:[^,]*,(.+)/);
      if (match) {
        currentName = match[1].trim();
      }
    } else if (!line.startsWith('#')) {
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

// Helper to process files including M3U/PLS
async function processAudioFiles(files: FileList | File[]): Promise<StereoTrack[]> {
  const fileArray = Array.from(files);
  const newTracks: StereoTrack[] = [];
  
  for (const file of fileArray) {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.m3u') || fileName.endsWith('.m3u8')) {
      try {
        const content = await file.text();
        const entries = parseM3U(content);
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
      newTracks.push({
        id: generateId(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        objectUrl: URL.createObjectURL(file),
      });
    }
  }
  
  return newTracks;
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
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const leftMergerRef = useRef<ChannelMergerNode | null>(null);
  const rightMergerRef = useRef<ChannelMergerNode | null>(null);
  const leftSplitterRef = useRef<ChannelSplitterNode | null>(null);
  const rightSplitterRef = useRef<ChannelSplitterNode | null>(null);
  const leftMonoGainRef = useRef<GainNode | null>(null);
  const rightMonoGainRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const lastLeftTimeRef = useRef<number>(0);
  const lastRightTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

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
  const [leftShuffleActive, setLeftShuffleActive] = useState(false);
  const [rightShuffleActive, setRightShuffleActive] = useState(false);
  
  // Refs to avoid stale closures in audio callbacks
  const loopModeRef = useRef<LoopMode>(loopMode);
  const shuffleRef = useRef(shuffle);
  const leftShuffleActiveRef = useRef(leftShuffleActive);
  const rightShuffleActiveRef = useRef(rightShuffleActive);
  const leftShuffledIndicesRef = useRef<number[]>(leftShuffledIndices);
  const rightShuffledIndicesRef = useRef<number[]>(rightShuffledIndices);
  const leftIndexRef = useRef(leftIndex);
  const rightIndexRef = useRef(rightIndex);

  const leftTrack = leftTracks[leftIndex] || null;
  const rightTrack = rightTracks[rightIndex] || null;

  // Keep refs in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);
  
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  
  useEffect(() => {
    leftShuffleActiveRef.current = leftShuffleActive;
  }, [leftShuffleActive]);
  
  useEffect(() => {
    rightShuffleActiveRef.current = rightShuffleActive;
  }, [rightShuffleActive]);
  
  useEffect(() => {
    leftShuffledIndicesRef.current = leftShuffledIndices;
  }, [leftShuffledIndices]);
  
  useEffect(() => {
    rightShuffledIndicesRef.current = rightShuffledIndices;
  }, [rightShuffledIndices]);
  
  useEffect(() => {
    leftIndexRef.current = leftIndex;
  }, [leftIndex]);
  
  useEffect(() => {
    rightIndexRef.current = rightIndex;
  }, [rightIndex]);

  // Keepalive mechanism to prevent browser from stopping audio and keep AudioContext alive
  useEffect(() => {
    const startKeepAlive = () => {
      if (keepAliveIntervalRef.current) return;
      
      keepAliveIntervalRef.current = window.setInterval(async () => {
        // Keep AudioContext alive
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          console.log('AudioContext suspended, resuming...');
          await audioContextRef.current.resume();
        }

        if (isPlayingRef.current) {
          // Check if left audio has stalled
          if (leftAudioRef.current && leftTracks.length > 0) {
            const leftTime = leftAudioRef.current.currentTime;
            if (leftTime === lastLeftTimeRef.current && !leftAudioRef.current.paused && !leftAudioRef.current.ended) {
              console.log('Left audio stalled, attempting recovery...');
              leftAudioRef.current.play().catch(() => {});
            }
            lastLeftTimeRef.current = leftTime;
          }
          
          // Check if right audio has stalled
          if (rightAudioRef.current && rightTracks.length > 0) {
            const rightTime = rightAudioRef.current.currentTime;
            if (rightTime === lastRightTimeRef.current && !rightAudioRef.current.paused && !rightAudioRef.current.ended) {
              console.log('Right audio stalled, attempting recovery...');
              rightAudioRef.current.play().catch(() => {});
            }
            lastRightTimeRef.current = rightTime;
          }
        }
      }, 5000); // Check every 5 seconds
    };

    const stopKeepAlive = () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
    };

    if (isPlaying) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }

    return () => stopKeepAlive();
  }, [isPlaying, leftTracks.length, rightTracks.length]);

  // Handle visibility changes - resume playback when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current) {
        // Resume AudioContext if suspended
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        // Resume audio elements if paused
        if (leftAudioRef.current && leftAudioRef.current.paused && leftTracks.length > 0) {
          leftAudioRef.current.play().catch(() => {});
        }
        if (rightAudioRef.current && rightAudioRef.current.paused && rightTracks.length > 0) {
          rightAudioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [leftTracks.length, rightTracks.length]);

  const initializeAudioSystem = useCallback(async () => {
    if (isInitializedRef.current) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    const ctx = audioContextRef.current;
    
    // For true channel isolation, we need to:
    // 1. Split stereo source into L/R channels
    // 2. Sum them to mono with a gain node
    // 3. Route mono signal to only one output channel via merger
    
    if (!leftAudioRef.current) {
      leftAudioRef.current = new Audio();
      const source = ctx.createMediaElementSource(leftAudioRef.current);
      
      // Split source into individual channels
      const splitter = ctx.createChannelSplitter(2);
      // Create mono sum gain node (mixes L+R to mono)
      const monoGain = ctx.createGain();
      monoGain.gain.value = 0.5; // Prevent clipping when summing
      // Volume control
      const volumeGain = ctx.createGain();
      volumeGain.gain.value = leftVolume * volume;
      // Merger to route mono to left channel only (input 0 = left output)
      const merger = ctx.createChannelMerger(2);
      
      // Connect: source -> splitter -> both channels to monoGain -> volumeGain -> merger input 0 (left only)
      source.connect(splitter);
      splitter.connect(monoGain, 0); // Left channel of source
      splitter.connect(monoGain, 1); // Right channel of source (summed to mono)
      monoGain.connect(volumeGain);
      volumeGain.connect(merger, 0, 0); // Route to left output channel only
      merger.connect(ctx.destination);
      
      leftSourceRef.current = source;
      leftSplitterRef.current = splitter;
      leftMonoGainRef.current = monoGain;
      leftGainRef.current = volumeGain;
      leftMergerRef.current = merger;
    }
    
    if (!rightAudioRef.current) {
      rightAudioRef.current = new Audio();
      const source = ctx.createMediaElementSource(rightAudioRef.current);
      
      // Split source into individual channels
      const splitter = ctx.createChannelSplitter(2);
      // Create mono sum gain node
      const monoGain = ctx.createGain();
      monoGain.gain.value = 0.5;
      // Volume control
      const volumeGain = ctx.createGain();
      volumeGain.gain.value = rightVolume * volume;
      // Merger to route mono to right channel only (input 1 = right output)
      const merger = ctx.createChannelMerger(2);
      
      // Connect: source -> splitter -> both channels to monoGain -> volumeGain -> merger input 1 (right only)
      source.connect(splitter);
      splitter.connect(monoGain, 0);
      splitter.connect(monoGain, 1);
      monoGain.connect(volumeGain);
      volumeGain.connect(merger, 0, 1); // Route to right output channel only
      merger.connect(ctx.destination);
      
      rightSourceRef.current = source;
      rightSplitterRef.current = splitter;
      rightMonoGainRef.current = monoGain;
      rightGainRef.current = volumeGain;
      rightMergerRef.current = merger;
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
    if (leftSplitterRef.current) {
      leftSplitterRef.current.disconnect();
      leftSplitterRef.current = null;
    }
    if (rightSplitterRef.current) {
      rightSplitterRef.current.disconnect();
      rightSplitterRef.current = null;
    }
    if (leftMonoGainRef.current) {
      leftMonoGainRef.current.disconnect();
      leftMonoGainRef.current = null;
    }
    if (rightMonoGainRef.current) {
      rightMonoGainRef.current.disconnect();
      rightMonoGainRef.current = null;
    }
    if (leftGainRef.current) {
      leftGainRef.current.disconnect();
      leftGainRef.current = null;
    }
    if (rightGainRef.current) {
      rightGainRef.current.disconnect();
      rightGainRef.current = null;
    }
    if (leftMergerRef.current) {
      leftMergerRef.current.disconnect();
      leftMergerRef.current = null;
    }
    if (rightMergerRef.current) {
      rightMergerRef.current.disconnect();
      rightMergerRef.current = null;
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

  const loadLeftTrack = useCallback((track: StereoTrack) => {
    if (!leftAudioRef.current) return;
    
    const audio = leftAudioRef.current;
    audio.pause();
    audio.src = track.objectUrl;
    audio.loop = loopMode === 'track'; // Loop track when in track mode
    
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
      // Use refs to get current values (avoid stale closures)
      const currentLoopMode = loopModeRef.current;
      const currentShuffle = shuffleRef.current;
      const currentShuffleActive = leftShuffleActiveRef.current;
      const currentShuffledIndices = leftShuffledIndicesRef.current;
      const currentIdx = leftIndexRef.current;
      
      // If in track loop mode, the audio element will handle looping automatically
      if (currentLoopMode === 'track') {
        return;
      }
      
      setLeftTracks(currentTracks => {
        if (currentShuffleActive && currentShuffledIndices.length > 0) {
          const currentShufflePos = currentShuffledIndices.indexOf(currentIdx);
          if (currentShufflePos === -1) {
            if (currentLoopMode === 'playlist') {
              if (currentShuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setLeftShuffledIndices(newIndices);
                setLeftIndex(newIndices[0] ?? 0);
              } else {
                setLeftShuffleActive(false);
                setLeftIndex(0);
              }
            }
          } else {
            const nextShufflePos = currentShufflePos + 1;
            if (nextShufflePos < currentShuffledIndices.length) {
              setLeftIndex(currentShuffledIndices[nextShufflePos] ?? 0);
            } else if (currentLoopMode === 'playlist') {
              if (currentShuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setLeftShuffledIndices(newIndices);
                setLeftIndex(newIndices[0] ?? 0);
              } else {
                setLeftShuffleActive(false);
                setLeftIndex(0);
              }
            }
          }
        } else {
          const nextIdx = currentIdx + 1;
          if (nextIdx < currentTracks.length) {
            setLeftIndex(nextIdx);
          } else if (currentLoopMode === 'playlist' && currentTracks.length > 0) {
            if (currentShuffle && !currentShuffleActive) {
              const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
              setLeftShuffledIndices(newIndices);
              setLeftShuffleActive(true);
              setLeftIndex(newIndices[0] ?? 0);
            } else {
              setLeftIndex(0);
            }
          }
        }
        return currentTracks;
      });
    };
  }, []);

  const loadRightTrack = useCallback((track: StereoTrack) => {
    if (!rightAudioRef.current) return;
    
    const audio = rightAudioRef.current;
    audio.pause();
    audio.src = track.objectUrl;
    audio.loop = loopMode === 'track'; // Loop track when in track mode
    
    audio.onloadedmetadata = () => {
      setRightTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, duration: audio.duration } : t
      ));
      const rightDur = audio.duration || 0;
      const leftDur = leftAudioRef.current?.duration || 0;
      setDuration(Math.max(leftDur, rightDur));
    };
    
    audio.onended = () => {
      // Use refs to get current values (avoid stale closures)
      const currentLoopMode = loopModeRef.current;
      const currentShuffle = shuffleRef.current;
      const currentShuffleActive = rightShuffleActiveRef.current;
      const currentShuffledIndices = rightShuffledIndicesRef.current;
      const currentIdx = rightIndexRef.current;
      
      // If in track loop mode, the audio element will handle looping automatically
      if (currentLoopMode === 'track') {
        return;
      }
      
      setRightTracks(currentTracks => {
        if (currentShuffleActive && currentShuffledIndices.length > 0) {
          const currentShufflePos = currentShuffledIndices.indexOf(currentIdx);
          if (currentShufflePos === -1) {
            if (currentLoopMode === 'playlist') {
              if (currentShuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setRightShuffledIndices(newIndices);
                setRightIndex(newIndices[0] ?? 0);
              } else {
                setRightShuffleActive(false);
                setRightIndex(0);
              }
            }
          } else {
            const nextShufflePos = currentShufflePos + 1;
            if (nextShufflePos < currentShuffledIndices.length) {
              setRightIndex(currentShuffledIndices[nextShufflePos] ?? 0);
            } else if (currentLoopMode === 'playlist') {
              if (currentShuffle) {
                const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
                setRightShuffledIndices(newIndices);
                setRightIndex(newIndices[0] ?? 0);
              } else {
                setRightShuffleActive(false);
                setRightIndex(0);
              }
            }
          }
        } else {
          const nextIdx = currentIdx + 1;
          if (nextIdx < currentTracks.length) {
            setRightIndex(nextIdx);
          } else if (currentLoopMode === 'playlist' && currentTracks.length > 0) {
            if (currentShuffle && !currentShuffleActive) {
              const newIndices = shuffleArray(Array.from({ length: currentTracks.length }, (_, i) => i));
              setRightShuffledIndices(newIndices);
              setRightShuffleActive(true);
              setRightIndex(newIndices[0] ?? 0);
            } else {
              setRightIndex(0);
            }
          }
        }
        return currentTracks;
      });
    };
  }, []);

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

  const addLeftFiles = useCallback(async (files: FileList | File[]) => {
    const newTracks = await processAudioFiles(files);
    
    if (newTracks.length > 0) {
      setLeftTracks(prev => [...prev, ...newTracks]);
      
      if (leftTracks.length === 0) {
        setLeftIndex(0);
      }
    }
  }, [leftTracks.length]);

  const addRightFiles = useCallback(async (files: FileList | File[]) => {
    const newTracks = await processAudioFiles(files);
    
    if (newTracks.length > 0) {
      setRightTracks(prev => [...prev, ...newTracks]);
      
      if (rightTracks.length === 0) {
        setRightIndex(0);
      }
    }
  }, [rightTracks.length]);

  const addBothFiles = useCallback(async (files: FileList | File[]) => {
    const processedTracks = await processAudioFiles(files);
    
    // Create separate track instances for left and right (with unique IDs)
    const leftNewTracks: StereoTrack[] = processedTracks.map(t => ({
      ...t,
      id: generateId(), // New ID for left
    }));
    
    const rightNewTracks: StereoTrack[] = processedTracks.map(t => ({
      ...t,
      id: generateId(), // New ID for right
      objectUrl: t.isUrl ? t.objectUrl : (t.file ? URL.createObjectURL(t.file) : t.objectUrl),
    }));
    
    if (leftNewTracks.length > 0) {
      setLeftTracks(prev => [...prev, ...leftNewTracks]);
      setRightTracks(prev => [...prev, ...rightNewTracks]);
      
      if (leftTracks.length === 0) {
        setLeftIndex(0);
      }
      if (rightTracks.length === 0) {
        setRightIndex(0);
      }
    }
  }, [leftTracks.length, rightTracks.length]);

  const removeLeftTrack = useCallback((id: string) => {
    setLeftTracks(prev => {
      const trackToRemove = prev.find(t => t.id === id);
      if (trackToRemove && !trackToRemove.isUrl) {
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
      if (trackToRemove && !trackToRemove.isUrl) {
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

  const removeLeftMultiple = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idsSet = new Set(ids);
    
    setLeftTracks(prev => {
      const currentTrackId = prev[leftIndex]?.id;
      const isCurrentRemoved = currentTrackId && idsSet.has(currentTrackId);
      
      prev.filter(t => idsSet.has(t.id)).forEach(t => URL.revokeObjectURL(t.objectUrl));
      const newTracks = prev.filter(t => !idsSet.has(t.id));
      
      if (newTracks.length === 0) {
        if (leftAudioRef.current) {
          leftAudioRef.current.pause();
          leftAudioRef.current.src = "";
        }
        setLeftIndex(0);
      } else if (isCurrentRemoved) {
        if (leftAudioRef.current) {
          leftAudioRef.current.pause();
          leftAudioRef.current.src = "";
        }
        setLeftIndex(0);
      } else {
        const newIndex = newTracks.findIndex(t => t.id === currentTrackId);
        if (newIndex !== leftIndex) {
          setLeftIndex(Math.max(0, newIndex));
        }
      }
      
      return newTracks;
    });
  }, [leftIndex]);

  const removeRightMultiple = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idsSet = new Set(ids);
    
    setRightTracks(prev => {
      const currentTrackId = prev[rightIndex]?.id;
      const isCurrentRemoved = currentTrackId && idsSet.has(currentTrackId);
      
      prev.filter(t => idsSet.has(t.id)).forEach(t => URL.revokeObjectURL(t.objectUrl));
      const newTracks = prev.filter(t => !idsSet.has(t.id));
      
      if (newTracks.length === 0) {
        if (rightAudioRef.current) {
          rightAudioRef.current.pause();
          rightAudioRef.current.src = "";
        }
        setRightIndex(0);
      } else if (isCurrentRemoved) {
        if (rightAudioRef.current) {
          rightAudioRef.current.pause();
          rightAudioRef.current.src = "";
        }
        setRightIndex(0);
      } else {
        const newIndex = newTracks.findIndex(t => t.id === currentTrackId);
        if (newIndex !== rightIndex) {
          setRightIndex(Math.max(0, newIndex));
        }
      }
      
      return newTracks;
    });
  }, [rightIndex]);

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
      if (leftShuffleActive && leftShuffledIndices.length > 0) {
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
      if (rightShuffleActive && rightShuffledIndices.length > 0) {
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
  }, [leftTracks.length, rightTracks.length, leftIndex, rightIndex, leftShuffleActive, rightShuffleActive, leftShuffledIndices, rightShuffledIndices]);

  const prevBoth = useCallback(() => {
    if (leftAudioRef.current && leftAudioRef.current.currentTime > 3) {
      leftAudioRef.current.currentTime = 0;
      if (rightAudioRef.current) rightAudioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (leftTracks.length > 0) {
      if (leftShuffleActive && leftShuffledIndices.length > 0) {
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
      if (rightShuffleActive && rightShuffledIndices.length > 0) {
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
  }, [leftTracks.length, rightTracks.length, leftIndex, rightIndex, leftShuffleActive, rightShuffleActive, leftShuffledIndices, rightShuffledIndices]);

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
      // Cycle through: off → playlist → track → off
      let next: LoopMode;
      if (prev === 'off') {
        next = 'playlist';
      } else if (prev === 'playlist') {
        next = 'track';
      } else {
        next = 'off';
      }
      
      // Loop tracks when in track mode
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

  const moveLeftTrack = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= leftTracks.length) return;
    if (toIndex < 0 || toIndex >= leftTracks.length) return;
    
    setLeftTracks(prev => {
      const newTracks = [...prev];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return newTracks;
    });
    
    if (leftIndex === fromIndex) {
      setLeftIndex(toIndex);
    } else if (fromIndex < leftIndex && toIndex >= leftIndex) {
      setLeftIndex(leftIndex - 1);
    } else if (fromIndex > leftIndex && toIndex <= leftIndex) {
      setLeftIndex(leftIndex + 1);
    }
  }, [leftTracks.length, leftIndex]);

  const moveRightTrack = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= rightTracks.length) return;
    if (toIndex < 0 || toIndex >= rightTracks.length) return;
    
    setRightTracks(prev => {
      const newTracks = [...prev];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return newTracks;
    });
    
    if (rightIndex === fromIndex) {
      setRightIndex(toIndex);
    } else if (fromIndex < rightIndex && toIndex >= rightIndex) {
      setRightIndex(rightIndex - 1);
    } else if (fromIndex > rightIndex && toIndex <= rightIndex) {
      setRightIndex(rightIndex + 1);
    }
  }, [rightTracks.length, rightIndex]);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const newShuffleState = !prev;
      if (newShuffleState) {
        // Activating shuffle - generate shuffled indices for both channels
        if (leftTracks.length > 0) {
          const leftIndices = shuffleArray(Array.from({ length: leftTracks.length }, (_, i) => i));
          setLeftShuffledIndices(leftIndices);
          setLeftShuffleActive(true);
        }
        if (rightTracks.length > 0) {
          const rightIndices = shuffleArray(Array.from({ length: rightTracks.length }, (_, i) => i));
          setRightShuffledIndices(rightIndices);
          setRightShuffleActive(true);
        }
      } else {
        // Deactivating shuffle - clear shuffle state
        setLeftShuffleActive(false);
        setRightShuffleActive(false);
        setLeftShuffledIndices([]);
        setRightShuffledIndices([]);
      }
      return newShuffleState;
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
    removeLeftMultiple,
    removeRightMultiple,
    moveLeftTrack,
    moveRightTrack,
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

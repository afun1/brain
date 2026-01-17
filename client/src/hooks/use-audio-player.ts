import { useRef, useState, useCallback, useEffect } from "react";

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }

    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.src = url;
    audio.volume = volume;
    audio.loop = true;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setIsLoaded(true);
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audioRef.current = audio;
    setFileName(file.name);
    setIsPlaying(false);
    setCurrentTime(0);
  }, [volume]);

  const play = useCallback(() => {
    if (audioRef.current && isLoaded) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isLoaded]);

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

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current && isLoaded) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [isLoaded]);

  const clear = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsLoaded(false);
    setFileName(null);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return {
    isPlaying,
    isLoaded,
    fileName,
    volume,
    currentTime,
    duration,
    loadFile,
    play,
    pause,
    togglePlay,
    setVolume,
    seek,
    clear,
  };
}

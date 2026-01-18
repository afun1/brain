import { useState, useRef, useCallback, useEffect } from "react";

interface UseTTSReaderOptions {
  onWordChange?: (wordIndex: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function useTTSReader(options: UseTTSReaderOptions = {}) {
  const { onWordChange, onComplete, onError } = options;
  
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [readSpeed, setReadSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("");
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordTimingsRef = useRef<{ start: number; end: number }[]>([]);
  const animationFrameRef = useRef<number>(0);

  const estimateWordTimings = useCallback((words: string[], audioDuration: number) => {
    const totalChars = words.reduce((sum, w) => sum + w.length, 0);
    let currentTime = 0;
    const timings: { start: number; end: number }[] = [];
    
    for (const word of words) {
      const wordDuration = (word.length / totalChars) * audioDuration;
      timings.push({
        start: currentTime,
        end: currentTime + wordDuration,
      });
      currentTime += wordDuration;
    }
    
    return timings;
  }, []);

  const updateHighlight = useCallback(() => {
    if (!audioRef.current || !isReading || isPaused) return;
    
    const currentTime = audioRef.current.currentTime;
    const timings = wordTimingsRef.current;
    
    let newIndex = -1;
    for (let i = 0; i < timings.length; i++) {
      if (currentTime >= timings[i].start && currentTime < timings[i].end) {
        newIndex = i;
        break;
      }
    }
    
    if (newIndex !== currentWordIndex) {
      setCurrentWordIndex(newIndex);
      onWordChange?.(newIndex);
    }
    
    if (isReading && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isReading, isPaused, currentWordIndex, onWordChange]);

  const startReading = useCallback(async (inputText: string) => {
    if (!inputText.trim()) {
      onError?.("No text to read");
      return;
    }
    
    setIsLoading(true);
    setText(inputText);
    
    const words = inputText.split(/\s+/).filter(w => w.length > 0);
    wordsRef.current = words;
    
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, speed: readSpeed }),
      });
      
      if (!response.ok) {
        throw new Error("TTS generation failed");
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadedmetadata = () => {
        wordTimingsRef.current = estimateWordTimings(words, audio.duration);
        audio.playbackRate = 1;
        audio.play();
        setIsReading(true);
        setIsPaused(false);
        setCurrentWordIndex(0);
        onWordChange?.(0);
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      };
      
      audio.onended = () => {
        setIsReading(false);
        setIsPaused(false);
        setCurrentWordIndex(-1);
        onWordChange?.(-1);
        onComplete?.();
        cancelAnimationFrame(animationFrameRef.current);
      };
      
      audio.onerror = () => {
        onError?.("Audio playback error");
        setIsReading(false);
        setIsLoading(false);
      };
      
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "TTS error");
    } finally {
      setIsLoading(false);
    }
  }, [readSpeed, estimateWordTimings, updateHighlight, onWordChange, onComplete, onError]);

  const pauseReading = useCallback(() => {
    if (audioRef.current && isReading) {
      audioRef.current.pause();
      setIsPaused(true);
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isReading]);

  const resumeReading = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isPaused, updateHighlight]);

  const stopReading = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsReading(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
    onWordChange?.(-1);
    cancelAnimationFrame(animationFrameRef.current);
  }, [onWordChange]);

  const toggleReading = useCallback((inputText?: string) => {
    if (isReading && !isPaused) {
      pauseReading();
    } else if (isPaused) {
      resumeReading();
    } else if (inputText || text) {
      startReading(inputText || text);
    }
  }, [isReading, isPaused, text, pauseReading, resumeReading, startReading]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && isReading && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    }
  }, [isReading, isPaused, updateHighlight]);

  return {
    isReading,
    isPaused,
    isLoading,
    currentWordIndex,
    readSpeed,
    setReadSpeed,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    toggleReading,
    words: wordsRef.current,
  };
}

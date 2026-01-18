import { useRef, useEffect, useState, useCallback } from "react";

// Types matching our schema/logic
export interface AudioStage {
  startCarrierFreq: number; // Left ear
  endCarrierFreq: number;
  startBeatFreq: number;    // Difference
  endBeatFreq: number;
  durationSeconds: number;
}

interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  totalTime: number;
  currentCarrier: number;
  currentBeat: number;
  volume: number;
}

export function useAudioEngine(stages: AudioStage[] = []) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCarrier, setCurrentCarrier] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [leftEnabled, setLeftEnabledState] = useState(true);
  const [rightEnabled, setRightEnabledState] = useState(true);
  
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Calculate total duration
  const totalDuration = stages.reduce((acc, stage) => acc + stage.durationSeconds, 0);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const play = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Create nodes
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const leftPan = ctx.createStereoPanner();
    const rightPan = ctx.createStereoPanner();
    const masterGain = ctx.createGain();

    // Configure routing
    leftOsc.connect(leftGain);
    leftGain.connect(leftPan);
    leftPan.connect(masterGain);
    
    rightOsc.connect(rightGain);
    rightGain.connect(rightPan);
    rightPan.connect(masterGain);
    
    masterGain.connect(ctx.destination);

    // Settings
    leftPan.pan.value = -1; // Hard left
    rightPan.pan.value = 1; // Hard right
    masterGain.gain.value = volume; // Initial volume
    leftGain.gain.value = leftEnabled ? 1 : 0;
    rightGain.gain.value = rightEnabled ? 1 : 0;

    // Schedule frequencies based on stages
    const now = ctx.currentTime;
    let accumulatedTime = now;
    
    // If resuming, we need to handle the offset (omitted for MVP simplicity - restarting logic mostly)
    // For a robust sleep timer, we usually restart from 0 or calculating offset is complex logic
    
    stages.forEach((stage) => {
      const duration = stage.durationSeconds;
      
      // Left Ear (Carrier)
      leftOsc.frequency.setValueAtTime(stage.startCarrierFreq, accumulatedTime);
      leftOsc.frequency.linearRampToValueAtTime(stage.endCarrierFreq, accumulatedTime + duration);
      
      // Right Ear (Carrier + Beat)
      const startRight = stage.startCarrierFreq + stage.startBeatFreq;
      const endRight = stage.endCarrierFreq + stage.endBeatFreq;
      
      rightOsc.frequency.setValueAtTime(startRight, accumulatedTime);
      rightOsc.frequency.linearRampToValueAtTime(endRight, accumulatedTime + duration);
      
      accumulatedTime += duration;
    });

    // Start oscillators
    leftOsc.start(now);
    rightOsc.start(now);
    leftOsc.stop(accumulatedTime);
    rightOsc.stop(accumulatedTime);

    // Store refs
    leftOscillatorRef.current = leftOsc;
    rightOscillatorRef.current = rightOsc;
    leftGainRef.current = leftGain;
    rightGainRef.current = rightGain;
    masterGainRef.current = masterGain;
    
    startTimeRef.current = Date.now();
    setIsPlaying(true);
    
    // Start status loop
    const updateLoop = () => {
      if (!ctx || !leftOsc || !rightOsc) return;
      
      const secondsElapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(secondsElapsed);

      // Find current stage to report correct frequencies
      let timeScanner = 0;
      let currentStage = null;
      let stageProgress = 0; // 0 to 1

      for (const stage of stages) {
        if (secondsElapsed >= timeScanner && secondsElapsed < timeScanner + stage.durationSeconds) {
          currentStage = stage;
          stageProgress = (secondsElapsed - timeScanner) / stage.durationSeconds;
          break;
        }
        timeScanner += stage.durationSeconds;
      }

      if (currentStage) {
        // Linear interpolation for display
        const curCar = currentStage.startCarrierFreq + (currentStage.endCarrierFreq - currentStage.startCarrierFreq) * stageProgress;
        const curBeat = currentStage.startBeatFreq + (currentStage.endBeatFreq - currentStage.startBeatFreq) * stageProgress;
        
        setCurrentCarrier(curCar);
        setCurrentBeat(curBeat);
      } else if (secondsElapsed >= totalDuration) {
        // Done
        stopAudio();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };
    
    updateLoop();

  }, [stages, volume, totalDuration, leftEnabled, rightEnabled]);

  const stopAudio = useCallback(() => {
    if (leftOscillatorRef.current) {
      try { leftOscillatorRef.current.stop(); } catch(e) {}
      leftOscillatorRef.current.disconnect();
    }
    if (rightOscillatorRef.current) {
      try { rightOscillatorRef.current.stop(); } catch(e) {}
      rightOscillatorRef.current.disconnect();
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setIsPlaying(false);
    setElapsedTime(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopAudio();
    } else {
      play();
    }
  }, [isPlaying, play, stopAudio]);

  const updateVolume = useCallback((val: number) => {
    setVolume(val);
    if (masterGainRef.current) {
      // Smooth volume transition
      masterGainRef.current.gain.setTargetAtTime(val, audioContextRef.current?.currentTime || 0, 0.1);
    }
  }, []);

  const reset = useCallback(() => {
    stopAudio();
    setElapsedTime(0);
    setCurrentCarrier(0);
    setCurrentBeat(0);
  }, [stopAudio]);

  const setLeftEnabled = useCallback((enabled: boolean) => {
    setLeftEnabledState(enabled);
    if (leftGainRef.current && audioContextRef.current) {
      leftGainRef.current.gain.setTargetAtTime(enabled ? 1 : 0, audioContextRef.current.currentTime, 0.05);
    }
  }, []);

  const setRightEnabled = useCallback((enabled: boolean) => {
    setRightEnabledState(enabled);
    if (rightGainRef.current && audioContextRef.current) {
      rightGainRef.current.gain.setTargetAtTime(enabled ? 1 : 0, audioContextRef.current.currentTime, 0.05);
    }
  }, []);

  // Calculate current left and right frequencies for display
  const currentLeftFreq = currentCarrier;
  const currentRightFreq = currentCarrier + currentBeat;

  return {
    isPlaying,
    togglePlay,
    volume,
    setVolume: updateVolume,
    elapsedTime,
    totalDuration,
    currentCarrier,
    currentBeat,
    reset,
    audioContext: audioContextRef.current,
    leftEnabled,
    setLeftEnabled,
    rightEnabled,
    setRightEnabled,
    currentLeftFreq,
    currentRightFreq,
  };
}

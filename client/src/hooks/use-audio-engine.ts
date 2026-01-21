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
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  
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
  const seekOffsetRef = useRef<number>(0);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Keepalive mechanism to prevent browser from suspending AudioContext
  useEffect(() => {
    const startKeepAlive = () => {
      if (keepAliveIntervalRef.current) return;
      
      keepAliveIntervalRef.current = window.setInterval(async () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended' && isPlayingRef.current) {
          console.log('AudioContext suspended, resuming...');
          await audioContextRef.current.resume();
        }
      }, 5000);
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
  }, [isPlaying]);

  // Handle visibility changes - resume AudioContext when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isPlayingRef.current && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Calculate total duration
  const totalDuration = stages.reduce((acc, stage) => acc + stage.durationSeconds, 0);
  
  // Initialize carrier/beat from first stage when stages change and not playing
  useEffect(() => {
    if (!isPlaying && stages.length > 0) {
      setCurrentCarrier(stages[0].startCarrierFreq);
      setCurrentBeat(stages[0].startBeatFreq);
    }
  }, [stages, isPlaying]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const play = useCallback((startOffset: number = 0) => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Store seek offset for time tracking
    seekOffsetRef.current = startOffset;

    // Create nodes
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const masterGain = ctx.createGain();
    
    // Use ChannelMergerNode for TRUE stereo isolation
    // This ensures left oscillator ONLY goes to left speaker, right ONLY to right
    const merger = ctx.createChannelMerger(2);

    // Ensure stereo output configuration
    ctx.destination.channelCount = 2;
    ctx.destination.channelCountMode = 'explicit';
    ctx.destination.channelInterpretation = 'discrete';
    
    // Configure master gain for stereo
    masterGain.channelCount = 2;
    masterGain.channelCountMode = 'explicit';
    masterGain.channelInterpretation = 'discrete';

    // Route left oscillator to left channel ONLY (input 0)
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    
    // Route right oscillator to right channel ONLY (input 1)
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    
    // Merger outputs stereo signal to master gain
    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Settings
    masterGain.gain.value = volume;
    leftGain.gain.value = leftEnabled ? 1 : 0;
    rightGain.gain.value = rightEnabled ? 1 : 0;
    
    mergerRef.current = merger;

    // Calculate starting stage based on startOffset
    let skipTime = 0;
    let startingStageIndex = 0;
    for (let i = 0; i < stages.length; i++) {
      if (startOffset < skipTime + stages[i].durationSeconds) {
        startingStageIndex = i;
        break;
      }
      skipTime += stages[i].durationSeconds;
    }

    // Schedule frequencies based on stages, starting from the offset position
    const now = ctx.currentTime;
    let accumulatedTime = now;
    
    // Transition time: how quickly to ramp to target frequency at start of each stage
    // 60 seconds provides smooth but noticeable transition (not jarring, not glacially slow)
    const TRANSITION_TIME = 60; // seconds
    
    // Track time through stages to handle offset correctly
    let stageStartTime = 0;
    
    stages.forEach((stage, index) => {
      const duration = stage.durationSeconds;
      
      // Skip stages that are before the startOffset
      if (stageStartTime + duration <= startOffset) {
        stageStartTime += duration;
        return;
      }
      
      // Calculate how much of this stage to skip if we're starting mid-stage
      const timeIntoStage = Math.max(0, startOffset - stageStartTime);
      const remainingDuration = duration - timeIntoStage;
      
      if (remainingDuration <= 0) {
        stageStartTime += duration;
        return;
      }
      
      // Use quick transition at start of stage, then hold steady
      // Transition time is capped to 1/3 of stage duration for short stages
      const transitionDuration = Math.min(TRANSITION_TIME, remainingDuration / 3);
      
      // Calculate interpolated starting frequencies if we're mid-stage
      const stageProgress = timeIntoStage / duration;
      const startCarrier = stage.startCarrierFreq + (stage.endCarrierFreq - stage.startCarrierFreq) * stageProgress;
      const startBeat = stage.startBeatFreq + (stage.endBeatFreq - stage.startBeatFreq) * stageProgress;
      
      // Left Ear (Carrier)
      leftOsc.frequency.setValueAtTime(startCarrier, accumulatedTime);
      leftOsc.frequency.linearRampToValueAtTime(stage.endCarrierFreq, accumulatedTime + transitionDuration);
      // Hold at end frequency for remainder of stage
      leftOsc.frequency.setValueAtTime(stage.endCarrierFreq, accumulatedTime + transitionDuration);
      
      // Right Ear (Carrier + Beat)
      const startRight = startCarrier + startBeat;
      const endRight = stage.endCarrierFreq + stage.endBeatFreq;
      
      rightOsc.frequency.setValueAtTime(startRight, accumulatedTime);
      rightOsc.frequency.linearRampToValueAtTime(endRight, accumulatedTime + transitionDuration);
      // Hold at end frequency for remainder of stage
      rightOsc.frequency.setValueAtTime(endRight, accumulatedTime + transitionDuration);
      
      accumulatedTime += remainingDuration;
      stageStartTime += duration;
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
      
      // Account for seek offset in elapsed time
      const secondsElapsed = seekOffsetRef.current + (Date.now() - startTimeRef.current) / 1000;
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
        // Match the audio engine's quick transition then hold behavior
        const stageDuration = currentStage.durationSeconds;
        const transitionDuration = Math.min(60, stageDuration / 3); // Same as audio engine
        const timeInStage = (secondsElapsed - timeScanner);
        
        // During transition period: interpolate. After: hold at end frequency.
        const transitionProgress = Math.min(1, timeInStage / transitionDuration);
        
        const curCar = currentStage.startCarrierFreq + (currentStage.endCarrierFreq - currentStage.startCarrierFreq) * transitionProgress;
        const curBeat = currentStage.startBeatFreq + (currentStage.endBeatFreq - currentStage.startBeatFreq) * transitionProgress;
        
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
      leftOscillatorRef.current = null;
    }
    if (rightOscillatorRef.current) {
      try { rightOscillatorRef.current.stop(); } catch(e) {}
      rightOscillatorRef.current.disconnect();
      rightOscillatorRef.current = null;
    }
    if (leftGainRef.current) {
      leftGainRef.current.disconnect();
      leftGainRef.current = null;
    }
    if (rightGainRef.current) {
      rightGainRef.current.disconnect();
      rightGainRef.current = null;
    }
    if (mergerRef.current) {
      mergerRef.current.disconnect();
      mergerRef.current = null;
    }
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
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
    seekOffsetRef.current = 0;
    setElapsedTime(0);
    setCurrentCarrier(0);
    setCurrentBeat(0);
  }, [stopAudio]);

  const seekTo = useCallback((time: number) => {
    const wasPlaying = isPlaying;
    stopAudio();
    seekOffsetRef.current = 0;
    if (wasPlaying || time > 0) {
      play(time);
    } else {
      setElapsedTime(time);
    }
  }, [isPlaying, play, stopAudio]);

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
    seekTo,
    audioContext: audioContextRef.current,
    leftEnabled,
    setLeftEnabled,
    rightEnabled,
    setRightEnabled,
    currentLeftFreq,
    currentRightFreq,
  };
}

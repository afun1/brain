import { useRef, useEffect, useState, useCallback } from "react";
import type { ProgressionSlot } from "@/components/ProgressionBuilder";

export function useProgressionAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const keepAliveIntervalRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [slots, setSlots] = useState<ProgressionSlot[]>([]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const startKeepAlive = () => {
      if (keepAliveIntervalRef.current) return;
      
      keepAliveIntervalRef.current = window.setInterval(async () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended' && isPlayingRef.current) {
          console.log('Progression AudioContext suspended, resuming...');
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

  useEffect(() => {
    return () => {
      stop();
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const setOscillatorFrequencies = useCallback((leftHz: number, rightHz: number) => {
    if (leftOscillatorRef.current && audioContextRef.current) {
      leftOscillatorRef.current.frequency.setTargetAtTime(leftHz, audioContextRef.current.currentTime, 0.1);
    }
    if (rightOscillatorRef.current && audioContextRef.current) {
      rightOscillatorRef.current.frequency.setTargetAtTime(rightHz, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

  const play = useCallback((progressionSlots: ProgressionSlot[]) => {
    if (progressionSlots.length === 0) return;

    const ctx = initAudio();
    if (!ctx) return;

    setSlots(progressionSlots);
    setCurrentSlotIndex(0);
    setElapsedTime(0);
    startTimeRef.current = performance.now();

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const masterGain = ctx.createGain();
    const merger = ctx.createChannelMerger(2);

    // Ensure stereo output configuration
    ctx.destination.channelCount = 2;
    ctx.destination.channelCountMode = 'explicit';
    ctx.destination.channelInterpretation = 'discrete';
    
    // Configure master gain for stereo
    masterGain.channelCount = 2;
    masterGain.channelCountMode = 'explicit';
    masterGain.channelInterpretation = 'discrete';

    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    masterGain.gain.value = volume;
    leftGain.gain.value = 1;
    rightGain.gain.value = 1;

    const firstSlot = progressionSlots[0];
    leftOsc.frequency.value = firstSlot.leftHz;
    rightOsc.frequency.value = firstSlot.rightHz;

    leftOsc.start();
    rightOsc.start();

    leftOscillatorRef.current = leftOsc;
    rightOscillatorRef.current = rightOsc;
    leftGainRef.current = leftGain;
    rightGainRef.current = rightGain;
    mergerRef.current = merger;
    masterGainRef.current = masterGain;

    setIsPlaying(true);
  }, [volume, initAudio]);

  useEffect(() => {
    if (!isPlaying || slots.length === 0) return;

    let localSlotIndex = 0;
    let slotStartTime = performance.now();

    const tick = () => {
      if (!isPlayingRef.current) return;

      const now = performance.now();
      const totalElapsed = (now - startTimeRef.current) / 1000;
      const slotElapsed = (now - slotStartTime) / 1000;
      const currentSlot = slots[localSlotIndex];

      if (!currentSlot) {
        stop();
        return;
      }

      const slotDurationSeconds = currentSlot.durationMinutes * 60;

      if (slotElapsed >= slotDurationSeconds) {
        localSlotIndex++;
        if (localSlotIndex >= slots.length) {
          stop();
          return;
        }
        slotStartTime = now;
        setCurrentSlotIndex(localSlotIndex);
        const nextSlot = slots[localSlotIndex];
        setOscillatorFrequencies(nextSlot.leftHz, nextSlot.rightHz);
      }

      setElapsedTime(Math.floor(slotElapsed));
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, slots, setOscillatorFrequencies]);

  const stop = useCallback(() => {
    if (leftOscillatorRef.current) {
      try { leftOscillatorRef.current.stop(); } catch (e) {}
      leftOscillatorRef.current.disconnect();
      leftOscillatorRef.current = null;
    }
    if (rightOscillatorRef.current) {
      try { rightOscillatorRef.current.stop(); } catch (e) {}
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    setCurrentSlotIndex(0);
    setElapsedTime(0);
    setSlots([]);
  }, []);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

  return {
    isPlaying,
    play,
    stop,
    volume,
    setVolume,
    currentSlotIndex,
    elapsedTime,
    currentSlot: slots[currentSlotIndex] || null,
  };
}

import { useRef, useEffect, useState, useCallback } from "react";

export function useCustomAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftPanRef = useRef<StereoPannerNode | null>(null);
  const rightPanRef = useRef<StereoPannerNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [carrierFreq, setCarrierFreqState] = useState(174);
  const [beatFreq, setBeatFreqState] = useState(4);

  const rightFreq = carrierFreq + beatFreq;

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
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

  const play = useCallback(() => {
    const ctx = initAudio();
    if (!ctx) return;

    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    const leftPan = ctx.createStereoPanner();
    const rightPan = ctx.createStereoPanner();
    const masterGain = ctx.createGain();

    leftOsc.connect(leftPan);
    leftPan.connect(masterGain);

    rightOsc.connect(rightPan);
    rightPan.connect(masterGain);

    masterGain.connect(ctx.destination);

    leftPan.pan.value = -1;
    rightPan.pan.value = 1;
    masterGain.gain.value = volume;

    leftOsc.frequency.value = carrierFreq;
    rightOsc.frequency.value = carrierFreq + beatFreq;

    leftOsc.start();
    rightOsc.start();

    leftOscillatorRef.current = leftOsc;
    rightOscillatorRef.current = rightOsc;
    leftPanRef.current = leftPan;
    rightPanRef.current = rightPan;
    masterGainRef.current = masterGain;

    setIsPlaying(true);
  }, [carrierFreq, beatFreq, volume, initAudio]);

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
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  const setCarrierFreq = useCallback((freq: number) => {
    setCarrierFreqState(freq);
    if (leftOscillatorRef.current && audioContextRef.current) {
      leftOscillatorRef.current.frequency.setTargetAtTime(
        freq, 
        audioContextRef.current.currentTime, 
        0.05
      );
    }
    if (rightOscillatorRef.current && audioContextRef.current) {
      rightOscillatorRef.current.frequency.setTargetAtTime(
        freq + beatFreq, 
        audioContextRef.current.currentTime, 
        0.05
      );
    }
  }, [beatFreq]);

  const setBeatFreq = useCallback((freq: number) => {
    setBeatFreqState(freq);
    if (rightOscillatorRef.current && audioContextRef.current) {
      rightOscillatorRef.current.frequency.setTargetAtTime(
        carrierFreq + freq, 
        audioContextRef.current.currentTime, 
        0.05
      );
    }
  }, [carrierFreq]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

  return {
    isPlaying,
    togglePlay,
    play,
    stop,
    volume,
    setVolume,
    carrierFreq,
    setCarrierFreq,
    beatFreq,
    setBeatFreq,
    rightFreq,
  };
}

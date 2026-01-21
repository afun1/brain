import { useRef, useEffect, useState, useCallback } from "react";

export function useCustomAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const mergerRef = useRef<ChannelMergerNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [carrierFreq, setCarrierFreqState] = useState(174);
  const [beatFreq, setBeatFreqState] = useState(4);
  const [carrierSide, setCarrierSideState] = useState<'left' | 'right'>('left');
  const [leftEnabled, setLeftEnabledState] = useState(true);
  const [rightEnabled, setRightEnabledState] = useState(true);

  const calculatedFreq = carrierFreq + beatFreq;
  const leftFreq = carrierSide === 'left' ? carrierFreq : calculatedFreq;
  const rightFreq = carrierSide === 'left' ? calculatedFreq : carrierFreq;

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

    masterGain.gain.value = volume;
    leftGain.gain.value = leftEnabled ? 1 : 0;
    rightGain.gain.value = rightEnabled ? 1 : 0;

    leftOsc.frequency.value = leftFreq;
    rightOsc.frequency.value = rightFreq;

    leftOsc.start();
    rightOsc.start();

    leftOscillatorRef.current = leftOsc;
    rightOscillatorRef.current = rightOsc;
    leftGainRef.current = leftGain;
    rightGainRef.current = rightGain;
    mergerRef.current = merger;
    masterGainRef.current = masterGain;

    setIsPlaying(true);
  }, [carrierFreq, beatFreq, volume, initAudio, leftFreq, rightFreq, carrierSide, leftEnabled, rightEnabled]);

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
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, play, stop]);

  const updateOscillatorFreqs = useCallback((carrier: number, beat: number, side: 'left' | 'right') => {
    const calc = carrier + beat;
    const newLeft = side === 'left' ? carrier : calc;
    const newRight = side === 'left' ? calc : carrier;
    
    if (leftOscillatorRef.current && audioContextRef.current) {
      leftOscillatorRef.current.frequency.setTargetAtTime(newLeft, audioContextRef.current.currentTime, 0.05);
    }
    if (rightOscillatorRef.current && audioContextRef.current) {
      rightOscillatorRef.current.frequency.setTargetAtTime(newRight, audioContextRef.current.currentTime, 0.05);
    }
  }, []);

  const setCarrierFreq = useCallback((freq: number) => {
    setCarrierFreqState(freq);
    updateOscillatorFreqs(freq, beatFreq, carrierSide);
  }, [beatFreq, carrierSide, updateOscillatorFreqs]);

  const setBeatFreq = useCallback((freq: number) => {
    setBeatFreqState(freq);
    updateOscillatorFreqs(carrierFreq, freq, carrierSide);
  }, [carrierFreq, carrierSide, updateOscillatorFreqs]);

  const setCarrierSide = useCallback((side: 'left' | 'right') => {
    setCarrierSideState(side);
    updateOscillatorFreqs(carrierFreq, beatFreq, side);
  }, [carrierFreq, beatFreq, updateOscillatorFreqs]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.1);
    }
  }, []);

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
    carrierSide,
    setCarrierSide,
    leftFreq,
    rightFreq,
    calculatedFreq,
    leftEnabled,
    setLeftEnabled,
    rightEnabled,
    setRightEnabled,
  };
}

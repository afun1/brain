import { useState, useMemo, useEffect } from "react";
import { usePrograms } from "@/hooks/use-programs";
import { useCustomAudio } from "@/hooks/use-custom-audio";
import { useAudioEngine } from "@/hooks/use-audio-engine";
import { WaveVisualizer } from "@/components/WaveVisualizer";
import { AudioFilePlayer } from "@/components/AudioFilePlayer";
import { StereoConfusionPlayer } from "@/components/StereoConfusionPlayer";
import { SleepProgressChart, MiniHypnogram } from "@/components/SleepProgressChart";
import { TTSLearningPlayer } from "@/components/TTSLearningPlayer";
import { AudiobookPlayer } from "@/components/AudiobookPlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, Volume2, Sliders, Headphones, 
  ArrowLeftRight, Moon, Brain, Timer, Sun, Zap, HelpCircle
} from "lucide-react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import type { SleepStage } from "@shared/schema";

const SOLFEGGIO_PRESETS = [
  { freq: 174, label: "174", name: "Foundation" },
  { freq: 285, label: "285", name: "Healing" },
  { freq: 396, label: "396", name: "Root" },
  { freq: 417, label: "417", name: "Sacral" },
  { freq: 432, label: "432", name: "Harmony" },
  { freq: 528, label: "528", name: "Love" },
  { freq: 639, label: "639", name: "Heart" },
  { freq: 741, label: "741", name: "Throat" },
  { freq: 852, label: "852", name: "Third Eye" },
  { freq: 963, label: "963", name: "Crown" },
];

const BEAT_PRESETS = [
  { freq: 0.5, label: "0.5", name: "Deep Delta" },
  { freq: 1, label: "1", name: "Delta" },
  { freq: 2, label: "2", name: "Delta" },
  { freq: 4, label: "4", name: "Theta" },
  { freq: 6, label: "6", name: "Theta" },
  { freq: 8, label: "8", name: "Alpha" },
  { freq: 10, label: "10", name: "Alpha" },
  { freq: 12, label: "12", name: "Beta" },
];

type Mode = "custom" | "program" | "learning" | "daytime";
type LearningTarget = "alpha" | "theta";
type DaytimeTarget = "beta" | "gamma";

const DURATION_OPTIONS = [
  { minutes: 10, label: "10 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 20, label: "20 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 hour" },
];

const DAYTIME_DURATION_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 25, label: "25 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "90 min" },
  { minutes: 120, label: "2 hours" },
];

export default function ConsolePage() {
  const { data: programs } = usePrograms();
  const customAudio = useCustomAudio();
  const [mode, setMode] = useState<Mode>("custom");
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  
  // Learning Mode state
  const [learningTarget, setLearningTarget] = useState<LearningTarget>("alpha");
  const [learningDuration, setLearningDuration] = useState(20); // minutes
  const [includeWindDown, setIncludeWindDown] = useState(true);
  
  // Daytime Mode state
  const [daytimeTarget, setDaytimeTarget] = useState<DaytimeTarget>("beta");
  const [daytimeDuration, setDaytimeDuration] = useState(25); // minutes
  const [includeRampUp, setIncludeRampUp] = useState(true);
  
  // Sleep Program wake-up sequence toggle
  const [includeWakeUp, setIncludeWakeUp] = useState(true);
  
  // Sleep duration options (in hours) - each ends in REM state for natural wake-up
  const SLEEP_DURATION_OPTIONS = [
    { hours: 5, cycles: 3, label: "5h (3 cycles)" },
    { hours: 6, cycles: 4, label: "6h (4 cycles)" },
    { hours: 7, cycles: 5, label: "7h (5 cycles)" },
    { hours: 7.5, cycles: 5, label: "7.5h (5 cycles)" },
    { hours: 8, cycles: 5, label: "8h (5 cycles)" },
    { hours: 9, cycles: 6, label: "9h (6 cycles)" },
    { hours: 10, cycles: 7, label: "10h (7 cycles)" },
  ];
  const SLEEP_DURATION_STORAGE_KEY = "binauralSleep_sleepDurationHours";
  
  const [sleepDurationHours, setSleepDurationHours] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(SLEEP_DURATION_STORAGE_KEY);
      if (stored) {
        const parsed = parseFloat(stored);
        if (SLEEP_DURATION_OPTIONS.some(opt => opt.hours === parsed)) {
          return parsed;
        }
      }
    } catch {}
    return 8; // Default 8 hours
  });
  
  // Persist sleep duration to localStorage
  useEffect(() => {
    localStorage.setItem(SLEEP_DURATION_STORAGE_KEY, sleepDurationHours.toString());
  }, [sleepDurationHours]);
  
  // Dynamic total program minutes based on selected sleep duration
  const totalProgramMinutes = sleepDurationHours * 60;
  
  // Custom frequency slots for Full Night Rest (10 slots, localStorage persisted)
  const DEFAULT_CUSTOM_FREQUENCIES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const DEFAULT_SLOT_DURATIONS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // minutes (user fills in)
  const CUSTOM_FREQ_STORAGE_KEY = "binauralSleep_customFrequencies";
  const CUSTOM_DURATION_STORAGE_KEY = "binauralSleep_slotDurationsMinutes";
  
  const [customFrequencySlots, setCustomFrequencySlots] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_FREQ_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 10 && parsed.every(f => typeof f === 'number' && f >= 60 && f <= 1000)) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_CUSTOM_FREQUENCIES;
  });
  
  // String state for frequency inputs to allow free typing
  const [frequencyInputs, setFrequencyInputs] = useState<string[]>(() => 
    DEFAULT_CUSTOM_FREQUENCIES.map(f => f === 0 ? '' : f.toString())
  );
  
  // Sync frequency inputs when customFrequencySlots changes (e.g., from localStorage on mount)
  // Show blank for 0 values to make typing easier
  useEffect(() => {
    setFrequencyInputs(customFrequencySlots.map(f => f === 0 ? '' : f.toString()));
  }, [customFrequencySlots]);
  
  const [slotDurations, setSlotDurations] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_DURATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 10 && parsed.every(d => typeof d === 'number' && d >= 0)) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_SLOT_DURATIONS;
  });
  
  // Persist custom frequencies to localStorage
  useEffect(() => {
    localStorage.setItem(CUSTOM_FREQ_STORAGE_KEY, JSON.stringify(customFrequencySlots));
  }, [customFrequencySlots]);
  
  // Persist slot durations to localStorage
  useEffect(() => {
    localStorage.setItem(CUSTOM_DURATION_STORAGE_KEY, JSON.stringify(slotDurations));
  }, [slotDurations]);
  
  // Update frequency input string (allows free typing)
  const handleFrequencyInputChange = (index: number, value: string) => {
    setFrequencyInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };
  
  // Validate and commit frequency on blur
  const handleFrequencyBlur = (index: number) => {
    const value = parseInt(frequencyInputs[index]) || 0;
    const clamped = Math.max(0, Math.min(1000, value));
    setCustomFrequencySlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = clamped;
      return newSlots;
    });
    setFrequencyInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = clamped.toString();
      return newInputs;
    });
  };
  
  // Direct update for presets (bypasses string state)
  const updateFrequencySlot = (index: number, value: number) => {
    const clamped = Math.max(60, Math.min(1000, value));
    setCustomFrequencySlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = clamped;
      return newSlots;
    });
    setFrequencyInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = clamped.toString();
      return newInputs;
    });
  };
  
  const updateSlotDuration = (index: number, value: number) => {
    const clamped = Math.max(0, Math.min(600, value)); // Max 600 minutes (10 hours)
    setSlotDurations(prev => {
      const newDurations = [...prev];
      newDurations[index] = clamped;
      return newDurations;
    });
  };
  
  const totalDurationMinutes = slotDurations.reduce((sum, d) => sum + d, 0);
  
  const normalizeAll = () => {
    // Clear frequencies to blank (0)
    setCustomFrequencySlots([...DEFAULT_CUSTOM_FREQUENCIES]);
    setFrequencyInputs(DEFAULT_CUSTOM_FREQUENCIES.map(() => ''));
    
    // Reset durations to blank (0)
    setSlotDurations([...DEFAULT_SLOT_DURATIONS]);
  };
  
  const fillWithSolfeggio = () => {
    setCustomFrequencySlots([174, 285, 396, 417, 432, 528, 639, 741, 852, 963]);
    setFrequencyInputs(["174", "285", "396", "417", "432", "528", "639", "741", "852", "963"]);
    setSlotDurations([...DEFAULT_SLOT_DURATIONS]);
  };
  
  // Generate preview stages for MiniHypnogram based on cycle count
  // Each cycle: N1 → N2 → N3 → N2 → REM pattern (~90 min each)
  const generatePreviewStages = (durationHours: number): SleepStage[] => {
    const cycleOption = SLEEP_DURATION_OPTIONS.find(opt => opt.hours === durationHours);
    const cycles = cycleOption?.cycles || 5;
    const totalSeconds = durationHours * 3600;
    const cycleLength = totalSeconds / cycles;
    
    const stages: SleepStage[] = [];
    let stageId = 1;
    let accumulatedDuration = 0;
    
    for (let c = 0; c < cycles; c++) {
      // Realistic sleep cycle structure based on sleep science:
      // Early cycles: More N3 (deep sleep), shorter REM
      // Later cycles: Less N3, longer REM
      const cycleProgress = c / Math.max(1, cycles - 1);
      
      // Fixed portions that sum to exactly 100%
      const n1Portion = 0.08; // 8% - brief N1 transition
      const n2aPortion = 0.17; // 17% - first N2 descent
      const n3Portion = 0.35 - cycleProgress * 0.15; // 35%→20% deep sleep decreases
      const n2bPortion = 0.15; // 15% - second N2 ascent
      const remPortion = 0.25 + cycleProgress * 0.15; // 25%→40% REM increases
      
      const stagesInCycle = [
        { name: `N1`, portion: n1Portion, startFreq: c === 0 ? 12 : 9, endFreq: 7 },
        { name: `N2`, portion: n2aPortion, startFreq: 7, endFreq: 5 },
        { name: `N3`, portion: n3Portion, startFreq: 5, endFreq: 1 },
        { name: `N2`, portion: n2bPortion, startFreq: 1, endFreq: 5 },
        { name: `REM`, portion: remPortion, startFreq: 5, endFreq: 9 },
      ];
      
      stagesInCycle.forEach((s) => {
        const duration = Math.round(cycleLength * s.portion);
        stages.push({
          id: stageId,
          programId: 0,
          order: stageId,
          name: `${s.name} Cycle ${c + 1}`,
          durationSeconds: duration,
          startBeatFreq: s.startFreq,
          endBeatFreq: s.endFreq,
          startCarrierFreq: 432,
          endCarrierFreq: 432,
        });
        accumulatedDuration += duration;
        stageId++;
      });
    }
    
    // Adjust final stage to match exact duration (fix rounding drift)
    const durationDiff = totalSeconds - accumulatedDuration;
    if (stages.length > 0 && durationDiff !== 0) {
      stages[stages.length - 1].durationSeconds += durationDiff;
    }
    
    return stages;
  };
  
  const selectedProgram = programs?.find(p => p.id === selectedProgramId);
  const isFullNightRest = selectedProgram?.name === "8-Hour Full Night Rest";
  
  // Generate wake-up stages (17 min total: 2 min REM→Alpha transition + 15 min beta awakening)
  // Starts from REM (9 Hz) to ensure smooth transition from dream state
  const wakeUpStages = useMemo((): SleepStage[] => {
    if (!includeWakeUp) return [];
    
    const baseOrder = 100; // Start after all program stages
    return [
      {
        id: 9000,
        programId: 0,
        name: "Dream Fade (REM→Alpha)",
        startBeatFreq: 9,  // Start from REM (dream state)
        endBeatFreq: 10,   // Gentle transition to Alpha
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: 120, // 2 min gentle transition
        order: baseOrder,
      },
      {
        id: 9001,
        programId: 0,
        name: "Wake Up - Low Beta",
        startBeatFreq: 10,
        endBeatFreq: 14,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: 300, // 5 min
        order: baseOrder + 1,
      },
      {
        id: 9002,
        programId: 0,
        name: "Wake Up - Mid Beta",
        startBeatFreq: 14,
        endBeatFreq: 18,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: 300, // 5 min
        order: baseOrder + 2,
      },
      {
        id: 9003,
        programId: 0,
        name: "Wake Up - Alert",
        startBeatFreq: 18,
        endBeatFreq: 20,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: 300, // 5 min
        order: baseOrder + 3,
      },
    ];
  }, [includeWakeUp]);
  
  // Scale and transform Full Night Rest stages based on selected duration
  // Also applies custom frequencies and ensures ending in REM state
  const transformFullNightRestStages = (stages: SleepStage[]): SleepStage[] => {
    if (!isFullNightRest || stages.length === 0) return stages;
    
    // Calculate original total duration and target duration
    const originalDurationSeconds = stages.reduce((sum, s) => sum + s.durationSeconds, 0);
    const targetDurationSeconds = totalProgramMinutes * 60;
    const scaleFactor = targetDurationSeconds / originalDurationSeconds;
    
    // Scale all stage durations proportionally using floor, then adjust last stage
    let scaledStages = stages.map((stage) => ({
      ...stage,
      durationSeconds: Math.floor(stage.durationSeconds * scaleFactor),
    }));
    
    // Ensure total duration exactly matches target by adjusting last stage
    const scaledTotal = scaledStages.reduce((sum, s) => sum + s.durationSeconds, 0);
    const durationDiff = targetDurationSeconds - scaledTotal;
    if (scaledStages.length > 0) {
      scaledStages[scaledStages.length - 1].durationSeconds += durationDiff;
    }
    
    // Add a final REM stage for refreshed wake-up (10 minutes at 9 Hz = true REM)
    // REM is 8-10 Hz range - waking from REM means waking from dreams = refreshed
    // Theta (4-7 Hz) causes grogginess - avoid ending in theta!
    const remWakeStage: SleepStage = {
      id: 9999,
      programId: 0,
      name: "Final REM (Dreams)",
      startBeatFreq: 9, // True REM frequency
      endBeatFreq: 9,   // Stay in REM for refreshed wake-up
      startCarrierFreq: 432,
      endCarrierFreq: 432,
      durationSeconds: 600, // 10 minutes
      order: 999,
    };
    
    // Reduce last stage by 10 min to make room for REM stage (if long enough)
    if (scaledStages.length > 0 && scaledStages[scaledStages.length - 1].durationSeconds > 600) {
      scaledStages[scaledStages.length - 1].durationSeconds -= 600;
      scaledStages.push(remWakeStage);
    } else {
      // If last stage is short, just modify its end frequency to REM
      const lastStage = scaledStages[scaledStages.length - 1];
      scaledStages[scaledStages.length - 1] = {
        ...lastStage,
        endBeatFreq: 9, // End in REM (not theta) for refreshed wake-up
      };
    }
    
    // Apply custom frequencies based on slot durations
    const totalMinutes = slotDurations.reduce((sum, d) => sum + d, 0);
    
    // Build cumulative time boundaries for each slot (in seconds)
    const slotBoundaries: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < 10; i++) {
      const slotProportion = totalMinutes > 0 ? slotDurations[i] / totalMinutes : 0.1;
      cumulative += slotProportion * targetDurationSeconds;
      slotBoundaries.push(cumulative);
    }
    
    // Get frequency for a given time point based on cumulative boundaries
    const getCustomFreqAtTime = (seconds: number): number => {
      for (let i = 0; i < 10; i++) {
        if (seconds < slotBoundaries[i]) {
          return customFrequencySlots[i] || 432; // Default to 432 Hz if slot is empty
        }
      }
      return customFrequencySlots[9] || 432;
    };
    
    // Transform stages with custom frequencies
    let currentTime = 0;
    return scaledStages.map((stage) => {
      const stageStart = currentTime;
      const stageEnd = currentTime + stage.durationSeconds;
      currentTime = stageEnd;
      
      const startFreq = getCustomFreqAtTime(stageStart);
      const endFreq = getCustomFreqAtTime(Math.max(0, stageEnd - 1));
      
      return {
        ...stage,
        startCarrierFreq: startFreq > 0 ? startFreq : stage.startCarrierFreq,
        endCarrierFreq: endFreq > 0 ? endFreq : stage.endCarrierFreq,
      };
    });
  };
  
  // Combine program stages with wake-up stages and apply transformations
  const programStagesWithWakeUp = useMemo(() => {
    const programStages = (selectedProgram?.stages as SleepStage[]) || [];
    const transformedStages = transformFullNightRestStages(programStages);
    return [...transformedStages, ...wakeUpStages];
  }, [selectedProgram, wakeUpStages, customFrequencySlots, slotDurations, isFullNightRest, totalProgramMinutes]);
  
  const programAudio = useAudioEngine(programStagesWithWakeUp);
  
  // Solfeggio frequencies cycle for Learning Mode - changes every ~9 minutes
  const SOLFEGGIO_FREQUENCIES = [174, 285, 396, 417, 432, 528, 639, 741, 852, 963];
  const FREQ_CHANGE_INTERVAL = 540; // 9 minutes per frequency
  
  // Helper: Get Solfeggio frequency at a given time point (cycles through all 10)
  const getFrequencyAtTime = (seconds: number) => {
    const freqIndex = Math.floor(seconds / FREQ_CHANGE_INTERVAL) % 10;
    return SOLFEGGIO_FREQUENCIES[freqIndex];
  };
  
  // Generate learning mode stages: brainwave stages with Solfeggio cycling within
  const learningStages = useMemo((): SleepStage[] => {
    const stages: SleepStage[] = [];
    const totalSeconds = learningDuration * 60;
    
    // Define brainwave stage structure based on target
    // Stage timing: wind-down (10%), alpha entry/theta transition (10%), sustain (80%)
    const windDownDuration = includeWindDown ? Math.min(300, Math.round(totalSeconds * 0.1)) : 0;
    const transitionDuration = Math.min(180, Math.round(totalSeconds * 0.1));
    const sustainDuration = totalSeconds - windDownDuration - transitionDuration;
    
    let timeOffset = 0;
    let stageOrder = 1;
    
    // Stage 1: Wind-down (Beta 15Hz → Alpha 10Hz)
    if (includeWindDown && windDownDuration > 0) {
      stages.push({
        id: stageOrder,
        programId: 0,
        name: "Wind Down",
        startBeatFreq: 15,
        endBeatFreq: 10,
        startCarrierFreq: getFrequencyAtTime(timeOffset),
        endCarrierFreq: getFrequencyAtTime(timeOffset + windDownDuration),
        durationSeconds: windDownDuration,
        order: stageOrder,
      });
      timeOffset += windDownDuration;
      stageOrder++;
    }
    
    // Stage 2: Alpha Entry or Alpha-to-Theta transition
    if (transitionDuration > 0) {
      if (learningTarget === "theta") {
        stages.push({
          id: stageOrder,
          programId: 0,
          name: "Alpha to Theta",
          startBeatFreq: 10,
          endBeatFreq: 6,
          startCarrierFreq: getFrequencyAtTime(timeOffset),
          endCarrierFreq: getFrequencyAtTime(timeOffset + transitionDuration),
          durationSeconds: transitionDuration,
          order: stageOrder,
        });
      } else {
        stages.push({
          id: stageOrder,
          programId: 0,
          name: "Alpha Entry",
          startBeatFreq: 10,
          endBeatFreq: 10,
          startCarrierFreq: getFrequencyAtTime(timeOffset),
          endCarrierFreq: getFrequencyAtTime(timeOffset + transitionDuration),
          durationSeconds: transitionDuration,
          order: stageOrder,
        });
      }
      timeOffset += transitionDuration;
      stageOrder++;
    }
    
    // Stage 3+: Sustained Alpha or Theta state
    // Break into segments aligned with frequency changes (~9 min each)
    const targetBeat = learningTarget === "alpha" ? 10 : 6;
    const stateName = learningTarget === "alpha" ? "Alpha Sustain" : "Deep Theta";
    
    let remainingSustain = sustainDuration;
    while (remainingSustain > 30) {
      // Calculate time until next frequency change
      const currentFreqStart = Math.floor(timeOffset / FREQ_CHANGE_INTERVAL);
      const nextFreqChangeAt = (currentFreqStart + 1) * FREQ_CHANGE_INTERVAL;
      const timeUntilChange = nextFreqChangeAt - timeOffset;
      
      // Stage duration: either until next freq change or remaining time
      const stageDuration = Math.min(timeUntilChange, remainingSustain);
      
      stages.push({
        id: stageOrder,
        programId: 0,
        name: stateName,
        startBeatFreq: targetBeat,
        endBeatFreq: targetBeat,
        startCarrierFreq: getFrequencyAtTime(timeOffset),
        endCarrierFreq: getFrequencyAtTime(timeOffset + stageDuration - 1), // Same freq within stage
        durationSeconds: Math.round(stageDuration),
        order: stageOrder,
      });
      
      timeOffset += stageDuration;
      remainingSustain -= stageDuration;
      stageOrder++;
    }
    
    return stages;
  }, [learningTarget, learningDuration, includeWindDown]);
  
  const learningAudio = useAudioEngine(learningStages);
  
  // Generate daytime mode stages dynamically
  const daytimeStages = useMemo((): SleepStage[] => {
    const stages: SleepStage[] = [];
    const totalSeconds = daytimeDuration * 60;
    const rampUpSeconds = includeRampUp ? Math.min(300, totalSeconds * 0.15) : 0; // 5 min or 15% max
    const mainSeconds = totalSeconds - rampUpSeconds;
    
    // Target frequencies: Beta = 20Hz, Gamma = 40Hz
    const targetFreq = daytimeTarget === "beta" ? 20 : 40;
    const startFreq = includeRampUp ? 12 : targetFreq; // Start from low beta if ramping up
    
    // Ramp-up phase: gradual increase to target frequency
    if (includeRampUp && rampUpSeconds > 0) {
      stages.push({
        id: 1,
        programId: 0,
        name: "Ramp Up",
        startBeatFreq: startFreq,
        endBeatFreq: targetFreq,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(rampUpSeconds),
        order: 1,
      });
    }
    
    if (daytimeTarget === "beta") {
      // Sustained beta state (15-30Hz, targeting 20Hz)
      stages.push({
        id: 2,
        programId: 0,
        name: "Beta Focus",
        startBeatFreq: targetFreq,
        endBeatFreq: targetFreq,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        durationSeconds: Math.round(mainSeconds),
        order: 2,
      });
    } else {
      // Gamma: might want slight variation for engagement
      const halfMain = mainSeconds / 2;
      
      stages.push({
        id: 2,
        programId: 0,
        name: "High Gamma",
        startBeatFreq: 40,
        endBeatFreq: 42,
        startCarrierFreq: 432,
        endCarrierFreq: 528,
        durationSeconds: Math.round(halfMain),
        order: 2,
      });
      
      stages.push({
        id: 3,
        programId: 0,
        name: "Peak Flow",
        startBeatFreq: 42,
        endBeatFreq: 40,
        startCarrierFreq: 528,
        endCarrierFreq: 432,
        durationSeconds: Math.round(halfMain),
        order: 3,
      });
    }
    
    return stages;
  }, [daytimeTarget, daytimeDuration, includeRampUp]);
  
  const daytimeAudio = useAudioEngine(daytimeStages);

  // Stop all other audio engines when switching modes to prevent overlap
  useEffect(() => {
    if (mode !== "custom" && customAudio.isPlaying) {
      customAudio.togglePlay();
    }
    if (mode !== "program" && programAudio.isPlaying) {
      programAudio.togglePlay();
    }
    if (mode !== "learning" && learningAudio.isPlaying) {
      learningAudio.togglePlay();
    }
    if (mode !== "daytime" && daytimeAudio.isPlaying) {
      daytimeAudio.togglePlay();
    }
  }, [mode]);

  const isPlaying = mode === "custom" 
    ? customAudio.isPlaying 
    : mode === "program" 
      ? programAudio.isPlaying 
      : mode === "learning"
        ? learningAudio.isPlaying
        : daytimeAudio.isPlaying;
  const beatFreq = mode === "custom" 
    ? customAudio.beatFreq 
    : mode === "program" 
      ? programAudio.currentBeat 
      : mode === "learning"
        ? learningAudio.currentBeat
        : daytimeAudio.currentBeat;

  const getCurrentStageName = () => {
    if (!selectedProgram || mode !== "program") return "";
    let timeScanner = 0;
    // Use transformed stages (scaled to selected duration) instead of original
    for (const stage of programStagesWithWakeUp) {
      if (programAudio.elapsedTime >= timeScanner && programAudio.elapsedTime < timeScanner + stage.durationSeconds) {
        return stage.name;
      }
      timeScanner += stage.durationSeconds;
    }
    if (programAudio.elapsedTime >= programAudio.totalDuration && programAudio.totalDuration > 0) {
      return "Complete";
    }
    return "Ready";
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgramSelect = (programId: number) => {
    programAudio.reset();
    setSelectedProgramId(programId);
    setMode("program");
  };
  
  const getLearningCurrentStage = () => {
    if (mode !== "learning") return "";
    let timeScanner = 0;
    for (const stage of learningStages) {
      if (learningAudio.elapsedTime >= timeScanner && learningAudio.elapsedTime < timeScanner + stage.durationSeconds) {
        return stage.name;
      }
      timeScanner += stage.durationSeconds;
    }
    if (learningAudio.elapsedTime >= learningAudio.totalDuration && learningAudio.totalDuration > 0) {
      return "Complete";
    }
    return "Ready";
  };
  
  const getDaytimeCurrentStage = () => {
    if (mode !== "daytime") return "";
    let timeScanner = 0;
    for (const stage of daytimeStages) {
      if (daytimeAudio.elapsedTime >= timeScanner && daytimeAudio.elapsedTime < timeScanner + stage.durationSeconds) {
        return stage.name;
      }
      timeScanner += stage.durationSeconds;
    }
    if (daytimeAudio.elapsedTime >= daytimeAudio.totalDuration && daytimeAudio.totalDuration > 0) {
      return "Complete";
    }
    return "Ready";
  };

  const handleTogglePlay = () => {
    if (mode === "custom") {
      customAudio.togglePlay();
    } else if (mode === "program") {
      programAudio.togglePlay();
    } else if (mode === "learning") {
      learningAudio.togglePlay();
    } else {
      daytimeAudio.togglePlay();
    }
  };

  const handleVolumeChange = (val: number) => {
    if (mode === "custom") {
      customAudio.setVolume(val);
    } else if (mode === "program") {
      programAudio.setVolume(val);
    } else if (mode === "learning") {
      learningAudio.setVolume(val);
    } else {
      daytimeAudio.setVolume(val);
    }
  };

  const currentVolume = mode === "custom" 
    ? customAudio.volume 
    : mode === "program" 
      ? programAudio.volume 
      : mode === "learning"
        ? learningAudio.volume
        : daytimeAudio.volume;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col">
      <WaveVisualizer isPlaying={isPlaying} beatFrequency={beatFreq} />

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/10">
        <div className="w-10" />
        <div className="flex items-center gap-3">
          <Moon className="w-5 h-5 text-primary" />
          <span className="text-sm tracking-widest uppercase font-semibold text-primary/80" data-testid="text-header-title">Binaural Sleep Console</span>
        </div>
        <Link href="/features">
          <Button variant="outline" size="sm" className="gap-2" data-testid="button-features-help">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Features & Instructions</span>
            <span className="sm:hidden">Help</span>
          </Button>
        </Link>
      </header>

      <main className="flex-1 relative z-10 flex flex-col px-4 py-4 pb-48 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-4">
          
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="custom" className="gap-2" data-testid="tab-custom">
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Custom</span>
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2" data-testid="tab-learning">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Learning</span>
              </TabsTrigger>
              <TabsTrigger value="daytime" className="gap-2" data-testid="tab-daytime">
                <Sun className="w-4 h-4" />
                <span className="hidden sm:inline">Daytime</span>
              </TabsTrigger>
              <TabsTrigger value="program" className="gap-2" data-testid="tab-program">
                <Moon className="w-4 h-4" />
                <span className="hidden sm:inline">Sleep</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="custom" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div 
                    className={`p-3 rounded-xl border transition-opacity ${customAudio.carrierSide === 'left' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}
                    style={{ opacity: customAudio.leftEnabled ? 1 : 0.4 }}
                    data-testid="card-left-channel"
                  >
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'left' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-left-freq">
                      {customAudio.leftFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground mb-2" data-testid="label-left-ear">Left</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => customAudio.setLeftEnabled(!customAudio.leftEnabled)}
                      className={`text-xs ${customAudio.leftEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                      data-testid="button-toggle-left-channel"
                    >
                      {customAudio.leftEnabled ? "On" : "Off"}
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                    <div className="text-xl font-bold text-accent animate-pulse" data-testid="text-beat-freq">
                      {customAudio.beatFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="label-beat-display">Beat</div>
                  </div>
                  <div 
                    className={`p-3 rounded-xl border transition-opacity ${customAudio.carrierSide === 'right' ? 'bg-primary/10 border-primary/20' : 'bg-white/5 border-white/10'}`}
                    style={{ opacity: customAudio.rightEnabled ? 1 : 0.4 }}
                    data-testid="card-right-channel"
                  >
                    <div className={`text-xl font-bold ${customAudio.carrierSide === 'right' ? 'text-primary' : 'text-muted-foreground'}`} data-testid="text-right-freq">
                      {customAudio.rightFreq} Hz
                    </div>
                    <div className="text-xs text-muted-foreground mb-2" data-testid="label-right-ear">Right</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => customAudio.setRightEnabled(!customAudio.rightEnabled)}
                      className={`text-xs ${customAudio.rightEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                      data-testid="button-toggle-right-channel"
                    >
                      {customAudio.rightEnabled ? "On" : "Off"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => customAudio.setCarrierSide(customAudio.carrierSide === 'left' ? 'right' : 'left')}
                    className="gap-2"
                    data-testid="button-swap-sides"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    Swap to {customAudio.carrierSide === 'left' ? 'Right' : 'Left'}
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-white" data-testid="label-carrier">Carrier (Solfeggio)</label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-carrier-value">{customAudio.carrierFreq} Hz</span>
                  </div>
                  <Slider
                    value={[customAudio.carrierFreq]}
                    onValueChange={([val]) => customAudio.setCarrierFreq(val)}
                    min={60}
                    max={1000}
                    step={1}
                    className="mb-2"
                    data-testid="slider-carrier"
                  />
                  <div className="flex flex-wrap gap-1">
                    {SOLFEGGIO_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={customAudio.carrierFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => customAudio.setCarrierFreq(preset.freq)}
                        className="text-xs"
                        data-testid={`button-preset-carrier-${preset.freq}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-white" data-testid="label-beat">Binaural Beat</label>
                    <span className="text-xs text-muted-foreground font-mono" data-testid="text-beat-value">{customAudio.beatFreq} Hz</span>
                  </div>
                  <Slider
                    value={[customAudio.beatFreq]}
                    onValueChange={([val]) => customAudio.setBeatFreq(val)}
                    min={0.5}
                    max={40}
                    step={0.5}
                    className="mb-2"
                    data-testid="slider-beat"
                  />
                  <div className="flex flex-wrap gap-1">
                    {BEAT_PRESETS.map((preset) => (
                      <Button
                        key={preset.freq}
                        variant={customAudio.beatFreq === preset.freq ? "default" : "outline"}
                        size="sm"
                        onClick={() => customAudio.setBeatFreq(preset.freq)}
                        className="text-xs"
                        data-testid={`button-preset-beat-${preset.freq}`}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-display text-white" data-testid="text-learning-title">Learning Mode</h3>
                  <p className="text-xs text-muted-foreground" data-testid="text-learning-description">
                    Optimize your focus with alpha or theta brainwave states
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-white" data-testid="label-target-state">Target State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={learningTarget === "alpha" ? "default" : "outline"}
                      onClick={() => {
                        learningAudio.reset();
                        setLearningTarget("alpha");
                      }}
                      className="flex flex-col items-center gap-1 whitespace-normal"
                      data-testid="button-target-alpha"
                    >
                      <span className="font-semibold">Alpha (8-12 Hz)</span>
                      <span className="text-[10px] opacity-70">Relaxed focus, learning</span>
                    </Button>
                    <Button
                      variant={learningTarget === "theta" ? "default" : "outline"}
                      onClick={() => {
                        learningAudio.reset();
                        setLearningTarget("theta");
                      }}
                      className="flex flex-col items-center gap-1 whitespace-normal"
                      data-testid="button-target-theta"
                    >
                      <span className="font-semibold">Theta (4-8 Hz)</span>
                      <span className="text-[10px] opacity-70">Deep meditation, creativity</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white" data-testid="label-wind-down">Wind Down</label>
                    <Button
                      variant={includeWindDown ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        learningAudio.reset();
                        setIncludeWindDown(!includeWindDown);
                      }}
                      className="text-xs"
                      data-testid="button-toggle-winddown"
                    >
                      {includeWindDown ? "On" : "Off"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground" data-testid="text-winddown-description">
                    Gradual transition from beta (alert) to your target state
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-white" data-testid="label-duration">Duration</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <Button
                        key={opt.minutes}
                        variant={learningDuration === opt.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          learningAudio.reset();
                          setLearningDuration(opt.minutes);
                        }}
                        className="text-xs"
                        data-testid={`button-duration-${opt.minutes}`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${learningTarget}-${learningDuration}-${includeWindDown}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="text-center py-2">
                      <div className="text-xl font-bold text-accent" data-testid="text-learning-stage">
                        {getLearningCurrentStage()}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="label-learning-current-stage">Current Stage</div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid="text-learning-elapsed">{formatTime(learningAudio.elapsedTime)}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="progress-bar-learning">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${learningAudio.totalDuration > 0 ? (learningAudio.elapsedTime / learningAudio.totalDuration) * 100 : 0}%` }}
                        />
                      </div>
                      <span data-testid="text-learning-total">{formatTime(learningAudio.totalDuration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                      <span data-testid="text-learning-beat">{Math.round(learningAudio.currentBeat * 10) / 10} Hz Beat</span>
                      <span>•</span>
                      <span data-testid="text-learning-carrier">{Math.round(learningAudio.currentCarrier)} Hz Carrier</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                      <div 
                        className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                        style={{ opacity: learningAudio.leftEnabled ? 1 : 0.4 }}
                        data-testid="card-learning-left"
                      >
                        <div className="text-lg font-bold text-primary" data-testid="text-learning-left-freq">
                          {Math.round(learningAudio.currentLeftFreq)} Hz
                        </div>
                        <div className="text-xs text-muted-foreground mb-2" data-testid="label-learning-left">Left</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => learningAudio.setLeftEnabled(!learningAudio.leftEnabled)}
                          className={`text-xs ${learningAudio.leftEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                          data-testid="button-toggle-learning-left"
                        >
                          {learningAudio.leftEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                      <div 
                        className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                        style={{ opacity: learningAudio.rightEnabled ? 1 : 0.4 }}
                        data-testid="card-learning-right"
                      >
                        <div className="text-lg font-bold text-primary" data-testid="text-learning-right-freq">
                          {Math.round(learningAudio.currentRightFreq)} Hz
                        </div>
                        <div className="text-xs text-muted-foreground mb-2" data-testid="label-learning-right">Right</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => learningAudio.setRightEnabled(!learningAudio.rightEnabled)}
                          className={`text-xs ${learningAudio.rightEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                          data-testid="button-toggle-learning-right"
                        >
                          {learningAudio.rightEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="h-px bg-white/10" />

                <TTSLearningPlayer />

                <div className="h-px bg-white/10" />

                <AudiobookPlayer />
              </div>
            </TabsContent>

            <TabsContent value="daytime" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4 space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-display text-white" data-testid="text-daytime-title">Daytime Mode</h3>
                  <p className="text-xs text-muted-foreground" data-testid="text-daytime-description">
                    Boost focus and energy with beta or gamma brainwave states
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-medium text-white" data-testid="label-daytime-target">Target State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={daytimeTarget === "beta" ? "default" : "outline"}
                      onClick={() => {
                        daytimeAudio.reset();
                        setDaytimeTarget("beta");
                      }}
                      className="flex flex-col items-center gap-1 whitespace-normal"
                      data-testid="button-target-beta"
                    >
                      <span className="font-semibold">Beta (15-30 Hz)</span>
                      <span className="text-[10px] opacity-70">Focus, concentration</span>
                    </Button>
                    <Button
                      variant={daytimeTarget === "gamma" ? "default" : "outline"}
                      onClick={() => {
                        daytimeAudio.reset();
                        setDaytimeTarget("gamma");
                      }}
                      className="flex flex-col items-center gap-1 whitespace-normal"
                      data-testid="button-target-gamma"
                    >
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span className="font-semibold">Gamma (30+ Hz)</span>
                      </div>
                      <span className="text-[10px] opacity-70">Peak flow, insight</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-white" data-testid="label-ramp-up">Ramp Up</label>
                    <Button
                      variant={includeRampUp ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        daytimeAudio.reset();
                        setIncludeRampUp(!includeRampUp);
                      }}
                      className="text-xs"
                      data-testid="button-toggle-rampup"
                    >
                      {includeRampUp ? "On" : "Off"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground" data-testid="text-rampup-description">
                    Gradual increase from low beta to your target frequency
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <label className="text-xs font-medium text-white" data-testid="label-daytime-duration">Duration</label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYTIME_DURATION_OPTIONS.map((opt) => (
                      <Button
                        key={opt.minutes}
                        variant={daytimeDuration === opt.minutes ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          daytimeAudio.reset();
                          setDaytimeDuration(opt.minutes);
                        }}
                        className="text-xs"
                        data-testid={`button-daytime-duration-${opt.minutes}`}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${daytimeTarget}-${daytimeDuration}-${includeRampUp}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="text-center py-2">
                      <div className="text-xl font-bold text-accent" data-testid="text-daytime-stage">
                        {getDaytimeCurrentStage()}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="label-daytime-current-stage">Current Stage</div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span data-testid="text-daytime-elapsed">{formatTime(daytimeAudio.elapsedTime)}</span>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="progress-bar-daytime">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${daytimeAudio.totalDuration > 0 ? (daytimeAudio.elapsedTime / daytimeAudio.totalDuration) * 100 : 0}%` }}
                        />
                      </div>
                      <span data-testid="text-daytime-total">{formatTime(daytimeAudio.totalDuration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                      <span data-testid="text-daytime-beat">{Math.round(daytimeAudio.currentBeat * 10) / 10} Hz Beat</span>
                      <span>•</span>
                      <span data-testid="text-daytime-carrier">{Math.round(daytimeAudio.currentCarrier)} Hz Carrier</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                      <div 
                        className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                        style={{ opacity: daytimeAudio.leftEnabled ? 1 : 0.4 }}
                        data-testid="card-daytime-left"
                      >
                        <div className="text-lg font-bold text-primary" data-testid="text-daytime-left-freq">
                          {Math.round(daytimeAudio.currentLeftFreq)} Hz
                        </div>
                        <div className="text-xs text-muted-foreground mb-2" data-testid="label-daytime-left">Left</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => daytimeAudio.setLeftEnabled(!daytimeAudio.leftEnabled)}
                          className={`text-xs ${daytimeAudio.leftEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                          data-testid="button-toggle-daytime-left"
                        >
                          {daytimeAudio.leftEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                      <div 
                        className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                        style={{ opacity: daytimeAudio.rightEnabled ? 1 : 0.4 }}
                        data-testid="card-daytime-right"
                      >
                        <div className="text-lg font-bold text-primary" data-testid="text-daytime-right-freq">
                          {Math.round(daytimeAudio.currentRightFreq)} Hz
                        </div>
                        <div className="text-xs text-muted-foreground mb-2" data-testid="label-daytime-right">Right</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => daytimeAudio.setRightEnabled(!daytimeAudio.rightEnabled)}
                          className={`text-xs ${daytimeAudio.rightEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                          data-testid="button-toggle-daytime-right"
                        >
                          {daytimeAudio.rightEnabled ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="program" className="space-y-4 mt-0">
              <div className="glass-panel rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {programs?.map((program) => (
                    <div
                      key={program.id}
                      onClick={() => handleProgramSelect(program.id)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all ${
                        selectedProgramId === program.id 
                          ? 'bg-primary/20 border-primary' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      data-testid={`button-program-${program.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-white">{program.name}</span>
                        {program.isDefault && (
                          <span className="text-[10px] bg-primary/30 text-primary px-2 py-0.5 rounded-full">Recommended</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{program.description}</p>
                      <MiniHypnogram stages={generatePreviewStages(sleepDurationHours)} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Wake-Up Sequence</div>
                    <div className="text-[10px] text-muted-foreground">
                      Gentle REM→Beta transition (+17 min after {sleepDurationHours}h sleep)
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIncludeWakeUp(!includeWakeUp)}
                    className={`text-xs ${includeWakeUp ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                    data-testid="button-toggle-wakeup"
                  >
                    {includeWakeUp ? "Yes" : "No"}
                  </Button>
                </div>

                {isFullNightRest && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4" data-testid="section-custom-frequencies">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-white">Custom Frequencies</div>
                        <div className="text-[10px] text-muted-foreground">
                          Set frequency and duration (min) for each slot
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={normalizeAll}
                          className="text-xs"
                          data-testid="button-clear"
                        >
                          Clear All
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={fillWithSolfeggio}
                          className="text-xs"
                          data-testid="button-fill-solfeggio"
                        >
                          Fill Solfeggio
                        </Button>
                      </div>
                    </div>
                    
                    {/* Sleep Duration Selector */}
                    <div className="mb-3 p-2 rounded-lg bg-white/5 border border-white/10" data-testid="sleep-duration-selector">
                      <div className="text-[10px] text-muted-foreground mb-2">Sleep Duration (ends in REM for natural wake-up)</div>
                      <div className="flex flex-wrap gap-1">
                        {SLEEP_DURATION_OPTIONS.map((option) => (
                          <Button
                            key={option.hours}
                            variant={sleepDurationHours === option.hours ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSleepDurationHours(option.hours)}
                            className="text-[10px] px-2"
                            data-testid={`button-duration-${option.hours}`}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Time Coverage Meter - shows percentage of selected sleep duration */}
                    <div className="mb-3" data-testid="time-coverage-meter">
                      <div className="flex h-4 rounded-md overflow-hidden border border-white/20">
                        {slotDurations.map((duration, idx) => {
                          const percent = totalProgramMinutes > 0 ? (duration / totalProgramMinutes) * 100 : 10;
                          const colors = [
                            "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
                            "bg-green-500", "bg-emerald-500", "bg-cyan-500", "bg-blue-500", "bg-purple-500"
                          ];
                          return (
                            <div
                              key={idx}
                              className={`${colors[idx]} transition-all duration-300 flex items-center justify-center`}
                              style={{ width: `${percent}%` }}
                              title={`Slot ${idx + 1}: ${customFrequencySlots[idx]} Hz - ${duration} min (${percent.toFixed(1)}%)`}
                              data-testid={`meter-segment-${idx}`}
                            >
                              {percent >= 8 && (
                                <span className="text-[8px] text-white/80 font-medium">{idx + 1}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1 text-[9px] text-muted-foreground">
                        <span>0 min</span>
                        <span>Total: {totalDurationMinutes} min ({((totalDurationMinutes / totalProgramMinutes) * 100).toFixed(0)}%)</span>
                        <span>{totalProgramMinutes} min ({sleepDurationHours}h)</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-2">
                      {customFrequencySlots.map((freq, idx) => {
                        const solfeggio = SOLFEGGIO_PRESETS.find(s => s.freq === freq);
                        const colors = [
                          "border-red-500/50", "border-orange-500/50", "border-amber-500/50", "border-yellow-500/50", "border-lime-500/50",
                          "border-green-500/50", "border-emerald-500/50", "border-cyan-500/50", "border-blue-500/50", "border-purple-500/50"
                        ];
                        return (
                          <div key={idx} className={`flex flex-col items-center p-1.5 rounded-lg border ${colors[idx]} bg-white/5`} data-testid={`slot-${idx}`}>
                            <div className="text-[10px] text-muted-foreground mb-1">#{idx + 1}</div>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={frequencyInputs[idx]}
                              onChange={(e) => handleFrequencyInputChange(idx, e.target.value)}
                              onBlur={() => handleFrequencyBlur(idx)}
                              className="w-full py-1 text-center text-xs bg-zinc-900 border border-white/20 rounded text-white focus:border-primary focus:outline-none"
                              data-testid={`input-freq-${idx}`}
                            />
                            {solfeggio && (
                              <div className="text-[8px] text-accent mt-0.5 truncate w-full text-center">{solfeggio.name}</div>
                            )}
                            <div className="flex items-center gap-0.5 mt-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={slotDurations[idx] === 0 ? '' : slotDurations[idx]}
                                onChange={(e) => updateSlotDuration(idx, parseInt(e.target.value) || 0)}
                                className="w-12 py-0.5 text-center text-[10px] bg-zinc-800 border border-white/10 rounded text-white focus:border-primary focus:outline-none"
                                data-testid={`input-duration-${idx}`}
                              />
                              <span className="text-[9px] text-muted-foreground">min</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[9px] text-muted-foreground">
                      <span>Quick presets:</span>
                      {SOLFEGGIO_PRESETS.map((preset, presetIdx) => (
                        <span
                          key={preset.freq}
                          onClick={() => updateFrequencySlot(presetIdx, preset.freq)}
                          className={`px-1 cursor-pointer rounded ${
                            customFrequencySlots[presetIdx] === preset.freq
                              ? 'text-accent font-medium'
                              : 'text-muted-foreground/60'
                          }`}
                          data-testid={`preset-${preset.freq}`}
                        >
                          {preset.freq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProgram && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedProgram.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="text-center py-4">
                        <h3 className="text-lg font-display text-white mb-1" data-testid="text-program-name">{selectedProgram.name}</h3>
                        <p className="text-xs text-muted-foreground mb-3" data-testid="text-program-description">{selectedProgram.description}</p>
                        
                        <div className="flex items-center justify-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xl font-bold text-accent" data-testid="text-current-stage">
                              {getCurrentStageName()}
                            </div>
                            <div className="text-xs text-muted-foreground" data-testid="label-current-stage">Current Stage</div>
                          </div>
                        </div>
                      </div>

                      <SleepProgressChart
                        stages={programStagesWithWakeUp}
                        elapsedTime={programAudio.elapsedTime}
                        currentBeat={programAudio.currentBeat}
                        currentStageName={getCurrentStageName()}
                      />

                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 font-mono">
                        <span data-testid="text-program-beat">{Math.round(programAudio.currentBeat * 10) / 10} Hz Beat</span>
                        <span>•</span>
                        <span data-testid="text-program-carrier">{Math.round(programAudio.currentCarrier)} Hz Carrier</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-center pt-2">
                        <div 
                          className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                          style={{ opacity: programAudio.leftEnabled ? 1 : 0.4 }}
                          data-testid="card-program-left"
                        >
                          <div className="text-lg font-bold text-primary" data-testid="text-program-left-freq">
                            {Math.round(programAudio.currentLeftFreq)} Hz
                          </div>
                          <div className="text-xs text-muted-foreground mb-2" data-testid="label-program-left">Left</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => programAudio.setLeftEnabled(!programAudio.leftEnabled)}
                            className={`text-xs ${programAudio.leftEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                            data-testid="button-toggle-program-left"
                          >
                            {programAudio.leftEnabled ? "On" : "Off"}
                          </Button>
                        </div>
                        <div 
                          className="p-3 rounded-xl border bg-white/5 border-white/10 transition-opacity"
                          style={{ opacity: programAudio.rightEnabled ? 1 : 0.4 }}
                          data-testid="card-program-right"
                        >
                          <div className="text-lg font-bold text-primary" data-testid="text-program-right-freq">
                            {Math.round(programAudio.currentRightFreq)} Hz
                          </div>
                          <div className="text-xs text-muted-foreground mb-2" data-testid="label-program-right">Right</div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => programAudio.setRightEnabled(!programAudio.rightEnabled)}
                            className={`text-xs ${programAudio.rightEnabled ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700'}`}
                            data-testid="button-toggle-program-right"
                          >
                            {programAudio.rightEnabled ? "On" : "Off"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {!selectedProgram && (
                  <div className="text-center py-8 text-muted-foreground text-sm" data-testid="text-program-empty-state">
                    Select a sleep program above
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-4">
            <AudioFilePlayer 
              title="Background Music" 
              icon="music" 
              storageKey="playlist:music"
              testIdPrefix="music-player"
            />
            <AudioFilePlayer 
              title="Affirmations" 
              icon="affirmation" 
              storageKey="playlist:affirmations"
              testIdPrefix="affirmation-player"
              showRecorder={true}
            />
          </div>

          <StereoConfusionPlayer />

          <div className="glass-panel rounded-xl p-3" data-testid="section-frequency-legend">
            <div className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-5 gap-2">
              <p data-testid="text-legend-delta"><strong className="text-white">Delta:</strong> Deep sleep</p>
              <p data-testid="text-legend-theta"><strong className="text-white">Theta:</strong> Meditation</p>
              <p data-testid="text-legend-alpha"><strong className="text-white">Alpha:</strong> Relaxation</p>
              <p data-testid="text-legend-beta"><strong className="text-white">Beta:</strong> Focus</p>
              <p data-testid="text-legend-gamma"><strong className="text-white">Gamma:</strong> Peak flow</p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 z-20">
        <div className="max-w-xl mx-auto glass-panel rounded-2xl p-4 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[currentVolume]}
              onValueChange={([val]) => handleVolumeChange(val)}
              min={0}
              max={1}
              step={0.01}
              className="flex-1"
              data-testid="slider-volume"
            />
          </div>

          <Button
            size="icon"
            onClick={handleTogglePlay}
            disabled={mode === "program" && !selectedProgram}
            className="rounded-full w-12 h-12"
            data-testid="button-play-pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>

          <div className="flex-1 flex justify-end">
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-mono" data-testid="text-mode-indicator">
                {mode === "custom" 
                  ? "Custom" 
                  : mode === "learning" 
                    ? `Learning: ${learningTarget === "alpha" ? "Alpha" : "Theta"}`
                    : mode === "daytime"
                      ? `Daytime: ${daytimeTarget === "beta" ? "Beta" : "Gamma"}`
                      : selectedProgram?.name || "Program"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

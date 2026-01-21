import { db } from "./db";
import {
  programs,
  sleepStages,
  betaFeedback,
  type Program,
  type SleepStage,
  type BetaFeedback,
  type InsertProgram,
  type InsertSleepStage,
  type InsertBetaFeedback,
  type ProgramWithStages,
} from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";

export interface IStorage {
  getPrograms(): Promise<ProgramWithStages[]>;
  getProgram(id: number): Promise<ProgramWithStages | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  createSleepStage(stage: InsertSleepStage): Promise<SleepStage>;
  seedDefaultPrograms(): Promise<void>;
  createBetaFeedback(feedback: InsertBetaFeedback): Promise<BetaFeedback>;
  getBetaFeedback(): Promise<BetaFeedback[]>;
}

export class DatabaseStorage implements IStorage {
  async getPrograms(): Promise<ProgramWithStages[]> {
    const allPrograms = await db.select().from(programs);
    const results: ProgramWithStages[] = [];

    for (const program of allPrograms) {
      const stages = await db
        .select()
        .from(sleepStages)
        .where(eq(sleepStages.programId, program.id))
        .orderBy(asc(sleepStages.order));
      results.push({ ...program, stages });
    }

    return results;
  }

  async getProgram(id: number): Promise<ProgramWithStages | undefined> {
    const [program] = await db.select().from(programs).where(eq(programs.id, id));
    if (!program) return undefined;

    const stages = await db
      .select()
      .from(sleepStages)
      .where(eq(sleepStages.programId, program.id))
      .orderBy(asc(sleepStages.order));

    return { ...program, stages };
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [newProgram] = await db.insert(programs).values(program).returning();
    return newProgram;
  }

  async createSleepStage(stage: InsertSleepStage): Promise<SleepStage> {
    const [newStage] = await db.insert(sleepStages).values(stage).returning();
    return newStage;
  }

  async seedDefaultPrograms(): Promise<void> {
    // First, remove any outdated programs that are no longer supported
    const deprecatedNames = ["90-Minute Sleep Cycle", "8-Hour Solfeggio Sleep Journey"];
    const allPrograms = await db.select().from(programs);
    
    for (const program of allPrograms) {
      if (deprecatedNames.includes(program.name)) {
        // Delete stages first, then the program
        await db.delete(sleepStages).where(eq(sleepStages.programId, program.id));
        await db.delete(programs).where(eq(programs.id, program.id));
      }
    }
    
    const existing = await this.getPrograms();
    const existingNames = new Set(existing.map((p) => p.name));

    if (!existingNames.has("8-Hour Solfeggio Healing Cycles")) {
      // Create the 8-Hour Solfeggio Program with 5 proper sleep cycles
      // Each cycle uses 2 Solfeggio frequencies, progressing through all 10 throughout the night
      const program8h = await this.createProgram({
        name: "8-Hour Solfeggio Healing Cycles",
        description: "Combines scientifically-accurate sleep cycles with all 10 Solfeggio healing frequencies. Each cycle features different chakra-aligned tones for complete healing.",
        isDefault: true,
      });

      // 5 Sleep Cycles with Solfeggio frequencies distributed across the night
      // Cycle 1: 174 Hz (Foundation) & 285 Hz (Cellular Healing) - Heavy N3
      // Cycle 2: 396 Hz (Root) & 417 Hz (Sacral) - Heavy N3  
      // Cycle 3: 432 Hz (Harmony) & 528 Hz (DNA Repair) - Moderate N3
      // Cycle 4: 639 Hz (Heart) & 741 Hz (Throat) - Light N3
      // Cycle 5: 852 Hz (Third Eye) & 963 Hz (Crown) - Long REM, Minimal N3
      
      const stages = [
        // === CYCLE 1: Foundation & Cellular Healing (174 Hz, 285 Hz) ===
        // Heavy N3 (35 min), Short REM (10 min) - Total ~90 min
        { name: "Settling In (174Hz)", order: 1, durationSeconds: 300, startCarrierFreq: 174, endCarrierFreq: 174, startBeatFreq: 14, endBeatFreq: 12 },
        { name: "N1 - Foundation (174Hz)", order: 2, durationSeconds: 420, startCarrierFreq: 174, endCarrierFreq: 174, startBeatFreq: 12, endBeatFreq: 7 },
        { name: "N2 - Grounding (174Hz)", order: 3, durationSeconds: 1500, startCarrierFreq: 174, endCarrierFreq: 174, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Deep Healing (285Hz)", order: 4, durationSeconds: 2100, startCarrierFreq: 285, endCarrierFreq: 285, startBeatFreq: 5, endBeatFreq: 1 },
        { name: "N2 - Rising (285Hz)", order: 5, durationSeconds: 480, startCarrierFreq: 285, endCarrierFreq: 285, startBeatFreq: 1, endBeatFreq: 5 },
        { name: "REM Cycle 1 (285Hz)", order: 6, durationSeconds: 600, startCarrierFreq: 285, endCarrierFreq: 285, startBeatFreq: 5, endBeatFreq: 9 },
        
        // === CYCLE 2: Root & Sacral Chakra (396 Hz, 417 Hz) ===
        // Heavy N3 (30 min), Growing REM (18 min) - Total ~95 min
        { name: "N1 - Release (396Hz)", order: 7, durationSeconds: 180, startCarrierFreq: 396, endCarrierFreq: 396, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Let Go (396Hz)", order: 8, durationSeconds: 1500, startCarrierFreq: 396, endCarrierFreq: 396, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Deep Release (417Hz)", order: 9, durationSeconds: 1800, startCarrierFreq: 417, endCarrierFreq: 417, startBeatFreq: 5, endBeatFreq: 1 },
        { name: "N2 - Breaking Patterns (417Hz)", order: 10, durationSeconds: 600, startCarrierFreq: 417, endCarrierFreq: 417, startBeatFreq: 1, endBeatFreq: 5 },
        { name: "REM Cycle 2 (417Hz)", order: 11, durationSeconds: 1080, startCarrierFreq: 417, endCarrierFreq: 417, startBeatFreq: 5, endBeatFreq: 9 },
        
        // === CYCLE 3: Universal Harmony & DNA Repair (432 Hz, 528 Hz) ===
        // Moderate N3 (10 min), Growing REM (28 min) - Total ~90 min
        { name: "N1 - Harmony (432Hz)", order: 12, durationSeconds: 180, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Universal Tune (432Hz)", order: 13, durationSeconds: 1800, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - DNA Repair (528Hz)", order: 14, durationSeconds: 600, startCarrierFreq: 528, endCarrierFreq: 528, startBeatFreq: 5, endBeatFreq: 2 },
        { name: "N2 - Love Frequency (528Hz)", order: 15, durationSeconds: 600, startCarrierFreq: 528, endCarrierFreq: 528, startBeatFreq: 2, endBeatFreq: 5 },
        { name: "REM Cycle 3 (528Hz)", order: 16, durationSeconds: 1680, startCarrierFreq: 528, endCarrierFreq: 528, startBeatFreq: 5, endBeatFreq: 9 },
        
        // === CYCLE 4: Heart & Throat Chakra (639 Hz, 741 Hz) ===
        // Brief N3 (5 min), Long REM (40 min) - Total ~90 min
        { name: "N1 - Heart Opening (639Hz)", order: 17, durationSeconds: 180, startCarrierFreq: 639, endCarrierFreq: 639, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Relationships (639Hz)", order: 18, durationSeconds: 1800, startCarrierFreq: 639, endCarrierFreq: 639, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Clarity (741Hz)", order: 19, durationSeconds: 300, startCarrierFreq: 741, endCarrierFreq: 741, startBeatFreq: 5, endBeatFreq: 3 },
        { name: "N2 - Expression (741Hz)", order: 20, durationSeconds: 600, startCarrierFreq: 741, endCarrierFreq: 741, startBeatFreq: 3, endBeatFreq: 5 },
        { name: "REM Cycle 4 (741Hz)", order: 21, durationSeconds: 2400, startCarrierFreq: 741, endCarrierFreq: 741, startBeatFreq: 5, endBeatFreq: 9 },
        
        // === CYCLE 5: Third Eye & Crown Chakra (852 Hz, 963 Hz) ===
        // No N3, Very Long REM (75 min) + Awakening - Total ~105 min
        { name: "N1 - Intuition (852Hz)", order: 22, durationSeconds: 180, startCarrierFreq: 852, endCarrierFreq: 852, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Third Eye (852Hz)", order: 23, durationSeconds: 1500, startCarrierFreq: 852, endCarrierFreq: 852, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N2 - Transition (963Hz)", order: 24, durationSeconds: 300, startCarrierFreq: 963, endCarrierFreq: 963, startBeatFreq: 5, endBeatFreq: 6 },
        { name: "REM Cycle 5 - Dreams (963Hz)", order: 25, durationSeconds: 3600, startCarrierFreq: 963, endCarrierFreq: 963, startBeatFreq: 6, endBeatFreq: 9 },
        { name: "Final REM - Cosmic (963Hz)", order: 26, durationSeconds: 900, startCarrierFreq: 963, endCarrierFreq: 963, startBeatFreq: 9, endBeatFreq: 9 },
        { name: "Gentle Awakening (432Hz)", order: 27, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 12 },
      ];

      for (const stage of stages) {
        await this.createSleepStage({
          programId: program8h.id,
          ...stage,
        });
      }
    }

    // Create the 8-Hour Full Night Rest program with scientifically accurate sleep cycles
    if (!existingNames.has("8-Hour Full Night Rest")) {
      const fullNight = await this.createProgram({
        name: "8-Hour Full Night Rest",
        description: "A complete 8-hour sleep cycle guiding you from Beta (Awake) down to Delta (Deep Sleep) and back to Theta (REM). Starts at 60Hz healing tone.",
        isDefault: false,
      });

      // Full night follows N1 → N2 → N3 → N2 → REM pattern across 5 cycles
      const stages = [
        { name: "Settling In", order: 1, durationSeconds: 300, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 14, endBeatFreq: 12 },
        { name: "N1 - Light Sleep", order: 2, durationSeconds: 420, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 12, endBeatFreq: 7 },
        { name: "N2 - Deeper Relaxation", order: 3, durationSeconds: 1500, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Deep Sleep", order: 4, durationSeconds: 2100, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 2 },
        { name: "N2 - Transition", order: 5, durationSeconds: 480, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 2, endBeatFreq: 5 },
        { name: "REM Cycle 1", order: 6, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 9 },
        { name: "N1 - Light", order: 7, durationSeconds: 180, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Settling", order: 8, durationSeconds: 1500, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Deep Sleep 2", order: 9, durationSeconds: 1800, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 1 },
        { name: "N2 - Rising", order: 10, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 1, endBeatFreq: 5 },
        { name: "REM Cycle 2", order: 11, durationSeconds: 1080, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 9 },
        { name: "N1 - Brief", order: 12, durationSeconds: 180, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Extended", order: 13, durationSeconds: 1800, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Shallow Deep", order: 14, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 2 },
        { name: "N2 - Transition", order: 15, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 2, endBeatFreq: 5 },
        { name: "REM Cycle 3", order: 16, durationSeconds: 1680, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 9 },
        { name: "N1 - Quick", order: 17, durationSeconds: 180, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Stable", order: 18, durationSeconds: 1800, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N3 - Brief Deep", order: 19, durationSeconds: 300, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 3 },
        { name: "N2 - Rising", order: 20, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 3, endBeatFreq: 5 },
        { name: "REM Cycle 4", order: 21, durationSeconds: 2400, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 9 },
        { name: "N1 - Light", order: 22, durationSeconds: 180, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 7 },
        { name: "N2 - Final Light Sleep", order: 23, durationSeconds: 1500, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 7, endBeatFreq: 5 },
        { name: "N2 - Transition", order: 24, durationSeconds: 300, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 5, endBeatFreq: 6 },
        { name: "REM Cycle 5 - Long", order: 25, durationSeconds: 3600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 6, endBeatFreq: 9 },
        { name: "Final REM - Dreams", order: 26, durationSeconds: 900, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 9 },
        { name: "Gentle Awakening", order: 27, durationSeconds: 600, startCarrierFreq: 432, endCarrierFreq: 432, startBeatFreq: 9, endBeatFreq: 12 },
      ];

      for (const stage of stages) {
        await this.createSleepStage({
          programId: fullNight.id,
          ...stage,
        });
      }
    }
  }

  async createBetaFeedback(feedback: InsertBetaFeedback): Promise<BetaFeedback> {
    const [result] = await db.insert(betaFeedback).values(feedback).returning();
    return result;
  }

  async getBetaFeedback(): Promise<BetaFeedback[]> {
    return db.select().from(betaFeedback).orderBy(desc(betaFeedback.createdAt));
  }
}

export const storage = new DatabaseStorage();

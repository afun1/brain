import { db } from "./db";
import {
  programs,
  sleepStages,
  type Program,
  type SleepStage,
  type InsertProgram,
  type InsertSleepStage,
  type ProgramWithStages,
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  getPrograms(): Promise<ProgramWithStages[]>;
  getProgram(id: number): Promise<ProgramWithStages | undefined>;
  createProgram(program: InsertProgram): Promise<Program>;
  createSleepStage(stage: InsertSleepStage): Promise<SleepStage>;
  seedDefaultPrograms(): Promise<void>;
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
    const existing = await this.getPrograms();
    const existingNames = new Set(existing.map((p) => p.name));

    if (!existingNames.has("90-Minute Sleep Cycle")) {
      // Create the "Standard Sleep Cycle" (90 Minutes)
      const program = await this.createProgram({
        name: "90-Minute Sleep Cycle",
        description: "A complete sleep cycle guiding you from Beta (Awake) down to Delta (Deep Sleep) and back to Theta (REM). Starts at 60Hz healing tone.",
        isDefault: false,
      });

      // 1. Beta (Awake/Relaxing) - 10 mins
      await this.createSleepStage({
        programId: program.id,
        name: "Wind Down (Beta)",
        order: 1,
        durationSeconds: 600, 
        startCarrierFreq: 60,
        endCarrierFreq: 60,
        startBeatFreq: 15,
        endBeatFreq: 12,
      });

      // 2. Alpha (Relaxation) - 10 mins
      await this.createSleepStage({
        programId: program.id,
        name: "Relaxation (Alpha)",
        order: 2,
        durationSeconds: 600, 
        startCarrierFreq: 60,
        endCarrierFreq: 110,
        startBeatFreq: 12,
        endBeatFreq: 8,
      });

      // 3. Theta (Light Sleep/Meditation) - 20 mins
      await this.createSleepStage({
        programId: program.id,
        name: "Light Sleep (Theta)",
        order: 3,
        durationSeconds: 1200, 
        startCarrierFreq: 110,
        endCarrierFreq: 110,
        startBeatFreq: 8,
        endBeatFreq: 4,
      });

      // 4. Delta (Deep Sleep) - 35 mins
      await this.createSleepStage({
        programId: program.id,
        name: "Deep Sleep (Delta)",
        order: 4,
        durationSeconds: 2100, 
        startCarrierFreq: 110,
        endCarrierFreq: 174,
        startBeatFreq: 4,
        endBeatFreq: 1, 
      });

      // 5. REM (Dreaming) - 15 mins
      await this.createSleepStage({
        programId: program.id,
        name: "REM Cycle",
        order: 5,
        durationSeconds: 900, 
        startCarrierFreq: 174,
        endCarrierFreq: 174,
        startBeatFreq: 1,
        endBeatFreq: 6,
      });
    }

    if (!existingNames.has("8-Hour Solfeggio Sleep Journey")) {
      // Create the 8-Hour Solfeggio Program
      const program8h = await this.createProgram({
        name: "8-Hour Solfeggio Sleep Journey",
        description: "A complete 8-hour healing journey using Solfeggio frequencies. Progresses through chakra-aligned tones from 396Hz (Root) to 432Hz (Harmony).",
        isDefault: true,
      });

      // Stage 1: Release & Ground (30 min) - Beta -> Theta
      // Left: 396Hz (Root Chakra - Release fear/guilt)
      // Right: 396+15=411Hz -> 396+6=402Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Release & Ground (396Hz)",
        order: 1,
        durationSeconds: 1800,
        startCarrierFreq: 396,
        endCarrierFreq: 396,
        startBeatFreq: 15,
        endBeatFreq: 6,
      });

      // Stage 2: Let Go of Past (30 min) - Theta -> Delta Entry
      // Left: 396Hz -> 417Hz (Sacral - Break negative patterns)
      // Right: 402Hz -> 421Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Let Go (417Hz)",
        order: 2,
        durationSeconds: 1800,
        startCarrierFreq: 396,
        endCarrierFreq: 417,
        startBeatFreq: 6,
        endBeatFreq: 4,
      });

      // Stage 3: Foundation & Security (90 min) - Delta
      // Left: 174Hz (Foundation Frequency)
      // Right: 174+4=178Hz -> 174+1=175Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Foundation (174Hz)",
        order: 3,
        durationSeconds: 5400,
        startCarrierFreq: 174,
        endCarrierFreq: 174,
        startBeatFreq: 4,
        endBeatFreq: 1,
      });

      // Stage 4: Cellular Healing (90 min) - Deep Delta
      // Left: 285Hz (Healing/Tissue Restoration)
      // Right: 285+1=286Hz -> 285+2=287Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Cellular Healing (285Hz)",
        order: 4,
        durationSeconds: 5400,
        startCarrierFreq: 285,
        endCarrierFreq: 285,
        startBeatFreq: 1,
        endBeatFreq: 2,
      });

      // Stage 5: DNA Repair & Love (90 min) - Delta
      // Left: 528Hz (Love Frequency / DNA Repair)
      // Right: 528+2=530Hz -> 528+1=529Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "DNA Repair (528Hz)",
        order: 5,
        durationSeconds: 5400,
        startCarrierFreq: 528,
        endCarrierFreq: 528,
        startBeatFreq: 2,
        endBeatFreq: 1,
      });

      // Stage 6: Emotional Healing (60 min) - Delta/Theta Mix
      // Left: 639Hz (Heart Chakra - Relationships)
      // Right: 639+1=640Hz -> 639+4=643Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Emotional Healing (639Hz)",
        order: 6,
        durationSeconds: 3600,
        startCarrierFreq: 639,
        endCarrierFreq: 639,
        startBeatFreq: 1,
        endBeatFreq: 4,
      });

      // Stage 7: Dream & Intuition (60 min) - Theta/REM
      // Left: 852Hz (Third Eye - Intuition)
      // Right: 852+4=856Hz -> 852+7=859Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Intuition & Dreams (852Hz)",
        order: 7,
        durationSeconds: 3600,
        startCarrierFreq: 852,
        endCarrierFreq: 852,
        startBeatFreq: 4,
        endBeatFreq: 7,
      });

      // Stage 8: Spiritual Connection (30 min) - Theta
      // Left: 963Hz (Crown Chakra - Universe)
      // Right: 963+7=970Hz -> 963+6=969Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Spiritual Connection (963Hz)",
        order: 8,
        durationSeconds: 1800,
        startCarrierFreq: 963,
        endCarrierFreq: 963,
        startBeatFreq: 7,
        endBeatFreq: 6,
      });

      // Stage 9: Awakening Clarity (20 min) - Alpha
      // Left: 741Hz (Throat - Clarity/Awakening)
      // Right: 741+8=749Hz -> 741+10=751Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Awakening Clarity (741Hz)",
        order: 9,
        durationSeconds: 1200,
        startCarrierFreq: 741,
        endCarrierFreq: 741,
        startBeatFreq: 8,
        endBeatFreq: 10,
      });

      // Stage 10: Gentle Rise (10 min) - Alpha -> Light Beta
      // Left: 432Hz (Universal Harmony)
      // Right: 432+10=442Hz -> 432+12=444Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Gentle Rise (432Hz)",
        order: 10,
        durationSeconds: 600,
        startCarrierFreq: 432,
        endCarrierFreq: 432,
        startBeatFreq: 10,
        endBeatFreq: 12,
      });
    }
  }
}

export const storage = new DatabaseStorage();

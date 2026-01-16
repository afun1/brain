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
    if (existing.length > 0) return;

    // Create the "Standard Sleep Cycle" (90 Minutes)
    const program = await this.createProgram({
      name: "90-Minute Sleep Cycle",
      description: "A complete sleep cycle guiding you from Beta (Awake) down to Delta (Deep Sleep) and back to Theta (REM). Starts at 60Hz healing tone.",
      isDefault: true,
    });

    // 1. Beta (Awake/Relaxing) - 10 mins
    // Carrier: 60Hz (Grounding)
    // Beat: 15Hz (Low Beta) -> 12Hz (High Alpha)
    await this.createSleepStage({
      programId: program.id,
      name: "Wind Down (Beta)",
      order: 1,
      durationSeconds: 600, // 10 mins
      startCarrierFreq: 60,
      endCarrierFreq: 60,
      startBeatFreq: 15,
      endBeatFreq: 12,
    });

    // 2. Alpha (Relaxation) - 10 mins
    // Carrier: 60Hz -> 110Hz (Transition to next healing tone)
    // Beat: 12Hz (Alpha) -> 8Hz (Low Alpha)
    await this.createSleepStage({
      programId: program.id,
      name: "Relaxation (Alpha)",
      order: 2,
      durationSeconds: 600, // 10 mins
      startCarrierFreq: 60,
      endCarrierFreq: 110,
      startBeatFreq: 12,
      endBeatFreq: 8,
    });

    // 3. Theta (Light Sleep/Meditation) - 20 mins
    // Carrier: 110Hz (Healing)
    // Beat: 8Hz (Theta Entry) -> 4Hz (Deep Theta)
    await this.createSleepStage({
      programId: program.id,
      name: "Light Sleep (Theta)",
      order: 3,
      durationSeconds: 1200, // 20 mins
      startCarrierFreq: 110,
      endCarrierFreq: 110,
      startBeatFreq: 8,
      endBeatFreq: 4,
    });

    // 4. Delta (Deep Sleep) - 35 mins
    // Carrier: 110Hz -> 174Hz (Pain Relief/Comfort)
    // Beat: 4Hz -> 2Hz (Delta) -> 1Hz (Deep Delta)
    await this.createSleepStage({
      programId: program.id,
      name: "Deep Sleep (Delta)",
      order: 4,
      durationSeconds: 2100, // 35 mins
      startCarrierFreq: 110,
      endCarrierFreq: 174,
      startBeatFreq: 4,
      endBeatFreq: 1, // Slow down to 1Hz
    });

    // 5. REM (Dreaming) - 15 mins
    // Carrier: 174Hz
    // Beat: 1Hz -> 6Hz (Theta Return for REM)
    await this.createSleepStage({
      programId: program.id,
      name: "REM Cycle",
      order: 5,
      durationSeconds: 900, // 15 mins
      startCarrierFreq: 174,
      endCarrierFreq: 174,
      startBeatFreq: 1,
      endBeatFreq: 6,
    });
  }
}

export const storage = new DatabaseStorage();

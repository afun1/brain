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

    if (!existingNames.has("8-Hour Full Night Rest")) {
      // Create the 8-Hour Program
      const program8h = await this.createProgram({
        name: "8-Hour Full Night Rest",
        description: "A complete 8-hour journey through all sleep stages, progressing through healing frequencies from 60Hz to 432Hz.",
        isDefault: true,
      });

      // 1. Induction (30 min) - Beta -> Alpha -> Theta
      // Carrier: 60Hz
      await this.createSleepStage({
        programId: program8h.id,
        name: "Induction (Wind Down)",
        order: 1,
        durationSeconds: 1800, // 30 mins
        startCarrierFreq: 60,
        endCarrierFreq: 60,
        startBeatFreq: 15, // Beta
        endBeatFreq: 6, // Theta
      });

      // 2. Deep Sleep Phase 1 (180 min) - Delta Dominant
      // Carrier: 60Hz -> 110Hz (Grounding -> Healing)
      await this.createSleepStage({
        programId: program8h.id,
        name: "Deep Rest (Delta)",
        order: 2,
        durationSeconds: 10800, // 3 hours
        startCarrierFreq: 60,
        endCarrierFreq: 110,
        startBeatFreq: 4, // Theta
        endBeatFreq: 1, // Deep Delta
      });

      // 3. Cellular Regeneration (150 min) - Delta/Theta Mix
      // Carrier: 110Hz -> 174Hz (Healing -> Pain Relief)
      await this.createSleepStage({
        programId: program8h.id,
        name: "Regeneration (Delta/Theta)",
        order: 3,
        durationSeconds: 9000, // 2.5 hours
        startCarrierFreq: 110,
        endCarrierFreq: 174,
        startBeatFreq: 1,
        endBeatFreq: 3, 
      });

      // 4. Dreaming & REM (90 min) - Theta Dominant
      // Carrier: 174Hz -> 285Hz (Restoration)
      await this.createSleepStage({
        programId: program8h.id,
        name: "Dream State (REM)",
        order: 4,
        durationSeconds: 5400, // 1.5 hours
        startCarrierFreq: 174,
        endCarrierFreq: 285,
        startBeatFreq: 3,
        endBeatFreq: 7, // High Theta
      });

      // 5. Morning Rise (30 min) - Alpha -> Beta
      // Carrier: 285Hz -> 432Hz (Awakening)
      await this.createSleepStage({
        programId: program8h.id,
        name: "Morning Rise",
        order: 5,
        durationSeconds: 1800, // 30 mins
        startCarrierFreq: 285,
        endCarrierFreq: 432,
        startBeatFreq: 8, // Alpha
        endBeatFreq: 15, // Beta
      });
    }
  }
}

export const storage = new DatabaseStorage();

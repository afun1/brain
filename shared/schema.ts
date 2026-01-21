import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Defines a single stage in the sleep cycle
export const sleepStages = pgTable("sleep_stages", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").notNull(), // Foreign key to a program
  name: text("name").notNull(), // e.g., "Relaxation", "Deep Sleep"
  order: integer("order").notNull(), // Sequence order
  durationSeconds: integer("duration_seconds").notNull(), // How long this stage lasts
  
  // Carrier Frequency (Left Ear) - The "Healing Tone"
  startCarrierFreq: integer("start_carrier_freq").notNull(), 
  endCarrierFreq: integer("end_carrier_freq").notNull(),

  // Binaural Beat Target (Frequency Difference)
  startBeatFreq: integer("start_beat_freq").notNull(),
  endBeatFreq: integer("end_beat_freq").notNull(),
});

export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isDefault: boolean("is_default").default(false),
});

export const insertProgramSchema = createInsertSchema(programs);
export const insertSleepStageSchema = createInsertSchema(sleepStages);

export type Program = typeof programs.$inferSelect;
export type SleepStage = typeof sleepStages.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type InsertSleepStage = z.infer<typeof insertSleepStageSchema>;

export type ProgramWithStages = Program & { stages: SleepStage[] };

// Beta Feedback for collecting user reports
export const betaFeedback = pgTable("beta_feedback", {
  id: serial("id").primaryKey(),
  feature: text("feature").notNull(),
  issueType: text("issue_type").notNull(), // bug, suggestion, confusion, praise
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBetaFeedbackSchema = createInsertSchema(betaFeedback).omit({ id: true, createdAt: true });
export type BetaFeedback = typeof betaFeedback.$inferSelect;
export type InsertBetaFeedback = z.infer<typeof insertBetaFeedbackSchema>;

export * from "./models/chat";

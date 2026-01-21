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
export * from "./models/auth";

// Library Progressions - Community shared progressions
export const libraryProgressions = pgTable("library_progressions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Sleep, Power Nap, Focus, Meditation, Healing, Workout
  authorId: text("author_id"), // null if anonymous
  authorName: text("author_name"), // Display name or "Anonymous"
  isAnonymous: boolean("is_anonymous").default(false),
  slots: jsonb("slots").notNull(), // The progression data
  carrierChannel: text("carrier_channel").default("L"),
  variance: text("variance").default("higher"),
  totalMinutes: integer("total_minutes").notNull(),
  downloadCount: integer("download_count").default(0),
  ratingSum: integer("rating_sum").default(0), // Sum of all ratings
  ratingCount: integer("rating_count").default(0), // Number of ratings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const libraryRatings = pgTable("library_ratings", {
  id: serial("id").primaryKey(),
  progressionId: integer("progression_id").notNull(),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLibraryProgressionSchema = createInsertSchema(libraryProgressions).omit({ 
  id: true, 
  createdAt: true, 
  downloadCount: true, 
  ratingSum: true, 
  ratingCount: true 
});
export const insertLibraryRatingSchema = createInsertSchema(libraryRatings).omit({ id: true, createdAt: true });

export type LibraryProgression = typeof libraryProgressions.$inferSelect;
export type LibraryRating = typeof libraryRatings.$inferSelect;
export type InsertLibraryProgression = z.infer<typeof insertLibraryProgressionSchema>;
export type InsertLibraryRating = z.infer<typeof insertLibraryRatingSchema>;

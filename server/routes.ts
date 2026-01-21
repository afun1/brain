import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerAudioRoutes } from "./replit_integrations/audio/routes";
import { insertBetaFeedbackSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize default data
  await storage.seedDefaultPrograms();

  app.get(api.programs.list.path, async (req, res) => {
    const programs = await storage.getPrograms();
    res.json(programs);
  });

  app.get(api.programs.get.path, async (req, res) => {
    const program = await storage.getProgram(Number(req.params.id));
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }
    res.json(program);
  });

  // Beta Feedback routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const parsed = insertBetaFeedbackSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid feedback data", errors: parsed.error.errors });
      }
      const feedback = await storage.createBetaFeedback(parsed.data);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getBetaFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Register AI audio routes (TTS, STT, voice chat)
  registerAudioRoutes(app);

  return httpServer;
}

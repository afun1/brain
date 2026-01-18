import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerAudioRoutes } from "./replit_integrations/audio/routes";

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

  // Register AI audio routes (TTS, STT, voice chat)
  registerAudioRoutes(app);

  return httpServer;
}

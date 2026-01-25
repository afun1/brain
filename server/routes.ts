import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { registerAudioRoutes } from "./replit_integrations/audio/routes";
import { insertBetaFeedbackSchema, insertLibraryProgressionSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth only if Replit environment is configured
  if (process.env.REPL_ID) {
    await setupAuth(app);
    registerAuthRoutes(app);
  } else {
    console.log("⚠️  Running without authentication (local dev mode)");
  }

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

  // Library routes - Community shared progressions
  
  // Get all library progressions (public, no auth required)
  app.get("/api/library", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const progressions = await storage.getLibraryProgressions(category);
      res.json(progressions);
    } catch (error) {
      console.error("Error fetching library:", error);
      res.status(500).json({ message: "Failed to fetch library" });
    }
  });

  // Get a single progression (and increment download count)
  app.get("/api/library/:id", async (req, res) => {
    try {
      const progression = await storage.getLibraryProgression(Number(req.params.id));
      if (!progression) {
        return res.status(404).json({ message: "Progression not found" });
      }
      // Increment download count
      await storage.incrementDownloadCount(Number(req.params.id));
      res.json(progression);
    } catch (error) {
      console.error("Error fetching progression:", error);
      res.status(500).json({ message: "Failed to fetch progression" });
    }
  });

  // Share a progression to the library (requires login)
  app.post("/api/library", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const userFirstName = req.user?.claims?.first_name || "";
      const userLastName = req.user?.claims?.last_name || "";
      const isAnonymous = req.body.isAnonymous === true;
      
      const authorName = isAnonymous ? "Anonymous" : `${userFirstName} ${userLastName}`.trim() || "Anonymous";
      
      const data = {
        ...req.body,
        authorId: isAnonymous ? null : userId,
        authorName,
        isAnonymous,
      };
      
      const parsed = insertLibraryProgressionSchema.safeParse(data);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid progression data", errors: parsed.error.errors });
      }
      
      const progression = await storage.createLibraryProgression(parsed.data);
      res.status(201).json(progression);
    } catch (error) {
      console.error("Error sharing progression:", error);
      res.status(500).json({ message: "Failed to share progression" });
    }
  });

  // Rate a progression (requires login)
  app.post("/api/library/:id/rate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progressionId = Number(req.params.id);
      const rating = Number(req.body.rating);
      
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      await storage.rateProgression(progressionId, userId, rating);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rating progression:", error);
      res.status(500).json({ message: "Failed to rate progression" });
    }
  });

  // Get user's own shared progressions
  app.get("/api/library/my/progressions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const progressions = await storage.getUserProgressions(userId);
      res.json(progressions);
    } catch (error) {
      console.error("Error fetching user progressions:", error);
      res.status(500).json({ message: "Failed to fetch your progressions" });
    }
  });

  return httpServer;
}

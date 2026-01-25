import express, { type Request, Response, NextFunction } from "express";
import { storage } from "../server/storage";
import { api } from "../shared/routes";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      console.log(`${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

let initialized = false;

async function initializeApp() {
  if (!initialized) {
    try {
      console.log("🔄 Initializing app...");
      
      // Test endpoint first
      app.get("/api/test", (_req, res) => {
        res.json({ status: "ok", message: "API is working" });
      });
      
      // Initialize default data
      console.log("🔄 Seeding default programs...");
      await storage.seedDefaultPrograms();
      console.log("✅ Default programs seeded");

      // Register routes
      app.get(api.programs.list.path, async (req, res) => {
        try {
          const programs = await storage.getPrograms();
          console.log(`📊 GET /api/programs - returning ${programs.length} programs`);
          res.json(programs);
        } catch (error) {
          console.error("Error fetching programs:", error);
          res.status(500).json({ error: "Failed to fetch programs" });
        }
      });

    app.get(api.programs.get.path, async (req, res) => {
      try {
        const program = await storage.getProgram(Number(req.params.id));
        if (!program) {
          return res.status(404).json({ message: "Program not found" });
        }
        res.json(program);
      } catch (error) {
        console.error("Error fetching program:", error);
        res.status(500).json({ error: "Failed to fetch program" });
      }
    });

    // Serve static files
    const distPath = path.join(process.cwd(), "dist", "public");
    app.use(express.static(distPath));

    // Fallback to index.html for client-side routing
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Error:", err);
      res.status(status).json({ message });
    });

    initialized = true;
    console.log("✅ App initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize app:", error);
      throw error;
    }
  }
}

// Export for Vercel serverless
export default async function handler(req: any, res: any) {
  try {
    await initializeApp();
    // Express apps can be called as functions with (req, res)
    return new Promise((resolve, reject) => {
      app(req, res);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

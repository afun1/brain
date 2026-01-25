import { storage } from "../server/storage";

// Simple Vercel serverless function (no Express)
export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    console.log(`📍 ${req.method} ${pathname}`);

    // Initialize database
    await storage.seedDefaultPrograms();

    // Route: GET /api/programs
    if (pathname === '/api/programs' && req.method === 'GET') {
      const programs = await storage.getPrograms();
      console.log(`✅ Returning ${programs.length} programs`);
      return res.status(200).json(programs);
    }

    // Route: GET /api/programs/:id
    if (pathname.startsWith('/api/programs/') && req.method === 'GET') {
      const id = parseInt(pathname.split('/')[3]);
      const program = await storage.getProgram(id);
      if (!program) {
        return res.status(404).json({ message: "Program not found" });
      }
      return res.status(200).json(program);
    }

    // Route: GET /api/test
    if (pathname === '/api/test' && req.method === 'GET') {
      return res.status(200).json({ status: "ok", message: "API is working" });
    }

    // 404 for unknown routes
    return res.status(404).json({ error: "Not found" });

  } catch (error: any) {
    console.error("❌ API Error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message 
    });
  }
}

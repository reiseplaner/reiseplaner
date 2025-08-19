import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

const app = express();

// Global parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lightweight request logger for API
app.use((req, res, next) => {
  const startMs = Date.now();
  let capturedJson: Record<string, any> | undefined;
  const originalJson: (body: any) => any = res.json.bind(res);
  (res as any).json = (body: any) => {
    capturedJson = body;
    return originalJson(body);
  };
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      let line = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - startMs}ms`;
      if (capturedJson) {
        try { line += ` :: ${JSON.stringify(capturedJson)}`; } catch {}
      }
      if (line.length > 120) line = line.slice(0, 119) + "…";
      console.log(line);
    }
  });
  next();
});

// Register all application routes (API) on this Express app
// Note: The returned HTTP server is not used on Vercel (serverless),
// but registering routes on the Express instance is sufficient.
registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

export default app;
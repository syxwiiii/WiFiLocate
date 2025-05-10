import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPointSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/points", async (req: Request, res: Response) => {
    try {
      const points = await storage.getAllPoints();
      return res.json(points);
    } catch (error) {
      console.error("Error fetching points:", error);
      return res.status(500).json({ message: "Failed to fetch points" });
    }
  });

  app.get("/api/points/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid point ID" });
      }

      const point = await storage.getPointById(id);
      if (!point) {
        return res.status(404).json({ message: "Point not found" });
      }

      return res.json(point);
    } catch (error) {
      console.error("Error fetching point:", error);
      return res.status(500).json({ message: "Failed to fetch point" });
    }
  });

  app.post("/api/points", async (req: Request, res: Response) => {
    try {
      const result = insertPointSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const newPoint = await storage.createPoint(result.data);
      return res.status(201).json(newPoint);
    } catch (error) {
      console.error("Error creating point:", error);
      return res.status(500).json({ message: "Failed to create point" });
    }
  });

  app.get("/api/points/type/:type", async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const validTypes = ['wifi', 'outlet', 'restroom'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid point type" });
      }
      
      const points = await storage.getPointsByType(type);
      return res.json(points);
    } catch (error) {
      console.error("Error fetching points by type:", error);
      return res.status(500).json({ message: "Failed to fetch points" });
    }
  });

  app.get("/api/points/nearest", async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, limit } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const limitNum = limit ? parseInt(limit as string) : 3;
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      
      if (isNaN(limitNum) || limitNum < 1) {
        return res.status(400).json({ message: "Invalid limit" });
      }
      
      const nearestPoints = await storage.getNearestPoints(lat, lng, limitNum);
      return res.json(nearestPoints);
    } catch (error) {
      console.error("Error finding nearest points:", error);
      return res.status(500).json({ message: "Failed to find nearest points" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

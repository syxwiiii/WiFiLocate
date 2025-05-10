import { users, points, type User, type InsertUser, type Point, type InsertPoint } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Import calculateDistance function for proximity calculations
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

// Database interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Point methods
  getAllPoints(): Promise<Point[]>;
  getPointById(id: number): Promise<Point | undefined>;
  createPoint(point: InsertPoint): Promise<Point>;
  updatePoint(id: number, point: Partial<InsertPoint>): Promise<Point | undefined>;
  deletePoint(id: number): Promise<boolean>;
  
  // Specific retrieval methods
  getPointsByType(type: string): Promise<Point[]>;
  getNearestPoints(latitude: number, longitude: number, limit?: number): Promise<Point[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Point methods
  async getAllPoints(): Promise<Point[]> {
    return await db.select().from(points);
  }

  async getPointById(id: number): Promise<Point | undefined> {
    const [point] = await db.select().from(points).where(eq(points.id, id));
    return point;
  }

  async createPoint(insertPoint: InsertPoint): Promise<Point> {
    // We need to convert numeric types to strings for PostgreSQL
    const dbPoint = {
      ...insertPoint,
      latitude: String(insertPoint.latitude),
      longitude: String(insertPoint.longitude)
    };
    
    const [point] = await db.insert(points).values(dbPoint).returning();
    return point;
  }

  async updatePoint(id: number, updateData: Partial<InsertPoint>): Promise<Point | undefined> {
    // Prepare the data for database update
    const dbUpdateData: any = { ...updateData, updatedAt: new Date() };
    
    // Convert numeric values to strings if they exist
    if (typeof updateData.latitude !== 'undefined') {
      dbUpdateData.latitude = String(updateData.latitude);
    }
    
    if (typeof updateData.longitude !== 'undefined') {
      dbUpdateData.longitude = String(updateData.longitude);
    }
    
    const [updatedPoint] = await db
      .update(points)
      .set(dbUpdateData)
      .where(eq(points.id, id))
      .returning();
    
    return updatedPoint;
  }

  async deletePoint(id: number): Promise<boolean> {
    const result = await db.delete(points).where(eq(points.id, id)).returning();
    return result.length > 0;
  }

  async getPointsByType(type: string): Promise<Point[]> {
    return await db.select().from(points).where(eq(points.type, type));
  }

  async getNearestPoints(latitude: number, longitude: number, limit: number = 3): Promise<Point[]> {
    // Get all points
    const allPoints = await db.select().from(points);
    
    // Calculate distance for each point
    const pointsWithDistance = allPoints.map(point => {
      const distance = calculateDistance(
        latitude, 
        longitude, 
        Number(point.latitude), 
        Number(point.longitude)
      );
      return { ...point, distance };
    });
    
    // Sort by distance and take the limit
    return pointsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }
}

export const storage = new DatabaseStorage();

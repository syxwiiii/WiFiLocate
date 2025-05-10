import { pgTable, text, serial, numeric, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export enum PointType {
  WIFI = "wifi",
  OUTLET = "outlet",
  RESTROOM = "restroom"
}

export enum WifiSpeed {
  SLOW = "slow",
  MEDIUM = "medium",
  FAST = "fast"
}

export const points = pgTable("points", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "wifi", "outlet", "restroom"
  name: text("name").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  password: text("password"), // Optional password for WiFi
  speed: text("speed"), // Optional speed for WiFi (slow, medium, fast)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPointSchema = createInsertSchema(points)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    type: z.nativeEnum(PointType),
    speed: z.nativeEnum(WifiSpeed).optional(),
    latitude: z.number().refine(lat => lat >= -90 && lat <= 90, {
      message: "Latitude must be between -90 and 90"
    }),
    longitude: z.number().refine(lon => lon >= -180 && lon <= 180, {
      message: "Longitude must be between -180 and 180"
    }),
  });

export type InsertPoint = z.infer<typeof insertPointSchema>;
export type Point = typeof points.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

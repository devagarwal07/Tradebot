import { users, type User, type InsertUser, settings, type Settings, type InsertSettings } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings methods
  getSettings(userId: number): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(userId: number, settingsData: Partial<InsertSettings>): Promise<Settings | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    const [userSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));
    return userSettings || undefined;
  }

  async saveSettings(settingsData: InsertSettings): Promise<Settings> {
    // Check if settings already exist for this user
    const existingSettings = await this.getSettings(settingsData.userId);
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(settings)
        .set({
          ...settingsData,
          updatedAt: new Date(),
        })
        .where(eq(settings.id, existingSettings.id))
        .returning();
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(settings)
        .values({
          ...settingsData,
          updatedAt: new Date(),
        })
        .returning();
      return newSettings;
    }
  }

  async updateSettings(userId: number, settingsData: Partial<InsertSettings>): Promise<Settings | undefined> {
    // Find settings by userId
    const existingSettings = await this.getSettings(userId);
    
    if (!existingSettings) {
      return undefined;
    }

    // Update settings
    const [updatedSettings] = await db
      .update(settings)
      .set({
        ...settingsData,
        updatedAt: new Date(),
      })
      .where(eq(settings.id, existingSettings.id))
      .returning();

    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();

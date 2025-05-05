import { users, type User, type InsertUser, settings, type Settings, type InsertSettings } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userSettings: Map<number, Settings>;
  currentId: number;
  settingsId: number;

  constructor() {
    this.users = new Map();
    this.userSettings = new Map();
    this.currentId = 1;
    this.settingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Settings methods
  async getSettings(userId: number): Promise<Settings | undefined> {
    // Find settings by userId using Array.from to avoid TypeScript iterator issues
    const settingsArray = Array.from(this.userSettings.values());
    return settingsArray.find(settings => settings.userId === userId);
  }

  async saveSettings(settingsData: InsertSettings): Promise<Settings> {
    // Check if settings already exist for this user
    const settingsEntries = Array.from(this.userSettings.entries());
    const existingEntry = settingsEntries.find(([_, settings]) => settings.userId === settingsData.userId);
    
    if (existingEntry) {
      // Update existing settings
      const [id, existingSettings] = existingEntry;
      const updatedSettings: Settings = {
        ...existingSettings,
        apiKey: settingsData.apiKey ?? existingSettings.apiKey,
        connected: settingsData.connected ?? existingSettings.connected,
        notifications: settingsData.notifications ?? existingSettings.notifications,
        risk: settingsData.risk ?? existingSettings.risk,
        preferences: settingsData.preferences ?? existingSettings.preferences,
        updatedAt: new Date()
      };
      this.userSettings.set(id, updatedSettings);
      return updatedSettings;
    } else {
      // Create new settings
      const id = this.settingsId++;
      const newSettings: Settings = {
        id,
        userId: settingsData.userId,
        apiKey: settingsData.apiKey ?? null,
        connected: settingsData.connected ?? false,
        notifications: settingsData.notifications ?? {},
        risk: settingsData.risk ?? {},
        preferences: settingsData.preferences ?? {},
        updatedAt: new Date()
      };
      this.userSettings.set(id, newSettings);
      return newSettings;
    }
  }

  async updateSettings(userId: number, settingsData: Partial<InsertSettings>): Promise<Settings | undefined> {
    // Find settings by userId
    const settingsEntries = Array.from(this.userSettings.entries());
    const existingEntry = settingsEntries.find(([_, settings]) => settings.userId === userId);
    
    if (!existingEntry) {
      return undefined;
    }

    const [id, existingSettings] = existingEntry;
    
    // Update settings
    const updatedSettings: Settings = {
      ...existingSettings,
      apiKey: settingsData.apiKey ?? existingSettings.apiKey,
      connected: settingsData.connected ?? existingSettings.connected,
      notifications: settingsData.notifications ?? existingSettings.notifications,
      risk: settingsData.risk ?? existingSettings.risk,
      preferences: settingsData.preferences ?? existingSettings.preferences,
      updatedAt: new Date()
    };

    this.userSettings.set(id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();

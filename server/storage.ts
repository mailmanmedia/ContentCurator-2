import { type User, type InsertUser, type Image, type InsertImage } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Image methods
  getImages(): Promise<Image[]>;
  getImage(id: string): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(id: string): Promise<boolean>;
  getImagesByCategory(category: string): Promise<Image[]>;
  searchImages(query: string): Promise<Image[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private images: Map<string, Image>;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    
    // Add some sample images
    this.seedImages();
  }

  private async seedImages() {
    const sampleImages: InsertImage[] = [
      {
        name: "arne-slot-portrait.jpg",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "2.3 MB",
        type: "JPEG",
        tags: ["arne slot", "manager", "portrait", "headshot"],
        category: "Staff",
        isStarred: true
      },
      {
        name: "salah-celebration.jpg",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "1.8 MB",
        type: "JPEG",
        tags: ["salah", "goal", "celebration", "premier league"],
        category: "Players",
        isStarred: false
      },
      {
        name: "anfield-atmosphere.jpg",
        url: "/placeholder.jpg",
        thumbnail: "/placeholder.jpg",
        size: "3.1 MB",
        type: "JPEG",
        tags: ["anfield", "atmosphere", "crowd", "stadium"],
        category: "Stadium",
        isStarred: true
      }
    ];
    
    for (const imageData of sampleImages) {
      await this.createImage(imageData);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Image methods
  async getImages(): Promise<Image[]> {
    return Array.from(this.images.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getImage(id: string): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = randomUUID();
    const image: Image = {
      id,
      name: insertImage.name,
      url: insertImage.url,
      thumbnail: insertImage.thumbnail,
      size: insertImage.size,
      type: insertImage.type,
      tags: insertImage.tags || [],
      category: insertImage.category || 'Uploads',
      isStarred: insertImage.isStarred || false,
      createdAt: new Date()
    };
    this.images.set(id, image);
    return image;
  }

  async updateImage(id: string, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const existing = this.images.get(id);
    if (!existing) return undefined;
    
    const updated: Image = { ...existing, ...updates };
    this.images.set(id, updated);
    return updated;
  }

  async deleteImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }

  async getImagesByCategory(category: string): Promise<Image[]> {
    const allImages = await this.getImages();
    return allImages.filter(img => img.category === category);
  }

  async searchImages(query: string): Promise<Image[]> {
    const allImages = await this.getImages();
    const lowerQuery = query.toLowerCase();
    
    return allImages.filter(img => 
      img.name.toLowerCase().includes(lowerQuery) ||
      img.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      img.category.toLowerCase().includes(lowerQuery)
    );
  }
}

export const storage = new MemStorage();

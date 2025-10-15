import { config } from "dotenv";

// Load environment variables from .env file before any other modules are imported
config();

// Export any configuration that other modules might need
export const isDevelopment = process.env.NODE_ENV === "development";
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Utility functions for safe date conversions
 */

/**
 * Safely converts various timestamp formats to a Date object
 * @param value - Can be a Date, string, number (Unix timestamp), or null/undefined
 * @param fallbackToNow - If true, returns current date when value is invalid (default: true)
 * @returns A valid Date object
 */
export function toSafeDate(value: any, fallbackToNow: boolean = true): Date | null {
  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? (fallbackToNow ? new Date() : null) : value;
  }
  
  // Null or undefined
  if (value == null) {
    return fallbackToNow ? new Date() : null;
  }
  
  // String format (ISO 8601 or other parseable formats)
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return fallbackToNow ? new Date() : null;
    }
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn(`Failed to parse date string: ${value}`, e);
    }
  }
  
  // Number format (Unix timestamp or milliseconds)
  if (typeof value === 'number') {
    // Check if it's likely a Unix timestamp (seconds) vs milliseconds
    // Unix timestamps are typically 10 digits, milliseconds are 13 digits
    const timestamp = value < 10000000000 ? value * 1000 : value;
    try {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime()) && date.getFullYear() > 1970 && date.getFullYear() < 2100) {
        return date;
      }
    } catch (e) {
      console.warn(`Failed to parse numeric timestamp: ${value}`, e);
    }
  }
  
  // Fallback
  console.warn(`Unable to parse date value: ${value} (type: ${typeof value})`);
  return fallbackToNow ? new Date() : null;
}

/**
 * Converts a value to a Date object, ensuring it's not null
 * Always returns a Date (uses current date as fallback)
 */
export function toSafeDateRequired(value: any): Date {
  const date = toSafeDate(value, true);
  return date || new Date();
}

/**
 * Batch convert an object's timestamp fields to Date objects
 * @param obj - The object to process
 * @param fields - Array of field names to convert
 * @returns The object with converted date fields
 */
export function convertTimestampFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result) {
      result[field] = toSafeDate(result[field]);
    }
  }
  
  return result;
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(value: any): boolean {
  if (!(value instanceof Date)) return false;
  return !isNaN(value.getTime());
}

/**
 * Format a date for database storage
 */
export function formatForDb(date: Date | null): Date | null {
  if (!date) return null;
  if (!isValidDate(date)) return new Date();
  return date;
}

/**
 * Safely converts various timestamp formats to a Unix timestamp (integer, seconds since epoch)
 * @param value - Can be a Date, string (ISO or numeric), number (Unix timestamp or milliseconds), or null/undefined
 * @param fallbackDate - Optional fallback date to use if value is invalid
 * @returns Unix timestamp in seconds (integer), or null if invalid and no fallback
 */
export function toUnixTimestamp(value: any, fallbackDate?: Date): number | null {
  // Null or undefined
  if (value == null) {
    return fallbackDate ? Math.floor(fallbackDate.getTime() / 1000) : null;
  }
  
  // Already a number - check if it's seconds or milliseconds
  if (typeof value === 'number') {
    // Unix timestamps are typically 10 digits (seconds), milliseconds are 13 digits
    return value < 10000000000 ? Math.floor(value) : Math.floor(value / 1000);
  }
  
  // String format - could be ISO date or numeric string
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallbackDate ? Math.floor(fallbackDate.getTime() / 1000) : null;
    }
    
    // Try parsing as number first
    const numValue = Number(trimmed);
    if (!isNaN(numValue)) {
      return numValue < 10000000000 ? Math.floor(numValue) : Math.floor(numValue / 1000);
    }
    
    // Try parsing as ISO date string
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return Math.floor(date.getTime() / 1000);
      }
    } catch (e) {
      console.warn(`Failed to parse timestamp string: ${trimmed}`, e);
    }
  }
  
  // Date object
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return Math.floor(value.getTime() / 1000);
    }
  }
  
  // Fallback
  console.warn(`Unable to parse timestamp value: ${value} (type: ${typeof value})`);
  return fallbackDate ? Math.floor(fallbackDate.getTime() / 1000) : null;
}
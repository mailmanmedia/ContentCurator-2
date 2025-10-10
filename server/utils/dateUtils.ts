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
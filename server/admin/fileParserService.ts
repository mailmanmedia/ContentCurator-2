import * as XLSX from 'xlsx';
import { parseOffice } from 'officeparser';
import { XMLParser } from 'fast-xml-parser';
import sharp from 'sharp';

export interface ParsedFileResult {
  data?: any[];
  text?: string;
  metadata?: any;
}

export async function parseJSON(buffer: Buffer): Promise<any[]> {
  try {
    const content = buffer.toString('utf-8');
    const parsed = JSON.parse(content);
    
    // Handle both array and single object formats
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      return [parsed];
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseCSV(buffer: Buffer): Promise<any[]> {
  try {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return [];
    }
    
    // Parse CSV with proper handling of quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    // Get headers from first line
    const headers = parseCSVLine(lines[0] || '');
    
    // Parse data rows
    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i] || '');
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseXLSX(buffer: Buffer): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('No sheets found in XLSX file');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      throw new Error('Failed to load worksheet');
    }
    
    // Convert to JSON with headers as keys
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse XLSX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    return new Promise((resolve, reject) => {
      parseOffice(buffer, (data: string, err: any) => {
        if (err) {
          reject(new Error(`Failed to parse DOCX: ${err}`));
        } else {
          resolve(data || '');
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseHTML(buffer: Buffer): Promise<string> {
  try {
    const content = buffer.toString('utf-8');
    
    const parser = new XMLParser({
      ignoreAttributes: true,
      ignoreDeclaration: true,
      parseTagValue: true,
      trimValues: true
    });
    
    const result = parser.parse(content);
    
    // Extract text content recursively
    const extractText = (obj: any): string => {
      if (typeof obj === 'string') {
        return obj;
      }
      if (typeof obj === 'object') {
        return Object.values(obj).map(extractText).join(' ');
      }
      return '';
    };
    
    const text = extractText(result);
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    throw new Error(`Failed to parse HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to extract a single FBref stats table
function extractFBrefTable(content: string, tableId: string): Map<string, any> {
  const playerData = new Map<string, any>();
  
  const tableMatch = content.match(new RegExp(`<table[^>]*id="${tableId}"[^>]*>(.*?)<\/table>`, 's'));
  if (!tableMatch) {
    return playerData; // Return empty if table not found
  }
  
  const tableHtml = tableMatch[1];
  const tbodyMatch = tableHtml.match(/<tbody>(.*?)<\/tbody>/s);
  
  if (tbodyMatch) {
    const rowMatches = tbodyMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs);
    
    for (const rowMatch of rowMatches) {
      const rowHtml = rowMatch[1];
      
      // Skip header rows
      if (rowHtml.includes('class="thead"')) continue;
      
      const player: any = {};
      const cellMatches = rowHtml.matchAll(/data-stat="([^"]+)"[^>]*>(.*?)<\/t[dh]>/gs);
      
      for (const cellMatch of cellMatches) {
        const stat = cellMatch[1];
        const value = cellMatch[2].replace(/<[^>]+>/g, '').trim();
        player[stat] = value;
      }
      
      // Only include valid player rows with names
      if (player.player && player.player !== 'Squad Total' && player.player.length > 0) {
        playerData.set(player.player, player);
      }
    }
  }
  
  return playerData;
}

export async function parseFBrefHTML(buffer: Buffer): Promise<any[]> {
  try {
    const content = buffer.toString('utf-8');
    
    // Extract all 11 FBref stats tables
    const tables = {
      standard: extractFBrefTable(content, 'stats_standard_combined'),
      shooting: extractFBrefTable(content, 'stats_shooting_combined'),
      passing: extractFBrefTable(content, 'stats_passing_combined'),
      defense: extractFBrefTable(content, 'stats_defense_combined'),
      possession: extractFBrefTable(content, 'stats_possession_combined'),
      misc: extractFBrefTable(content, 'stats_misc_combined'),
      playingTime: extractFBrefTable(content, 'stats_playing_time_combined'),
      gca: extractFBrefTable(content, 'stats_gca_combined'),
      passingTypes: extractFBrefTable(content, 'stats_passing_types_combined'),
      keeper: extractFBrefTable(content, 'stats_keeper_combined'),
      keeperAdv: extractFBrefTable(content, 'stats_keeper_adv_combined')
    };
    
    // Get all unique player names from standard table (primary source)
    if (tables.standard.size === 0) {
      throw new Error('No player data found in FBref standard stats table');
    }
    
    // Merge all tables by player name
    const mergedPlayers: any[] = [];
    
    for (const [playerName, standardStats] of tables.standard) {
      const mergedStats = { ...standardStats };
      
      // Merge data from other tables
      const shootingStats = tables.shooting.get(playerName) || {};
      const passingStats = tables.passing.get(playerName) || {};
      const defenseStats = tables.defense.get(playerName) || {};
      const possessionStats = tables.possession.get(playerName) || {};
      const miscStats = tables.misc.get(playerName) || {};
      const playingTimeStats = tables.playingTime.get(playerName) || {};
      const gcaStats = tables.gca.get(playerName) || {};
      const passingTypesStats = tables.passingTypes.get(playerName) || {};
      const keeperStats = tables.keeper.get(playerName) || {};
      const keeperAdvStats = tables.keeperAdv.get(playerName) || {};
      
      // Merge all stats (later values overwrite earlier if key conflicts)
      Object.assign(mergedStats, shootingStats, passingStats, defenseStats, 
                    possessionStats, miscStats, playingTimeStats, gcaStats,
                    passingTypesStats, keeperStats, keeperAdvStats);
      
      mergedPlayers.push(mergedStats);
    }
    
    return mergedPlayers;
  } catch (error) {
    throw new Error(`Failed to parse FBref HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseImage(buffer: Buffer, mimeType: string): Promise<{width: number, height: number, format: string}> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown'
    };
  } catch (error) {
    throw new Error(`Failed to parse image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseFile(buffer: Buffer, fileType: string, mimeType?: string): Promise<ParsedFileResult> {
  try {
    switch (fileType.toLowerCase()) {
      case 'json':
        return { data: await parseJSON(buffer) };
      
      case 'csv':
        return { data: await parseCSV(buffer) };
      
      case 'xlsx':
      case 'xls':
        return { data: await parseXLSX(buffer) };
      
      case 'pdf':
        return { text: await parsePDF(buffer) };
      
      case 'docx':
      case 'doc':
        return { text: await parseDOCX(buffer) };
      
      case 'html':
      case 'htm':
        // Check if it's a FBref HTML file with player stats
        const htmlContent = buffer.toString('utf-8');
        if (htmlContent.includes('FBref.com') && htmlContent.includes('stats_standard_combined')) {
          return { data: await parseFBrefHTML(buffer) };
        }
        return { text: await parseHTML(buffer) };
      
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return { metadata: await parseImage(buffer, mimeType || 'image/jpeg') };
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    throw new Error(`File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

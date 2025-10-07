import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type LUTPreset = 'lfc_home' | 'lfc_away' | 'cinematic' | 'sports_broadcast' | 'social_vibrant';

export interface ColorAdjustments {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  gamma?: number;
}

const LUT_DIRECTORY = path.join(__dirname, '../assets/luts');

const LUT_PRESETS: Record<LUTPreset, string> = {
  lfc_home: 'lfc_home.cube',
  lfc_away: 'lfc_away.cube',
  cinematic: 'cinematic.cube',
  sports_broadcast: 'sports_broadcast.cube',
  social_vibrant: 'social_vibrant.cube'
};

export async function ensureLUTDirectory(): Promise<void> {
  try {
    await fs.mkdir(LUT_DIRECTORY, { recursive: true });
    console.log('LUT directory ensured:', LUT_DIRECTORY);
  } catch (err) {
    console.error('Error creating LUT directory:', err);
  }
}

export async function applyColorGrading(
  inputPath: string,
  outputPath: string,
  preset?: LUTPreset,
  adjustments?: ColorAdjustments
): Promise<string> {
  await ensureLUTDirectory();
  
  return new Promise(async (resolve, reject) => {
    const filters: string[] = [];

    if (preset && LUT_PRESETS[preset]) {
      const lutPath = path.join(LUT_DIRECTORY, LUT_PRESETS[preset]);
      
      try {
        await fs.access(lutPath);
        filters.push(`lut3d=${lutPath}`);
      } catch (err) {
        console.warn(`LUT file not found: ${lutPath}, skipping LUT application`);
      }
    }

    if (adjustments) {
      const eqFilters: string[] = [];
      
      if (adjustments.brightness !== undefined) {
        const brightness = adjustments.brightness / 100;
        eqFilters.push(`brightness=${brightness}`);
      }
      
      if (adjustments.contrast !== undefined) {
        const contrast = 1 + (adjustments.contrast / 100);
        eqFilters.push(`contrast=${contrast}`);
      }
      
      if (adjustments.saturation !== undefined) {
        const saturation = 1 + (adjustments.saturation / 100);
        eqFilters.push(`saturation=${saturation}`);
      }
      
      if (adjustments.gamma !== undefined) {
        const gamma = 1 + (adjustments.gamma / 100);
        eqFilters.push(`gamma=${gamma}`);
      }
      
      if (eqFilters.length > 0) {
        filters.push(`eq=${eqFilters.join(':')}`);
      }
    }

    if (filters.length === 0) {
      console.log('No color grading to apply, copying file');
      filters.push('copy');
    }

    const command = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac');

    if (filters.length > 0 && filters[0] !== 'copy') {
      command.videoFilters(filters.join(','));
    }

    command
      .on('start', (cmdLine) => {
        console.log('Color grading started:', cmdLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Color grading progress: ${progress.percent.toFixed(2)}%`);
        }
      })
      .on('end', () => {
        console.log(`Color grading complete: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Color grading error:', err);
        reject(err);
      })
      .run();
  });
}

export function buildColorFilter(adjustments: ColorAdjustments): string {
  const eqFilters: string[] = [];
  
  if (adjustments.brightness !== undefined) {
    const brightness = adjustments.brightness / 100;
    eqFilters.push(`brightness=${brightness}`);
  }
  
  if (adjustments.contrast !== undefined) {
    const contrast = 1 + (adjustments.contrast / 100);
    eqFilters.push(`contrast=${contrast}`);
  }
  
  if (adjustments.saturation !== undefined) {
    const saturation = 1 + (adjustments.saturation / 100);
    eqFilters.push(`saturation=${saturation}`);
  }
  
  if (adjustments.gamma !== undefined) {
    const gamma = 1 + (adjustments.gamma / 100);
    eqFilters.push(`gamma=${gamma}`);
  }
  
  return eqFilters.length > 0 ? `eq=${eqFilters.join(':')}` : '';
}

export async function createDefaultLUTs(): Promise<void> {
  await ensureLUTDirectory();
  
  const defaultLUT = `TITLE "Default LUT"
LUT_3D_SIZE 2

0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0`;

  for (const preset of Object.keys(LUT_PRESETS)) {
    const lutPath = path.join(LUT_DIRECTORY, LUT_PRESETS[preset as LUTPreset]);
    
    try {
      await fs.access(lutPath);
      console.log(`LUT already exists: ${lutPath}`);
    } catch {
      await fs.writeFile(lutPath, defaultLUT);
      console.log(`Created default LUT: ${lutPath}`);
    }
  }
}

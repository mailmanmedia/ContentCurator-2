import ffmpeg from 'fluent-ffmpeg';

export interface AudioEnhancementOptions {
  noiseReduction?: boolean;
  compression?: boolean;
  voiceClarity?: boolean;
  normalization?: boolean;
  volume?: number;
}

export async function enhanceAudio(
  inputPath: string,
  outputPath: string,
  options: AudioEnhancementOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const audioFilters: string[] = [];

    if (options.noiseReduction) {
      audioFilters.push('highpass=f=80');
      audioFilters.push('lowpass=f=15000');
    }

    if (options.compression) {
      audioFilters.push(
        'compand=attacks=0.1:decays=0.2:points=-80/-80|-45/-45|-27/-25|0/-15:soft-knee=6:gain=0:volume=-90:delay=0.1'
      );
    }

    if (options.voiceClarity) {
      audioFilters.push('equalizer=f=3000:width_type=q:width=1:g=3');
    }

    if (options.normalization) {
      audioFilters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    if (options.volume !== undefined && options.volume !== 100) {
      const volumeDb = 20 * Math.log10(options.volume / 100);
      audioFilters.push(`volume=${volumeDb}dB`);
    }

    const command = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('copy');

    if (audioFilters.length > 0) {
      command
        .audioCodec('aac')
        .audioBitrate('192k')
        .audioFilters(audioFilters);
    } else {
      command.audioCodec('copy');
    }

    command
      .on('start', (cmdLine) => {
        console.log('Audio enhancement started:', cmdLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Audio processing: ${progress.percent.toFixed(2)}%`);
        }
      })
      .on('end', () => {
        console.log(`Audio enhancement complete: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Audio enhancement error:', err);
        reject(err);
      })
      .run();
  });
}

export async function normalizeAudioLevels(
  inputPath: string,
  outputPath: string,
  targetLUFS: number = -16
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('copy')
      .audioCodec('aac')
      .audioBitrate('192k')
      .audioFilters(`loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`)
      .on('end', () => {
        console.log('Audio normalization complete');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Audio normalization error:', err);
        reject(err);
      })
      .run();
  });
}

export async function extractAudioMetrics(inputPath: string): Promise<{
  peakLevel: number;
  meanLevel: number;
  dynamicRange: number;
}> {
  return new Promise((resolve, reject) => {
    let peakLevel = -Infinity;
    let meanLevel = 0;
    
    ffmpeg(inputPath)
      .outputOptions([
        '-af', 'volumedetect',
        '-f', 'null'
      ])
      .on('stderr', (stderrLine) => {
        const maxMatch = stderrLine.match(/max_volume: ([-\d.]+) dB/);
        const meanMatch = stderrLine.match(/mean_volume: ([-\d.]+) dB/);
        
        if (maxMatch) {
          peakLevel = parseFloat(maxMatch[1]);
        }
        if (meanMatch) {
          meanLevel = parseFloat(meanMatch[1]);
        }
      })
      .on('end', () => {
        resolve({
          peakLevel,
          meanLevel,
          dynamicRange: Math.abs(peakLevel - meanLevel)
        });
      })
      .on('error', (err) => {
        console.error('Audio metrics extraction error:', err);
        reject(err);
      })
      .output('-')
      .run();
  });
}

export function buildAudioFilterChain(options: AudioEnhancementOptions): string {
  const filters: string[] = [];

  if (options.noiseReduction) {
    filters.push('highpass=f=80', 'lowpass=f=15000');
  }

  if (options.compression) {
    filters.push(
      'compand=attacks=0.1:decays=0.2:points=-80/-80|-45/-45|-27/-25|0/-15:soft-knee=6:gain=0:volume=-90:delay=0.1'
    );
  }

  if (options.voiceClarity) {
    filters.push('equalizer=f=3000:width_type=q:width=1:g=3');
  }

  if (options.normalization) {
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
  }

  if (options.volume !== undefined && options.volume !== 100) {
    const volumeDb = 20 * Math.log10(options.volume / 100);
    filters.push(`volume=${volumeDb}dB`);
  }

  return filters.join(',');
}

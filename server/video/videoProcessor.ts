import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

export interface VideoMetadata {
  duration: number;
  resolution: { width: number; height: number };
  codec: string;
  bitrate: number;
  fps: number;
  size: number;
}

export interface SceneChange {
  time: number;
  score: number;
}

export interface SilencePeriod {
  start: number;
  end: number;
  duration: number;
}

export async function analyzeVideo(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Error analyzing video:', err);
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }

      const duration = metadata.format.duration || 0;
      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const codec = videoStream.codec_name || 'unknown';
      const bitrate = parseInt(metadata.format.bit_rate || '0');
      const fps = eval(videoStream.r_frame_rate || '30/1');
      const size = metadata.format.size || 0;

      resolve({
        duration,
        resolution: { width, height },
        codec,
        bitrate,
        fps,
        size
      });
    });
  });
}

export async function detectScenes(filePath: string, threshold: number = 0.3): Promise<SceneChange[]> {
  return new Promise((resolve, reject) => {
    const scenes: SceneChange[] = [];
    const filterString = `select='gt(scene,${threshold})',metadata=print:file=-`;
    
    ffmpeg(filePath)
      .outputOptions([
        '-vf', filterString,
        '-an',
        '-f', 'null'
      ])
      .on('stderr', (stderrLine) => {
        const match = stderrLine.match(/pts_time:([\d.]+).*scene:([\d.]+)/);
        if (match) {
          const time = parseFloat(match[1]);
          const score = parseFloat(match[2]);
          scenes.push({ time, score });
        }
      })
      .on('end', () => {
        console.log(`Detected ${scenes.length} scene changes`);
        resolve(scenes);
      })
      .on('error', (err) => {
        console.error('Scene detection error:', err);
        reject(err);
      })
      .output('-')
      .run();
  });
}

export async function detectSilences(
  filePath: string, 
  noiseThreshold: number = -40, 
  minDuration: number = 0.5
): Promise<SilencePeriod[]> {
  return new Promise((resolve, reject) => {
    const silences: SilencePeriod[] = [];
    const filterString = `silencedetect=n=${noiseThreshold}dB:d=${minDuration}`;
    
    ffmpeg(filePath)
      .audioFilters(filterString)
      .outputOptions(['-f', 'null'])
      .on('stderr', (stderrLine) => {
        const startMatch = stderrLine.match(/silence_start: ([\d.]+)/);
        const endMatch = stderrLine.match(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/);
        
        if (startMatch) {
          silences.push({
            start: parseFloat(startMatch[1]),
            end: 0,
            duration: 0
          });
        } else if (endMatch && silences.length > 0) {
          const lastSilence = silences[silences.length - 1];
          lastSilence.end = parseFloat(endMatch[1]);
          lastSilence.duration = parseFloat(endMatch[2]);
        }
      })
      .on('end', () => {
        const validSilences = silences.filter(s => s.end > 0);
        console.log(`Detected ${validSilences.length} silence periods`);
        resolve(validSilences);
      })
      .on('error', (err) => {
        console.error('Silence detection error:', err);
        reject(err);
      })
      .output('-')
      .run();
  });
}

export async function generateThumbnail(
  filePath: string, 
  outputPath: string, 
  position: number = 0.25
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await analyzeVideo(filePath);
      const timeInSeconds = metadata.duration * position;
      
      ffmpeg(filePath)
        .screenshots({
          timestamps: [timeInSeconds],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '320x?'
        })
        .on('end', () => {
          console.log(`Thumbnail generated: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Thumbnail generation error:', err);
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
}

export async function extractAudio(videoPath: string, audioPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(48000)
      .audioChannels(2)
      .on('end', () => {
        console.log('Audio extracted successfully');
        resolve(audioPath);
      })
      .on('error', (err) => {
        console.error('Audio extraction error:', err);
        reject(err);
      })
      .run();
  });
}

export async function trimVideo(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .videoCodec('copy')
      .audioCodec('copy')
      .on('end', () => {
        console.log(`Video trimmed: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Video trim error:', err);
        reject(err);
      })
      .run();
  });
}

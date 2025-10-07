import Queue from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { storage } from '../storage';
import { applyColorGrading, type LUTPreset, type ColorAdjustments } from './colorGrader';
import { enhanceAudio, type AudioEnhancementOptions } from './audioProcessor';
import type { VideoClip, RenderJob } from '@shared/schema';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const RENDERS_DIR = '/tmp/renders';

export interface RenderSettings {
  format: 'mp4' | 'webm';
  resolution?: { width: number; height: number };
  bitrate?: string;
  fps?: number;
  colorGradingPreset?: LUTPreset;
  colorAdjustments?: ColorAdjustments;
  audioEnhancement?: AudioEnhancementOptions;
}

export interface RenderJobData {
  projectId: string;
  clips: VideoClip[];
  settings: RenderSettings;
  renderJobId: string;
}

export const renderQueue = new Queue('video-renders', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: false,
    removeOnFail: false
  }
});

async function ensureRendersDirectory(): Promise<void> {
  try {
    await fs.mkdir(RENDERS_DIR, { recursive: true });
    console.log('Renders directory ensured:', RENDERS_DIR);
  } catch (err) {
    console.error('Error creating renders directory:', err);
  }
}

export async function addRenderJob(
  projectId: string,
  clips: VideoClip[],
  settings: RenderSettings
): Promise<string> {
  const renderJob = await storage.createRenderJob({
    projectId,
    status: 'pending',
    progress: 0,
    processingSteps: []
  });

  const jobData: RenderJobData = {
    projectId,
    clips,
    settings,
    renderJobId: renderJob.id
  };

  await renderQueue.add(jobData, {
    jobId: renderJob.id
  });

  console.log(`Render job queued: ${renderJob.id}`);
  return renderJob.id;
}

async function updateJobProgress(
  jobId: string,
  progress: number,
  step?: string
): Promise<void> {
  const updates: any = { progress };
  
  if (step) {
    const job = await storage.getRenderJob(jobId);
    if (job) {
      const steps = [...(job.processingSteps as string[] || []), step];
      updates.processingSteps = steps;
    }
  }
  
  await storage.updateRenderJob(jobId, updates);
}

export async function processRenderJob(job: Queue.Job<RenderJobData>): Promise<void> {
  const { projectId, clips, settings, renderJobId } = job.data;
  
  console.log(`Processing render job: ${renderJobId}`);
  
  await ensureRendersDirectory();
  await storage.updateRenderJob(renderJobId, { status: 'processing' });
  
  try {
    const startTime = Date.now();
    
    await updateJobProgress(renderJobId, 5, 'Preparing clips');
    
    const clipFiles: string[] = [];
    const tempDir = path.join(RENDERS_DIR, `temp_${renderJobId}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      await updateJobProgress(renderJobId, 10 + (i / clips.length) * 30, `Processing clip ${i + 1}/${clips.length}`);
      
      const recording = await storage.getRecording(clip.sourceRecordingId);
      if (!recording) {
        throw new Error(`Recording not found: ${clip.sourceRecordingId}`);
      }
      
      const clipPath = path.join(tempDir, `clip_${i}.mp4`);
      const startSeconds = clip.startTime / 1000;
      const durationSeconds = clip.duration / 1000;
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(recording.filepath)
          .setStartTime(startSeconds)
          .setDuration(durationSeconds)
          .output(clipPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => resolve())
          .on('error', reject)
          .run();
      });
      
      clipFiles.push(clipPath);
    }
    
    await updateJobProgress(renderJobId, 45, 'Concatenating clips');
    
    const concatListPath = path.join(tempDir, 'concat.txt');
    const concatContent = clipFiles.map(f => `file '${f}'`).join('\n');
    await fs.writeFile(concatListPath, concatContent);
    
    const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(concatenatedPath)
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    
    await updateJobProgress(renderJobId, 60, 'Applying color grading');
    
    let processedPath = concatenatedPath;
    
    if (settings.colorGradingPreset || settings.colorAdjustments) {
      const colorGradedPath = path.join(tempDir, 'color_graded.mp4');
      await applyColorGrading(
        processedPath,
        colorGradedPath,
        settings.colorGradingPreset,
        settings.colorAdjustments
      );
      processedPath = colorGradedPath;
    }
    
    await updateJobProgress(renderJobId, 75, 'Enhancing audio');
    
    if (settings.audioEnhancement) {
      const audioEnhancedPath = path.join(tempDir, 'audio_enhanced.mp4');
      await enhanceAudio(processedPath, audioEnhancedPath, settings.audioEnhancement);
      processedPath = audioEnhancedPath;
    }
    
    await updateJobProgress(renderJobId, 85, 'Finalizing output');
    
    const extension = settings.format === 'webm' ? 'webm' : 'mp4';
    const finalPath = path.join(RENDERS_DIR, `render_${renderJobId}.${extension}`);
    
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(processedPath)
        .output(finalPath);
      
      if (settings.format === 'webm') {
        command
          .videoCodec('libvpx-vp9')
          .audioCodec('libopus');
      } else {
        command
          .videoCodec('libx264')
          .audioCodec('aac');
      }
      
      if (settings.resolution) {
        command.size(`${settings.resolution.width}x${settings.resolution.height}`);
      }
      
      if (settings.bitrate) {
        command.videoBitrate(settings.bitrate);
      }
      
      if (settings.fps) {
        command.fps(settings.fps);
      }
      
      command
        .on('progress', (progress) => {
          if (progress.percent) {
            const finalProgress = 85 + (progress.percent / 100) * 10;
            updateJobProgress(renderJobId, Math.round(finalProgress), 'Encoding final output');
          }
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
    
    await updateJobProgress(renderJobId, 95, 'Cleaning up');
    
    await fs.rm(tempDir, { recursive: true, force: true });
    
    const stats = await fs.stat(finalPath);
    const processingTime = Math.floor((Date.now() - startTime) / 1000);
    
    await storage.updateRenderJob(renderJobId, {
      status: 'completed',
      progress: 100,
      outputPath: finalPath,
      outputSize: stats.size,
      processingTime,
      completedAt: new Date()
    });
    
    console.log(`Render job completed: ${renderJobId}`);
    
  } catch (err: any) {
    console.error(`Render job failed: ${renderJobId}`, err);
    
    await storage.updateRenderJob(renderJobId, {
      status: 'failed',
      errorMessage: err.message
    });
    
    throw err;
  }
}

renderQueue.process(async (job) => {
  await processRenderJob(job);
});

renderQueue.on('completed', (job) => {
  console.log(`Job completed: ${job.id}`);
});

renderQueue.on('failed', (job, err) => {
  console.error(`Job failed: ${job.id}`, err);
});

console.log('Render queue initialized');

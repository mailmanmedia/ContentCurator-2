import { detectScenes, detectSilences, analyzeVideo, type SceneChange, type SilencePeriod } from './videoProcessor';

export interface CutPoint {
  time: number;
  type: 'scene' | 'silence' | 'manual';
  score?: number;
  suggestedDuration?: number;
}

export interface VideoSegment {
  startTime: number;
  endTime: number;
  duration: number;
  type: string;
}

interface PacingRules {
  minDuration: number;
  maxDuration: number;
}

export async function analyzeCutPoints(videoPath: string): Promise<CutPoint[]> {
  console.log('Analyzing cut points for:', videoPath);
  
  const [scenes, silences, metadata] = await Promise.all([
    detectScenes(videoPath, 0.3),
    detectSilences(videoPath, -40, 0.5),
    analyzeVideo(videoPath)
  ]);

  const cutPoints: CutPoint[] = [];

  scenes.forEach(scene => {
    cutPoints.push({
      time: scene.time,
      type: 'scene',
      score: scene.score
    });
  });

  silences.forEach(silence => {
    cutPoints.push({
      time: silence.start,
      type: 'silence'
    });
    cutPoints.push({
      time: silence.end,
      type: 'silence'
    });
  });

  cutPoints.sort((a, b) => a.time - b.time);

  const uniqueCutPoints = cutPoints.filter((cut, index, array) => {
    if (index === 0) return true;
    const timeDiff = Math.abs(cut.time - array[index - 1].time);
    return timeDiff > 0.5;
  });

  console.log(`Found ${uniqueCutPoints.length} unique cut points`);
  return uniqueCutPoints;
}

function getPacingRules(videoPosition: number, totalDuration: number): PacingRules {
  if (videoPosition < 15) {
    return { minDuration: 2, maxDuration: 3 };
  } else if (videoPosition < 60) {
    return { minDuration: 3, maxDuration: 5 };
  } else {
    return { minDuration: 5, maxDuration: 8 };
  }
}

export async function optimizePacing(
  cutPoints: CutPoint[],
  totalDuration: number
): Promise<VideoSegment[]> {
  console.log('Optimizing pacing for video segments');
  
  const segments: VideoSegment[] = [];
  
  if (cutPoints.length === 0) {
    const rules = getPacingRules(0, totalDuration);
    let currentTime = 0;
    
    while (currentTime < totalDuration) {
      const segmentDuration = Math.min(
        rules.maxDuration,
        totalDuration - currentTime
      );
      
      if (segmentDuration >= rules.minDuration) {
        segments.push({
          startTime: currentTime,
          endTime: currentTime + segmentDuration,
          duration: segmentDuration,
          type: 'auto'
        });
      }
      
      currentTime += segmentDuration;
    }
    
    return segments;
  }

  let lastCutTime = 0;
  
  cutPoints.forEach((cut, index) => {
    const segmentDuration = cut.time - lastCutTime;
    const rules = getPacingRules(lastCutTime, totalDuration);
    
    if (segmentDuration >= rules.minDuration && segmentDuration <= rules.maxDuration) {
      segments.push({
        startTime: lastCutTime,
        endTime: cut.time,
        duration: segmentDuration,
        type: cut.type
      });
      lastCutTime = cut.time;
    } else if (segmentDuration > rules.maxDuration) {
      let subSegmentStart = lastCutTime;
      
      while (subSegmentStart < cut.time) {
        const subRules = getPacingRules(subSegmentStart, totalDuration);
        const subDuration = Math.min(subRules.maxDuration, cut.time - subSegmentStart);
        
        if (subDuration >= subRules.minDuration) {
          segments.push({
            startTime: subSegmentStart,
            endTime: subSegmentStart + subDuration,
            duration: subDuration,
            type: 'auto-split'
          });
        }
        
        subSegmentStart += subDuration;
      }
      
      lastCutTime = cut.time;
    }
  });

  if (lastCutTime < totalDuration) {
    const remainingDuration = totalDuration - lastCutTime;
    const rules = getPacingRules(lastCutTime, totalDuration);
    
    if (remainingDuration >= rules.minDuration) {
      segments.push({
        startTime: lastCutTime,
        endTime: totalDuration,
        duration: remainingDuration,
        type: 'final'
      });
    } else if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      lastSegment.endTime = totalDuration;
      lastSegment.duration = totalDuration - lastSegment.startTime;
    }
  }

  const filteredSegments = segments.filter(seg => {
    const rules = getPacingRules(seg.startTime, totalDuration);
    return seg.duration >= rules.minDuration && seg.duration <= rules.maxDuration;
  });

  console.log(`Created ${filteredSegments.length} optimized segments`);
  return filteredSegments;
}

export function suggestClipDurations(segments: VideoSegment[]): VideoSegment[] {
  return segments.map((segment, index) => {
    const position = segment.startTime;
    const totalDuration = segments[segments.length - 1].endTime;
    const rules = getPacingRules(position, totalDuration);
    
    let suggestedDuration = segment.duration;
    
    if (segment.duration > rules.maxDuration) {
      suggestedDuration = rules.maxDuration;
    } else if (segment.duration < rules.minDuration) {
      suggestedDuration = rules.minDuration;
    }
    
    return {
      ...segment,
      duration: suggestedDuration,
      endTime: segment.startTime + suggestedDuration
    };
  });
}

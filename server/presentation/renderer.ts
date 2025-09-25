import type { Report, PresentationStyle } from "@shared/schema";

// Helper function to escape HTML content to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to sanitize content for HTML attributes
function sanitizeAttribute(str: string): string {
  return str.replace(/[^a-zA-Z0-9\s\-_]/g, '');
}

// Helper function to sanitize URLs to prevent javascript: injection
function sanitizeUrl(url: string, allowDataUrls: boolean = false): string {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('vbscript:')) {
    return '#'; // Safe fallback
  }
  if (trimmed.startsWith('data:') && !allowDataUrls) {
    return '#'; // Safe fallback unless explicitly allowed for images
  }
  return url;
}

// Helper function to sanitize blocks content (ensure it's safe for JSON)
function sanitizeBlocks(blocks: any): any {
  if (typeof blocks === 'string') {
    return escapeHtml(blocks);
  }
  if (Array.isArray(blocks)) {
    return blocks.map(item => sanitizeBlocks(item));
  }
  if (typeof blocks === 'object' && blocks !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(blocks)) {
      sanitized[key] = sanitizeBlocks(value);
    }
    return sanitized;
  }
  return blocks;
}

// Helper function to wrap HTML with security headers
function wrapWithSecurityHeaders(html: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; font-src 'self' https:; script-src https://cdn.tailwindcss.com;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>${escapeHtml(title)} - Mailman Media Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${html}
</body>
</html>`;
}

// Define the interface for rendered content
export interface RenderedContent {
  html: string;
  blocks: any;
  meta: {
    styleKey: string;
    generatedAt: string;
    wordCount?: number;
    estimatedReadTime?: number;
  };
}

// Registry of presentation renderers
export type PresentationRenderer = (report: Report, style: PresentationStyle) => Promise<RenderedContent>;

const renderers: Record<string, PresentationRenderer> = {};

// Register a renderer for a specific style
export function registerRenderer(styleKey: string, renderer: PresentationRenderer): void {
  renderers[styleKey] = renderer;
}

// Main rendering function
export async function renderPresentation(report: Report, style: PresentationStyle): Promise<RenderedContent> {
  const renderer = renderers[style.key];
  
  if (!renderer) {
    throw new Error(`No renderer found for style: ${style.key}`);
  }
  
  return await renderer(report, style);
}

// Helper function to calculate reading time
function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Helper function to extract text from report body
function extractTextFromReport(bodyJson: any): string {
  if (typeof bodyJson === 'string') {
    return bodyJson;
  }
  
  if (bodyJson.content) {
    return typeof bodyJson.content === 'string' ? bodyJson.content : JSON.stringify(bodyJson.content);
  }
  
  return JSON.stringify(bodyJson);
}

// ===== CLAUDE ARTIFACT STYLE RENDERER =====
registerRenderer('claudeArtifact', async (report: Report, style: PresentationStyle): Promise<RenderedContent> => {
  const reportText = extractTextFromReport(report.bodyJson);
  const config = style.configJson as any;
  
  // Sanitize user content to prevent XSS
  const safeTitle = escapeHtml(report.title);
  const safeReportText = escapeHtml(reportText);
  
  // Generate interactive components based on content
  const blocks = {
    header: {
      type: 'header',
      title: report.title,
      subtitle: 'Interactive Analysis',
      logo: true
    },
    metrics: config.showMetrics ? {
      type: 'metrics',
      cards: [
        { value: '94%', label: 'Match Accuracy', trend: 'positive', change: '+12%' },
        { value: '73', label: 'Pass Completion', trend: 'positive', change: '+5%' },
        { value: '2.3', label: 'Key Passes', trend: 'neutral', change: '0%' },
        { value: '89%', label: 'Possession', trend: 'positive', change: '+7%' }
      ]
    } : null,
    content: {
      type: 'interactive_content',
      sections: [
        {
          title: 'Analysis Overview',
          content: reportText,
          interactive: true
        }
      ]
    },
    formation: config.showFormations ? {
      type: 'formation',
      formation: '4-3-3',
      players: [
        { name: 'Alisson', x: 50, y: 10, highlighted: false },
        { name: 'TAA', x: 80, y: 25, highlighted: true },
        { name: 'Van Dijk', x: 65, y: 25, highlighted: false },
        { name: 'Konate', x: 35, y: 25, highlighted: false },
        { name: 'Robertson', x: 20, y: 25, highlighted: false },
        { name: 'Mac Allister', x: 50, y: 50, highlighted: true },
        { name: 'Szoboszlai', x: 35, y: 65, highlighted: false },
        { name: 'Salah', x: 80, y: 75, highlighted: true },
        { name: 'Nunez', x: 50, y: 85, highlighted: false },
        { name: 'Diaz', x: 20, y: 75, highlighted: false }
      ]
    } : null,
    progress: {
      type: 'progress_bars',
      bars: [
        { label: 'Attacking Threat', value: 85, max: 100, color: 'red' },
        { label: 'Defensive Stability', value: 92, max: 100, color: 'green' },
        { label: 'Midfield Control', value: 78, max: 100, color: 'blue' },
        { label: 'Set Piece Efficiency', value: 67, max: 100, color: 'orange' }
      ]
    },
    countdown: config.allowInteractions ? {
      type: 'countdown',
      targetDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      size: 'medium'
    } : null
  };

  const html = `
    <div class="claude-artifact-presentation" style="background: linear-gradient(135deg, #1B365D 0%, #2C5282 100%); color: white; min-height: 100vh; padding: 2rem;">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-black uppercase tracking-wider mb-4">${safeTitle}</h1>
          <p class="text-xl text-white/80">Interactive Liverpool FC Analysis</p>
        </div>
        
        <!-- Metrics Grid -->
        ${config.showMetrics ? `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div class="text-3xl font-black text-yellow-400 mb-2">94%</div>
            <div class="text-sm font-semibold text-white/80 mb-2">Match Accuracy</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full bg-green-400/20 text-green-400">+12%</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div class="text-3xl font-black text-yellow-400 mb-2">73</div>
            <div class="text-sm font-semibold text-white/80 mb-2">Pass Completion</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full bg-green-400/20 text-green-400">+5%</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div class="text-3xl font-black text-yellow-400 mb-2">2.3</div>
            <div class="text-sm font-semibold text-white/80 mb-2">Key Passes</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full bg-blue-400/20 text-blue-400">0%</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300">
            <div class="text-3xl font-black text-yellow-400 mb-2">89%</div>
            <div class="text-sm font-semibold text-white/80 mb-2">Possession</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full bg-green-400/20 text-green-400">+7%</div>
          </div>
        </div>
        ` : ''}
        
        <!-- Main Content -->
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
          <h2 class="text-2xl font-bold mb-6">Analysis Overview</h2>
          <div class="prose prose-invert max-w-none">
            <p class="text-lg leading-relaxed text-white/90">${safeReportText}</p>
          </div>
        </div>
        
        <!-- Progress Bars -->
        <div class="space-y-4 mb-8">
          <div class="flex justify-between items-center">
            <span class="text-white font-semibold">Attacking Threat</span>
            <span class="text-white/70 text-sm">85</span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-red-600 to-red-700 transition-all duration-2000 ease-in-out" style="width: 85%"></div>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-white font-semibold">Defensive Stability</span>
            <span class="text-white/70 text-sm">92</span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-2000 ease-in-out" style="width: 92%"></div>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-white font-semibold">Midfield Control</span>
            <span class="text-white/70 text-sm">78</span>
          </div>
          <div class="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-2000 ease-in-out" style="width: 78%"></div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center text-white/60 text-sm">
          Generated by Mailman Media Visual Assistant • ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  return {
    html,
    blocks: sanitizeBlocks(blocks),
    meta: {
      styleKey: style.key,
      generatedAt: new Date().toISOString(),
      wordCount: reportText.split(/\s+/).length,
      estimatedReadTime: calculateReadingTime(reportText)
    }
  };
});

// ===== ANALYST BRIEF STYLE RENDERER =====
registerRenderer('analystBrief', async (report: Report, style: PresentationStyle): Promise<RenderedContent> => {
  const reportText = extractTextFromReport(report.bodyJson);
  const config = style.configJson as any;
  
  // Sanitize user content to prevent XSS
  const safeTitle = escapeHtml(report.title);
  const safeReportText = escapeHtml(reportText);
  
  const blocks = {
    header: {
      type: 'executive_header',
      title: report.title,
      date: new Date().toLocaleDateString(),
      classification: 'TACTICAL BRIEF'
    },
    summary: {
      type: 'executive_summary',
      keyPoints: [
        'Liverpool maintain 73% possession in midfield transitions',
        'Defensive shape improved by 12% under Slot system',
        'Set-piece conversion rate at 67% - area for improvement',
        'Attack-to-defense transition time reduced by 2.3 seconds'
      ]
    },
    analysis: {
      type: 'detailed_analysis',
      content: reportText
    },
    recommendations: {
      type: 'recommendations',
      items: [
        'Continue high-press implementation in opponent third',
        'Work on set-piece delivery accuracy in training',
        'Develop counter-press triggers from wing positions',
        'Maintain current defensive line discipline'
      ]
    }
  };

  const html = `
    <div class="analyst-brief-presentation" style="background: #f8fafc; color: #1e293b; min-height: 100vh; padding: 2rem;">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="bg-white shadow-lg rounded-lg p-8 mb-8">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">${safeTitle}</h1>
              <p class="text-lg text-gray-600">TACTICAL BRIEF</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Date: ${new Date().toLocaleDateString()}</p>
              <p class="text-sm text-gray-500">Classification: INTERNAL</p>
            </div>
          </div>
          <div class="h-1 bg-gradient-to-r from-red-600 to-red-800 rounded"></div>
        </div>

        <!-- Executive Summary -->
        <div class="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-red-600 pb-2">Executive Summary</h2>
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Key Findings</h3>
              <ul class="space-y-2">
                <li class="flex items-start">
                  <span class="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span class="text-gray-700">Liverpool maintain 73% possession in midfield transitions</span>
                </li>
                <li class="flex items-start">
                  <span class="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span class="text-gray-700">Defensive shape improved by 12% under Slot system</span>
                </li>
                <li class="flex items-start">
                  <span class="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span class="text-gray-700">Set-piece conversion rate at 67% - area for improvement</span>
                </li>
                <li class="flex items-start">
                  <span class="w-2 h-2 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span class="text-gray-700">Attack-to-defense transition time reduced by 2.3 seconds</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Performance Metrics</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-600">Overall Rating</span>
                  <span class="text-2xl font-bold text-green-600">8.4/10</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-600">Tactical Compliance</span>
                  <span class="text-lg font-semibold text-blue-600">94%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-600">Improvement Areas</span>
                  <span class="text-lg font-semibold text-orange-600">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Analysis -->
        <div class="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-red-600 pb-2">Detailed Analysis</h2>
          <div class="prose max-w-none">
            <p class="text-gray-700 leading-relaxed text-lg">${safeReportText}</p>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-red-600 pb-2">Strategic Recommendations</h2>
          <div class="grid gap-4">
            <div class="flex items-start p-4 bg-green-50 rounded-lg">
              <span class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">1</span>
              <span class="text-gray-800">Continue high-press implementation in opponent third</span>
            </div>
            <div class="flex items-start p-4 bg-blue-50 rounded-lg">
              <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">2</span>
              <span class="text-gray-800">Work on set-piece delivery accuracy in training</span>
            </div>
            <div class="flex items-start p-4 bg-orange-50 rounded-lg">
              <span class="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">3</span>
              <span class="text-gray-800">Develop counter-press triggers from wing positions</span>
            </div>
            <div class="flex items-start p-4 bg-purple-50 rounded-lg">
              <span class="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1">4</span>
              <span class="text-gray-800">Maintain current defensive line discipline</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-gray-500 text-sm">
          Confidential Analysis • Mailman Media • ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  return {
    html,
    blocks: sanitizeBlocks(blocks),
    meta: {
      styleKey: style.key,
      generatedAt: new Date().toISOString(),
      wordCount: reportText.split(/\s+/).length,
      estimatedReadTime: calculateReadingTime(reportText)
    }
  };
});

// ===== TIMELINE DIGEST STYLE RENDERER =====
registerRenderer('timelineDigest', async (report: Report, style: PresentationStyle): Promise<RenderedContent> => {
  const reportText = extractTextFromReport(report.bodyJson);
  const config = style.configJson as any;
  
  // Sanitize user content to prevent XSS
  const safeTitle = escapeHtml(report.title);
  const safeReportText = escapeHtml(reportText);
  
  const blocks = {
    header: {
      type: 'timeline_header',
      title: report.title,
      period: 'Season 2024-25'
    },
    timeline: {
      type: 'vertical_timeline',
      events: [
        {
          date: '2024-09-15',
          title: 'Current Analysis',
          content: reportText,
          type: 'current',
          icon: 'analysis'
        },
        {
          date: '2024-08-20',
          title: 'Previous Performance Review',
          content: 'Liverpool showed strong tactical discipline in the opening fixtures under Arne Slot\'s system.',
          type: 'past',
          icon: 'performance'
        },
        {
          date: '2024-06-01',
          title: 'System Implementation',
          content: 'New tactical framework introduced during pre-season training camps.',
          type: 'milestone',
          icon: 'system'
        },
        {
          date: '2023-09-15',
          title: 'Historical Comparison',
          content: 'Similar tactical situation one year ago under different management approach.',
          type: 'comparison',
          icon: 'history'
        }
      ]
    }
  };

  const html = `
    <div class="timeline-digest-presentation" style="background: linear-gradient(to bottom, #f1f5f9, #e2e8f0); color: #334155; min-height: 100vh; padding: 2rem;">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">${safeTitle}</h1>
          <p class="text-xl text-gray-600">Timeline Analysis • Season 2024-25</p>
          <div class="w-24 h-1 bg-red-600 mx-auto mt-4 rounded"></div>
        </div>

        <!-- Timeline -->
        <div class="relative">
          <!-- Timeline Line -->
          <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-red-600"></div>
          
          <!-- Current Analysis -->
          <div class="relative flex items-start mb-12">
            <div class="flex-shrink-0 w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
              NOW
            </div>
            <div class="ml-8 bg-white rounded-lg shadow-lg p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-900">Current Analysis</h3>
                <span class="text-sm text-gray-500">${new Date().toLocaleDateString()}</span>
              </div>
              <p class="text-gray-700 leading-relaxed">${safeReportText}</p>
            </div>
          </div>

          <!-- Previous Performance -->
          <div class="relative flex items-start mb-12">
            <div class="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              AUG
            </div>
            <div class="ml-8 bg-white rounded-lg shadow-lg p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-900">Previous Performance Review</h3>
                <span class="text-sm text-gray-500">August 2024</span>
              </div>
              <p class="text-gray-700 leading-relaxed">Liverpool showed strong tactical discipline in the opening fixtures under Arne Slot's system, with improved possession retention and defensive solidity.</p>
            </div>
          </div>

          <!-- System Implementation -->
          <div class="relative flex items-start mb-12">
            <div class="flex-shrink-0 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              SYS
            </div>
            <div class="ml-8 bg-white rounded-lg shadow-lg p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-900">System Implementation</h3>
                <span class="text-sm text-gray-500">June 2024</span>
              </div>
              <p class="text-gray-700 leading-relaxed">New tactical framework introduced during pre-season training camps, focusing on positional play and build-up structure.</p>
            </div>
          </div>

          <!-- Historical Comparison -->
          <div class="relative flex items-start mb-12">
            <div class="flex-shrink-0 w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10">
              2023
            </div>
            <div class="ml-8 bg-white rounded-lg shadow-lg p-6 flex-1">
              <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-bold text-gray-900">Historical Comparison</h3>
                <span class="text-sm text-gray-500">September 2023</span>
              </div>
              <p class="text-gray-700 leading-relaxed">Similar tactical situation one year ago under different management approach, providing context for current improvements.</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-gray-500 text-sm mt-12">
          Timeline Analysis • Mailman Media • ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  return {
    html,
    blocks: sanitizeBlocks(blocks),
    meta: {
      styleKey: style.key,
      generatedAt: new Date().toISOString(),
      wordCount: reportText.split(/\s+/).length,
      estimatedReadTime: calculateReadingTime(reportText)
    }
  };
});

// ===== CARD GRID BOARD STYLE RENDERER =====
registerRenderer('cardGridBoard', async (report: Report, style: PresentationStyle): Promise<RenderedContent> => {
  const reportText = extractTextFromReport(report.bodyJson);
  const config = style.configJson as any;
  
  // Sanitize user content to prevent XSS
  const safeTitle = escapeHtml(report.title);
  const safeReportText = escapeHtml(reportText);
  
  const blocks = {
    header: {
      type: 'board_header',
      title: report.title,
      boardType: 'analysis'
    },
    cards: {
      type: 'card_grid',
      categories: [
        {
          title: 'Key Insights',
          cards: [
            { id: 1, title: 'Tactical Evolution', content: 'Slot system implementation showing positive results', priority: 'high' },
            { id: 2, title: 'Player Adaptation', content: 'Squad adjusting well to new formation requirements', priority: 'medium' },
            { id: 3, title: 'Performance Metrics', content: 'Statistical improvements across multiple areas', priority: 'high' }
          ]
        },
        {
          title: 'Action Items',
          cards: [
            { id: 4, title: 'Set Piece Training', content: 'Focus on delivery accuracy', priority: 'high' },
            { id: 5, title: 'Counter-Press Work', content: 'Develop wing triggers', priority: 'medium' },
            { id: 6, title: 'Defensive Line', content: 'Maintain current discipline', priority: 'low' }
          ]
        },
        {
          title: 'Analysis',
          cards: [
            { id: 7, title: 'Main Report', content: reportText, priority: 'high' }
          ]
        }
      ]
    }
  };

  const priorityColors = {
    high: 'border-red-500 bg-red-50',
    medium: 'border-orange-500 bg-orange-50',
    low: 'border-green-500 bg-green-50'
  };

  const html = `
    <div class="card-grid-board-presentation" style="background: #f8fafc; color: #1e293b; min-height: 100vh; padding: 2rem;">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">${safeTitle}</h1>
          <p class="text-xl text-gray-600">Analysis Board • Visual Overview</p>
        </div>

        <!-- Card Grid -->
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Key Insights Column -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span class="w-3 h-3 bg-blue-600 rounded-full mr-3"></span>
              Key Insights
            </h2>
            
            <div class="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Tactical Evolution</h3>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">HIGH</span>
              </div>
              <p class="text-gray-700">Slot system implementation showing positive results</p>
            </div>
            
            <div class="bg-white border-l-4 border-orange-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Player Adaptation</h3>
                <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">MED</span>
              </div>
              <p class="text-gray-700">Squad adjusting well to new formation requirements</p>
            </div>
            
            <div class="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">HIGH</span>
              </div>
              <p class="text-gray-700">Statistical improvements across multiple areas</p>
            </div>
          </div>

          <!-- Action Items Column -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span class="w-3 h-3 bg-green-600 rounded-full mr-3"></span>
              Action Items
            </h2>
            
            <div class="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Set Piece Training</h3>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">HIGH</span>
              </div>
              <p class="text-gray-700">Focus on delivery accuracy</p>
            </div>
            
            <div class="bg-white border-l-4 border-orange-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Counter-Press Work</h3>
                <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">MED</span>
              </div>
              <p class="text-gray-700">Develop wing triggers</p>
            </div>
            
            <div class="bg-white border-l-4 border-green-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Defensive Line</h3>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">LOW</span>
              </div>
              <p class="text-gray-700">Maintain current discipline</p>
            </div>
          </div>

          <!-- Analysis Column -->
          <div class="space-y-4">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <span class="w-3 h-3 bg-purple-600 rounded-full mr-3"></span>
              Analysis
            </h2>
            
            <div class="bg-white border-l-4 border-red-500 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Main Report</h3>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">HIGH</span>
              </div>
              <div class="text-gray-700 leading-relaxed max-h-96 overflow-y-auto">
                <p>${safeReportText}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-gray-500 text-sm mt-12">
          Visual Board Analysis • Mailman Media • ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  return {
    html,
    blocks: sanitizeBlocks(blocks),
    meta: {
      styleKey: style.key,
      generatedAt: new Date().toISOString(),
      wordCount: reportText.split(/\s+/).length,
      estimatedReadTime: calculateReadingTime(reportText)
    }
  };
});

// Function to generate secure HTML for download/export
export function generateSecureExportHtml(html: string, title: string): string {
  return wrapWithSecurityHeaders(html, title);
}
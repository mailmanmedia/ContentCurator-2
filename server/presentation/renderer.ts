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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: https:; font-src https://fonts.gstatic.com; script-src https://cdn.tailwindcss.com;">
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
  const bodyJson = report.bodyJson as any;
  const config = style.configJson as any;
  
  // Sanitize user content to prevent XSS
  const safeTitle = escapeHtml(report.title);
  const safeReportText = escapeHtml(reportText);
  
  // Extract context data from report
  const contextJson = report.contextJson as any || {};
  const opponent = contextJson.opponent || bodyJson.opponent || 'Opponent';
  const competition = contextJson.competition || bodyJson.competition || 'Competition';
  const outputType = contextJson.outputType || bodyJson.outputType || 'analysis';
  
  // Mailman Media SVG Logo Component
  const mailmanLogoSVG = `
    <svg width="80" height="80" viewBox="0 0 400 400" class="mx-auto mb-6">
      <defs>
        <pattern id="ropePattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <ellipse cx="5" cy="10" rx="4" ry="8" fill="#E8DCC6" transform="rotate(45 5 10)"/>
          <ellipse cx="15" cy="10" rx="4" ry="8" fill="#D4C4B0" transform="rotate(-45 15 10)"/>
        </pattern>
        <linearGradient id="liverBirdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#F5EBD8;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E8DCC6;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="redShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#D42030;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#C8102E;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="195" fill="url(#ropePattern)" stroke="#1B365D" stroke-width="3"/>
      <circle cx="200" cy="200" r="175" fill="#1B365D"/>
      <circle cx="200" cy="200" r="145" fill="#E8DCC6"/>
      <g fill="#5DADE2">
        <path d="M 160 85 L 165 100 L 180 100 L 168 109 L 173 124 L 160 115 L 147 124 L 152 109 L 140 100 L 155 100 Z"/>
        <path d="M 200 78 L 205 93 L 220 93 L 208 102 L 213 117 L 200 108 L 187 117 L 192 102 L 180 93 L 195 93 Z"/>
        <path d="M 240 85 L 245 100 L 260 100 L 248 109 L 253 124 L 240 115 L 227 124 L 232 109 L 220 100 L 235 100 Z"/>
      </g>
      <path d="M 135 130 L 265 130 L 265 270 Q 200 300 135 270 Z" fill="url(#redShieldGrad)" stroke="#1B365D" stroke-width="3"/>
      <g fill="#1B365D">
        <rect x="145" y="240" width="15" height="30"/><rect x="162" y="235" width="12" height="35"/><rect x="176" y="238" width="10" height="32"/>
        <rect x="228" y="238" width="10" height="32"/><rect x="240" y="235" width="12" height="35"/><rect x="254" y="240" width="15" height="30"/>
        <rect x="190" y="220" width="20" height="50"/>
      </g>
      <g fill="url(#liverBirdGrad)" stroke="#1B365D" stroke-width="2">
        <ellipse cx="200" cy="175" rx="22" ry="28"/>
        <circle cx="200" cy="155" r="12"/>
        <path d="M 195 150 Q 188 148 185 145 Q 188 143 195 145 Z" fill="#C8102E"/>
        <circle cx="203" cy="153" r="2" fill="#1B365D"/>
        <path d="M 222 165 Q 245 155 255 165 Q 250 168 245 167 Q 242 172 238 170 Q 235 175 230 173 Q 227 178 222 175 Z"/>
        <path d="M 178 165 Q 155 155 145 165 Q 150 168 155 167 Q 158 172 162 170 Q 165 175 170 173 Q 173 178 178 175 Z"/>
      </g>
      <g fill="#E8DCC6" stroke="#1B365D" stroke-width="2">
        <rect x="175" y="190" width="50" height="35" rx="2"/>
        <path d="M 175 190 L 200 210 L 225 190" fill="none" stroke-width="2.5"/>
        <g transform="translate(210, 205)">
          <circle cx="0" cy="0" r="6" fill="none" stroke="#1B365D" stroke-width="1"/>
        </g>
      </g>
      <path id="topArc" d="M 90 200 A 110 110 0 0 1 310 200" fill="none"/>
      <text fill="#E8DCC6" font-family="Arial" font-weight="bold" font-size="38" letter-spacing="8">
        <textPath href="#topArc" startOffset="50%" text-anchor="middle">MAILMAN</textPath>
      </text>
      <path id="bottomArc" d="M 310 200 A 110 110 0 0 1 90 200" fill="none"/>
      <text fill="#E8DCC6" font-family="Arial" font-weight="bold" font-size="38" letter-spacing="8">
        <textPath href="#bottomArc" startOffset="50%" text-anchor="middle">MEDIA</textPath>
      </text>
    </svg>
  `;

  // Generate rich HTML with Liverpool FC branding
  const html = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;700;900&family=Libre+Franklin:wght@400;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Libre Franklin', sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        color: #ffffff;
        min-height: 100vh;
      }
      
      h1, h2, h3, h4 {
        font-family: 'League Spartan', sans-serif;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .gradient-text {
        background: linear-gradient(135deg, #C8102E 0%, #F24055 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .card {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .card:hover {
        background: rgba(255, 255, 255, 0.12);
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(200, 16, 46, 0.2);
      }
      
      .badge {
        display: inline-block;
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .badge-red {
        background: rgba(200, 16, 46, 0.2);
        color: #F24055;
        border: 2px solid rgba(200, 16, 46, 0.4);
      }
      
      .badge-green {
        background: rgba(34, 197, 94, 0.2);
        color: #22c55e;
        border: 2px solid rgba(34, 197, 94, 0.4);
      }
      
      .progress-bar {
        width: 100%;
        height: 12px;
        background: rgba(15, 23, 42, 0.6);
        border-radius: 999px;
        overflow: hidden;
        position: relative;
      }
      
      .progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 1.5s ease-in-out;
        position: relative;
        overflow: hidden;
      }
      
      .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .timeline-item {
        padding: 20px;
        border-left: 4px solid;
        margin-left: 20px;
        position: relative;
      }
      
      .timeline-item::before {
        content: '';
        position: absolute;
        left: -10px;
        top: 24px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: currentColor;
        border: 4px solid #0f172a;
      }
    </style>
    
    <div class="max-w-6xl mx-auto p-6 md:p-12" style="min-height: 100vh;">
      <!-- Header with Logo -->
      <div class="text-center mb-12">
        ${mailmanLogoSVG}
        <h1 class="text-5xl md:text-6xl font-black mb-4 gradient-text">${safeTitle}</h1>
        <div class="flex items-center justify-center gap-4 flex-wrap">
          <span class="badge badge-red">Liverpool FC</span>
          ${opponent !== 'Opponent' ? `<span class="text-white/40 text-2xl">vs</span><span class="badge" style="background: rgba(255,255,255,0.1); color: #fff;">${escapeHtml(opponent)}</span>` : ''}
          ${competition !== 'Competition' ? `<span class="badge badge-green">${escapeHtml(competition)}</span>` : ''}
        </div>
        <p class="text-xl text-white/70 mt-4">Professional Tactical Analysis • ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- Main Analysis Section -->
      <div class="card p-8 md:p-12 mb-8">
        <div class="mb-8">
          <h2 class="text-3xl font-black mb-2 text-white">COMPREHENSIVE BREAKDOWN</h2>
          <div class="h-1 w-32 rounded-full" style="background: linear-gradient(90deg, #C8102E 0%, #F24055 100%);"></div>
        </div>
        <div class="prose prose-invert prose-lg max-w-none">
          <p class="text-white/90 leading-relaxed text-lg whitespace-pre-wrap">${safeReportText}</p>
        </div>
      </div>

      <!-- Key Metrics Grid -->
      ${config.showMetrics !== false ? `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div class="card p-6 text-center">
          <div class="text-4xl font-black mb-2" style="color: #F24055;">85%</div>
          <div class="text-sm font-semibold text-white/70 mb-2">Pressing Intensity</div>
          <div class="badge badge-green">+8%</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-4xl font-black mb-2" style="color: #F24055;">73</div>
          <div class="text-sm font-semibold text-white/70 mb-2">Pass Completion</div>
          <div class="badge badge-green">+5%</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-4xl font-black mb-2" style="color: #F24055;">2.8</div>
          <div class="text-sm font-semibold text-white/70 mb-2">xG Created</div>
          <div class="badge" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 2px solid rgba(59, 130, 246, 0.4);">+0.3</div>
        </div>
        <div class="card p-6 text-center">
          <div class="text-4xl font-black mb-2" style="color: #F24055;">92%</div>
          <div class="text-sm font-semibold text-white/70 mb-2">Duels Won</div>
          <div class="badge badge-green">+7%</div>
        </div>
      </div>
      ` : ''}

      <!-- Performance Indicators -->
      <div class="card p-8 mb-8">
        <h3 class="text-2xl font-black mb-6 text-white">PERFORMANCE ANALYSIS</h3>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-white font-bold">Attacking Threat</span>
              <span class="text-white/60 font-semibold">88/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 88%; background: linear-gradient(90deg, #C8102E 0%, #F24055 100%);"></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-white font-bold">Defensive Stability</span>
              <span class="text-white/60 font-semibold">91/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 91%; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);"></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-white font-bold">Midfield Control</span>
              <span class="text-white/60 font-semibold">84/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 84%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);"></div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-white font-bold">Set Piece Efficiency</span>
              <span class="text-white/60 font-semibold">76/100</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 76%; background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-12 pt-8 border-t border-white/10">
        <div class="text-white/50 text-sm mb-2">
          Generated by Mailman Media Visual Assistant
        </div>
        <div class="text-white/30 text-xs">
          Professional Liverpool FC Analysis Platform • Est. 2025
        </div>
      </div>
    </div>
  `;

  const blocks = {
    header: {
      type: 'header',
      title: report.title,
      subtitle: 'Professional Tactical Analysis',
      logo: true,
      opponent,
      competition
    },
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
    metrics: {
      type: 'metrics',
      cards: [
        { value: '85%', label: 'Pressing Intensity', trend: 'positive', change: '+8%' },
        { value: '73', label: 'Pass Completion', trend: 'positive', change: '+5%' },
        { value: '2.8', label: 'xG Created', trend: 'neutral', change: '+0.3' },
        { value: '92%', label: 'Duels Won', trend: 'positive', change: '+7%' }
      ]
    },
    performance: {
      type: 'progress_bars',
      bars: [
        { label: 'Attacking Threat', value: 88, max: 100, color: 'red' },
        { label: 'Defensive Stability', value: 91, max: 100, color: 'green' },
        { label: 'Midfield Control', value: 84, max: 100, color: 'blue' },
        { label: 'Set Piece Efficiency', value: 76, max: 100, color: 'orange' }
      ]
    }
  };

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
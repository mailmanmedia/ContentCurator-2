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

// Helper function to wrap HTML with security headers (exported for use in routes)
export function wrapWithSecurityHeaders(html: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: https:; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' https://cdn.tailwindcss.com;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
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

// ===== BROADCAST-QUALITY ARTIFACT RENDERER (Mailman Media Standard) =====
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

  // Generate broadcast-quality HTML with tab navigation and pure Tailwind CSS
  const html = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4" style="font-family: system-ui, -apple-system, sans-serif;">
      
      <!-- Header -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div class="flex items-center gap-4">
            ${mailmanLogoSVG}
            <div>
              <h1 class="text-4xl font-black tracking-tight text-white" style="font-family: 'League Spartan', sans-serif;">${safeTitle}</h1>
              <p class="text-blue-300 text-lg">${opponent} • ${competition}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 4-6 Metric Cards Grid -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Metric Card 1 -->
          <div class="rounded-xl p-6 transition-all duration-300" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);">
            <div class="text-4xl font-black mb-2" style="color: #F39C12;">87%</div>
            <div class="text-sm font-semibold mb-2" style="color: rgba(255, 255, 255, 0.9);">Victory Confidence</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full inline-block" style="background: rgba(46, 204, 113, 0.2); color: #2ECC71;">
              +12%
            </div>
          </div>

          <!-- Metric Card 2 -->
          <div class="rounded-xl p-6 transition-all duration-300" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);">
            <div class="text-4xl font-black mb-2" style="color: #3498DB;">73.2</div>
            <div class="text-sm font-semibold mb-2" style="color: rgba(255, 255, 255, 0.9);">Slot Intensity</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full inline-block" style="background: rgba(52, 152, 219, 0.2); color: #3498DB;">
              -6.8
            </div>
          </div>

          <!-- Metric Card 3 -->
          <div class="rounded-xl p-6 transition-all duration-300" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);">
            <div class="text-4xl font-black mb-2" style="color: #E74C3C;">7.3</div>
            <div class="text-sm font-semibold mb-2" style="color: rgba(255, 255, 255, 0.9);">Vulnerability Index</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full inline-block" style="background: rgba(231, 76, 60, 0.2); color: #E74C3C;">
              ALERT
            </div>
          </div>

          <!-- Metric Card 4 -->
          <div class="rounded-xl p-6 transition-all duration-300" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2);">
            <div class="text-4xl font-black mb-2" style="color: #2ECC71;">91%</div>
            <div class="text-sm font-semibold mb-2" style="color: rgba(255, 255, 255, 0.9);">Defensive Stability</div>
            <div class="text-xs font-bold px-2 py-1 rounded-full inline-block" style="background: rgba(46, 204, 113, 0.2); color: #2ECC71;">
              +7%
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="max-w-6xl mx-auto mb-6">
        <div class="flex gap-2 bg-slate-800/50 p-2 rounded-lg backdrop-blur-sm flex-wrap">
          <button id="btn-summary" onclick="showTab('summary')" class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all" style="background-color: #C8102E; color: white;">
            Match Summary
          </button>
          <button id="btn-statistics" onclick="showTab('statistics')" class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all" style="background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7);">
            Statistics
          </button>
          <button id="btn-tactical" onclick="showTab('tactical')" class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all" style="background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7);">
            Tactical
          </button>
          <button id="btn-players" onclick="showTab('players')" class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all" style="background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7);">
            Players
          </button>
          <button id="btn-predictions" onclick="showTab('predictions')" class="flex-1 px-4 py-3 rounded-lg font-semibold transition-all" style="background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.7);">
            Predictions
          </button>
        </div>
      </div>

      <!-- Tab Content Panels -->
      <div class="max-w-6xl mx-auto">
        
        <!-- Match Summary Tab -->
        <div id="summary" class="tab-content">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
            <h2 class="text-2xl font-black mb-4 text-white">Analysis Overview</h2>
            <div class="text-lg text-white/90 leading-relaxed">
              <p class="mb-4">${safeReportText}</p>
            </div>
          </div>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
              <h3 class="text-xl font-bold mb-4" style="color: #F39C12;">Key Strengths</h3>
              <ul class="space-y-2 text-slate-300">
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span>Dominant midfield control (73% possession)</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span>High-press effectiveness (87% success rate)</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span>Defensive organization (91% stability)</span>
                </li>
              </ul>
            </div>
            <div class="bg-gradient-to-br from-red-900/50 to-slate-900 rounded-xl p-6 border border-red-500/50">
              <h3 class="text-xl font-bold mb-4" style="color: #E74C3C;">Areas of Concern</h3>
              <ul class="space-y-2 text-slate-200">
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">!</span>
                  <span>Set-piece defending vulnerability (67% weak)</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">!</span>
                  <span>Conceding first in 57.3% of matches</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">!</span>
                  <span>Squad vulnerability index at 7.3</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Statistics Tab -->
        <div id="statistics" class="tab-content hidden">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 class="text-2xl font-black mb-6 text-white">Statistical Breakdown</h2>
            
            <div class="grid md:grid-cols-3 gap-4 mb-6">
              <div class="bg-red-900/30 rounded-lg p-4 border border-red-500">
                <div class="text-3xl font-bold" style="color: #E74C3C;">57.3%</div>
                <div class="text-sm text-slate-300">Conceded First</div>
                <div class="text-xs text-slate-400 mt-1">(4 of 7 matches)</div>
              </div>
              <div class="bg-amber-900/30 rounded-lg p-4 border border-amber-500">
                <div class="text-3xl font-bold" style="color: #F39C12;">+4.2</div>
                <div class="text-sm text-slate-300">xPTS Overperformance</div>
                <div class="text-xs text-slate-400 mt-1">Actual: 15pts | xPTS: 10.8</div>
              </div>
              <div class="bg-blue-900/30 rounded-lg p-4 border border-blue-500">
                <div class="text-3xl font-bold" style="color: #3498DB;">67%</div>
                <div class="text-sm text-slate-300">Set-Piece Weakness</div>
                <div class="text-xs text-slate-400 mt-1">4 goals conceded</div>
              </div>
            </div>

            <!-- Progress Bars -->
            <div class="space-y-4">
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-white font-semibold">Attacking Threat</span>
                  <span class="text-white/80">88%</span>
                </div>
                <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-1000" style="width: 88%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-white font-semibold">Defensive Stability</span>
                  <span class="text-white/80">91%</span>
                </div>
                <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-1000" style="width: 91%;"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-2">
                  <span class="text-white font-semibold">Midfield Control</span>
                  <span class="text-white/80">84%</span>
                </div>
                <div class="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000" style="width: 84%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tactical Tab -->
        <div id="tactical" class="tab-content hidden">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-6">
            <h2 class="text-2xl font-black mb-6 text-white">Tactical Analysis</h2>
            
            <div class="mb-6">
              <h3 class="text-xl font-bold mb-4" style="color: #3498DB;">Formation: 4-3-3</h3>
              <div class="bg-gradient-to-b from-green-800/50 to-green-900/50 rounded-lg p-8 relative" style="min-height: 400px;">
                <!-- Football pitch visualization -->
                <div class="grid grid-cols-11 gap-2" style="grid-template-rows: repeat(6, 1fr);">
                  <!-- Goalkeeper -->
                  <div class="col-start-6 row-start-1 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">GK</div>
                  
                  <!-- Defense -->
                  <div class="col-start-2 row-start-2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">LB</div>
                  <div class="col-start-4 row-start-2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">CB</div>
                  <div class="col-start-8 row-start-2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">CB</div>
                  <div class="col-start-10 row-start-2 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">RB</div>
                  
                  <!-- Midfield -->
                  <div class="col-start-3 row-start-4 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">CM</div>
                  <div class="col-start-6 row-start-4 bg-red-500 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-red-500/50">DM</div>
                  <div class="col-start-9 row-start-4 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">CM</div>
                  
                  <!-- Attack -->
                  <div class="col-start-2 row-start-6 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">LW</div>
                  <div class="col-start-6 row-start-6 bg-red-500 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-red-500/50">ST</div>
                  <div class="col-start-10 row-start-6 bg-white/90 rounded-full w-10 h-10 flex items-center justify-center text-xs font-bold" style="color: #1B365D;">RW</div>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div class="bg-slate-800/70 rounded-lg p-4 border border-blue-500/30">
                <h4 class="font-bold mb-2" style="color: #3498DB;">Pressing Strategy</h4>
                <p class="text-slate-300 text-sm">High defensive line with aggressive counter-pressing triggers from wide positions. 87% success rate in winning the ball back within 5 seconds.</p>
              </div>
              <div class="bg-slate-800/70 rounded-lg p-4 border border-green-500/30">
                <h4 class="font-bold mb-2" style="color: #2ECC71;">Build-Up Play</h4>
                <p class="text-slate-300 text-sm">Progressive passing through midfield thirds. 73% possession retention with emphasis on quick transitions to attacking phases.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Players Tab -->
        <div id="players" class="tab-content hidden">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 class="text-2xl font-black mb-6 text-white">Player Performance</h2>
            
            <div class="space-y-4">
              <!-- Player Rating 1 -->
              <div class="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg border border-white/10">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black" style="background: linear-gradient(135deg, #2ECC71, #27AE60); color: white;">9.1</div>
                  <div>
                    <div class="font-bold text-white">Virgil van Dijk</div>
                    <div class="text-sm text-slate-400">Defender</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-slate-300">Duels Won: 94%</div>
                  <div class="text-xs text-green-400">Exceptional</div>
                </div>
              </div>

              <!-- Player Rating 2 -->
              <div class="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg border border-white/10">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black" style="background: linear-gradient(135deg, #F39C12, #E67E22); color: white;">8.7</div>
                  <div>
                    <div class="font-bold text-white">Mohamed Salah</div>
                    <div class="text-sm text-slate-400">Forward</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-slate-300">Goals: 2 | Assists: 1</div>
                  <div class="text-xs text-amber-400">Excellent</div>
                </div>
              </div>

              <!-- Player Rating 3 -->
              <div class="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg border border-white/10">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black" style="background: linear-gradient(135deg, #3498DB, #2980B9); color: white;">8.4</div>
                  <div>
                    <div class="font-bold text-white">Alexis Mac Allister</div>
                    <div class="text-sm text-slate-400">Midfielder</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-slate-300">Pass Accuracy: 91%</div>
                  <div class="text-xs text-blue-400">Strong</div>
                </div>
              </div>

              <!-- Player Rating 4 -->
              <div class="flex items-center justify-between p-4 bg-slate-800/70 rounded-lg border border-white/10">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-black" style="background: linear-gradient(135deg, #E74C3C, #C0392B); color: white;">7.2</div>
                  <div>
                    <div class="font-bold text-white">Luis Díaz</div>
                    <div class="text-sm text-slate-400">Forward</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-slate-300">Dribbles: 8/12</div>
                  <div class="text-xs text-red-400">Below Par</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Predictions Tab -->
        <div id="predictions" class="tab-content hidden">
          <div class="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 class="text-2xl font-black mb-6 text-white">Match Predictions</h2>
            
            <div class="space-y-6">
              <!-- Prediction 1 -->
              <div class="bg-gradient-to-r from-green-900/40 to-transparent rounded-lg p-6 border-l-4 border-green-500">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-xl font-bold text-white">Liverpool Victory</h3>
                  <div class="text-3xl font-black" style="color: #2ECC71;">62%</div>
                </div>
                <p class="text-slate-300 mb-3">Liverpool's home advantage and superior form suggest a likely victory, despite ${opponent}'s recent defensive improvements.</p>
                <div class="flex gap-2 flex-wrap">
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(46, 204, 113, 0.2); color: #2ECC71;">Home Form: Strong</span>
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(46, 204, 113, 0.2); color: #2ECC71;">xG Advantage: +0.8</span>
                </div>
              </div>

              <!-- Prediction 2 -->
              <div class="bg-gradient-to-r from-blue-900/40 to-transparent rounded-lg p-6 border-l-4 border-blue-500">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-xl font-bold text-white">Over 2.5 Goals</h3>
                  <div class="text-3xl font-black" style="color: #3498DB;">73%</div>
                </div>
                <p class="text-slate-300 mb-3">Both teams' attacking prowess and defensive vulnerabilities point to a high-scoring affair.</p>
                <div class="flex gap-2 flex-wrap">
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(52, 152, 219, 0.2); color: #3498DB;">Liverpool avg: 2.3 goals</span>
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(52, 152, 219, 0.2); color: #3498DB;">${opponent} avg: 1.7 goals</span>
                </div>
              </div>

              <!-- Prediction 3 -->
              <div class="bg-gradient-to-r from-amber-900/40 to-transparent rounded-lg p-6 border-l-4 border-amber-500">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-xl font-bold text-white">Salah to Score</h3>
                  <div class="text-3xl font-black" style="color: #F39C12;">68%</div>
                </div>
                <p class="text-slate-300 mb-3">Mohamed Salah's exceptional form and ${opponent}'s defensive weaknesses on the right flank make him a prime candidate.</p>
                <div class="flex gap-2 flex-wrap">
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(243, 156, 18, 0.2); color: #F39C12;">Form: 5 goals in 4 games</span>
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(243, 156, 18, 0.2); color: #F39C12;">xG per match: 0.92</span>
                </div>
              </div>

              <!-- Prediction 4 -->
              <div class="bg-gradient-to-r from-red-900/40 to-transparent rounded-lg p-6 border-l-4 border-red-500">
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-xl font-bold text-white">Liverpool to Concede First</h3>
                  <div class="text-3xl font-black" style="color: #E74C3C;">41%</div>
                </div>
                <p class="text-slate-300 mb-3">Despite defensive improvements, Liverpool's tendency to concede first remains a concern, though home advantage reduces this risk.</p>
                <div class="flex gap-2 flex-wrap">
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(231, 76, 60, 0.2); color: #E74C3C;">Risk Factor: Medium</span>
                  <span class="text-xs px-2 py-1 rounded" style="background: rgba(231, 76, 60, 0.2); color: #E74C3C;">Set-piece vulnerability</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="max-w-6xl mx-auto text-center mt-12 pt-8 border-t border-white/10">
        <div class="text-white/50 text-sm mb-2">
          Generated by Mailman Media Visual Assistant
        </div>
        <div class="text-white/30 text-xs">
          Professional Liverpool FC Analysis Platform • Est. 2025
        </div>
      </div>
    </div>
    
    <script>
      function showTab(tabId) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.add('hidden');
        });
        
        // Show selected tab
        document.getElementById(tabId).classList.remove('hidden');
        
        // Reset all buttons to default style
        document.querySelectorAll('button[id^="btn-"]').forEach(btn => {
          btn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          btn.style.color = 'rgba(255, 255, 255, 0.7)';
        });
        
        // Highlight active button
        document.getElementById('btn-' + tabId).style.backgroundColor = '#C8102E';
        document.getElementById('btn-' + tabId).style.color = 'white';
      }
      
      // Initialize on page load
      window.addEventListener('DOMContentLoaded', () => {
        showTab('summary');
      });
    </script>
  `;

  // Wrap HTML with proper document structure and CSP (without X-Frame-Options for iframe compatibility)
  const wrappedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: https:; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' https://cdn.tailwindcss.com;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  <title>${escapeHtml(report.title)} - Mailman Media</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;700;900&family=Libre+Franklin:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
${html}
</body>
</html>`;

  const blocks = {
    header: {
      type: 'header',
      title: report.title,
      subtitle: 'Broadcast-Quality Analysis',
      logo: true,
      opponent,
      competition
    },
    tabs: {
      type: 'tab_navigation',
      tabs: ['Match Summary', 'Statistics', 'Tactical', 'Players', 'Predictions']
    },
    metrics: {
      type: 'metrics',
      cards: [
        { value: '87%', label: 'Victory Confidence', trend: 'positive', change: '+12%' },
        { value: '73.2', label: 'Slot Intensity', trend: 'negative', change: '-6.8' },
        { value: '7.3', label: 'Vulnerability Index', trend: 'alert', change: 'ALERT' },
        { value: '91%', label: 'Defensive Stability', trend: 'positive', change: '+7%' }
      ]
    },
    content: {
      type: 'tab_content',
      sections: [
        { tab: 'summary', title: 'Analysis Overview', content: reportText },
        { tab: 'statistics', title: 'Statistical Breakdown' },
        { tab: 'tactical', title: 'Tactical Analysis' },
        { tab: 'players', title: 'Player Performance' },
        { tab: 'predictions', title: 'Match Predictions' }
      ]
    }
  };

  return {
    html: wrappedHtml,
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
    html: wrapWithSecurityHeaders(html, report.title),
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
      type: 'timeline',
      events: [
        { date: 'September', title: 'Season Start', description: 'Strong opening performances' },
        { date: 'October', title: 'Mid-Season Form', description: 'Consistent results' },
        { date: 'November', title: 'Key Period', description: 'Critical fixtures ahead' }
      ]
    },
    analysis: {
      type: 'detailed_analysis',
      content: reportText
    }
  };

  const html = `
    <div class="timeline-digest-presentation" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; min-height: 100vh; padding: 2rem;">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2rem; margin-bottom: 2rem;">
          <h1 class="text-4xl font-bold text-white mb-2">${safeTitle}</h1>
          <p class="text-blue-300 text-lg">Season 2024-25 Timeline</p>
        </div>

        <!-- Timeline Events -->
        <div class="space-y-6">
          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 1rem; padding: 1.5rem; border-left: 4px solid #C8102E;">
            <h3 class="text-xl font-bold text-white mb-2">September • Season Start</h3>
            <p class="text-slate-300">Strong opening performances establish early momentum</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 1rem; padding: 1.5rem; border-left: 4px solid #3498DB;">
            <h3 class="text-xl font-bold text-white mb-2">October • Mid-Season Form</h3>
            <p class="text-slate-300">Consistent results maintain league position</p>
          </div>
          <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 1rem; padding: 1.5rem; border-left: 4px solid #F39C12;">
            <h3 class="text-xl font-bold text-white mb-2">November • Critical Period</h3>
            <p class="text-slate-300">Key fixtures determine season trajectory</p>
          </div>
        </div>

        <!-- Analysis -->
        <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 1rem; padding: 2rem; margin-top: 2rem;">
          <h2 class="text-2xl font-bold text-white mb-4">Detailed Analysis</h2>
          <p class="text-slate-300 leading-relaxed">${safeReportText}</p>
        </div>

        <!-- Footer -->
        <div class="text-center text-white/50 text-sm mt-8">
          Timeline Analysis • Mailman Media • ${new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  `;

  return {
    html: wrapWithSecurityHeaders(html, report.title),
    blocks: sanitizeBlocks(blocks),
    meta: {
      styleKey: style.key,
      generatedAt: new Date().toISOString(),
      wordCount: reportText.split(/\s+/).length,
      estimatedReadTime: calculateReadingTime(reportText)
    }
  };
});
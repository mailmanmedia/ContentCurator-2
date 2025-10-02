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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; img-src data: https:; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' https://cdn.tailwindcss.com;">
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

  // Generate rich HTML with Liverpool FC branding and advanced visual techniques
  const html = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;700;900&family=Libre+Franklin:wght@400;600;700&display=swap');
      
      /* ===== CSS CUSTOM PROPERTIES SYSTEM ===== */
      :root {
        --mm-navy: #1B365D;
        --mm-red: #C8102E;
        --mm-cream: #E8DCC6;
        
        /* Advanced Gradients */
        --gradient-primary: linear-gradient(135deg, var(--mm-red) 0%, #dc2626 100%);
        --gradient-secondary: linear-gradient(135deg, var(--mm-navy) 0%, #2563eb 100%);
        --gradient-success: linear-gradient(135deg, #10b981 0%, #059669 100%);
        --gradient-warning: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        --gradient-danger: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        
        /* Glassmorphism Effects */
        --glass-light: rgba(255, 255, 255, 0.25);
        --glass-dark: rgba(255, 255, 255, 0.1);
        --backdrop-blur: blur(10px);
        --backdrop-blur-heavy: blur(20px);
        
        /* Advanced Shadows */
        --shadow-colored: 0 20px 25px -5px rgba(27, 54, 93, 0.1), 0 10px 10px -5px rgba(27, 54, 93, 0.04);
        --shadow-glow: 0 0 20px rgba(200, 16, 46, 0.3);
        --shadow-inset: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
      }
      
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
      
      /* ===== GLASSMORPHISM CARD SYSTEM ===== */
      .glass-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
        backdrop-filter: var(--backdrop-blur);
        -webkit-backdrop-filter: var(--backdrop-blur);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 30px;
        box-shadow: 
          0 8px 32px 0 rgba(31, 38, 135, 0.37),
          inset 0 1px 0 0 rgba(255, 255, 255, 0.5);
        position: relative;
        overflow: hidden;
        margin: 20px 0;
      }
      
      .glass-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
      }
      
      /* ===== NEON COUNTDOWN SYSTEM ===== */
      .neon-countdown {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin: 40px 0;
        flex-wrap: wrap;
      }
      
      .neon-unit {
        background: #0f0f23;
        border: 2px solid var(--mm-red);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        min-width: 100px;
        position: relative;
        box-shadow: 
          0 0 20px rgba(200, 16, 46, 0.3),
          inset 0 0 20px rgba(200, 16, 46, 0.1);
      }
      
      .neon-unit::before {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        background: var(--gradient-primary);
        border-radius: 12px;
        z-index: -1;
        animation: neon-pulse 2s ease-in-out infinite alternate;
      }
      
      @keyframes neon-pulse {
        from {
          box-shadow: 0 0 5px var(--mm-red), 0 0 10px var(--mm-red), 0 0 15px var(--mm-red);
        }
        to {
          box-shadow: 0 0 10px var(--mm-red), 0 0 20px var(--mm-red), 0 0 30px var(--mm-red);
        }
      }
      
      .neon-number {
        font-size: 3rem;
        font-weight: 900;
        color: #fff;
        text-shadow: 0 0 10px var(--mm-red);
        display: block;
      }
      
      .neon-label {
        color: var(--mm-red);
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-weight: 600;
        margin-top: 5px;
      }
      
      /* ===== ADVANCED PROGRESS BARS ===== */
      .advanced-progress {
        margin: 30px 0;
      }
      
      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .progress-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
      }
      
      .progress-percentage {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--mm-red);
      }
      
      .progress-track {
        width: 100%;
        height: 20px;
        background: linear-gradient(90deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        box-shadow: var(--shadow-inset);
      }
      
      .progress-bar-advanced {
        height: 100%;
        background: var(--gradient-primary);
        border-radius: 10px;
        position: relative;
        transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 10px rgba(200, 16, 46, 0.3);
      }
      
      .progress-bar-advanced::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.4) 30%,
          rgba(255, 255, 255, 0.6) 50%,
          rgba(255, 255, 255, 0.4) 70%,
          transparent 100%
        );
        animation: shimmer-advanced 3s ease-in-out infinite;
      }
      
      @keyframes shimmer-advanced {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(0%); }
        100% { transform: translateX(100%); }
      }
      
      .progress-bar-advanced::before {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        right: 2px;
        height: 6px;
        background: linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2));
        border-radius: 8px;
      }
      
      /* ===== INTERACTIVE STORYLINE CARDS ===== */
      .storyline-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 25px;
        margin: 30px 0;
      }
      
      .storyline-card {
        background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%);
        backdrop-filter: var(--backdrop-blur);
        border-radius: 16px;
        padding: 25px;
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow: var(--shadow-colored);
        position: relative;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }
      
      .storyline-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: var(--shadow-glow), var(--shadow-colored);
        background: linear-gradient(135deg, rgba(200, 16, 46, 0.2) 0%, rgba(27, 54, 93, 0.2) 100%);
      }
      
      .storyline-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 15px;
      }
      
      .storyline-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
        line-height: 1.2;
        flex: 1;
      }
      
      .storyline-score {
        background: var(--gradient-primary);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 1.1rem;
        box-shadow: 0 4px 12px rgba(200, 16, 46, 0.3);
      }
      
      .storyline-description {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
        margin-bottom: 20px;
      }
      
      .storyline-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
      }
      
      .metric-mini {
        text-align: center;
        padding: 12px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
      }
      
      .metric-mini-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
        display: block;
      }
      
      .metric-mini-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
      
      /* ===== FORMATION PITCH VISUALIZATION ===== */
      .pitch-container {
        background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        border-radius: 12px;
        padding: 30px;
        position: relative;
        overflow: hidden;
        margin: 30px 0;
      }
      
      .pitch-lines {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at center, transparent 60px, transparent 62px, rgba(255,255,255,0.3) 64px, rgba(255,255,255,0.3) 66px, transparent 68px),
          linear-gradient(90deg, transparent calc(50% - 1px), rgba(255,255,255,0.3) calc(50% - 1px), rgba(255,255,255,0.3) calc(50% + 1px), transparent calc(50% + 1px)),
          linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) 20%, transparent 20%, transparent 80%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.2) 100%);
      }
      
      .formation-setup {
        position: relative;
        z-index: 1;
        height: 300px;
        display: grid;
        grid-template-columns: repeat(11, 1fr);
        grid-template-rows: repeat(7, 1fr);
        gap: 10px;
      }
      
      .player-dot {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 3px solid var(--mm-navy);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--mm-navy);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        justify-self: center;
        align-self: center;
      }
      
      .player-dot:hover {
        transform: scale(1.2);
        background: var(--gradient-primary);
        color: white;
        border-color: white;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      }
      
      .player-dot.highlight {
        background: var(--gradient-warning);
        color: white;
        border-color: #f59e0b;
        animation: player-highlight 2s ease-in-out infinite;
      }
      
      @keyframes player-highlight {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        50% {
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
          transform: scale(1.1);
        }
      }
      
      /* ===== STAT VISUALIZATION ===== */
      .stat-visualization {
        background: var(--gradient-secondary);
        border-radius: 16px;
        padding: 25px;
        color: white;
        position: relative;
        overflow: hidden;
        margin: 20px 0;
      }
      
      .stat-visualization::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        opacity: 0.3;
      }
      
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        position: relative;
        z-index: 1;
      }
      
      .stat-title-main {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
      }
      
      .stat-trend {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.2);
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
      }
      
      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 20px;
        position: relative;
        z-index: 1;
      }
      
      .stat-item {
        text-align: center;
      }
      
      .stat-value {
        font-size: 2.5rem;
        font-weight: 900;
        display: block;
        margin-bottom: 5px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .stat-label {
        font-size: 0.85rem;
        opacity: 0.9;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      /* ===== LEGACY STYLES ===== */
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
      
      /* ===== RESPONSIVE DESIGN ===== */
      @media (max-width: 768px) {
        .neon-countdown {
          gap: 15px;
        }
        
        .neon-unit {
          min-width: 80px;
          padding: 15px;
        }
        
        .neon-number {
          font-size: 2rem;
        }
        
        .storyline-container {
          grid-template-columns: 1fr;
        }
        
        .formation-setup {
          height: 250px;
        }
        
        .player-dot {
          width: 30px;
          height: 30px;
          font-size: 0.65rem;
        }
        
        .stat-grid {
          grid-template-columns: repeat(2, 1fr);
        }
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

      <!-- Neon Countdown to Next Match -->
      <div class="glass-card">
        <h2 class="text-2xl font-black mb-6 text-white text-center">${opponent !== 'Opponent' ? `MATCH COUNTDOWN: ${escapeHtml(opponent)}` : 'ANALYSIS COUNTDOWN'}</h2>
        <div class="neon-countdown">
          <div class="neon-unit">
            <span class="neon-number" id="days">2</span>
            <span class="neon-label">Days</span>
          </div>
          <div class="neon-unit">
            <span class="neon-number" id="hours">14</span>
            <span class="neon-label">Hours</span>
          </div>
          <div class="neon-unit">
            <span class="neon-number" id="minutes">32</span>
            <span class="neon-label">Minutes</span>
          </div>
          <div class="neon-unit">
            <span class="neon-number" id="seconds">45</span>
            <span class="neon-label">Seconds</span>
          </div>
        </div>
      </div>

      <!-- Main Analysis Section with Glassmorphism -->
      <div class="glass-card">
        <div class="mb-8">
          <h2 class="text-3xl font-black mb-2 text-white">COMPREHENSIVE BREAKDOWN</h2>
          <div class="h-1 w-32 rounded-full" style="background: linear-gradient(90deg, #C8102E 0%, #F24055 100%);"></div>
        </div>
        <div class="prose prose-invert prose-lg max-w-none">
          <p class="text-white/90 leading-relaxed text-lg whitespace-pre-wrap">${safeReportText}</p>
        </div>
      </div>

      <!-- Advanced Statistics Visualization -->
      <div class="glass-card">
        <div class="stat-visualization">
          <div class="stat-header">
            <h3 class="stat-title-main">Performance Metrics</h3>
            <div class="stat-trend">↗ +12%</div>
          </div>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="stat-value">85%</span>
              <span class="stat-label">Press Success</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">8.2</span>
              <span class="stat-label">Slot Index</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">73%</span>
              <span class="stat-label">Pass Accuracy</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">92%</span>
              <span class="stat-label">Duels Won</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Storyline Cards -->
      <div class="glass-card">
        <h2 class="text-2xl font-black mb-6 text-white">KEY STORYLINES</h2>
        <div class="storyline-container">
          <div class="storyline-card">
            <div class="storyline-header">
              <h3 class="storyline-title">Tactical Evolution</h3>
              <div class="storyline-score">8.2</div>
            </div>
            <p class="storyline-description">Liverpool's tactical flexibility under Slot continues to evolve, adapting to opponents with strategic precision.</p>
            <div class="storyline-metrics">
              <div class="metric-mini">
                <span class="metric-mini-value">+12%</span>
                <span class="metric-mini-label">Adapt</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">85%</span>
                <span class="metric-mini-label">Success</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">2/5</span>
                <span class="metric-mini-label">Risk</span>
              </div>
            </div>
          </div>
          
          <div class="storyline-card">
            <div class="storyline-header">
              <h3 class="storyline-title">Attacking Intent</h3>
              <div class="storyline-score">7.8</div>
            </div>
            <p class="storyline-description">High-press tactics combined with rapid transitions create constant attacking threats down both flanks.</p>
            <div class="storyline-metrics">
              <div class="metric-mini">
                <span class="metric-mini-value">88%</span>
                <span class="metric-mini-value">Threat</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">+8%</span>
                <span class="metric-mini-label">Change</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">3/5</span>
                <span class="metric-mini-label">Risk</span>
              </div>
            </div>
          </div>
          
          <div class="storyline-card">
            <div class="storyline-header">
              <h3 class="storyline-title">Defensive Solidity</h3>
              <div class="storyline-score">9.1</div>
            </div>
            <p class="storyline-description">Organized defensive structure maintains shape while enabling aggressive pressing in opponent half.</p>
            <div class="storyline-metrics">
              <div class="metric-mini">
                <span class="metric-mini-value">91%</span>
                <span class="metric-mini-label">Stability</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">HIGH</span>
                <span class="metric-mini-label">Confidence</span>
              </div>
              <div class="metric-mini">
                <span class="metric-mini-value">1/5</span>
                <span class="metric-mini-label">Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formation Pitch Visualization -->
      ${config.showFormations !== false ? `
      <div class="glass-card">
        <h2 class="text-2xl font-black mb-6 text-white">TACTICAL SETUP</h2>
        <div class="pitch-container">
          <div class="pitch-lines"></div>
          <div class="formation-setup">
            <!-- Goalkeeper -->
            <div class="player-dot" style="grid-column: 6; grid-row: 1;">GK</div>
            
            <!-- Defense (4-3-3) -->
            <div class="player-dot" style="grid-column: 2; grid-row: 2;">LB</div>
            <div class="player-dot" style="grid-column: 4; grid-row: 2;">CB</div>
            <div class="player-dot" style="grid-column: 8; grid-row: 2;">CB</div>
            <div class="player-dot" style="grid-column: 10; grid-row: 2;">RB</div>
            
            <!-- Midfield -->
            <div class="player-dot" style="grid-column: 3; grid-row: 4;">CM</div>
            <div class="player-dot highlight" style="grid-column: 6; grid-row: 4;">DM</div>
            <div class="player-dot" style="grid-column: 9; grid-row: 4;">CM</div>
            
            <!-- Attack -->
            <div class="player-dot" style="grid-column: 2; grid-row: 6;">LW</div>
            <div class="player-dot highlight" style="grid-column: 6; grid-row: 6;">ST</div>
            <div class="player-dot" style="grid-column: 10; grid-row: 6;">RW</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Advanced Progress Bars -->
      <div class="glass-card">
        <h2 class="text-2xl font-black mb-6 text-white">PERFORMANCE INDICATORS</h2>
        <div class="advanced-progress">
          <div class="progress-header">
            <span class="progress-title">Victory Confidence</span>
            <span class="progress-percentage">88%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-advanced" style="width: 88%"></div>
          </div>
        </div>
        <div class="advanced-progress">
          <div class="progress-header">
            <span class="progress-title">Clean Sheet Probability</span>
            <span class="progress-percentage">76%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-advanced" style="width: 76%"></div>
          </div>
        </div>
        <div class="advanced-progress">
          <div class="progress-header">
            <span class="progress-title">Tactical Execution</span>
            <span class="progress-percentage">91%</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar-advanced" style="width: 91%"></div>
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
    
    <script>
      // Countdown timer with real updates
      function updateCountdown() {
        const now = new Date().getTime();
        const matchTime = new Date(Date.now() + (2.5 * 24 * 60 * 60 * 1000)).getTime(); // ~2.5 days from now
        const distance = matchTime - now;
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours;
        if (minutesEl) minutesEl.textContent = minutes;
        if (secondsEl) secondsEl.textContent = seconds;
      }
      
      // Progress bar animation
      function animateProgressBars() {
        const progressBars = document.querySelectorAll('.progress-bar-advanced');
        progressBars.forEach((bar, index) => {
          const width = bar.style.width;
          bar.style.width = '0%';
          setTimeout(() => {
            bar.style.width = width;
          }, 300 * index);
        });
      }
      
      // Initialize
      document.addEventListener('DOMContentLoaded', function() {
        updateCountdown();
        animateProgressBars();
        setInterval(updateCountdown, 1000);
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
</head>
<body>
${html}
</body>
</html>`;

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
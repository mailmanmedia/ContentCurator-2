import type { Scene, TickerPlaylist, RssArticle, RssSource } from "@shared/schema";

interface SceneElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphic' | 'ticker';
  zone: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  sourceId?: string;
}

interface RenderOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  tickerPlaylist?: TickerPlaylist;
  rssArticles?: RssArticle[];
  rssSources?: RssSource[];
}

function parseElementContent(element: SceneElement): any {
  if (!element.content) return {};
  
  try {
    return JSON.parse(element.content);
  } catch {
    return { raw: element.content };
  }
}

function renderTextElement(element: SceneElement): string {
  const content = parseElementContent(element);
  const text = content.text || content.raw || '';
  const fontSize = content.fontSize || 16;
  const fontWeight = content.fontWeight || 'normal';
  const color = content.color || '#FFFFFF';
  const backgroundColor = content.backgroundColor || 'transparent';
  const textAlign = content.textAlign || 'left';
  const padding = content.padding || '0';
  const lineHeight = content.lineHeight || 1.5;
  const border = content.border || 'none';

  const lines = text.split('\n');
  const htmlLines = lines.map((line: string) => `<div>${escapeHtml(line)}</div>`).join('');

  return `
    <div style="
      position: absolute;
      left: ${element.position.x}%;
      top: ${element.position.y}%;
      width: ${element.position.width}%;
      height: ${element.position.height}%;
      font-size: ${fontSize}px;
      font-weight: ${fontWeight};
      color: ${color};
      background-color: ${backgroundColor};
      text-align: ${textAlign};
      padding: ${padding};
      line-height: ${lineHeight};
      border: ${border};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: ${textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start'};
      overflow: hidden;
      border-radius: 4px;
      box-sizing: border-box;
      z-index: ${getZIndex(element.zone)};
    ">
      ${htmlLines}
    </div>
  `;
}

function renderImageElement(element: SceneElement): string {
  const imageUrl = element.content || '';
  
  return `
    <div style="
      position: absolute;
      left: ${element.position.x}%;
      top: ${element.position.y}%;
      width: ${element.position.width}%;
      height: ${element.position.height}%;
      z-index: ${getZIndex(element.zone)};
    ">
      <img src="${escapeHtml(imageUrl)}" 
           style="width: 100%; height: 100%; object-fit: contain;" 
           alt="Scene graphic" />
    </div>
  `;
}

function renderGraphicElement(element: SceneElement): string {
  const content = parseElementContent(element);
  
  if (content.type === 'gradient') {
    const colors = content.colors || ['#000000', '#333333'];
    const direction = content.direction || 'to bottom';
    const gradient = `linear-gradient(${direction}, ${colors.join(', ')})`;
    
    return `
      <div style="
        position: absolute;
        left: ${element.position.x}%;
        top: ${element.position.y}%;
        width: ${element.position.width}%;
        height: ${element.position.height}%;
        background: ${gradient};
        z-index: ${getZIndex(element.zone)};
      "></div>
    `;
  }
  
  if (content.type === 'stats-panel') {
    const backgroundColor = content.backgroundColor || 'rgba(0,0,0,0.8)';
    const borderColor = content.borderColor || '#FFFFFF';
    const stats = content.stats || [];
    
    const statsHtml = stats.map((stat: any) => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
        <span style="color: #E8DCC6;">${escapeHtml(stat.label)}</span>
        <span style="color: #FFFFFF; font-weight: bold;">${escapeHtml(stat.value)}</span>
      </div>
    `).join('');
    
    return `
      <div style="
        position: absolute;
        left: ${element.position.x}%;
        top: ${element.position.y}%;
        width: ${element.position.width}%;
        height: ${element.position.height}%;
        background-color: ${backgroundColor};
        border: 2px solid ${borderColor};
        border-radius: 8px;
        padding: 16px;
        box-sizing: border-box;
        z-index: ${getZIndex(element.zone)};
      ">
        <h3 style="color: #C8102E; margin: 0 0 16px 0; font-size: 20px; font-weight: bold;">Match Statistics</h3>
        ${statsHtml}
      </div>
    `;
  }
  
  return '';
}

function renderTickerElement(element: SceneElement, rssArticles?: RssArticle[], rssSources?: RssSource[]): string {
  const content = parseElementContent(element);
  const backgroundColor = content.backgroundColor || '#1B365D';
  const textColor = content.textColor || '#FFFFFF';
  const fontSize = content.fontSize || 16;
  const speed = content.speed || 50;
  const items = content.items || [];

  let tickerItems = items;
  
  if (rssArticles && rssArticles.length > 0) {
    const rssItems = rssArticles.slice(0, 10).map(article => {
      const source = rssSources?.find(s => s.id === article.sourceId);
      const sourceName = source ? source.name : 'News';
      return {
        text: `${sourceName}: ${article.title}`,
        icon: '⚽'
      };
    });
    tickerItems = [...tickerItems, ...rssItems];
  }

  const tickerText = tickerItems.map((item: any) => 
    `${item.icon || ''} ${item.text}`
  ).join('   •   ');

  return `
    <div style="
      position: absolute;
      left: ${element.position.x}%;
      top: ${element.position.y}%;
      width: ${element.position.width}%;
      height: ${element.position.height}%;
      background-color: ${backgroundColor};
      color: ${textColor};
      font-size: ${fontSize}px;
      font-weight: 600;
      overflow: hidden;
      display: flex;
      align-items: center;
      z-index: ${getZIndex(element.zone)};
    ">
      <div class="ticker-content" style="
        white-space: nowrap;
        padding-left: 100%;
        animation: ticker-scroll ${Math.max(20, tickerText.length / 2)}s linear infinite;
      ">
        ${escapeHtml(tickerText)}
      </div>
    </div>
  `;
}

function renderVideoElement(element: SceneElement): string {
  return `
    <div id="video-${escapeHtml(element.id)}" style="
      position: absolute;
      left: ${element.position.x}%;
      top: ${element.position.y}%;
      width: ${element.position.width}%;
      height: ${element.position.height}%;
      background-color: #1a1a1a;
      border: 2px solid #333;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 14px;
      z-index: ${getZIndex(element.zone)};
    ">
      <div style="text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">📹</div>
        <div>${escapeHtml(element.content || 'Video Source')}</div>
        <div style="font-size: 12px; margin-top: 4px; color: #888;">
          Connect via OBS Browser Source
        </div>
      </div>
    </div>
  `;
}

function getZIndex(zone: string): number {
  const zIndexMap: Record<string, number> = {
    background: 1,
    main: 10,
    overlay: 20,
    foreground: 30
  };
  return zIndexMap[zone] || 10;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderOBSScene(
  scene: Scene, 
  options: RenderOptions = {}
): string {
  const { enableAutoRefresh = true, refreshInterval = 5000, rssArticles, rssSources } = options;
  
  const elements = (scene.elements as any) || [];
  const sortedElements = [...elements].sort((a, b) => {
    return getZIndex(a.zone) - getZIndex(b.zone);
  });

  const elementsHtml = sortedElements.map(element => {
    switch (element.type) {
      case 'text':
        return renderTextElement(element);
      case 'image':
        return renderImageElement(element);
      case 'graphic':
        return renderGraphicElement(element);
      case 'ticker':
        return renderTickerElement(element, rssArticles, rssSources);
      case 'video':
        return renderVideoElement(element);
      default:
        return '';
    }
  }).join('\n');

  const autoRefreshScript = enableAutoRefresh ? `
    let refreshTimer;
    function scheduleRefresh() {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        console.log('[OBS Overlay] Auto-refreshing scene...');
        window.location.reload();
      }, ${refreshInterval});
    }
    
    if (!window.obsstudio) {
      scheduleRefresh();
    }

    window.addEventListener('focus', () => {
      if (!window.obsstudio) {
        scheduleRefresh();
      }
    });
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(scene.name)} - OBS Overlay</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background-color: rgba(0, 0, 0, 0);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
    }
    
    body {
      position: relative;
    }
    
    @keyframes ticker-scroll {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-100%);
      }
    }
    
    .ticker-content {
      display: inline-block;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }
  </style>
</head>
<body>
  ${elementsHtml}
  
  <script>
    console.log('[OBS Overlay] Scene loaded:', ${JSON.stringify(scene.name)});
    console.log('[OBS Overlay] OBS Studio detected:', !!window.obsstudio);
    console.log('[OBS Overlay] Elements count:', ${elements.length});
    
    ${autoRefreshScript}
    
    window.addEventListener('error', (e) => {
      console.error('[OBS Overlay] Error:', e.message);
    });
    
    if (window.obsstudio) {
      window.obsstudio.getStatus((status) => {
        console.log('[OBS Overlay] OBS Status:', status);
      });
    }
  </script>
</body>
</html>`;
}

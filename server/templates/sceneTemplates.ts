import type { InsertScene } from "@shared/schema";

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Omit<InsertScene, 'name'>;
}

export const sceneTemplates: SceneTemplate[] = [
  {
    id: 'pre-match-analysis',
    name: 'Pre-Match Analysis',
    description: 'Liverpool FC pre-match analysis with tactical breakdown and stats overlay',
    category: 'Match Coverage',
    template: {
      description: 'Pre-match analysis template with Liverpool FC branding',
      layout: 'split',
      aspectRatio: '16:9',
      isTemplate: false,
      tags: ['pre-match', 'analysis', 'liverpool'],
      backgroundConfig: {
        type: 'gradient',
        colors: ['#1B365D', '#0A1628'],
        opacity: 1
      },
      transitionConfig: {
        in: 'fade',
        out: 'fade',
        duration: 500
      },
      elements: [
        {
          id: 'bg-gradient',
          type: 'graphic',
          zone: 'background',
          position: { x: 0, y: 0, width: 100, height: 100 },
          content: JSON.stringify({
            type: 'gradient',
            colors: ['#1B365D', '#0A1628'],
            direction: 'to bottom right'
          })
        },
        {
          id: 'main-video',
          type: 'video',
          zone: 'main',
          position: { x: 5, y: 10, width: 60, height: 70 },
          content: 'Main camera feed - Presenter'
        },
        {
          id: 'team-logo',
          type: 'image',
          zone: 'overlay',
          position: { x: 70, y: 10, width: 25, height: 25 },
          content: '/assets/847D1ED6-4A19-4001-B286-53F0D10F961E.png_1758823068354.PNG'
        },
        {
          id: 'match-title',
          type: 'text',
          zone: 'overlay',
          position: { x: 70, y: 38, width: 28, height: 8 },
          content: JSON.stringify({
            text: 'PRE-MATCH ANALYSIS',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#E8DCC6',
            backgroundColor: 'rgba(200, 16, 46, 0.9)',
            textAlign: 'center',
            padding: '8px'
          })
        },
        {
          id: 'matchup-info',
          type: 'text',
          zone: 'overlay',
          position: { x: 70, y: 48, width: 28, height: 15 },
          content: JSON.stringify({
            text: 'Liverpool FC vs Opponent\nPremier League\nAnfield',
            fontSize: 16,
            fontWeight: '600',
            color: '#FFFFFF',
            backgroundColor: 'rgba(27, 54, 93, 0.85)',
            textAlign: 'center',
            lineHeight: 1.6,
            padding: '12px'
          })
        },
        {
          id: 'ticker',
          type: 'ticker',
          zone: 'foreground',
          position: { x: 0, y: 92, width: 100, height: 8 },
          content: JSON.stringify({
            backgroundColor: '#C8102E',
            textColor: '#FFFFFF',
            fontSize: 16,
            speed: 50,
            items: [
              { text: 'Latest Liverpool FC news and updates', icon: '⚽' },
              { text: 'Follow @MailmanMedia for more content', icon: '📺' }
            ]
          })
        }
      ]
    }
  },
  {
    id: 'live-commentary',
    name: 'Live Commentary',
    description: 'Live match commentary overlay with score and match stats',
    category: 'Match Coverage',
    template: {
      description: 'Live commentary template with real-time stats',
      layout: 'single',
      aspectRatio: '16:9',
      isTemplate: false,
      tags: ['live', 'commentary', 'liverpool'],
      backgroundConfig: {
        type: 'transparent',
        opacity: 0
      },
      transitionConfig: {
        in: 'slide',
        out: 'slide',
        duration: 300
      },
      elements: [
        {
          id: 'commentator-video',
          type: 'video',
          zone: 'main',
          position: { x: 2, y: 2, width: 35, height: 30 },
          content: 'Commentator camera'
        },
        {
          id: 'score-overlay',
          type: 'text',
          zone: 'overlay',
          position: { x: 35, y: 5, width: 30, height: 12 },
          content: JSON.stringify({
            text: 'LFC 2 - 1 OPP',
            fontSize: 32,
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: 'rgba(27, 54, 93, 0.95)',
            textAlign: 'center',
            padding: '10px',
            border: '3px solid #C8102E'
          })
        },
        {
          id: 'match-time',
          type: 'text',
          zone: 'overlay',
          position: { x: 42, y: 18, width: 16, height: 6 },
          content: JSON.stringify({
            text: "67' ⚽",
            fontSize: 20,
            fontWeight: 'bold',
            color: '#E8DCC6',
            backgroundColor: 'rgba(200, 16, 46, 0.9)',
            textAlign: 'center',
            padding: '4px'
          })
        },
        {
          id: 'mailman-logo-small',
          type: 'image',
          zone: 'overlay',
          position: { x: 90, y: 5, width: 8, height: 8 },
          content: '/assets/mailman-logo.png'
        },
        {
          id: 'ticker',
          type: 'ticker',
          zone: 'foreground',
          position: { x: 0, y: 93, width: 100, height: 7 },
          content: JSON.stringify({
            backgroundColor: 'rgba(27, 54, 93, 0.95)',
            textColor: '#E8DCC6',
            fontSize: 14,
            speed: 60,
            items: [
              { text: 'LIVE: Liverpool vs Opponent - Follow along with Mailman Media', icon: '🔴' },
              { text: 'Subscribe for more Liverpool FC content', icon: '⚽' }
            ]
          })
        }
      ]
    }
  },
  {
    id: 'post-match-analysis',
    name: 'Post-Match Analysis',
    description: 'Post-match breakdown with player ratings and key moments',
    category: 'Match Coverage',
    template: {
      description: 'Post-match analysis template with stats and ratings',
      layout: 'grid',
      aspectRatio: '16:9',
      isTemplate: false,
      tags: ['post-match', 'analysis', 'liverpool'],
      backgroundConfig: {
        type: 'gradient',
        colors: ['#0A1628', '#1B365D', '#C8102E'],
        opacity: 1
      },
      transitionConfig: {
        in: 'fade',
        out: 'fade',
        duration: 600
      },
      elements: [
        {
          id: 'bg-gradient',
          type: 'graphic',
          zone: 'background',
          position: { x: 0, y: 0, width: 100, height: 100 },
          content: JSON.stringify({
            type: 'gradient',
            colors: ['#0A1628', '#1B365D', '#C8102E'],
            direction: 'to bottom'
          })
        },
        {
          id: 'analyst-video',
          type: 'video',
          zone: 'main',
          position: { x: 8, y: 15, width: 40, height: 50 },
          content: 'Post-match analyst camera'
        },
        {
          id: 'match-result-header',
          type: 'text',
          zone: 'overlay',
          position: { x: 10, y: 5, width: 80, height: 8 },
          content: JSON.stringify({
            text: 'FULL TIME: Liverpool 3 - 1 Opponent',
            fontSize: 28,
            fontWeight: 'bold',
            color: '#E8DCC6',
            backgroundColor: 'rgba(200, 16, 46, 0.95)',
            textAlign: 'center',
            padding: '8px',
            border: '2px solid #1B365D'
          })
        },
        {
          id: 'stats-panel',
          type: 'graphic',
          zone: 'overlay',
          position: { x: 52, y: 15, width: 42, height: 50 },
          content: JSON.stringify({
            type: 'stats-panel',
            backgroundColor: 'rgba(27, 54, 93, 0.9)',
            borderColor: '#E8DCC6',
            stats: [
              { label: 'Possession', value: '68%' },
              { label: 'Shots', value: '18' },
              { label: 'Shots on Target', value: '9' },
              { label: 'Pass Accuracy', value: '87%' },
              { label: 'Duels Won', value: '52' }
            ]
          })
        },
        {
          id: 'motm-badge',
          type: 'text',
          zone: 'overlay',
          position: { x: 55, y: 68, width: 36, height: 10 },
          content: JSON.stringify({
            text: '⭐ MOTM: Mohamed Salah',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: 'rgba(200, 16, 46, 0.95)',
            textAlign: 'center',
            padding: '8px'
          })
        },
        {
          id: 'ticker',
          type: 'ticker',
          zone: 'foreground',
          position: { x: 0, y: 92, width: 100, height: 8 },
          content: JSON.stringify({
            backgroundColor: '#1B365D',
            textColor: '#E8DCC6',
            fontSize: 16,
            speed: 45,
            items: [
              { text: 'Post-Match Analysis brought to you by Mailman Media', icon: '⚽' },
              { text: 'Player Ratings and Key Moments coming up', icon: '📊' }
            ]
          })
        }
      ]
    }
  },
  {
    id: 'transfer-news',
    name: 'Transfer News',
    description: 'Transfer news and rumours coverage with breaking news ticker',
    category: 'News & Updates',
    template: {
      description: 'Transfer news template with Liverpool FC branding',
      layout: 'split',
      aspectRatio: '16:9',
      isTemplate: false,
      tags: ['transfer', 'news', 'liverpool'],
      backgroundConfig: {
        type: 'gradient',
        colors: ['#C8102E', '#1B365D'],
        opacity: 1
      },
      transitionConfig: {
        in: 'slide',
        out: 'slide',
        duration: 400
      },
      elements: [
        {
          id: 'bg-gradient',
          type: 'graphic',
          zone: 'background',
          position: { x: 0, y: 0, width: 100, height: 100 },
          content: JSON.stringify({
            type: 'gradient',
            colors: ['#C8102E', '#1B365D'],
            direction: 'to right'
          })
        },
        {
          id: 'presenter-video',
          type: 'video',
          zone: 'main',
          position: { x: 5, y: 20, width: 45, height: 60 },
          content: 'Transfer news presenter camera'
        },
        {
          id: 'breaking-news-banner',
          type: 'text',
          zone: 'overlay',
          position: { x: 5, y: 8, width: 90, height: 10 },
          content: JSON.stringify({
            text: '🚨 BREAKING: Transfer News Update',
            fontSize: 26,
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: 'rgba(200, 16, 46, 0.95)',
            textAlign: 'center',
            padding: '10px',
            animation: 'pulse'
          })
        },
        {
          id: 'transfer-details',
          type: 'text',
          zone: 'overlay',
          position: { x: 55, y: 25, width: 40, height: 50 },
          content: JSON.stringify({
            text: 'Transfer Window Updates\n\n• Latest Rumours\n• Confirmed Deals\n• Expert Analysis',
            fontSize: 18,
            fontWeight: '600',
            color: '#E8DCC6',
            backgroundColor: 'rgba(27, 54, 93, 0.9)',
            textAlign: 'left',
            lineHeight: 2,
            padding: '20px',
            border: '3px solid #C8102E'
          })
        },
        {
          id: 'lfc-badge',
          type: 'image',
          zone: 'overlay',
          position: { x: 88, y: 85, width: 10, height: 10 },
          content: '/assets/847D1ED6-4A19-4001-B286-53F0D10F961E.png_1758823068354.PNG'
        },
        {
          id: 'ticker',
          type: 'ticker',
          zone: 'foreground',
          position: { x: 0, y: 92, width: 100, height: 8 },
          content: JSON.stringify({
            backgroundColor: '#C8102E',
            textColor: '#FFFFFF',
            fontSize: 16,
            speed: 55,
            items: [
              { text: 'Stay tuned for the latest Liverpool FC transfer news', icon: '🔴' },
              { text: 'Subscribe to Mailman Media for exclusive updates', icon: '📰' }
            ]
          })
        }
      ]
    }
  }
];

export function getSceneTemplate(templateId: string): SceneTemplate | undefined {
  return sceneTemplates.find(t => t.id === templateId);
}

export function getAllSceneTemplates(): SceneTemplate[] {
  return sceneTemplates;
}

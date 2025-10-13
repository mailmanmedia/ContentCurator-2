
#!/usr/bin/env node

/**
 * Blueprint Auto-Generator
 * Scans codebase and updates CONTENT_CURATOR_BLUEPRINT.md
 * Run with: npm run generate-blueprint
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface ComponentInfo {
  file: string;
  name: string;
  type: 'page' | 'component' | 'overlay' | 'hook' | 'util';
  props: string[];
  hooks: string[];
  dependencies: string[];
  apiCalls: string[];
  exports: string[];
}

function scanFile(filePath: string): ComponentInfo | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  // Extract component name
  const componentMatch = content.match(/export (?:default )?(?:function|const) (\w+)/);
  if (!componentMatch) return null;
  
  const name = componentMatch[1];
  
  // Extract props
  const propsMatch = content.match(/interface \w+Props\s*{([^}]+)}/);
  const props = propsMatch 
    ? propsMatch[1].split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('//'))
        .map(line => line.split(':')[0].replace('?', '').trim())
    : [];
  
  // Extract hooks
  const hooks = [
    ...content.matchAll(/use(\w+)\(/g)
  ].map(m => `use${m[1]}`);
  
  // Extract API calls
  const apiCalls = [
    ...content.matchAll(/fetch\(['"`]([^'"`]+)['"`]\)/g)
  ].map(m => m[1]);
  
  // Extract imports
  const dependencies = [
    ...content.matchAll(/import .+ from ['"]([^'"]+)['"]/g)
  ].map(m => m[1]);
  
  // Determine type
  let type: ComponentInfo['type'] = 'component';
  if (filePath.includes('/pages/')) type = 'page';
  if (filePath.includes('/overlays/')) type = 'overlay';
  if (filePath.includes('/hooks/')) type = 'hook';
  if (filePath.includes('/lib/')) type = 'util';
  
  return {
    file: filePath.replace(process.cwd(), ''),
    name,
    type,
    props,
    hooks: [...new Set(hooks)],
    dependencies,
    apiCalls: [...new Set(apiCalls)],
    exports: [name]
  };
}

function scanDirectory(dir: string): ComponentInfo[] {
  const results: ComponentInfo[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      results.push(...scanDirectory(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      const info = scanFile(fullPath);
      if (info) results.push(info);
    }
  }
  
  return results;
}

function generateReport(components: ComponentInfo[]): string {
  const pages = components.filter(c => c.type === 'page');
  const overlays = components.filter(c => c.type === 'overlay');
  const hooks = components.filter(c => c.type === 'hook');
  
  let report = `# ContentCurator Blueprint - Auto-Generated\n\n`;
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Total Components**: ${components.length}\n\n`;
  
  report += `## Pages (${pages.length})\n\n`;
  for (const page of pages) {
    report += `### ${page.name}\n`;
    report += `- File: \`${page.file}\`\n`;
    report += `- Props: ${page.props.join(', ') || 'None'}\n`;
    report += `- Hooks: ${page.hooks.join(', ') || 'None'}\n`;
    report += `- API Calls: ${page.apiCalls.join(', ') || 'None'}\n\n`;
  }
  
  report += `## Overlays (${overlays.length})\n\n`;
  for (const overlay of overlays) {
    report += `### ${overlay.name}\n`;
    report += `- File: \`${overlay.file}\`\n`;
    report += `- Props: ${overlay.props.join(', ')}\n`;
    report += `- API Calls: ${overlay.apiCalls.join(', ') || 'None'}\n\n`;
  }
  
  return report;
}

// Main execution
console.log('🔍 Scanning codebase...');

const clientComponents = scanDirectory(path.join(__dirname, '../client/src'));
const serverFiles = scanDirectory(path.join(__dirname, '../server'));

const allComponents = [...clientComponents, ...serverFiles];

console.log(`✅ Found ${allComponents.length} components`);

const report = generateReport(allComponents);

fs.writeFileSync(
  path.join(__dirname, '../BLUEPRINT_AUTO.md'),
  report
);

console.log('📝 Blueprint generated: BLUEPRINT_AUTO.md');

// Generate CSV export
const csv = [
  'File,Component,Type,Props,Hooks,API Calls',
  ...allComponents.map(c => 
    `"${c.file}","${c.name}","${c.type}","${c.props.join('; ')}","${c.hooks.join('; ')}","${c.apiCalls.join('; ')}"`
  )
].join('\n');

fs.writeFileSync(
  path.join(__dirname, '../blueprint_export.csv'),
  csv
);

console.log('📊 CSV export: blueprint_export.csv');

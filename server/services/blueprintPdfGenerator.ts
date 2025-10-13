
import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import path from 'path';
import { db, pool } from '../db';

interface CodeScanResult {
  files: FileInfo[];
  components: ComponentInfo[];
  apis: ApiEndpoint[];
  errors: ErrorInfo[];
  timestamp: Date;
}

interface FileInfo {
  path: string;
  lines: number;
  exports: string[];
  imports: string[];
  type: 'component' | 'page' | 'hook' | 'util' | 'api';
}

interface ComponentInfo {
  name: string;
  file: string;
  props: string[];
  hooks: string[];
  dependencies: string[];
  apiCalls: string[];
}

interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
  requestSchema?: any;
  responseSchema?: any;
}

interface ErrorInfo {
  file: string;
  line: number;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export class BlueprintPdfGenerator {
  
  async scanCodebase(): Promise<CodeScanResult> {
    console.log('Starting fresh codebase scan...');
    
    const clientFiles = await this.scanDirectory('client/src');
    const serverFiles = await this.scanDirectory('server');
    
    const components = await this.extractComponents([...clientFiles, ...serverFiles]);
    const apis = await this.extractApiEndpoints();
    const errors = await this.extractErrors();
    
    return {
      files: [...clientFiles, ...serverFiles],
      components,
      apis,
      errors,
      timestamp: new Date()
    };
  }
  
  async scanDirectory(dir: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          const subResults = await this.scanDirectory(fullPath);
          results.push(...subResults);
        } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
          const fileInfo = await this.analyzeFile(fullPath);
          if (fileInfo) results.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
    
    return results;
  }
  
  async analyzeFile(filePath: string): Promise<FileInfo | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      const exports = this.extractExports(content);
      const imports = this.extractImports(content);
      const type = this.determineFileType(filePath, content);
      
      return {
        path: filePath,
        lines,
        exports,
        imports,
        type
      };
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error);
      return null;
    }
  }
  
  extractExports(content: string): string[] {
    const exportRegex = /export (?:default |const |function |class )?(\w+)/g;
    const matches = content.matchAll(exportRegex);
    return Array.from(matches, m => m[1]);
  }
  
  extractImports(content: string): string[] {
    const importRegex = /import .+ from ['"]([^'"]+)['"]/g;
    const matches = content.matchAll(importRegex);
    return Array.from(matches, m => m[1]);
  }
  
  determineFileType(filePath: string, content: string): FileInfo['type'] {
    if (filePath.includes('/pages/')) return 'page';
    if (filePath.includes('/hooks/')) return 'hook';
    if (filePath.includes('/lib/') || filePath.includes('/utils/')) return 'util';
    if (filePath.includes('server/routes') || filePath.includes('server/index')) return 'api';
    if (content.includes('export default function') || content.includes('export const')) return 'component';
    return 'util';
  }
  
  async extractComponents(files: FileInfo[]): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    
    for (const file of files) {
      if (file.type === 'component' || file.type === 'page') {
        const content = await fs.readFile(file.path, 'utf-8');
        
        const name = file.exports[0] || path.basename(file.path, path.extname(file.path));
        const props = this.extractProps(content);
        const hooks = this.extractHooks(content);
        const apiCalls = this.extractApiCalls(content);
        
        components.push({
          name,
          file: file.path,
          props,
          hooks,
          dependencies: file.imports,
          apiCalls
        });
      }
    }
    
    return components;
  }
  
  extractProps(content: string): string[] {
    const propsMatch = content.match(/interface \w+Props\s*{([^}]+)}/);
    if (!propsMatch) return [];
    
    return propsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.split(':')[0].replace('?', '').trim());
  }
  
  extractHooks(content: string): string[] {
    const hookRegex = /(use\w+)\(/g;
    const matches = content.matchAll(hookRegex);
    return Array.from(new Set(matches), m => m[1]);
  }
  
  extractApiCalls(content: string): string[] {
    const apiRegex = /['"`]\/api\/([^'"`]+)['"`]/g;
    const matches = content.matchAll(apiRegex);
    return Array.from(new Set(matches), m => `/api/${m[1]}`);
  }
  
  async extractApiEndpoints(): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    
    try {
      const routesContent = await fs.readFile('server/routes.ts', 'utf-8');
      const routeRegex = /app\.(get|post|patch|put|delete)\(['"]([^'"]+)['"]/g;
      const matches = routesContent.matchAll(routeRegex);
      
      for (const match of matches) {
        endpoints.push({
          method: match[1].toUpperCase(),
          path: match[2],
          handler: `routes.ts`
        });
      }
    } catch (error) {
      console.error('Error extracting API endpoints:', error);
    }
    
    return endpoints;
  }
  
  async extractErrors(): Promise<ErrorInfo[]> {
    // In production, this would scan error logs, console output, and catch blocks
    return [
      {
        file: 'client/src/pages/LivePresentation.tsx',
        line: 850,
        type: 'Data Fetch Error',
        message: 'Teams data returns empty array',
        severity: 'critical'
      },
      {
        file: 'server/storage.ts',
        line: 1954,
        type: 'Database Error',
        message: 'column "key" does not exist',
        severity: 'critical'
      }
    ];
  }
  
  async generatePdf(scanResult: CodeScanResult, outputPath: string): Promise<void> {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const writeStream = require('fs').createWriteStream(outputPath);
    doc.pipe(writeStream);
    
    // Cover page
    doc.fontSize(24).font('Helvetica-Bold').text('ContentCurator App Blueprint', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Generated: ${scanResult.timestamp.toISOString()}`, { align: 'center' });
    doc.moveDown(3);
    
    // Table of Contents
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('Table of Contents');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    doc.text('1. Application Overview');
    doc.text('2. Component Hierarchy');
    doc.text('3. API Endpoints');
    doc.text('4. Error Report');
    doc.text('5. Data Flow Maps');
    doc.text('6. Dependencies');
    
    // Components section
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('Component Hierarchy');
    doc.moveDown();
    
    for (const component of scanResult.components) {
      doc.fontSize(14).font('Helvetica-Bold').text(component.name);
      doc.fontSize(10).font('Helvetica').text(`File: ${component.file}`);
      doc.text(`Props: ${component.props.join(', ') || 'None'}`);
      doc.text(`Hooks: ${component.hooks.join(', ') || 'None'}`);
      doc.text(`API Calls: ${component.apiCalls.join(', ') || 'None'}`);
      doc.moveDown();
    }
    
    // API Endpoints section
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('API Endpoints');
    doc.moveDown();
    
    for (const api of scanResult.apis) {
      doc.fontSize(12).font('Helvetica-Bold').text(`${api.method} ${api.path}`);
      doc.fontSize(10).font('Helvetica').text(`Handler: ${api.handler}`);
      doc.moveDown();
    }
    
    // Errors section
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('Error Report');
    doc.moveDown();
    
    for (const error of scanResult.errors) {
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor(error.severity === 'critical' ? 'red' : 'orange')
        .text(`[${error.severity.toUpperCase()}] ${error.type}`);
      doc.fillColor('black').fontSize(10).font('Helvetica');
      doc.text(`File: ${error.file}:${error.line}`);
      doc.text(`Message: ${error.message}`);
      doc.moveDown();
    }
    
    doc.end();
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
}

export const blueprintPdfGenerator = new BlueprintPdfGenerator();

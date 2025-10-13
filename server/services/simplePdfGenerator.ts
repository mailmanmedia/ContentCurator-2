import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import path from 'path';

export async function generateBlueprintPdf(outputPath: string): Promise<void> {
  try {
    // Read the blueprint markdown file
    const blueprintPath = path.join(process.cwd(), 'CONTENT_CURATOR_BLUEPRINT.md');
    const blueprintContent = await fs.readFile(blueprintPath, 'utf-8');
    
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });
    
    // Create write stream
    const stream = doc.pipe(require('fs').createWriteStream(outputPath));
    
    // Add title page
    doc.fontSize(24).font('Helvetica-Bold')
       .text('ContentCurator Blueprint', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica')
       .text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
    doc.moveDown(2);
    
    // Process blueprint content line by line
    const lines = blueprintContent.split('\n');
    let isCodeBlock = false;
    
    for (const line of lines) {
      // Check for code blocks
      if (line.startsWith('```')) {
        isCodeBlock = !isCodeBlock;
        continue;
      }
      
      // Handle different line types
      if (isCodeBlock) {
        doc.fontSize(9).font('Courier')
           .fillColor('#444444')
           .text(line || ' ', { continued: false });
      } else if (line.startsWith('# ')) {
        // Main heading
        doc.addPage();
        doc.fontSize(20).font('Helvetica-Bold')
           .fillColor('#000000')
           .text(line.substring(2), { align: 'center' });
        doc.moveDown();
      } else if (line.startsWith('## ')) {
        // Section heading
        doc.moveDown();
        doc.fontSize(16).font('Helvetica-Bold')
           .fillColor('#000000')
           .text(line.substring(3));
        doc.moveDown(0.5);
      } else if (line.startsWith('### ')) {
        // Subsection heading
        doc.fontSize(14).font('Helvetica-Bold')
           .fillColor('#333333')
           .text(line.substring(4));
        doc.moveDown(0.3);
      } else if (line.startsWith('- ')) {
        // Bullet point
        doc.fontSize(11).font('Helvetica')
           .fillColor('#000000')
           .text(`• ${line.substring(2)}`, { indent: 20 });
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.fontSize(11).font('Helvetica-Bold')
           .fillColor('#000000')
           .text(line.replace(/\*\*/g, ''));
      } else if (line.trim()) {
        // Normal paragraph
        doc.fontSize(11).font('Helvetica')
           .fillColor('#000000')
           .text(line);
      } else {
        // Empty line
        doc.moveDown(0.5);
      }
    }
    
    // Add page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      const pageNumber = `Page ${i + 1} of ${pages.count}`;
      doc.fontSize(10).font('Helvetica')
         .fillColor('#666666')
         .text(pageNumber, 50, doc.page.height - 50, {
           align: 'center',
           lineBreak: false
         });
    }
    
    // Finalize the PDF
    doc.end();
    
    // Wait for stream to finish
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log('PDF generation completed successfully');
        resolve();
      });
      stream.on('error', reject);
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
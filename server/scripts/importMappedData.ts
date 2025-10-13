
import XLSX from 'xlsx';
import { ExcelDataImporter } from '../football/excelDataImporter';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';

async function main() {
  console.log('\n🚀 Starting Excel import process...\n');
  
  // Step 1: Verify database connection
  console.log('🔌 Verifying database connection...');
  try {
    await db.execute('SELECT 1');
    console.log('✅ Database connection verified\n');
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
  
  // Step 2: Find Excel file
  const assetsDir = path.resolve('attached_assets');
  let filePath: string | null = null;
  
  console.log('📁 Current directory:', process.cwd());
  console.log('🔍 Searching for Excel files in:', assetsDir);
  
  if (!fs.existsSync(assetsDir)) {
    console.error('❌ attached_assets directory not found');
    process.exit(1);
  }
  
  const excelFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.xlsx'));
  console.log(`\n📂 Found ${excelFiles.length} Excel files:`);
  excelFiles.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  
  // Try to find the mapped data file
  const mappedFile = excelFiles.find(f => f.includes('mapped_data'));
  if (mappedFile) {
    filePath = path.join(assetsDir, mappedFile);
    console.log(`\n✅ Using file: ${mappedFile}`);
  } else if (excelFiles.length > 0) {
    filePath = path.join(assetsDir, excelFiles[0]);
    console.log(`\n⚠️  No 'mapped_data' file found, using: ${excelFiles[0]}`);
  } else {
    console.error('❌ No Excel files found');
    process.exit(1);
  }
  
  // Step 3: Validate Excel file
  const stats = fs.statSync(filePath);
  console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📅 Last modified: ${stats.mtime}\n`);
  
  // Step 4: Read and validate Excel structure
  try {
    console.log('📖 Reading Excel file structure...');
    const workbook = XLSX.readFile(filePath);
    console.log(`✅ Excel file read successfully!`);
    console.log(`📋 Found ${workbook.SheetNames.length} sheets:\n`);
    
    let totalRows = 0;
    workbook.SheetNames.forEach((name, idx) => {
      const sheet = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json(sheet);
      totalRows += data.length;
      
      console.log(`  ${idx + 1}. ${name}`);
      console.log(`     └─ ${data.length} rows`);
      
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`     └─ Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}`);
      }
    });
    
    console.log(`\n📊 Total rows across all sheets: ${totalRows}\n`);
    
    if (totalRows === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to read Excel file:');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
  
  // Step 5: Run the importer
  try {
    console.log('🔄 Starting import process...\n');
    const importer = new ExcelDataImporter(filePath);
    const result = await importer.importData();
    
    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total rows processed: ${result.rowsProcessed}`);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📋 Import Summary:`);
      result.results.forEach((r: any, idx: number) => {
        console.log(`  ${idx + 1}. ${r.rowsProcessed || 0} rows processed`);
      });
    }
    
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\n❌ Import failed:');
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});

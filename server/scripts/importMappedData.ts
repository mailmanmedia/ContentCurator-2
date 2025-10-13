
import XLSX from 'xlsx';
import { ExcelDataImporter } from '../football/excelDataImporter';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('\n🚀 Starting Excel import process...\n');
  
  const filePath = path.resolve('attached_assets/mapped_data_all_sheets_20251013_002956_1760316402833.xlsx');
  
  console.log('📁 Current directory:', process.cwd());
  console.log('🔍 Looking for file at:', filePath);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('\n📂 Checking attached_assets folder...');
    
    const assetsDir = path.resolve('attached_assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.xlsx'));
      console.log(`\nFound ${files.length} Excel files:`);
      files.forEach(f => console.log(`  - ${f}`));
      
      if (files.length > 0) {
        console.log('\n💡 Tip: Update the filePath variable with the correct filename');
      }
    } else {
      console.log('❌ attached_assets directory not found');
    }
    
    process.exit(1);
  }
  
  console.log(`✅ File found!`);
  const stats = fs.statSync(filePath);
  console.log(`📦 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📅 Last modified: ${stats.mtime}\n`);
  
  // Try to read the Excel file directly first
  try {
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    console.log(`✅ Excel file read successfully!`);
    console.log(`📋 Found ${workbook.SheetNames.length} sheets:`);
    workbook.SheetNames.forEach((name, idx) => {
      const sheet = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json(sheet);
      console.log(`  ${idx + 1}. ${name} (${data.length} rows)`);
    });
    console.log();
  } catch (error: any) {
    console.error('❌ Failed to read Excel file:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  // Now try the importer
  try {
    console.log('🔄 Starting import process...\n');
    const importer = new ExcelDataImporter(filePath);
    const result = await importer.importData();
    
    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total rows processed: ${result.rowsProcessed}`);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📋 Import Summary:`);
      result.results.forEach((r: any) => {
        console.log(`  - ${r.rowsProcessed || 0} rows processed`);
      });
    }
    
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

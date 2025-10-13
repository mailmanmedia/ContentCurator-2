
import { ExcelDataImporter } from '../football/excelDataImporter';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const filePath = path.resolve('attached_assets/mapped_data_all_sheets_20251013_002956_1760316402833.xlsx');
  
  console.log(`\n🚀 Starting Excel import from: ${filePath}\n`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('📁 Current directory:', process.cwd());
    console.log('📂 Checking attached_assets folder...');
    
    const assetsDir = path.resolve('attached_assets');
    if (fs.existsSync(assetsDir)) {
      const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.xlsx'));
      console.log(`Found ${files.length} Excel files:`);
      files.forEach(f => console.log(`  - ${f}`));
    }
    
    process.exit(1);
  }
  
  console.log(`✅ File found: ${filePath}`);
  console.log(`📦 File size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n`);
  
  try {
    const importer = new ExcelDataImporter(filePath);
    const result = await importer.importData();
    
    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total rows processed: ${result.rowsProcessed}`);
    
    if (result.results) {
      console.log(`\n📋 Import Summary:`);
      result.results.forEach((r: any) => {
        console.log(`  - ${r.rowsProcessed || 0} rows processed`);
      });
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Import failed:');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();

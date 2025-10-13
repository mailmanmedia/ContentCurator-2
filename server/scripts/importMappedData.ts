
import { ExcelDataImporter } from '../football/excelDataImporter';

async function main() {
  const filePath = 'attached_assets/mapped_data_all_sheets_20251013_002956_1760316402833.xlsx';
  
  console.log(`\n🚀 Starting Excel import from: ${filePath}\n`);
  
  try {
    const importer = new ExcelDataImporter(filePath);
    const result = await importer.importData();
    
    console.log('\n✅ Import completed successfully!');
    console.log(`📊 Total rows processed: ${result.rowsProcessed}`);
    
    if (result.results) {
      console.log(`\n📋 Import Summary:`);
      result.results.forEach((r: any) => {
        console.log(`  - ${r.rowsProcessed || 0} rows`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();

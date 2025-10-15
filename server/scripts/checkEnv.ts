import '../config'; // Load environment variables

console.log('🔍 Checking Environment Variables...\n');

const API_KEY = process.env.API_FOOTBALL_KEY;

if (!API_KEY) {
  console.error('❌ API_FOOTBALL_KEY is not set or is empty!');
  console.log('\nAll environment variables starting with API:');
  Object.keys(process.env)
    .filter(key => key.startsWith('API'))
    .forEach(key => {
      console.log(`  ${key}: ${process.env[key]?.substring(0, 10)}...`);
    });
} else {
  console.log('✅ API_FOOTBALL_KEY is set');
  console.log(`   Length: ${API_KEY.length} characters`);
  console.log(`   First 10 chars: ${API_KEY.substring(0, 10)}...`);
  console.log(`   Last 10 chars: ...${API_KEY.substring(API_KEY.length - 10)}`);
  console.log(`   Looks like a valid key: ${API_KEY.length >= 20 ? '✅ Yes' : '❌ No (too short)'}`);
  
  // Check if it has any weird characters
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(API_KEY);
  console.log(`   Contains special characters: ${hasSpecialChars ? '⚠️ Yes' : '✅ No'}`);
  
  // Check for whitespace
  const hasWhitespace = /\s/.test(API_KEY);
  console.log(`   Contains whitespace: ${hasWhitespace ? '❌ Yes (this is a problem!)' : '✅ No'}`);
  
  // Trim and compare
  const trimmed = API_KEY.trim();
  if (trimmed !== API_KEY) {
    console.log(`   ⚠️ WARNING: Key has leading/trailing whitespace!`);
    console.log(`   Trimmed length: ${trimmed.length}`);
  }
}

console.log('\n📋 Other relevant environment variables:');
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

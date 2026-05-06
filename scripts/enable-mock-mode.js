#!/usr/bin/env node

/**
 * Production server'da Mock Mode aktiv etmək üçün script
 * 
 * Bu script production server'da çalıştırılmalıdır:
 * node scripts/enable-mock-mode.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Production Mock Mode aktiv edilir...');

// .env dosyasını oku
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env dosyası oxundu');
} catch (error) {
  console.log('⚠️ .env dosyası tapılmadı, yeni yaradılır');
  envContent = '';
}

// Mock mode'u aktiv et
const mockModeLine = 'EPOINT_MOCK_MODE=true';
const nodeEnvLine = 'NODE_ENV=production';

// Eğer zaten varsa güncelle, yoksa ekle
if (envContent.includes('EPOINT_MOCK_MODE=')) {
  envContent = envContent.replace(/EPOINT_MOCK_MODE=.*/g, mockModeLine);
  console.log('✅ EPOINT_MOCK_MODE güncellendi');
} else {
  envContent += `\n${mockModeLine}\n`;
  console.log('✅ EPOINT_MOCK_MODE eklendi');
}

// NODE_ENV'i production olarak ayarla
if (envContent.includes('NODE_ENV=')) {
  envContent = envContent.replace(/NODE_ENV=.*/g, nodeEnvLine);
  console.log('✅ NODE_ENV production olarak ayarlandı');
} else {
  envContent += `\n${nodeEnvLine}\n`;
  console.log('✅ NODE_ENV eklendi');
}

// Dosyayı kaydet
fs.writeFileSync(envPath, envContent);
console.log('✅ .env dosyası güncellendi');

console.log('\n🎯 Mock Mode aktiv edildi!');
console.log('📝 Şimdi production server\'ı yeniden başlatın:');
console.log('   npm start');
console.log('\n🧪 Test ödemeleri artık mock mode\'da çalışacak');
console.log('💡 Real E-point API key\'leri aldığınızda EPOINT_MOCK_MODE=false yapın');

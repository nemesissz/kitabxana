import { executeQuery, insert } from '../src/config/database.js';

async function insertDefaultCategories() {
    try {
        console.log('🔧 Adding default categories...');
        
        const defaultCategories = [
            { name: 'Vergi Qanunvericiliyi' },
            { name: 'Mühasibat Uçotu' },
            { name: 'Maliyyə Hesabatları' },
            { name: 'Beynəlxalq Standartlar' },
            { name: 'Ümumi' }
        ];

        for (const category of defaultCategories) {
            try {
                // Check if category already exists
                const existing = await executeQuery(
                    'SELECT id FROM categories WHERE name = ?',
                    [category.name]
                );
                
                if (existing.length === 0) {
                    const categoryId = await insert('categories', category);
                    console.log(`✅ Added category: ${category.name} (ID: ${categoryId})`);
                } else {
                    console.log(`⚠️  Category already exists: ${category.name}`);
                }
            } catch (error) {
                console.error(`❌ Error adding category ${category.name}:`, error.message);
            }
        }
        
        console.log('✅ Default categories setup completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up categories:', error);
        process.exit(1);
    }
}

insertDefaultCategories();
import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class CategoryService {
  async getAllCategories() {
    return await executeQuery('SELECT * FROM categories ORDER BY name');
  }

  async getCategoryById(id) {
    return await getOne('SELECT * FROM categories WHERE id = ?', [id]);
  }

  async createCategory(data) {
    const { name, description } = data;
    
    // Check if category exists
    const existing = await getOne('SELECT id FROM categories WHERE name = ?', [name]);
    if (existing) {
      throw new Error('Category already exists');
    }

    const categoryData = { name };
    
    // Only add description if it's provided
    if (description !== undefined && description !== '') {
      categoryData.description = description;
    }

    const categoryId = await insert('categories', categoryData);
    return await this.getCategoryById(categoryId);
  }

  async updateCategory(id, data) {
    const { name, description } = data;
    
    // Check if category exists
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    // Check for duplicate name
    if (name) {
      const duplicate = await getOne('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
      if (duplicate) {
        throw new Error('Category name already exists');
      }
    }

    await update('categories', id, { name, description });
    return await this.getCategoryById(id);
  }

  async deleteCategory(id) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('Category not found');
    }

    await deleteRecord('categories', id);
    return { message: 'Category deleted successfully' };
  }
}

export default new CategoryService();
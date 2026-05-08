import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class CategoryPdfService {
  async getAllCategories() {
    return await executeQuery('SELECT * FROM category_pdfs ORDER BY name');
  }

  async getCategoryById(id) {
    console.log('Service: Looking for PDF category with ID:', id);
    const result = await getOne('SELECT * FROM category_pdfs WHERE id = ?', [id]);
    console.log('Service: Query result:', result);
    return result;
  }

  async createCategory(data) {
    const { name, display_type = 'tax-journal', pdf_type = 'emr' } = data;

    const existing = await getOne('SELECT id FROM category_pdfs WHERE name = ?', [name]);
    if (existing) {
      throw new Error('PDF Category already exists');
    }

    if (!['tax-journal', 'other-books'].includes(display_type)) {
      throw new Error('Invalid display_type. Must be either "tax-journal" or "other-books"');
    }

    if (!['kitab', 'emr', 'serecam'].includes(pdf_type)) {
      throw new Error('Invalid pdf_type. Must be kitab, emr or serecam');
    }

    const categoryId = await insert('category_pdfs', { name, display_type, pdf_type });
    return await this.getCategoryById(categoryId);
  }

  async updateCategory(id, data) {
    const { name, display_type, pdf_type } = data;

    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('PDF Category not found');
    }

    if (name) {
      const duplicate = await getOne('SELECT id FROM category_pdfs WHERE name = ? AND id != ?', [name, id]);
      if (duplicate) {
        throw new Error('PDF Category name already exists');
      }
    }

    if (display_type && !['tax-journal', 'other-books'].includes(display_type)) {
      throw new Error('Invalid display_type. Must be either "tax-journal" or "other-books"');
    }

    if (pdf_type && !['kitab', 'emr', 'serecam'].includes(pdf_type)) {
      throw new Error('Invalid pdf_type. Must be kitab, emr or serecam');
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (display_type) updateData.display_type = display_type;
    if (pdf_type) updateData.pdf_type = pdf_type;

    await update('category_pdfs', id, updateData);
    return await this.getCategoryById(id);
  }

  async deleteCategory(id) {
    // Check if category exists
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('PDF Category not found');
    }

    // Check if category is used by any PDFs
    const pdfCount = await getOne('SELECT COUNT(*) as count FROM pdfs WHERE category_id = ?', [id]);
    if (pdfCount.count > 0) {
      throw new Error('Cannot delete PDF category that is in use by PDFs');
    }

    await deleteRecord('category_pdfs', id);
    return { message: 'PDF Category deleted successfully' };
  }

  async getCategoriesWithPdfCount() {
    return await executeQuery(`
      SELECT 
        cp.*,
        COUNT(p.id) as pdf_count
      FROM category_pdfs cp
      LEFT JOIN pdfs p ON cp.id = p.category_id
      GROUP BY cp.id
      ORDER BY cp.name
    `);
  }
}

export default new CategoryPdfService();
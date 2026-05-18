import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class CategoryPdfService {
  async getAllCategories() {
    return await executeQuery('SELECT * FROM category_pdfs ORDER BY name');
  }

  async getCategoryById(id) {
    return await getOne('SELECT * FROM category_pdfs WHERE id = ?', [id]);
  }

  async createCategory(data) {
    const { name, display_type = 'tax-journal' } = data;

    const existing = await getOne('SELECT id FROM category_pdfs WHERE name = ?', [name]);
    if (existing) {
      throw new Error('PDF Category already exists');
    }

    if (!['tax-journal', 'other-books'].includes(display_type)) {
      throw new Error('Invalid display_type. Must be either "tax-journal" or "other-books"');
    }

    const categoryId = await insert('category_pdfs', { name, display_type });
    return await this.getCategoryById(categoryId);
  }

  async updateCategory(id, data) {
    const { name, display_type } = data;

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

    const updateData = {};
    if (name) updateData.name = name;
    if (display_type) updateData.display_type = display_type;

    await update('category_pdfs', id, updateData);
    return await this.getCategoryById(id);
  }

  async deleteCategory(id) {
    const existing = await this.getCategoryById(id);
    if (!existing) {
      throw new Error('PDF Category not found');
    }

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

  // --- Category request methods ---

  async submitRequest({ type, categoryId, name, pdfType, displayType }, userId, institutionId) {
    if (!name || !name.trim()) throw new Error('Name is required');
    if (!['add', 'edit'].includes(type)) throw new Error('Invalid request type');

    if (type === 'edit') {
      if (!categoryId) throw new Error('categoryId required for edit requests');
      const cat = await this.getCategoryById(categoryId);
      if (!cat) throw new Error('Category not found');
    }

    const requestId = await insert('category_requests', {
      type,
      requested_by: userId,
      category_id: categoryId || null,
      name: name.trim(),
      display_type: displayType || 'tax-journal',
      status: 'pending',
      requester_institution_id: institutionId,
    });

    return await getOne('SELECT * FROM category_requests WHERE id = ?', [requestId]);
  }

  async getRequests({ status = 'pending', institutionId = null } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('cr.status = ?');
      params.push(status);
    }
    if (institutionId) {
      conditions.push('cr.requester_institution_id = ?');
      params.push(institutionId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return await executeQuery(`
      SELECT cr.*, u.login as requester_login,
             inst.name as institution_name,
             cat.name as current_category_name
      FROM category_requests cr
      JOIN users u ON cr.requested_by = u.id
      LEFT JOIN institutions inst ON cr.requester_institution_id = inst.id
      LEFT JOIN category_pdfs cat ON cr.category_id = cat.id
      ${where}
      ORDER BY cr.created_at DESC
    `, params);
  }

  async approveRequest(requestId, reviewerUserId) {
    const req = await getOne('SELECT * FROM category_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Request not found');
    if (req.status !== 'pending') throw new Error('Request already processed');

    if (req.type === 'add') {
      // Skip if category name already exists (idempotent)
      const existing = await getOne('SELECT id FROM category_pdfs WHERE name = ?', [req.name]);
      if (!existing) {
        await this.createCategory({ name: req.name, display_type: req.display_type });
      }
    } else if (req.type === 'edit') {
      await this.updateCategory(req.category_id, {
        name: req.name,
        display_type: req.display_type,
      });
    }

    await executeQuery(
      'UPDATE category_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', reviewerUserId, requestId]
    );
    return { message: 'Request approved and applied' };
  }

  async rejectRequest(requestId, reviewerUserId) {
    const req = await getOne('SELECT * FROM category_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Request not found');
    if (req.status !== 'pending') throw new Error('Request already processed');

    await executeQuery(
      'UPDATE category_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', reviewerUserId, requestId]
    );
    return { message: 'Request rejected' };
  }
}

export default new CategoryPdfService();

import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class CvService {
  async getAllCvs(filters = {}) {
    const { 
      page = 1, 
      limit = 12, 
      category = null,
      search = null 
    } = filters;

    const validPage = parseInt(page) || 1;
    const validLimit = Math.min(Math.max(parseInt(limit) || 12, 1), 100);
    const offset = (validPage - 1) * validLimit;
    
    const conditions = [];
    const queryParams = [];
    
    if (category) {
      conditions.push('cv.category = ?');
      queryParams.push(category);
    }
    
    if (search && search.trim() !== '') {
      conditions.push('(cv.title LIKE ? OR cv.description LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM cvs cv
      ${whereClause}
    `;
    const countResult = await getOne(countQuery, queryParams);
    const total = countResult.total;
    
    // Get paginated CVs
    const query = `
      SELECT 
        cv.id,
        cv.title,
        cv.description,
        cv.category,
        cv.file_path,
        cv.downloads,
        cv.file_size,
        cv.created_at,
        cv.updated_at
      FROM cvs cv
      ${whereClause}
      ORDER BY cv.created_at DESC
      LIMIT ${validLimit} OFFSET ${offset}
    `;
    
    const cvs = await executeQuery(query, queryParams);
    
    return {
      cvs,
      pagination: {
        current_page: validPage,
        per_page: validLimit,
        total: total,
        total_pages: Math.ceil(total / validLimit)
      },
      filters: {
        category,
        search
      }
    };
  }

  async getCvById(id) {
    const query = `
      SELECT 
        cv.id,
        cv.title,
        cv.description,
        cv.category,
        cv.file_path,
        cv.downloads,
        cv.file_size,
        cv.created_at,
        cv.updated_at
      FROM cvs cv
      WHERE cv.id = ?
    `;
    return await getOne(query, [id]);
  }

  async createCv(data, file = null) {
    const { title, description, category } = data;
    
    if (!title) {
      throw new Error('Title is required');
    }
    
    if (!file || !file.path) {
      throw new Error('File is required');
    }
    
    // Calculate file size in KB
    const fileSize = Math.round(file.size / 1024);
    
    const cvData = {
      title,
      file_path: file.path,
      file_size: fileSize,
      downloads: 0
    };
    
    if (description && description !== '') {
      cvData.description = description;
    }
    
    if (category && category !== '') {
      cvData.category = category;
    }
    
    const cvId = await insert('cvs', cvData);
    return await this.getCvById(cvId);
  }

  async updateCv(id, data, file = null) {
    const existing = await this.getCvById(id);
    if (!existing) {
      throw new Error('CV not found');
    }
    
    const updateData = { ...data };
    
    if (file && file.path) {
      updateData.file_path = file.path;
      updateData.file_size = Math.round(file.size / 1024);
    }
    
    await update('cvs', id, updateData);
    return await this.getCvById(id);
  }

  async deleteCv(id) {
    const existing = await this.getCvById(id);
    if (!existing) {
      throw new Error('CV not found');
    }
    
    await deleteRecord('cvs', id);
    return { message: 'CV deleted successfully' };
  }

  async downloadCv(id) {
    const cv = await this.getCvById(id);
    if (!cv) {
      throw new Error('CV not found');
    }
    
    // Increment download count
    await executeQuery(
      'UPDATE cvs SET downloads = downloads + 1 WHERE id = ?',
      [id]
    );
    
    return {
      filePath: cv.file_path,
      fileName: cv.title,
      cv: cv
    };
  }

  async getCvsPreview(limit = 6, category = null) {
    limit = parseInt(limit) || 6;
    if (limit > 20) limit = 20;
    if (limit < 1) limit = 6;
    
    let whereClause = '';
    const queryParams = [];
    
    if (category) {
      whereClause = 'WHERE cv.category = ?';
      queryParams.push(category);
    }
    
    const query = `
      SELECT 
        cv.id,
        cv.title,
        cv.description,
        cv.category,
        cv.file_path,
        cv.downloads,
        cv.file_size,
        cv.created_at
      FROM cvs cv
      ${whereClause}
      ORDER BY cv.downloads DESC, cv.created_at DESC
      LIMIT ${limit}
    `;
    
    return await executeQuery(query, queryParams);
  }

  async getCategories() {
    const query = `
      SELECT DISTINCT category 
      FROM cvs 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `;
    return await executeQuery(query);
  }
}

export default new CvService();


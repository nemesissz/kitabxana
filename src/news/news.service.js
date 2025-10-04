import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class NewsService {
  async getAllNews() {
    return await executeQuery('SELECT * FROM news ORDER BY created_at DESC');
  }

  async getNewsById(id) {
    return await getOne('SELECT * FROM news WHERE id = ?', [id]);
  }

  async createNews(data, imageFile = null) {
    const { title, content, summary, categoryId, language } = data;
    
    // Validate required fields
    if (!title || !content || !language || !categoryId) {
      throw new Error('Title, content, language, and categoryId are required');
    }
    
    // Validate category exists
    const category = await getOne('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      throw new Error('Category not found');
    }
    
    const newsData = {
      title,
      content,
      language,
      category_id: categoryId
    };
    
    // Only add summary if it's provided and not empty
    if (summary && summary.trim() !== '') {
      newsData.summary = summary;
    }
    
    // Handle image file if provided
    if (imageFile && imageFile.path) {
      newsData.image = imageFile.path;
    }
    
    const newsId = await insert('news', newsData);
    return await this.getNewsById(newsId);
  }

  async updateNews(id, data) {
    const existing = await this.getNewsById(id);
    if (!existing) {
      throw new Error('News not found');
    }
    
    await update('news', id, data);
    return await this.getNewsById(id);
  }

  async deleteNews(id) {
    const existing = await this.getNewsById(id);
    if (!existing) {
      throw new Error('News not found');
    }
    
    await deleteRecord('news', id);
    return { message: 'News deleted successfully' };
  }
}

export default new NewsService();
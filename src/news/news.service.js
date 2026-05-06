import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class NewsService {
  async getAllNews(filters = {}) {
    const { 
      page = 1, 
      limit = 24, 
      language = null, 
      categoryId = null,
      search = null,
      startDate = null,
      endDate = null
    } = filters;

    // Ensure page and limit are integers
    const validPage = parseInt(page) || 1;
    const validLimit = Math.min(Math.max(parseInt(limit) || 24, 1), 100);
    const offset = (validPage - 1) * validLimit;
    
    // Build WHERE clause based on filters
    const conditions = [];
    const queryParams = [];
    
    if (language) {
      conditions.push('n.language = ?');
      queryParams.push(language);
    }
    
    if (categoryId) {
      conditions.push('n.category_id = ?');
      queryParams.push(categoryId);
    }
    
    if (search && search.trim() !== '') {
      conditions.push('(n.title LIKE ? OR n.content LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    // Başlangıç tarihi filtresi
    if (startDate) {
      conditions.push('DATE(n.created_at) >= ?');
      queryParams.push(startDate);
    }
    
    // Bitiş tarihi filtresi
    if (endDate) {
      conditions.push('DATE(n.created_at) <= ?');
      queryParams.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      ${whereClause}
    `;
    const countResult = await getOne(countQuery, queryParams);
    const total = countResult.total;
    
    // Get paginated news with category details
    const newsQuery = `
      SELECT 
        n.*,
        c.id as category_id,
        c.name as category_name,
        c.created_at as category_created_at
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ${validLimit} OFFSET ${offset}
    `;
    
    const news = await executeQuery(newsQuery, queryParams);
    
    return {
      news: news.map(this.formatNewsWithCategory),
      pagination: {
        current_page: validPage,
        per_page: validLimit,
        total: total,
        total_pages: Math.ceil(total / validLimit)
      },
      filters: {
        language,
        categoryId,
        search,
        startDate,
        endDate
      }
    };
  }

  async getNewsById(id) {
    const news = await getOne(`
      SELECT 
        n.*,
        c.id as category_id,
        c.name as category_name,
        c.created_at as category_created_at
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      WHERE n.id = ?
    `, [id]);
    
    return news ? this.formatNewsWithCategory(news) : null;
  }

  formatNewsWithCategory(newsItem) {
    const formattedNews = {
      id: newsItem.id,
      title: newsItem.title,
      content: newsItem.content,
      image: newsItem.image,
      language: newsItem.language,
      created_at: newsItem.created_at,
      updated_at: newsItem.updated_at
    };

    // Add category object if category exists
    if (newsItem.category_id) {
      formattedNews.category = {
        id: newsItem.category_id,
        name: newsItem.category_name,
        created_at: newsItem.category_created_at
      };
    } else {
      formattedNews.category = null;
    }

    return formattedNews;
  }

  async createNews(data, imageFile = null) {
    const { title, content, categoryId, language } = data;
    
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

  async getNewsPreview(limit = 5, language = null) {
    // Ensure limit is integer and within bounds
    limit = parseInt(limit) || 5;
    if (limit > 20) limit = 20;
    if (limit < 1) limit = 5;
    
    // Build WHERE clause for language filter
    let whereClause = '';
    const queryParams = [];
    
    if (language) {
      whereClause = 'WHERE n.language = ?';
      queryParams.push(language);
    }
    
    const query = `
      SELECT 
        n.id,
        n.title,
        n.content,
        n.image,
        n.language,
        n.category_id,
        n.created_at,
        c.name as category_name
      FROM news n
      LEFT JOIN categories c ON n.category_id = c.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ${limit}
    `;
    
    return await executeQuery(query, queryParams);
  }
}

export default new NewsService();
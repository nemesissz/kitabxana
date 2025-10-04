import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';
import fs from 'fs/promises';

class NewsService {
  async getAllNews(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          category: true // Kategori bilgisini de dahil ediyoruz
        }
      }),
      prisma.news.count()
    ]);

    return {
      news,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getNewsById(id) {
    const news = await prisma.news.findUnique({
      where: { id: Number(id) },
      include: {
        category: true
      }
    });

    if (!news) {
      throw new Error('News not found');
    }

    return news;
  }

  async createNews(data, imageFile) {
    const { title, content, language, categoryId } = data;

    // Kateqoriyanın mövcudluğunu yoxlayırıq
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const news = await prisma.news.create({
      data: {
        title,
        content,
        language,
        categoryId: Number(categoryId),
        image: imageFile ? imageFile.path.replace(/\\/g, '/') : null
      }
    });

    return news;
  }

  async updateNews(id, data, imageFile) {
    const { title, content, language, categoryId } = data;

    // Get old news
    const oldNews = await this.getNewsById(id);

    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (language) updates.language = language;
    if (categoryId) updates.categoryId = Number(categoryId);

    // Handle image update
    if (imageFile) {
      // Delete old image if exists
      if (oldNews.image) {
        try {
          await fs.unlink(oldNews.image);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      updates.image = imageFile.path;
    }

    const news = await prisma.news.update({
      where: { id: Number(id) },
      data: updates
    });

    return news;
  }

  async deleteNews(id) {
    const news = await this.getNewsById(id);

    // Delete image if exists
    if (news.image) {
      try {
        await fs.unlink(news.image);
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }

    await prisma.news.delete({
      where: { id: Number(id) }
    });

    return true;
  }
}

export default new NewsService();
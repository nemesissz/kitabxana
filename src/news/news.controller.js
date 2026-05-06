import newsService from './news.service.js';
import upload from '../utils/upload.js'; // Bu dosya news için yanlış, imageUpload.js olmalı

export const getAllNews = async (req, res, next) => {
  try {
    const { page, limit, language, categoryId, search, startDate, endDate } = req.query;
    const result = await newsService.getAllNews({
      page,
      limit,
      language,
      categoryId,
      search,
      startDate,
      endDate
    });

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await newsService.getNewsById(id);

    res.status(200).json({
      status: 'success',
      data: {
        news
      }
    });
  } catch (error) {
    if (error.message === 'News not found') {
      return res.status(404).json({
        status: 'error',
        message: 'News not found'
      });
    }
    next(error);
  }
};

export const createNews = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { title, content, language, categoryId } = body;
    const imageFile = req.file;

    if (!title || !content || !language || !categoryId) {
      return res.status(400).json({
        status: 'error',
        message: 'Bütün məlumatlar tələb olunur (başlıq, məzmun, dil, kateqoriya)'
      });
    }

    // Dil validasiyası
    const allowedLanguages = ['az', 'ru', 'en'];
    if (!allowedLanguages.includes(language)) {
      return res.status(400).json({
        status: 'error',
        message: `Yalnız ${allowedLanguages.join(', ')} dilləri dəstəklənir`
      });
    }

    if (!Number.isInteger(Number(categoryId))) {
      return res.status(400).json({
        status: 'error',
        message: 'Kateqoriya ID-si bir tam ədəd olmalıdır'
      });
    }

    const news = await newsService.createNews({ title, content, language, categoryId }, imageFile);

    res.status(201).json({
      status: 'success',
      data: {
        news
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { title, content, language, categoryId } = body;
    const imageFile = req.file;

    if (!title && !content && !imageFile && !language && !categoryId) {
      return res.status(400).json({
        status: 'error',
        message: 'No updates provided'
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (language) updateData.language = language;
    if (categoryId) updateData.category_id = categoryId;

    const news = await newsService.updateNews(id, updateData, imageFile);

    res.status(200).json({
      status: 'success',
      data: {
        news
      }
    });
  } catch (error) {
    if (error.message === 'News not found') {
      return res.status(404).json({
        status: 'error',
        message: 'News not found'
      });
    }
    next(error);
  }
};

export const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    await newsService.deleteNews(id);

    res.status(200).json({
      status: 'success',
      message: 'News deleted successfully'
    });
  } catch (error) {
    if (error.message === 'News not found') {
      return res.status(404).json({
        status: 'error',
        message: 'News not found'
      });
    }
    next(error);
  }
};

export const getNewsPreview = async (req, res, next) => {
  try {
    const { limit, language } = req.query;
    const news = await newsService.getNewsPreview(limit, language);

    res.status(200).json({
      status: 'success',
      data: {
        news,
        count: news.length
      }
    });
  } catch (error) {
    next(error);
  }
};
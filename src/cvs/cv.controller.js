import cvService from './cv.service.js';
import upload from '../utils/upload.js';

export const createCv = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const { title, category, description } = req.body;

    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required'
      });
    }

    const cv = await cvService.createCv(req.body, file);

    res.status(201).json({
      status: 'success',
      data: { cv }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCvs = async (req, res, next) => {
  try {
    const { page, limit, category, search } = req.query;

    const result = await cvService.getAllCvs({
      page,
      limit,
      category,
      search
    });

    res.status(200).json({
      status: 'success',
      data: {
        cvs: result.cvs,
        pagination: result.pagination,
        filters: result.filters
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCvById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cv = await cvService.getCvById(Number(id));

    if (!cv) {
      return res.status(404).json({
        status: 'error',
        message: 'CV not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { cv }
    });
  } catch (error) {
    if (error.message === 'CV not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const updateCv = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    const cv = await cvService.updateCv(Number(id), req.body, file);

    res.status(200).json({
      status: 'success',
      data: { cv }
    });
  } catch (error) {
    if (error.message === 'CV not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteCv = async (req, res, next) => {
  try {
    const { id } = req.params;
    await cvService.deleteCv(Number(id));

    res.status(200).json({
      status: 'success',
      message: 'CV deleted successfully'
    });
  } catch (error) {
    if (error.message === 'CV not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const downloadCv = async (req, res, next) => {
  try {
    const { id } = req.params;
    const downloadInfo = await cvService.downloadCv(Number(id));

    // Send file for download
    res.download(downloadInfo.filePath, `${downloadInfo.fileName}.docx`);
  } catch (error) {
    if (error.message === 'CV not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getCvsPreview = async (req, res, next) => {
  try {
    const { limit, category } = req.query;
    const cvs = await cvService.getCvsPreview(limit, category);

    res.status(200).json({
      status: 'success',
      data: {
        cvs,
        count: cvs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await cvService.getCategories();

    res.status(200).json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};


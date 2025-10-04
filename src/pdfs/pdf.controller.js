import pdfService from './pdf.service.js';
import upload from '../utils/upload.js';

export const createPdf = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No PDF file uploaded'
      });
    }

    const { title, language, price, categoryId } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required'
      });
    }
    
    if (!price) {
      return res.status(400).json({
        status: 'error',
        message: 'Price is required'
      });
    }

    const pdf = await pdfService.createPdf(req.body, file);

    res.status(201).json({
      status: 'success',
      data: {
        pdf
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPdfs = async (req, res, next) => {
  try {
    const { 
      categoryId, 
      language, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy, 
      sortOrder 
    } = req.query;

    // Validate sortBy field if provided
    const allowedSortFields = ['title', 'price', 'downloads', 'createdAt'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sort field'
      });
    }

    // Validate sortOrder if provided
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        status: 'error',
        message: 'Sort order must be either "asc" or "desc"'
      });
    }

    const pdfs = await pdfService.getAllPdfs({ 
      categoryId, 
      language, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy, 
      sortOrder 
    });

    res.status(200).json({
      status: 'success',
      data: {
        pdfs,
        count: pdfs.length,
        filters: {
          categoryId,
          language,
          search,
          minPrice,
          maxPrice,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPdfById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdf = await pdfService.getPdfById(Number(id));

    res.status(200).json({
      status: 'success',
      data: {
        pdf
      }
    });
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const updatePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdf = await pdfService.updatePdf(Number(id), req.body);

    res.status(200).json({
      status: 'success',
      data: {
        pdf
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pdfService.deletePdf(Number(id));

    res.status(200).json({
      status: 'success',
      message: 'PDF deleted successfully'
    });
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const downloadPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filePath = await pdfService.downloadPdf(Number(id), req.user.id);

    res.download(filePath);
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};
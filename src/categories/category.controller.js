import categoryService from './category.service.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required'
      });
    }

    const category = await categoryService.createCategory({ name });

    res.status(201).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    if (error.message === 'Category already exists') {
      return res.status(400).json({
        status: 'error',
        message: 'Category already exists'
      });
    }
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required'
      });
    }

    const category = await categoryService.updateCategory(id, { name });

    res.status(200).json({
      status: 'success',
      data: {
        category
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    if (error.message === 'Category name already exists') {
      return res.status(400).json({
        status: 'error',
        message: 'Category name already exists'
      });
    }
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);

    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    if (error.message === 'Cannot delete category with existing PDFs') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete category with existing PDFs'
      });
    }
    next(error);
  }
};
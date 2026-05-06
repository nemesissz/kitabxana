import categoryPdfService from './category-pdf.service.js';

class CategoryPdfController {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryPdfService.getAllCategories();
      
      res.status(200).json({
        status: 'success',
        data: {
          categories,
          count: categories.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriesWithPdfCount(req, res, next) {
    try {
      const categories = await categoryPdfService.getCategoriesWithPdfCount();
      
      res.status(200).json({
        status: 'success',
        data: {
          categories,
          count: categories.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      console.log('PDF Category ID requested:', id);
      
      const category = await categoryPdfService.getCategoryById(id);
      console.log('PDF Category found:', category);
      
      if (!category) {
        console.log('PDF Category not found for ID:', id);
        return res.status(404).json({
          status: 'error',
          message: 'PDF Category not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { category }
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await categoryPdfService.createCategory(req.body);
      
      res.status(201).json({
        status: 'success',
        data: { category },
        message: 'PDF Category created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryPdfService.updateCategory(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: { category },
        message: 'PDF Category updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryPdfService.deleteCategory(id);
      
      res.status(200).json({
        status: 'success',
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryPdfController();
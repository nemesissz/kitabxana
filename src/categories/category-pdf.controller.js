import categoryPdfService from './category-pdf.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';

class CategoryPdfController {
  async getAllCategories(req, res, next) {
    try {
      const categories = await categoryPdfService.getAllCategories();
      res.status(200).json({ status: 'success', data: { categories, count: categories.length } });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriesWithPdfCount(req, res, next) {
    try {
      const categories = await categoryPdfService.getCategoriesWithPdfCount();
      res.status(200).json({ status: 'success', data: { categories, count: categories.length } });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryPdfService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ status: 'error', message: 'PDF Category not found' });
      }
      res.status(200).json({ status: 'success', data: { category } });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        const cp = req.user.categoryPermission;
        if (cp === 'none') return res.status(403).json({ status: 'error', message: 'Kategoriya yaratma icazəniz yoxdur.' });
        if (cp !== 'direct') return res.status(403).json({ status: 'error', message: 'Kategoriyaları birbaşa yarada bilməzsiniz. Sorğu göndərin.' });
      }
      const category = await categoryPdfService.createCategory(req.body);
      res.status(201).json({ status: 'success', data: { category }, message: 'PDF Category created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        const cp = req.user.categoryPermission;
        if (cp !== 'direct') return res.status(403).json({ status: 'error', message: 'Kategoriyaları redaktə etmə icazəniz yoxdur.' });
      }
      const { id } = req.params;
      const category = await categoryPdfService.updateCategory(id, req.body);
      res.status(200).json({ status: 'success', data: { category }, message: 'PDF Category updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        return res.status(403).json({
          status: 'error',
          message: 'Kategoriyaları silmək icazəniz yoxdur.',
        });
      }
      const { id } = req.params;
      const result = await categoryPdfService.deleteCategory(id);
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      if (error.message === 'PDF Category not found') {
        return res.status(404).json({ status: 'error', message: 'Kateqoriya tapılmadı' });
      }
      if (error.message === 'Cannot delete PDF category that is in use by PDFs') {
        return res.status(400).json({
          status: 'error',
          message: 'Bu kateqoriyaya bağlı PDF-lər var. Əvvəlcə həmin PDF-ləri silin və ya başqa kateqoriyaya köçürün.',
        });
      }
      next(error);
    }
  }

  // --- Request handlers ---

  async submitRequest(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type !== 'institution') {
        return res.status(403).json({
          status: 'error',
          message: 'Global adminlər kategoriyaları birbaşa idarə edə bilər.',
        });
      }
      if (req.user.categoryPermission === 'none') {
        return res.status(403).json({ status: 'error', message: 'Kategoriya yaratma icazəniz yoxdur.' });
      }
      const request = await categoryPdfService.submitRequest(
        req.body,
        req.user.id,
        scope.institutionId
      );
      res.status(201).json({ status: 'success', data: { request }, message: 'Request submitted' });
    } catch (error) {
      next(error);
    }
  }

  async getRequests(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      let requests;
      if (scope.type === 'global') {
        // Global admin: see all pending requests from all institutions
        requests = await categoryPdfService.getRequests({ status: 'pending' });
      } else {
        // Institution-scoped admin: see own requests with all statuses
        requests = await categoryPdfService.getRequests({
          institutionId: scope.institutionId,
          status: 'all',
        });
      }
      res.status(200).json({ status: 'success', data: { requests } });
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        return res.status(403).json({
          status: 'error',
          message: 'Sorğuları yalnız global adminlər təsdiqləyə bilər.',
        });
      }
      const { id } = req.params;
      const result = await categoryPdfService.approveRequest(id, req.user.id);
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      if (error.message === 'Request not found') {
        return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
      }
      if (error.message === 'Request already processed') {
        return res.status(400).json({ status: 'error', message: 'Sorğu artıq işlənib' });
      }
      next(error);
    }
  }

  async rejectRequest(req, res, next) {
    try {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        return res.status(403).json({
          status: 'error',
          message: 'Sorğuları yalnız global adminlər rədd edə bilər.',
        });
      }
      const { id } = req.params;
      const result = await categoryPdfService.rejectRequest(id, req.user.id);
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      if (error.message === 'Request not found') {
        return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
      }
      if (error.message === 'Request already processed') {
        return res.status(400).json({ status: 'error', message: 'Sorğu artıq işlənib' });
      }
      next(error);
    }
  }
}

export default new CategoryPdfController();

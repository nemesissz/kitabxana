import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class PdfService {
  async getAllPdfs() {
    return await executeQuery('SELECT * FROM pdfs ORDER BY created_at DESC');
  }

  async getPdfById(id) {
    return await getOne('SELECT * FROM pdfs WHERE id = ?', [id]);
  }

  async createPdf(data, file = null) {
    const { title, description, categoryId, price } = data;
    
    // Validate required fields
    if (!title) {
      throw new Error('Title is required');
    }
    
    if (!file || !file.path) {
      throw new Error('PDF file is required');
    }
    
    const pdfData = {
      title,
      file_path: file.path,
      price: price || 0,
      downloads: 0
    };
    
    // Only add optional fields if they have values
    if (description !== undefined && description !== '') {
      pdfData.description = description;
    }
    
    if (categoryId !== undefined && categoryId !== '' && categoryId !== '0') {
      pdfData.category_id = categoryId;
    }
    
    const pdfId = await insert('pdfs', pdfData);
    return await this.getPdfById(pdfId);
  }

  async updatePdf(id, data) {
    const existing = await this.getPdfById(id);
    if (!existing) {
      throw new Error('PDF not found');
    }
    
    await update('pdfs', id, data);
    return await this.getPdfById(id);
  }

  async deletePdf(id) {
    const existing = await this.getPdfById(id);
    if (!existing) {
      throw new Error('PDF not found');
    }
    
    await deleteRecord('pdfs', id);
    return { message: 'PDF deleted successfully' };
  }

  async checkPdfAccess(userId, pdfId) {
    // Check if user has an active subscription or has purchased this specific PDF
    const subscription = await getOne(
      'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active" AND end_date > NOW()',
      [userId]
    );

    if (subscription) {
      return true; // User has active subscription
    }

    // Check if user has purchased this specific PDF
    const payment = await getOne(
      'SELECT * FROM payments WHERE user_id = ? AND type = "single-pdf" AND status = "success"',
      [userId]
    );

    if (payment) {
      return true; // User has purchased this PDF
    }

    return false; // No access
  }

  async downloadPdf(pdfId, userId) {
    // Get PDF details
    const pdf = await this.getPdfById(pdfId);
    if (!pdf) {
      throw new Error('PDF not found');
    }

    // Check if user has access (implement your access logic here)
    const hasAccess = await this.checkPdfAccess(userId, pdfId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Increment download count
    await executeQuery(
      'UPDATE pdfs SET downloads = downloads + 1 WHERE id = ?',
      [pdfId]
    );

    // Return file path for download
    return pdf.file_path;
  }
}

export default new PdfService();
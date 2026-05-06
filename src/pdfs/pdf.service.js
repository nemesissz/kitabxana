import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class PdfService {
  async getAllPdfs(filters = {}) {
    const { 
      page = 1, 
      limit = 24, 
      language = null, 
      categoryId = null,
      search = null,
      minPrice = null,
      maxPrice = null,
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
      conditions.push('p.language = ?');
      queryParams.push(language);
    }
    
    if (categoryId) {
      conditions.push('p.category_id = ?');
      queryParams.push(categoryId);
    }
    
    // Arama filtresi - başlık ve açıklama alanlarında arama yapar
    if (search && search.trim() !== '') {
      conditions.push('(p.title LIKE ? OR p.description LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    // Minimum fiyat filtresi
    if (minPrice !== null && minPrice !== undefined && minPrice !== '') {
      conditions.push('p.price >= ?');
      queryParams.push(parseFloat(minPrice));
    }
    
    // Maximum fiyat filtresi
    if (maxPrice !== null && maxPrice !== undefined && maxPrice !== '') {
      conditions.push('p.price <= ?');
      queryParams.push(parseFloat(maxPrice));
    }
    
    // Başlangıç tarihi filtresi
    if (startDate) {
      conditions.push('DATE(p.created_at) >= ?');
      queryParams.push(startDate);
    }
    
    // Bitiş tarihi filtresi
    if (endDate) {
      conditions.push('DATE(p.created_at) <= ?');
      queryParams.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pdfs p
      ${whereClause}
    `;
    const countResult = await getOne(countQuery, queryParams);
    const total = countResult.total;
    
    // Get paginated PDFs with category details
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.language,
        p.file_path,
        p.cover_image_path AS image_path,
        p.price,
        p.downloads,
        p.category_id,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${validLimit} OFFSET ${offset}
    `;
    
    const pdfs = await executeQuery(query, queryParams);
    
    return {
      pdfs,
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
        minPrice,
        maxPrice,
        startDate,
        endDate
      }
    };
  }

  async getPdfById(id) {
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.language,
        p.file_path,
        p.cover_image_path AS image_path,
        p.cover_image_path,
        p.content_images_paths,
        p.price,
        p.downloads,
        p.category_id,
        p.created_at,
        p.updated_at,
        c.name as category_name
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const pdf = await getOne(query, [id]);
    // content_images_paths JSON string ise parse et
    if (pdf && pdf.content_images_paths) {
      try {
        pdf.content_images_paths = JSON.parse(pdf.content_images_paths);
      } catch (e) {
        pdf.content_images_paths = [];
      }
    }
    return pdf;
  }

  async createPdf(data, file = null, coverImage = null, contentImages = []) {
    const { title, description, language, categoryId, price, pdfDate } = data;
    
    // Validate required fields
    if (!title) {
      throw new Error('Title is required');
    }
    
    if (!file || !file.path) {
      throw new Error('PDF file is required');
    }
    
    // Validate category exists if provided
    if (categoryId !== undefined && categoryId !== '' && categoryId !== '0') {
      const categoryExists = await getOne(
        'SELECT id FROM category_pdfs WHERE id = ?',
        [categoryId]
      );
      if (!categoryExists) {
        throw new Error(`Category with ID ${categoryId} not found in PDF categories`);
      }
    }
    
    // Validate language if provided
    if (language !== undefined && language !== '') {
      const allowedLanguages = ['az', 'ru', 'az-ru'];
      if (!allowedLanguages.includes(language)) {
        throw new Error(`Invalid language. Allowed values: ${allowedLanguages.join(', ')}`);
      }
    }
    
    const pdfData = {
      title,
      file_path: file.path,
      price: price || 0,
      downloads: 0
    };
    
    // pdfDate varsa created_at olarak kullan
    if (pdfDate) {
      // Tarihi MySQL formatına çevir (YYYY-MM-DD HH:MM:SS)
      // pdfDate YYYY-MM-DD formatında geliyor, bunu YYYY-MM-DD 00:00:00 formatına çevir
      const formattedDate = `${pdfDate} 00:00:00`;
      pdfData.created_at = formattedDate;
    }
    
    // Qapaq sekli
    if (coverImage && coverImage.path) {
      pdfData.cover_image_path = coverImage.path;
    }
    
    // Mündericat sekilleri (JSON array olarak kaydet)
    // Sütunun varlığını kontrol et, yoksa ekleme
    if (contentImages && contentImages.length > 0) {
      try {
        // Sütunun varlığını kontrol et
        const columnExists = await getOne(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'pdfs' 
             AND COLUMN_NAME = 'content_images_paths'`
        );
        
        if (columnExists) {
          const contentImagePaths = contentImages.map(img => img.path);
          pdfData.content_images_paths = JSON.stringify(contentImagePaths);
        } else {
          console.warn('⚠️ content_images_paths sütunu yoxdur. SQL scriptini çalıştırın: database/add-content-images-column.sql');
        }
      } catch (error) {
        console.warn('⚠️ content_images_paths sütunu yoxlanarkən xəta:', error.message);
        // Sütun yoksa devam et, hata verme
      }
    }
    
    // Only add optional fields if they have values
    if (description !== undefined && description !== '') {
      pdfData.description = description;
    }
    
    if (language !== undefined && language !== '') {
      pdfData.language = language;
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
    
    // Validate category exists if being updated
    if (data.category_id !== undefined && data.category_id !== '' && data.category_id !== '0') {
      const categoryExists = await getOne(
        'SELECT id FROM category_pdfs WHERE id = ?',
        [data.category_id]
      );
      if (!categoryExists) {
        throw new Error(`Category with ID ${data.category_id} not found in PDF categories`);
      }
    }
    
    // Validate language if being updated
    if (data.language !== undefined && data.language !== '') {
      const allowedLanguages = ['az', 'ru', 'az-ru'];
      if (!allowedLanguages.includes(data.language)) {
        throw new Error(`Invalid language. Allowed values: ${allowedLanguages.join(', ')}`);
      }
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

  /**
   * PDF-ə giriş imkanını yoxlayır
   * İstifadəçi ya aktiv subscription-a malik olmalıdır ya da konkret PDF-i alıb
   */
  async checkPdfAccess(userId, pdfId) {
    try {
      // 1. Aktiv subscription yoxla
      const subscription = await getOne(`
        SELECT s.* 
        FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ? 
        AND s.status = 'active' 
        AND s.end_date > NOW()
        AND s.plan != 'none'
        ORDER BY s.end_date DESC
        LIMIT 1
      `, [userId]);

      if (subscription) {
        console.log('✅ User has active subscription:', subscription.plan);
        return {
          hasAccess: true,
          accessType: 'subscription',
          subscription: subscription
        };
      }

      // 2. Bu konkret PDF-in alındığını yoxla
      const payment = await getOne(`
        SELECT p.* 
        FROM payments p
        WHERE p.user_id = ? 
        AND p.pdf_id = ?
        AND p.type = 'single-pdf' 
        AND p.status = 'success'
        ORDER BY p.created_at DESC
        LIMIT 1
      `, [userId, pdfId]);

      if (payment) {
        console.log('✅ User purchased this PDF:', pdfId);
        return {
          hasAccess: true,
          accessType: 'single-purchase',
          payment: payment
        };
      }

      console.log('❌ User has no access to PDF:', pdfId);
      return {
        hasAccess: false,
        accessType: null,
        message: 'PDF-ə giriş üçün abunə olun və ya PDF-i alın'
      };

    } catch (error) {
      console.error('Error checking PDF access:', error);
      throw error;
    }
  }

  /**
   * İstifadəçinin bütün girişi olan PDF-ləri qaytarır
   */
  async getUserAccessiblePdfs(userId) {
    try {
      // Aktiv subscription varsa, bütün PDF-lər
      const subscription = await getOne(`
        SELECT s.* 
        FROM subscriptions s
        JOIN user_subscriptions us ON s.id = us.subscription_id
        WHERE us.user_id = ? 
        AND s.status = 'active' 
        AND s.end_date > NOW()
        AND s.plan != 'none'
        ORDER BY s.end_date DESC
        LIMIT 1
      `, [userId]);

      if (subscription) {
        // Bütün PDF-lər
        const allPdfs = await executeQuery(`
          SELECT 
            p.id,
            p.title,
            p.description,
            p.language,
            p.cover_image_path AS image_path,
            p.price,
            p.downloads,
            p.category_id,
            c.name as category_name,
            p.created_at,
            'subscription' as access_type
          FROM pdfs p
          LEFT JOIN category_pdfs c ON p.category_id = c.id
          ORDER BY p.created_at DESC
        `);

        return {
          accessType: 'subscription',
          subscription: subscription,
          pdfs: allPdfs
        };
      }

      // Subscription yoxdursa, yalnız alınmış PDF-lər
      const purchasedPdfs = await executeQuery(`
        SELECT 
          p.id,
          p.title,
          p.description,
          p.language,
          p.cover_image_path AS image_path,
          p.price,
          p.downloads,
          p.category_id,
          c.name as category_name,
          p.created_at,
          'single-purchase' as access_type,
          pay.created_at as purchased_at
        FROM payments pay
        JOIN pdfs p ON pay.pdf_id = p.id
        LEFT JOIN category_pdfs c ON p.category_id = c.id
        WHERE pay.user_id = ?
        AND pay.type = 'single-pdf'
        AND pay.status = 'success'
        ORDER BY pay.created_at DESC
      `, [userId]);

      return {
        accessType: 'single-purchase',
        subscription: null,
        pdfs: purchasedPdfs
      };

    } catch (error) {
      console.error('Error getting accessible PDFs:', error);
      throw error;
    }
  }

  async downloadPdf(pdfId, userId) {
    // Get PDF details
    const pdf = await this.getPdfById(pdfId);
    if (!pdf) {
      throw new Error('PDF not found');
    }

    // Check if user has access
    const accessCheck = await this.checkPdfAccess(userId, pdfId);
    if (!accessCheck.hasAccess) {
      const error = new Error(accessCheck.message || 'PDF-ə giriş rədd edildi');
      error.code = 'ACCESS_DENIED';
      error.requiresPayment = true;
      error.pdfPrice = pdf.price;
      throw error;
    }

    console.log(`✅ User ${userId} downloading PDF ${pdfId} via ${accessCheck.accessType}`);

    // Increment download count
    await executeQuery(
      'UPDATE pdfs SET downloads = downloads + 1 WHERE id = ?',
      [pdfId]
    );

    // Return file path for download
    return {
      filePath: pdf.file_path,
      fileName: pdf.title,
      accessType: accessCheck.accessType,
      pdf: pdf
    };
  }

  async getPdfsPreview(limit = 5, categoryId = null) {
    // Ensure limit is integer and within bounds
    limit = parseInt(limit) || 5;
    if (limit > 20) limit = 20;
    if (limit < 1) limit = 5;
    
    // Build WHERE clause for category filter
    let whereClause = '';
    const queryParams = [];
    
    if (categoryId) {
      whereClause = 'WHERE p.category_id = ?';
      queryParams.push(categoryId);
    }
    
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.language,
        p.file_path,
        p.cover_image_path AS image_path,
        p.price,
        p.downloads,
        p.category_id,
        p.created_at,
        c.name as category_name
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;
    
    return await executeQuery(query, queryParams);
  }
}

export default new PdfService();
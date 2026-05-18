import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';
import activityLog from '../activity-logs/activity-log.service.js';
import settingsService from '../settings/settings.service.js';

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
      endDate = null,
      status = null,
      uploadedBy = null,
      uploaderInstitutionId = null
    } = filters;

    // Ensure page and limit are integers
    const validPage = parseInt(page) || 1;
    const validLimit = Math.min(Math.max(parseInt(limit) || 24, 1), 100);
    const offset = (validPage - 1) * validLimit;
    
    // Build WHERE clause based on filters
    const conditions = [];
    const queryParams = [];
    
    if (language) {
      conditions.push('l.code = ?');
      queryParams.push(language);
    }
    
    if (categoryId) {
      conditions.push('p.category_id = ?');
      queryParams.push(categoryId);
    }
    
    if (search && search.trim() !== '') {
      conditions.push('(p.title LIKE ? OR p.description LIKE ? OR p.table_of_contents LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
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
    
    if (endDate) {
      conditions.push('DATE(p.created_at) <= ?');
      queryParams.push(endDate);
    }

    if (status && ['pending', 'approved'].includes(status)) {
      conditions.push('p.status = ?');
      queryParams.push(status);
    }

    if (uploadedBy) {
      conditions.push('p.uploaded_by = ?');
      queryParams.push(uploadedBy);
    }

    if (uploaderInstitutionId) {
      conditions.push('p.uploaded_by IN (SELECT id FROM users WHERE institution_id = ?)');
      queryParams.push(uploaderInstitutionId);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM pdfs p
      LEFT JOIN languages l ON p.language_id = l.id
      ${whereClause}
    `;
    const countResult = await getOne(countQuery, queryParams);
    const total = countResult.total;

    const downloadsResult = await getOne(
      `SELECT COALESCE(SUM(downloads), 0) AS totalDownloads FROM pdfs p ${whereClause}`,
      queryParams
    );

    // Get paginated PDFs with category details
    const query = `
      SELECT
        p.id, p.title, p.description,
        l.code AS language, l.name AS language_name, l.flag AS language_flag,
        p.file_path, p.cover_image_path AS image_path,
        p.price, p.downloads, p.category_id,
        p.order_number, p.author, p.isbn, p.status,
        p.publication_year, p.publisher_location, p.allow_download,
        p.uploaded_by, p.created_at, p.updated_at,
        p.institution_id,
        c.name as category_name,
        u.email as uploader_email
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      LEFT JOIN languages l ON p.language_id = l.id
      LEFT JOIN users u ON p.uploaded_by = u.id
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
        total_pages: Math.ceil(total / validLimit),
        totalDownloads: Number(downloadsResult.totalDownloads) || 0
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

  async getLanguageId(code) {
    if (!code) return null;
    const lang = await getOne('SELECT id FROM languages WHERE code = ?', [code]);
    return lang?.id || null;
  }

  async getPdfById(id) {
    const query = `
      SELECT
        p.id,
        p.title,
        p.description,
        p.table_of_contents,
        l.code AS language,
        l.name AS language_name,
        l.flag AS language_flag,
        p.file_path,
        p.cover_image_path AS image_path,
        p.cover_image_path,
        p.content_images_paths,
        p.price,
        p.downloads,
        p.category_id,
        p.author,
        p.isbn,
        p.order_number,
        p.publication_year,
        p.publisher_location,
        p.allow_download,
        p.foreword,
        p.uploaded_by,
        p.status,
        p.created_at,
        p.updated_at,
        p.institution_id,
        c.name as category_name,
        inst.name as institution_name
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      LEFT JOIN languages l ON p.language_id = l.id
      LEFT JOIN institutions inst ON p.institution_id = inst.id
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
      const langRow = await getOne('SELECT id FROM languages WHERE code = ?', [language]);
      if (!langRow) {
        throw new Error(`Invalid language code: ${language}`);
      }
    }
    
    const pdfData = {
      title,
      file_path: file?.path || null,
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
      pdfData.language_id = await this.getLanguageId(language);
    }

    if (categoryId !== undefined && categoryId !== '' && categoryId !== '0') {
      pdfData.category_id = categoryId;
    }

    // Book-specific and other optional text fields
    const optionalFields = [
      'author', 'isbn', 'publication_year', 'publisher_location',
      'table_of_contents', 'order_number', 'allow_download',
      'uploaded_by', 'foreword', 'institution_id',
    ];
    for (const field of optionalFields) {
      if (data[field] !== undefined && data[field] !== '') {
        pdfData[field] = data[field];
      }
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
    
    // language code → language_id dönüşümü
    if (data.language !== undefined && data.language !== '') {
      const langRow = await getOne('SELECT id FROM languages WHERE code = ?', [data.language]);
      if (!langRow) throw new Error(`Invalid language code: ${data.language}`);
      data.language_id = langRow.id;
      delete data.language;
    }

    await update('pdfs', id, data);
    return await this.getPdfById(id);
  }

  async deletePdf(id, adminEmail = null) {
    const existing = await this.getPdfById(id);
    if (!existing) {
      throw new Error('PDF not found');
    }

    let delUploaderInstId = null;
    if (existing.uploaded_by) {
      const uploader = await getOne('SELECT institution_id FROM users WHERE id = ?', [existing.uploaded_by]);
      delUploaderInstId = uploader?.institution_id || null;
    }

    await activityLog.log({
      eventType: 'pdf_deleted',
      actorEmail: adminEmail,
      targetType: 'pdf',
      targetId: id,
      details: {
        title: existing.title,
        category_name: existing.category_name || null,
        language: existing.language || null,
        order_number: existing.order_number || null,
        author: existing.author || null,
        uploaded_by: existing.uploaded_by || null,
        uploader_institution_id: delUploaderInstId,
      },
    });

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
            l.code AS language, l.name AS language_name, l.flag AS language_flag,
            p.cover_image_path AS image_path,
            p.price,
            p.downloads,
            p.category_id,
            c.name as category_name,
            p.created_at,
            'subscription' as access_type
          FROM pdfs p
          LEFT JOIN category_pdfs c ON p.category_id = c.id
          LEFT JOIN languages l ON p.language_id = l.id
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
          l.code AS language, l.name AS language_name, l.flag AS language_flag,
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
        LEFT JOIN languages l ON p.language_id = l.id
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
    const pdf = await this.getPdfById(pdfId);
    if (!pdf) {
      throw new Error('PDF not found');
    }

    // Increment download count
    await executeQuery(
      'UPDATE pdfs SET downloads = downloads + 1 WHERE id = ?',
      [pdfId]
    );

    return {
      filePath: pdf.file_path,
      fileName: pdf.title,
      pdf: pdf
    };
  }

  async submitPdf(data, file, coverImage = null) {
    const { title, description, table_of_contents, order_number, author, isbn, language, category_id,
            publication_year, publisher_location, price, allow_download, uploaded_by, foreword, institution_id } = data;

    if (!title || !title.trim()) throw new Error('PDF adı tələb olunur');

    let userPermission = 'pending';

    if (uploaded_by) {
      const user = await getOne(
        `SELECT upload_permission, institution_id, role FROM users WHERE id = ?`,
        [uploaded_by]
      );
      if (!user || user.upload_permission === 'none') {
        throw new Error('PDF yükləmə icazəniz yoxdur');
      }
      userPermission = user.upload_permission;

      if (file) {
        const limitMb = await settingsService.getEffectiveLimitForUser(uploaded_by);
        const fileSizeMb = file.size / (1024 * 1024);
        if (fileSizeMb > limitMb) {
          const err = new Error(`Fayl ölçüsü limitdən böyükdür. Sizin limitiniz: ${limitMb} MB`);
          err.statusCode = 413;
          throw err;
        }
      }

      // Müəssisəsiz töhfəçilər (role=1) üçün günlük say limiti yoxla
      if (!user.institution_id && user.role === 1) {
        const dailyLimit = await settingsService.getDailyCountLimit();
        if (dailyLimit > 0) {
          const todayCount = await getOne(
            `SELECT COUNT(*) AS count FROM pdfs WHERE uploaded_by = ? AND DATE(created_at) = CURDATE()`,
            [uploaded_by]
          );
          if (todayCount.count >= dailyLimit) {
            const err = new Error(`Günlük yükləmə limitinizə çatdınız (${dailyLimit} PDF/gün). Sabah yenidən cəhd edin.`);
            err.statusCode = 429;
            throw err;
          }
        }
      }
    }

    const pdfData = {
      title: title.trim(),
      file_path: file?.path || null,
      price: price !== undefined && price !== '' ? parseFloat(price) || 0 : 0,
      downloads: 0,
      allow_download: allow_download === '0' || allow_download === 0 ? 0 : 1,
      language_id: await this.getLanguageId(language) || await this.getLanguageId('az'),
      status: userPermission === 'free' ? 'approved' : 'pending'
    };

    if (description && description.trim()) pdfData.description = description.trim();
    if (table_of_contents && table_of_contents.trim()) pdfData.table_of_contents = table_of_contents.trim();
    if (order_number && order_number.trim()) pdfData.order_number = order_number.trim();
    if (author && author.trim()) pdfData.author = author.trim();
    if (isbn && isbn.trim()) pdfData.isbn = isbn.trim();
    if (publication_year) pdfData.publication_year = parseInt(publication_year) || null;
    if (publisher_location && publisher_location.trim()) pdfData.publisher_location = publisher_location.trim();
    if (foreword && foreword.trim()) pdfData.foreword = foreword.trim();
    if (category_id) pdfData.category_id = category_id;
    if (uploaded_by) pdfData.uploaded_by = uploaded_by;
    if (institution_id) pdfData.institution_id = institution_id;
    if (coverImage && coverImage.path) pdfData.cover_image_path = coverImage.path;

    const pdfId = await insert('pdfs', pdfData);
    const created = await this.getPdfById(pdfId);

    // PDF yükləmə hadisəsini qeyd et
    if (uploaded_by) {
      const uploader = await getOne('SELECT email FROM users WHERE id = ?', [uploaded_by]);
      await activityLog.log({
        eventType: 'pdf_uploaded',
        actorEmail: uploader?.email || null,
        targetType: 'pdf',
        targetId: pdfId,
        details: { title: created.title, status: pdfData.status },
      });
    }

    return created;
  }

  async approvePdf(id, adminEmail = null) {
    const existing = await this.getPdfById(id);
    if (!existing) throw new Error('PDF not found');
    let approveUploaderInstId = null;
    if (existing.uploaded_by) {
      const uploader = await getOne('SELECT institution_id FROM users WHERE id = ?', [existing.uploaded_by]);
      approveUploaderInstId = uploader?.institution_id || null;
    }
    await update('pdfs', id, { status: 'approved' });
    await activityLog.log({
      eventType: 'pdf_approved',
      actorEmail: adminEmail,
      targetType: 'pdf',
      targetId: id,
      details: { title: existing.title, uploaded_by: existing.uploaded_by, uploader_institution_id: approveUploaderInstId },
    });
    return await this.getPdfById(id);
  }

  async rejectPdf(id, adminEmail = null) {
    const existing = await this.getPdfById(id);
    if (!existing) throw new Error('PDF not found');

    let uploaderInstitutionId = null;
    if (existing.uploaded_by) {
      const uploader = await getOne('SELECT institution_id FROM users WHERE id = ?', [existing.uploaded_by]);
      uploaderInstitutionId = uploader?.institution_id || null;
    }

    await activityLog.log({
      eventType: 'pdf_rejected',
      actorEmail: adminEmail,
      targetType: 'pdf',
      targetId: id,
      details: { title: existing.title, uploaded_by: existing.uploaded_by, uploader_institution_id: uploaderInstitutionId },
    });
    await deleteRecord('pdfs', id);
    return { message: 'PDF rejected and deleted' };
  }

  // FULLTEXT axtarış (30,000+ PDF üçün)
  async searchPdfs(searchTerm, page = 1, limit = 24) {
    const validPage = parseInt(page) || 1;
    const validLimit = Math.min(Math.max(parseInt(limit) || 24, 1), 100);
    const offset = (validPage - 1) * validLimit;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return this.getAllPdfs({ page, limit });
    }

    const term = searchTerm.trim();

    const countResult = await getOne(`
      SELECT COUNT(*) as total FROM pdfs p
      WHERE MATCH(p.title, p.description, p.order_number, p.table_of_contents) AGAINST (? IN BOOLEAN MODE)
    `, [`${term}*`]);

    const pdfs = await executeQuery(`
      SELECT p.id, p.title, p.description, p.order_number,
             l.code AS language, l.name AS language_name, l.flag AS language_flag,
             p.file_path, p.cover_image_path AS image_path, p.price,
             p.downloads, p.category_id, p.uploaded_by, p.created_at, p.updated_at,
             c.name as category_name,
             MATCH(p.title, p.description, p.order_number, p.table_of_contents) AGAINST (? IN BOOLEAN MODE) AS relevance
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      LEFT JOIN languages l ON p.language_id = l.id
      WHERE MATCH(p.title, p.description, p.order_number, p.table_of_contents) AGAINST (? IN BOOLEAN MODE)
      ORDER BY relevance DESC
      LIMIT ${validLimit} OFFSET ${offset}
    `, [`${term}*`, `${term}*`]);

    return {
      pdfs,
      pagination: {
        current_page: validPage,
        per_page: validLimit,
        total: countResult.total,
        total_pages: Math.ceil(countResult.total / validLimit)
      }
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
        l.code AS language, l.name AS language_name, l.flag AS language_flag,
        p.file_path,
        p.cover_image_path AS image_path,
        p.price,
        p.downloads,
        p.category_id,
        p.created_at,
        c.name as category_name
      FROM pdfs p
      LEFT JOIN category_pdfs c ON p.category_id = c.id
      LEFT JOIN languages l ON p.language_id = l.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;
    
    return await executeQuery(query, queryParams);
  }
}

export default new PdfService();
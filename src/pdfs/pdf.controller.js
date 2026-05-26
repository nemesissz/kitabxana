import pdfService from './pdf.service.js';
import upload from '../utils/upload.js';
import emailService from '../utils/email.js';
import { executeQuery, getOne, insert } from '../config/database.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';
import activityLog from '../activity-logs/activity-log.service.js';

function workerCanEditPdfType(workerType, pdfTypeName) {
  if (!workerType) return true;
  const name = (pdfTypeName || '').toLowerCase();
  if (name.includes('ikisi')) return false;
  if (workerType === 'elektron') return name.includes('elektron');
  if (workerType === 'fiziki') return name.includes('fiziki');
  return false;
}

// Helper: server fayl yolunu web yoluna çevir
const toWebPath = (p) => {
  if (!p) return null;
  
  let result = p;
  
  // Windows path'leri handle et (C:\Users\...\uploads\images\...)
  if (result.includes('uploads')) {
    // Windows path'den uploads klasörünü bul
    const uploadsIndex = result.indexOf('uploads');
    if (uploadsIndex !== -1) {
      result = result.substring(uploadsIndex);
      // Windows backslash'leri forward slash'e çevir
      result = result.replace(/\\/g, '/');
    }
  } else {
    // Linux path'leri handle et (/home/muhasibatjurnal/backend-mmu/uploads/...)
    result = result.replace('/home/muhasibatjurnal/backend-mmu', '');
    result = result.replace(/\\/g, '/');
  }
  
  // Path'in / ile başlamasını sağla
  if (!result.startsWith('/')) {
    result = '/' + result;
  }
  
  return result;
};

// Helper: .edu və .edu.az email yoxlaması və indirim hesablaması
const calculatePriceWithDiscount = (price, userEmail) => {
  if (!userEmail || !price) return { originalPrice: price, discountedPrice: price, hasDiscount: false, discountPercent: 0 };
  
  const emailLower = userEmail.toLowerCase();
  const isEduEmail = emailLower.endsWith('.edu') || emailLower.endsWith('.edu.az');
  
  if (isEduEmail) {
    const discountedPrice = price * 0.5; // %50 endirim
    return {
      originalPrice: price,
      discountedPrice: discountedPrice,
      hasDiscount: true,
      discountPercent: 50
    };
  }
  
  return { originalPrice: price, discountedPrice: price, hasDiscount: false, discountPercent: 0 };
};

export const createPdf = async (req, res, next) => {
  try {
    // Only superadmin, main institution manager, and main institution worker can directly create PDFs
    const { role, institutionId, workerType } = req.user;
    if (role < 4 && institutionId) {
      const callerInst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [institutionId]);
      if (!callerInst?.is_main) {
        return res.status(403).json({
          status: 'error',
          message: 'Birbaşa PDF əlavə etmə icazəniz yoxdur. Sorğu göndərməlisiniz.'
        });
      }
    }

    if (role === 2 && workerType) {
      const typeId = req.body.pdf_type_id;
      if (typeId) {
        const pdfType = await getOne('SELECT name FROM pdfs_types WHERE id = ?', [typeId]);
        if (!workerCanEditPdfType(workerType, pdfType?.name)) {
          return res.status(403).json({ status: 'error', message: 'Bu tipli PDF-ə əməliyyat etmək icazəniz yoxdur' });
        }
      }
    }

    const file = req.files?.file?.[0];
    const coverImage = req.files?.coverImage?.[0] || null;
    const contentImages = req.files?.contentImages || [];

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No PDF file uploaded'
      });
    }

    const { title, language, price, categoryId, pdfDate } = req.body;

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

    // pdfDate varsa req.body'ye ekle
    const pdfData = { ...req.body };
    if (pdfDate) {
      pdfData.pdfDate = pdfDate;
    }
    
    const pdf = await pdfService.createPdf(pdfData, file, coverImage, contentImages);

    // Debug: PDF response kontrolü
    console.log('📄 PDF oluşturuldu:', {
      pdfId: pdf.id,
      imagePath: pdf.image_path,
      coverImagePath: pdf.cover_image_path
    });

    // Transform data to include category object and format paths
    const transformedPdf = {
      id: pdf.id,
      title: pdf.title,
      description: pdf.description,
      language: pdf.language,
      file_path: toWebPath(pdf.file_path),
      image_path: toWebPath(pdf.cover_image_path || pdf.image_path),
      cover_image_path: toWebPath(pdf.cover_image_path),
      content_images_paths: pdf.content_images_paths ? pdf.content_images_paths.map(path => toWebPath(path)) : [],
      price: pdf.price,
      downloads: pdf.downloads,
      created_at: pdf.created_at,
      updated_at: pdf.updated_at,
      category: pdf.category_id ? {
        id: pdf.category_id,
        name: pdf.category_name
      } : null
    };

    // Debug: Transform edilmiş PDF
    console.log('🔄 Transform edilmiş PDF:', {
      image_path: transformedPdf.image_path,
      originalImagePath: pdf.image_path
    });

    // Tüm kullanıcılara email gönder (async - blocking etmez)
    (async () => {
      try {
        // Tüm kullanıcıların email'lerini al
        const users = await executeQuery('SELECT login FROM users WHERE login IS NOT NULL AND login != ""');
        
        if (users && users.length > 0) {
          console.log(`📧 ${users.length} istifadəçiyə yeni PDF bildirimi göndərilir...`);
          
          const pdfDetails = {
            id: pdf.id,
            title: pdf.title,
            description: pdf.description || null,
            price: pdf.price,
            category: pdf.category_name || null,
            language: pdf.language || null
          };
          
          // Her kullanıcıya email gönder (paralel)
          const emailPromises = users.map(async (user) => {
            try {
              await emailService.sendNewPdfNotification(user.email, pdfDetails);
              console.log(`✅ Email göndərildi: ${user.email}`);
            } catch (error) {
              console.error(`❌ Email göndərilmədi (${user.email}):`, error.message);
            }
          });
          
          // Tüm email'lerin gönderilmesini bekle
          await Promise.allSettled(emailPromises);
          console.log(`✅ Bütün email'lər göndərilməyə çalışıldı`);
        } else {
          console.log('⚠️ Göndəriləcək istifadəçi tapılmadı');
        }
      } catch (error) {
        console.error('❌ Email göndərmə xətası:', error.message);
        // Email xətası PDF yaratma prosesini durdurmamalı
      }
    })();

    res.status(201).json({
      status: 'success',
      data: {
        pdf: transformedPdf
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPdfs = async (req, res, next) => {
  try {
    const {
      page, limit, categoryId, pdfTypeId, language, search,
      minPrice, maxPrice, startDate, endDate,
      status, uploadedBy, submittedBy, sortBy,
      pInstitutionId, uploaderInstId, anyInstId, includeNoInst, uploaderNoInst
    } = req.query;

    // submittedBy — istifadəçinin öz PDF-lərini görmək üçün
    let resolvedUploadedBy = uploadedBy || submittedBy || null;
    const isOwnPdfs = !!submittedBy && req.user && String(submittedBy) === String(req.user.id);

    // Admin olmayan istifadəçilərə yalnız qəbul edilmiş PDFlər göstərilir
    // İSTİSNA: istifadəçi öz PDF-lərini sorğulayırsa bütün statuslar görünür
    const isAdmin = req.user && req.user.role >= 2;
    const effectiveStatus = status || ((!isAdmin && !isOwnPdfs) ? 'approved' : null);

    // Scope məhdudiyyəti yalnız admin panel sorğuları üçün tətbiq edilir (adminView=1)
    // Ana səhifə / user-facing kitabxana bütün təsdiqlənmiş PDF-ləri görməlidir
    const isAdminView = req.query.adminView === '1';

    let uploaderInstitutionId = null;
    if (isAdmin && isAdminView) {
      const scope = await resolveAdminScope(req.user);
      if (scope.type === 'institution') {
        // Həm əsas, həm qeyri-əsas müəssisə işçiləri öz müəssisəsinə aid PDF-ləri görür
        uploaderInstitutionId = scope.institutionId;
      }
    }

    const result = await pdfService.getAllPdfs({
      page, limit, categoryId, pdfTypeId, language, search,
      minPrice, maxPrice, startDate, endDate,
      status: effectiveStatus, uploadedBy: resolvedUploadedBy, uploaderInstitutionId,
      pInstitutionId, uploaderInstId, anyInstId,
      includeNoInst: includeNoInst === '1' || includeNoInst === 'true',
      uploaderNoInst: uploaderNoInst === '1' || uploaderNoInst === 'true',
      sortBy
    });

    // Check access for each PDF if user is authenticated
    const userId = req.user?.id;
    let userEmail = null;
    
    let hasActiveSubscription = false;
    
    // Real-time subscription yoxla (token-ə etibar etmə) və istifadəçi email-ni al
    if (userId) {
      try {
        const subscription = await getOne(`
          SELECT id FROM subscriptions
          WHERE user_id = ?
            AND status = 'active'
            AND end_date > NOW()
            AND plan != 'none'
          LIMIT 1
        `, [userId]);
        hasActiveSubscription = !!subscription;
      } catch (_) {
        hasActiveSubscription = false;
      }
      console.log(`🔍 User ${userId} subscription check:`, hasActiveSubscription ? 'ACTIVE' : 'NO SUBSCRIPTION');
      
      // İstifadəçi email-ni al (indirim üçün)
      const user = await getOne('SELECT login FROM users WHERE id = ?', [userId]);
      if (user) {
        userEmail = user.login;
      }
    }
    
    // Əgər subscription varsa, bütün PDF-lər açıqdır
    if (hasActiveSubscription) {
      const transformedPdfs = result.pdfs.map(pdf => {
        const priceInfo = calculatePriceWithDiscount(pdf.price, userEmail);
        return {
          id: pdf.id,
          title: pdf.title,
          description: pdf.description,
          language: pdf.language,
          file_path: toWebPath(pdf.file_path),
          image_path: toWebPath(pdf.image_path),
          price: pdf.price,
          priceInfo: priceInfo,
          downloads: pdf.downloads,
          status: pdf.status,
          order_number: pdf.order_number,
          author: pdf.author,
          isbn: pdf.isbn || null,
          publication_year: pdf.publication_year || null,
          publisher_location: pdf.publisher_location || null,
          allow_download: pdf.allow_download !== undefined ? Number(pdf.allow_download) : 1,
          quantity: pdf.quantity || 1,
          category_id: pdf.category_id,
          uploaded_by: pdf.uploaded_by,
          uploader_email: pdf.uploader_email,
          created_at: pdf.created_at,
          updated_at: pdf.updated_at,
          institution_id: pdf.institution_id || null,
          institution_name: pdf.institution_name || null,
          category: pdf.category_id ? {
            id: pdf.category_id,
            name: pdf.category_name
          } : null,
          pdf_type: pdf.pdf_type_id ? { id: pdf.pdf_type_id, name: pdf.pdf_type_name } : null,
          reads: pdf.reads || 0,
          hasAccess: true,
          accessType: 'subscription',
          downloadUrl: `/pdfs/${pdf.id}/download`
        };
      });

      return res.status(200).json({
        status: 'success',
        data: {
          pdfs: transformedPdfs,
          pagination: result.pagination,
          filters: result.filters
        }
      });
    }

    // Subscription yoxdursa, hər PDF üçün purchased yoxla
    const transformedPdfs = await Promise.all(result.pdfs.map(async (pdf) => {
      let hasAccess = false;
      let accessType = null;
      
      if (userId) {
        try {
          // Purchased PDF-ləri yoxla
          const purchased = await getOne(`
            SELECT id FROM payments 
            WHERE user_id = ? 
              AND pdf_id = ? 
              AND type = 'single-pdf' 
              AND status = 'success'
            LIMIT 1
          `, [userId, pdf.id]);
          
          if (purchased) {
            hasAccess = true;
            accessType = 'purchased';
            console.log(`✅ User ${userId} purchased PDF ${pdf.id}: ${pdf.title}`);
          }
        } catch (error) {
          // Ignore error
        }
      }

      // İndirim hesablaması
      const priceInfo = calculatePriceWithDiscount(pdf.price, userEmail);

      return {
        id: pdf.id,
        title: pdf.title,
        description: pdf.description,
        language: pdf.language,
        file_path: toWebPath(pdf.file_path),
        image_path: toWebPath(pdf.image_path),
        price: pdf.price,
        priceInfo: priceInfo,
        downloads: pdf.downloads,
        status: pdf.status,
        order_number: pdf.order_number,
        author: pdf.author,
        isbn: pdf.isbn || null,
        publication_year: pdf.publication_year || null,
        publisher_location: pdf.publisher_location || null,
        allow_download: pdf.allow_download !== undefined ? Number(pdf.allow_download) : 1,
        quantity: pdf.quantity || 1,
        category_id: pdf.category_id,
        uploaded_by: pdf.uploaded_by,
        uploader_email: pdf.uploader_email,
        created_at: pdf.created_at,
        updated_at: pdf.updated_at,
        institution_id: pdf.institution_id || null,
        institution_name: pdf.institution_name || null,
        category: pdf.category_id ? {
          id: pdf.category_id,
          name: pdf.category_name
        } : null,
        pdf_type: pdf.pdf_type_id ? { id: pdf.pdf_type_id, name: pdf.pdf_type_name } : null,
        reads: pdf.reads || 0,
        hasAccess: hasAccess,
        accessType: accessType,
        downloadUrl: hasAccess ? `/pdfs/${pdf.id}/download` : null
      };
    }));

    res.status(200).json({
      status: 'success',
      data: {
        pdfs: transformedPdfs,
        pagination: result.pagination,
        filters: result.filters
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

    if (!pdf) {
      return res.status(404).json({
        status: 'error',
        message: 'PDF not found'
      });
    }

    // İstifadəçi email-ni al (indirim üçün)
    let userEmail = null;
    let hasAccess = false;
    let accessType = null;
    const userId = req.user?.id;
    
    console.log('📄 getPdfById - userId:', userId, 'pdfId:', id);
    
    if (userId) {
      const user = await getOne('SELECT login FROM users WHERE id = ?', [userId]);
      if (user) {
        userEmail = user.login;
      }
      
      // Access yoxla
      try {
        const accessCheck = await pdfService.checkPdfAccess(userId, Number(id));
        hasAccess = accessCheck.hasAccess;
        accessType = accessCheck.accessType;
        console.log('✅ getPdfById access check result:', { hasAccess, accessType });
      } catch (error) {
        // Access yoxlaması xətası olsa belə, PDF məlumatlarını qaytarırıq
        console.error('❌ Access check error:', error);
      }
    } else {
      console.log('⚠️ getPdfById - No userId (user not authenticated)');
    }

    // İndirim hesablaması
    const priceInfo = calculatePriceWithDiscount(pdf.price, userEmail);

    // Favorites yoxlama
    let isFavorited = false;
    if (userId) {
      try {
        const fav = await getOne('SELECT id FROM user_favorites WHERE user_id = ? AND pdf_id = ?', [userId, id]);
        isFavorited = !!fav;
      } catch (_) {}
    }

    // Transform data to include category object
    const transformedPdf = {
      id: pdf.id,
      title: pdf.title,
      description: pdf.description,
      table_of_contents: pdf.table_of_contents || null,
      language: pdf.language,
      file_path: toWebPath(pdf.file_path),
      image_path: toWebPath(pdf.cover_image_path || pdf.image_path),
      cover_image_path: toWebPath(pdf.cover_image_path),
      content_images_paths: pdf.content_images_paths ? pdf.content_images_paths.map(path => toWebPath(path)) : [],
      price: pdf.price,
      priceInfo: priceInfo,
      downloads: pdf.downloads,
      author: pdf.author || null,
      isbn: pdf.isbn || null,
      order_number: pdf.order_number || null,
      publication_year: pdf.publication_year || null,
      publisher_location: pdf.publisher_location || null,
      foreword: pdf.foreword || null,
      reads: pdf.reads || 0,
      allow_download: pdf.allow_download !== undefined ? Number(pdf.allow_download) : 1,
      status: pdf.status,
      uploaded_by: pdf.uploaded_by,
      created_at: pdf.created_at,
      updated_at: pdf.updated_at,
      category: pdf.category_id ? {
        id: pdf.category_id,
        name: pdf.category_name,
        pdf_type: pdf.category_pdf_type
      } : null,
      pdf_type: pdf.pdf_type_id ? { id: pdf.pdf_type_id, name: pdf.pdf_type_name } : null,
      quantity: parseInt(pdf.quantity) || 1,
      active_rentals_count: parseInt(pdf.active_rentals_count) || 0,
      institution_id: pdf.institution_id || null,
      institution: pdf.institution_name ? { id: pdf.institution_id, name: pdf.institution_name } : null,
      hasAccess: hasAccess,
      accessType: accessType,
      downloadUrl: hasAccess ? `/pdfs/${pdf.id}/download` : null,
      is_favorited: isFavorited,
    };

    res.status(200).json({
      status: 'success',
      data: {
        pdf: transformedPdf
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

export const incrementReads = async (req, res, next) => {
  try {
    const { id } = req.params;
    await executeQuery('UPDATE pdfs SET `reads` = `reads` + 1 WHERE id = ?', [id]);
    if (req.user?.id) {
      await executeQuery(
        'INSERT IGNORE INTO user_pdf_reads (user_id, pdf_id) VALUES (?, ?)',
        [req.user.id, id]
      );
    }
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};

export const getMyReads = async (req, res, next) => {
  try {
    const rows = await executeQuery(
      `SELECT r.created_at, p.id, p.title, p.cover_image_path AS image_path, c.name AS category_name
       FROM user_pdf_reads r
       JOIN pdfs p ON r.pdf_id = p.id
       LEFT JOIN category_pdfs c ON p.category_id = c.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'success', data: { pdfs: rows.map(r => ({ ...r, image_path: toWebPath(r.image_path) })) } });
  } catch (err) { next(err); }
};

export const getMyDownloads = async (req, res, next) => {
  try {
    const rows = await executeQuery(
      `SELECT d.created_at, p.id, p.title, p.cover_image_path AS image_path, c.name AS category_name
       FROM user_pdf_downloads d
       JOIN pdfs p ON d.pdf_id = p.id
       LEFT JOIN category_pdfs c ON p.category_id = c.id
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'success', data: { pdfs: rows.map(d => ({ ...d, image_path: toWebPath(d.image_path) })) } });
  } catch (err) { next(err); }
};

export const getMyFavorites = async (req, res, next) => {
  try {
    const rows = await executeQuery(
      `SELECT f.created_at, p.id, p.title, p.author,
              p.cover_image_path AS image_path, c.name AS category_name
       FROM user_favorites f
       JOIN pdfs p ON f.pdf_id = p.id
       LEFT JOIN category_pdfs c ON p.category_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'success', data: { pdfs: rows.map(r => ({ ...r, image_path: toWebPath(r.image_path) })) } });
  } catch (err) { next(err); }
};

export const toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await getOne(
      'SELECT id FROM user_favorites WHERE user_id = ? AND pdf_id = ?',
      [userId, id]
    );
    if (existing) {
      await executeQuery('DELETE FROM user_favorites WHERE user_id = ? AND pdf_id = ?', [userId, id]);
      res.json({ status: 'success', favorited: false });
    } else {
      await executeQuery('INSERT IGNORE INTO user_favorites (user_id, pdf_id) VALUES (?, ?)', [userId, id]);
      res.json({ status: 'success', favorited: true });
    }
  } catch (err) { next(err); }
};

export const updatePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Əsas müəssisə işçisi yalnız öz yüklədiyini redaktə edə bilər
    // İSTİSNA: başqasının kitabını "kitab-hər ikisi"-yə çevirirsə (fiziki link) icazə var
    let isPhysicalLink = false;
    if (req.user.role === 2 && req.user.institutionId) {
      const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [req.user.institutionId]);
      if (inst?.is_main) {
        const pdfRow = await getOne('SELECT uploaded_by FROM pdfs WHERE id = ?', [id]);
        if (!pdfRow) {
          return res.status(404).json({ status: 'error', message: 'PDF tapılmadı' });
        }
        if (String(pdfRow.uploaded_by) !== String(req.user.id)) {
          const newTypeId = req.body.pdf_type_id;
          const newType = newTypeId
            ? await getOne('SELECT name FROM pdfs_types WHERE id = ?', [newTypeId])
            : null;
          const isHerIkisiConversion = (newType?.name || '').toLowerCase().includes('ikisi');
          if (!isHerIkisiConversion) {
            return res.status(403).json({ status: 'error', message: 'Yalnız özünüzün yüklədiyiniz PDF-ləri redaktə edə bilərsiniz' });
          }
          isPhysicalLink = true;
        }
      }
    }

    if (req.user.role === 2 && req.user.workerType) {
      const newTypeId = req.body.pdf_type_id;
      const currentPdfRow = await getOne('SELECT pdf_type_id FROM pdfs WHERE id = ?', [id]);
      const typeId = newTypeId || currentPdfRow?.pdf_type_id;
      const pdfType = typeId ? await getOne('SELECT name FROM pdfs_types WHERE id = ?', [typeId]) : null;
      const targetIsHerIkisi = (pdfType?.name || '').toLowerCase().includes('ikisi');
      // "hər ikisi"-yə çevirməyə icazə var (fiziki işçi mövcud elektron kitabı link edir)
      if (!workerCanEditPdfType(req.user.workerType, pdfType?.name) && !targetIsHerIkisi) {
        return res.status(403).json({ status: 'error', message: 'Bu tipli PDF-ə əməliyyat etmək icazəniz yoxdur' });
      }
    }

    const { pdfDate, ...restBody } = req.body;
    
    // Transform categoryId to category_id if present
    const updateData = { ...restBody };
    
    // pdfDate varsa created_at olarak kullan
    if (pdfDate) {
      const formattedDate = `${pdfDate} 00:00:00`;
      updateData.created_at = formattedDate;
    }
    
    // pdfDate'i updateData'dan sil (veritabanında yok)
    delete updateData.pdfDate;
    
    // Fayl/image yeniləmələri
    const file = req.files?.file?.[0] || null;
    const image = req.files?.image?.[0] || null;
    if (file) {
      updateData.file_path = file.path;
    }
    if (image) {
      updateData.cover_image_path = image.path;
    }
    if (updateData.categoryId !== undefined) {
      updateData.category_id = updateData.categoryId;
      delete updateData.categoryId;
    }

    if (updateData.allow_download !== undefined) {
      updateData.allow_download = updateData.allow_download === '0' || updateData.allow_download === 0 ? 0 : 1;
    }
    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price) || 0;
    }
    if (updateData.publication_year !== undefined && updateData.publication_year !== '') {
      updateData.publication_year = parseInt(updateData.publication_year) || null;
    }

    const pdf = await pdfService.updatePdf(Number(id), updateData);

    if (isPhysicalLink) {
      activityLog.log({
        eventType: 'pdf_physical_linked',
        actorEmail: req.user.login || null,
        targetType: 'pdf',
        targetId: Number(id),
        details: {
          title: pdf?.title || updateData.title || null,
          category_name: 'kitab-hər ikisi',
        },
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        pdf
      }
    });
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({ status: 'error', message: 'PDF tapılmadı' });
    }
    if (error.message?.startsWith('Invalid language') || error.message?.startsWith('Category with ID')) {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    next(error);
  }
};

const assertCanApprovePdfs = async (user, pdfId = null) => {
  const { role, institutionId, pdfReviewPermission } = user;
  if (role >= 4 || !institutionId) return;
  const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [institutionId]);
  if (inst?.is_main) return; // main institution → allowed
  // pdf-in institution_id-si approver-in müəssisəsinə bərabərdirsə → OK
  if (pdfId) {
    const pdf = await getOne('SELECT institution_id FROM pdfs WHERE id = ?', [pdfId]);
    if (pdf?.institution_id && Number(pdf.institution_id) === Number(institutionId)) return;
  }
  if (pdfReviewPermission === 'allowed') return; // explicitly granted
  throw Object.assign(new Error('forbidden'), { statusCode: 403 });
};

export const approvePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    await assertCanApprovePdfs(req.user, Number(id));
    const pdf = await pdfService.approvePdf(Number(id), req.user?.login);
    res.status(200).json({ status: 'success', data: { pdf } });
  } catch (error) {
    if (error.message === 'forbidden') {
      return res.status(403).json({ status: 'error', message: 'PDF sorğusunu qəbul etmə icazəniz yoxdur' });
    }
    if (error.message === 'PDF not found') {
      return res.status(404).json({ status: 'error', message: 'PDF tapılmadı' });
    }
    next(error);
  }
};

export const rejectPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    await assertCanApprovePdfs(req.user, Number(id));
    await pdfService.rejectPdf(Number(id), req.user?.login);
    res.status(200).json({ status: 'success', message: 'PDF rejected and deleted' });
  } catch (error) {
    if (error.message === 'forbidden') {
      return res.status(403).json({ status: 'error', message: 'PDF sorğusunu rədd etmə icazəniz yoxdur' });
    }
    if (error.message === 'PDF not found') {
      return res.status(404).json({ status: 'error', message: 'PDF tapılmadı' });
    }
    next(error);
  }
};

export const deletePdf = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Əsas müəssisə işçisi yalnız öz yüklədiyini silə bilər
    if (req.user.role === 2 && req.user.institutionId) {
      const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [req.user.institutionId]);
      if (inst?.is_main) {
        const pdfRow = await getOne('SELECT uploaded_by FROM pdfs WHERE id = ?', [id]);
        if (!pdfRow) {
          return res.status(404).json({ status: 'error', message: 'PDF tapılmadı' });
        }
        if (String(pdfRow.uploaded_by) !== String(req.user.id)) {
          return res.status(403).json({ status: 'error', message: 'Yalnız özünüzün yüklədiyiniz PDF-ləri silə bilərsiniz' });
        }
      }
    }

    if (req.user.role === 2 && req.user.workerType) {
      const pdfRow = await getOne('SELECT pdf_type_id FROM pdfs WHERE id = ?', [id]);
      const pdfType = pdfRow?.pdf_type_id
        ? await getOne('SELECT name FROM pdfs_types WHERE id = ?', [pdfRow.pdf_type_id])
        : null;
      if (!workerCanEditPdfType(req.user.workerType, pdfType?.name)) {
        return res.status(403).json({ status: 'error', message: 'Bu tipli PDF-ə əməliyyat etmək icazəniz yoxdur' });
      }
    }

    await pdfService.deletePdf(Number(id), req.user?.login);

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
    const downloadInfo = await pdfService.downloadPdf(Number(id), req.user?.id || null);

    if (downloadInfo.pdf.allow_download == 0) {
      return res.status(403).json({ status: 'error', message: 'Bu PDF-i yükləmək icazəsi yoxdur.' });
    }

    if (req.user?.id) {
      executeQuery(
        'INSERT IGNORE INTO user_pdf_downloads (user_id, pdf_id) VALUES (?, ?)',
        [req.user.id, id]
      ).catch(() => {});
    }

    res.download(downloadInfo.filePath, `${downloadInfo.fileName}.pdf`);
  } catch (error) {
    if (error.message === 'PDF not found') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    if (error.code === 'ACCESS_DENIED') {
      return res.status(403).json({
        status: 'error',
        message: error.message,
        requiresPayment: error.requiresPayment,
        pdfPrice: error.pdfPrice
      });
    }
    next(error);
  }
};

/**
 * İstifadəçinin girişi olan bütün PDF-ləri qaytarır
 */
export const getMyAccessiblePdfs = async (req, res, next) => {
  try {
    const result = await pdfService.getUserAccessiblePdfs(req.user.id);

    // Transform data
    const transformedPdfs = result.pdfs.map(pdf => ({
      id: pdf.id,
      title: pdf.title,
      description: pdf.description,
      language: pdf.language,
      file_path: toWebPath(pdf.file_path),
      image_path: toWebPath(pdf.image_path),
      price: pdf.price,
      downloads: pdf.downloads,
      created_at: pdf.created_at,
      access_type: pdf.access_type,
      purchased_at: pdf.purchased_at || null,
      category: pdf.category_id ? {
        id: pdf.category_id,
        name: pdf.category_name
      } : null
    }));

    res.status(200).json({
      status: 'success',
      data: {
        accessType: result.accessType,
        subscription: result.subscription,
        pdfs: transformedPdfs,
        count: transformedPdfs.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Konkret PDF-ə giriş imkanını yoxlayır
 */
export const checkPdfAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const accessCheck = await pdfService.checkPdfAccess(req.user.id, Number(id));

    res.status(200).json({
      status: 'success',
      data: accessCheck
    });
  } catch (error) {
    next(error);
  }
};

// İstifadəçi PDF yükləmə (role=1)
export const submitPdf = async (req, res, next) => {
  try {
    const file = req.files?.file?.[0] || null;
    const coverImage = req.files?.coverImage?.[0] || null;

    const { title, description, table_of_contents, order_number, author, isbn, language, category_id,
            pdf_type_id,
            publication_year, publisher_location, price, allow_download, foreword, institution_id,
            linked_pdf_id, quantity } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: 'error', message: 'PDF adı tələb olunur' });
    }

    const pdf = await pdfService.submitPdf(
      { title, description, table_of_contents, order_number, author, isbn, language, category_id,
        pdf_type_id,
        publication_year, publisher_location, price, allow_download, foreword, institution_id,
        linked_pdf_id, quantity,
        uploaded_by: req.user.id },
      file,
      coverImage
    );

    const transformedPdf = {
      id: pdf.id,
      title: pdf.title,
      description: pdf.description,
      order_number: pdf.order_number,
      file_path: toWebPath(pdf.file_path),
      image_path: toWebPath(pdf.cover_image_path || pdf.image_path),
      price: 0,
      downloads: 0,
      status: pdf.status,
      created_at: pdf.created_at,
      uploaded_by: pdf.uploaded_by
    };

    res.status(201).json({ status: 'success', data: { pdf: transformedPdf } });
  } catch (error) {
    next(error);
  }
};

// FULLTEXT axtarış
export const searchPdfs = async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const result = await pdfService.searchPdfs(q, page, limit);

    const userId = req.user?.id;
    let userEmail = null;
    if (userId) {
      const user = await getOne('SELECT login FROM users WHERE id = ?', [userId]);
      if (user) userEmail = user.login;
    }

    const transformedPdfs = result.pdfs.map(pdf => {
      const priceInfo = calculatePriceWithDiscount(pdf.price, userEmail);
      return {
        id: pdf.id,
        title: pdf.title,
        description: pdf.description,
        order_number: pdf.order_number,
        language: pdf.language,
        image_path: toWebPath(pdf.image_path),
        price: pdf.price,
        priceInfo,
        downloads: pdf.downloads,
        created_at: pdf.created_at,
        category: pdf.category_id ? { id: pdf.category_id, name: pdf.category_name } : null,
        hasAccess: pdf.price === 0 || pdf.price === '0.00',
        accessType: pdf.price === 0 ? 'free' : null,
        downloadUrl: `/pdfs/${pdf.id}/download`
      };
    });

    res.status(200).json({
      status: 'success',
      data: { pdfs: transformedPdfs, pagination: result.pagination }
    });
  } catch (error) {
    next(error);
  }
};

export const getPdfsPreview = async (req, res, next) => {
  try {
    const { limit, categoryId } = req.query;
    const pdfs = await pdfService.getPdfsPreview(limit, categoryId);

    // İstifadəçi email-ni al (indirim üçün)
    let userEmail = null;
    const userId = req.user?.id;
    if (userId) {
      const user = await getOne('SELECT login FROM users WHERE id = ?', [userId]);
      if (user) {
        userEmail = user.login;
      }
    }

    // Transform data to include category object
    const transformedPdfs = pdfs.map(pdf => {
      const priceInfo = calculatePriceWithDiscount(pdf.price, userEmail);
      return {
        id: pdf.id,
        title: pdf.title,
        description: pdf.description,
        language: pdf.language,
        file_path: toWebPath(pdf.file_path),
        image_path: toWebPath(pdf.image_path),
        price: pdf.price,
        priceInfo: priceInfo,
        downloads: pdf.downloads,
        created_at: pdf.created_at,
        category: pdf.category_id ? {
          id: pdf.category_id,
          name: pdf.category_name
        } : null
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        pdfs: transformedPdfs,
        count: transformedPdfs.length
      }
    });
  } catch (error) {
    next(error);
  }
};
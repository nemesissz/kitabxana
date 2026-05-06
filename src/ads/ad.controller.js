import adService from './ad.service.js';
import imageUpload from '../utils/imageUpload.js';

// Reklam alanları işlemleri
export const getAllAdSpaces = async (req, res, next) => {
  try {
    const adSpaces = await adService.getAllAdSpaces();
    res.status(200).json({
      status: 'success',
      data: { ad_spaces: adSpaces }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdSpaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adSpace = await adService.getAdSpaceById(id);
    
    if (!adSpace) {
      return res.status(404).json({
        status: 'error',
        message: 'Reklam alanı bulunamadı'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { ad_space: adSpace }
    });
  } catch (error) {
    next(error);
  }
};

export const createAdSpace = async (req, res, next) => {
  try {
    const { name, position, description, width, height, is_active } = req.body;
    const adSpace = await adService.createAdSpace({
      name,
      position,
      description,
      width,
      height,
      is_active
    });

    res.status(201).json({
      status: 'success',
      data: { ad_space: adSpace }
    });
  } catch (error) {
    if (error.message.includes('Duplicate entry')) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu pozisyon zaten kullanılıyor'
      });
    }
    next(error);
  }
};

export const updateAdSpace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, description, width, height, is_active } = req.body;
    
    const adSpace = await adService.updateAdSpace(id, {
      name,
      position,
      description,
      width,
      height,
      is_active
    });

    res.status(200).json({
      status: 'success',
      data: { ad_space: adSpace }
    });
  } catch (error) {
    if (error.message === 'Reklam alanı bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteAdSpace = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adService.deleteAdSpace(id);

    res.status(200).json({
      status: 'success',
      message: 'Reklam alanı başarıyla silindi'
    });
  } catch (error) {
    if (error.message === 'Reklam alanı bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

// Reklam işlemleri
export const getAllAds = async (req, res, next) => {
  try {
    const { adSpaceId, isActive } = req.query;
    const ads = await adService.getAllAds({
      adSpaceId: adSpaceId ? parseInt(adSpaceId) : null,
      isActive: isActive !== undefined ? isActive === 'true' : null
    });

    res.status(200).json({
      status: 'success',
      data: { ads }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await adService.getAdById(id);
    
    if (!ad) {
      return res.status(404).json({
        status: 'error',
        message: 'Reklam bulunamadı'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { ad }
    });
  } catch (error) {
    next(error);
  }
};

// Belirli pozisyon için aktif reklamları getir (public endpoint)
export const getAdsByPosition = async (req, res, next) => {
  try {
    const { position } = req.params;
    console.log(`[AdController] ${position} pozisyonu üçün reklamlar soruşulur`);
    const ads = await adService.getActiveAdsByPosition(position);
    console.log(`[AdController] ${position} üçün ${ads.length} reklam tapıldı`);

    res.status(200).json({
      status: 'success',
      data: { ads }
    });
  } catch (error) {
    console.error(`[AdController] ${req.params.position} üçün xəta:`, error);
    next(error);
  }
};

export const createAd = async (req, res, next) => {
  try {
    const { 
      ad_space_id, 
      title, 
      type, 
      content, 
      link_url, 
      start_date, 
      end_date, 
      is_active,
      priority
    } = req.body;
    
    const imageFile = req.file;

    if (!ad_space_id || !title || !type) {
      return res.status(400).json({
        status: 'error',
        message: 'ad_space_id, title ve type zorunludur'
      });
    }

    // Banner tipi için resim kontrolü
    if (type === 'banner' && !imageFile && !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Banner tipi için resim veya content gerekli'
      });
    }

    const ad = await adService.createAd({
      ad_space_id: parseInt(ad_space_id),
      title,
      type,
      content,
      link_url,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : true,
      priority: priority ? parseInt(priority) : 0
    }, imageFile);

    res.status(201).json({
      status: 'success',
      data: { ad }
    });
  } catch (error) {
    if (error.message === 'Reklam alanı bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const updateAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      type, 
      content, 
      link_url, 
      start_date, 
      end_date, 
      is_active,
      priority
    } = req.body;
    
    const imageFile = req.file;

    const updateData = {};
    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (is_active !== undefined) updateData.is_active = (is_active === 'true' || is_active === true) ? 1 : 0;
    if (priority !== undefined) updateData.priority = parseInt(priority);

    const ad = await adService.updateAd(id, updateData, imageFile);

    res.status(200).json({
      status: 'success',
      data: { ad }
    });
  } catch (error) {
    if (error.message === 'Reklam bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const deleteAd = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adService.deleteAd(id);

    res.status(200).json({
      status: 'success',
      message: 'Reklam başarıyla silindi'
    });
  } catch (error) {
    if (error.message === 'Reklam bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

// Tıklama sayacını artır (public endpoint)
export const trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adService.incrementClickCount(id);

    res.status(200).json({
      status: 'success',
      message: 'Tıklama kaydedildi'
    });
  } catch (error) {
    next(error);
  }
};

// Görüntülenme sayacını artır (public endpoint)
export const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adService.incrementViewCount(id);

    res.status(200).json({
      status: 'success',
      message: 'Görüntülenme kaydedildi'
    });
  } catch (error) {
    next(error);
  }
};

// İstatistikler
export const getAdStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await adService.getAdStats(id);

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    if (error.message === 'Reklam bulunamadı') {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

export const getAllStats = async (req, res, next) => {
  try {
    const stats = await adService.getAllStats();

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};


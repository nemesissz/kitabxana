import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

class AdService {
  // Reklam alanları işlemleri
  async getAllAdSpaces() {
    return await executeQuery(`
      SELECT * FROM ad_spaces 
      ORDER BY position ASC
    `);
  }

  async getAdSpaceById(id) {
    return await getOne('SELECT * FROM ad_spaces WHERE id = ?', [id]);
  }

  async getAdSpaceByPosition(position) {
    return await getOne('SELECT * FROM ad_spaces WHERE position = ? AND is_active = 1', [position]);
  }

  async createAdSpace(data) {
    const { name, position, description, width, height, is_active = 1 } = data;
    
    if (!name || !position) {
      throw new Error('Name ve position zorunludur');
    }

    const adSpaceData = {
      name,
      position,
      description: description || null,
      width: width || null,
      height: height || null,
      is_active: is_active ? 1 : 0
    };

    const id = await insert('ad_spaces', adSpaceData);
    return await this.getAdSpaceById(id);
  }

  async updateAdSpace(id, data) {
    const existing = await this.getAdSpaceById(id);
    if (!existing) {
      throw new Error('Reklam alanı bulunamadı');
    }

    await update('ad_spaces', id, data);
    return await this.getAdSpaceById(id);
  }

  async deleteAdSpace(id) {
    const existing = await this.getAdSpaceById(id);
    if (!existing) {
      throw new Error('Reklam alanı bulunamadı');
    }

    await deleteRecord('ad_spaces', id);
    return { message: 'Reklam alanı başarıyla silindi' };
  }

  // Reklam işlemleri
  async getAllAds(filters = {}) {
    const { adSpaceId = null, isActive = null } = filters;
    
    let conditions = [];
    let params = [];

    if (adSpaceId) {
      conditions.push('a.ad_space_id = ?');
      params.push(adSpaceId);
    }

    if (isActive !== null) {
      conditions.push('a.is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return await executeQuery(`
      SELECT 
        a.*,
        s.name as space_name,
        s.position as space_position
      FROM ads a
      LEFT JOIN ad_spaces s ON a.ad_space_id = s.id
      ${whereClause}
      ORDER BY a.priority DESC, a.created_at DESC
    `, params);
  }

  async getAdById(id) {
    return await getOne(`
      SELECT 
        a.*,
        s.name as space_name,
        s.position as space_position
      FROM ads a
      LEFT JOIN ad_spaces s ON a.ad_space_id = s.id
      WHERE a.id = ?
    `, [id]);
  }

  // Belirli bir pozisyon için aktif reklamları getir
  async getActiveAdsByPosition(position) {
    const now = new Date();
    const today = now.toISOString().slice(0, 10); // YYYY-MM-DD formatında bugünün tarihi
    const nowDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(`[AdService] ${position} üçün reklam axtarılır, cari tarix: ${today}, cari datetime: ${nowDateTime}`);
    
    // Önce tüm reklamları al (debug üçün)
    const allAds = await executeQuery(`
      SELECT 
        a.*,
        s.name as space_name,
        s.position as space_position,
        s.width,
        s.height,
        s.is_active as space_is_active
      FROM ads a
      INNER JOIN ad_spaces s ON a.ad_space_id = s.id
      WHERE s.position = ?
      ORDER BY a.priority DESC, a.created_at DESC
    `, [position]);
    
    console.log(`[AdService] ${position} üçün cəmi reklam sayı (filtresiz): ${allAds.length}`);
    if (allAds.length > 0) {
      console.log(`[AdService] Bütün reklamlar:`, allAds.map(ad => {
        // start_date ve end_date string'e çevir
        const startDateStr = ad.start_date ? (typeof ad.start_date === 'string' ? ad.start_date : ad.start_date.toISOString().slice(0, 19).replace('T', ' ')) : null;
        const endDateStr = ad.end_date ? (typeof ad.end_date === 'string' ? ad.end_date : ad.end_date.toISOString().slice(0, 19).replace('T', ' ')) : null;
        
        return {
          id: ad.id,
          title: ad.title,
          is_active: ad.is_active,
          space_is_active: ad.space_is_active,
          start_date: startDateStr,
          end_date: endDateStr,
          start_date_only: startDateStr ? startDateStr.split(' ')[0] : null,
          end_date_only: endDateStr ? endDateStr.split(' ')[0] : null
        };
      }));
    }
    
    // Sonra filtrelenmiş reklamları al
    // Tarih kontrolü: Gün bazında kontrol et (saat/dakika önemli değil)
    // Eğer start_date ve end_date NULL ise her zaman göster
    // Eğer tarih varsa, bugünün tarihi (sadece gün) aralık içinde olmalı
    const result = await executeQuery(`
      SELECT 
        a.*,
        s.name as space_name,
        s.position as space_position,
        s.width,
        s.height
      FROM ads a
      INNER JOIN ad_spaces s ON a.ad_space_id = s.id
      WHERE s.position = ?
        AND s.is_active = 1
        AND a.is_active = 1
        AND (
          (a.start_date IS NULL AND a.end_date IS NULL) OR
          (a.start_date IS NULL AND DATE(a.end_date) >= ?) OR
          (a.end_date IS NULL AND DATE(a.start_date) <= ?) OR
          (DATE(a.start_date) <= ? AND DATE(a.end_date) >= ?)
        )
      ORDER BY a.priority DESC, a.created_at DESC
    `, [position, today, today, today, today]);
    
    console.log(`[AdService] ${position} üçün filtrelenmiş reklam sayı: ${result.length}`);
    if (result.length > 0) {
      console.log(`[AdService] Filtrelenmiş reklam detayları:`, result[0]);
    } else if (allAds.length > 0) {
      console.warn(`[AdService] ${position} üçün reklamlar var amma filtrdən keçməyib.`);
      console.warn(`[AdService] Səbəb ola bilər: aktiv deyil, tarix aralığı xaricində və ya reklam alanı deaktiv`);
    }
    
    return result;
  }

  async createAd(data, imageFile = null) {
    const { 
      ad_space_id, 
      title, 
      type = 'banner', 
      content, 
      link_url, 
      start_date, 
      end_date, 
      is_active = 1,
      priority = 0
    } = data;

    if (!ad_space_id || !title || !type) {
      throw new Error('ad_space_id, title ve type zorunludur');
    }

    // Reklam alanının varlığını kontrol et
    const adSpace = await this.getAdSpaceById(ad_space_id);
    if (!adSpace) {
      throw new Error('Reklam alanı bulunamadı');
    }

    let finalContent = content;

    // Banner tipi için resim yükleme
    if (type === 'banner' && imageFile && imageFile.path) {
      finalContent = imageFile.path;
    } else if (type === 'banner' && !content && !imageFile) {
      throw new Error('Banner tipi için resim veya content gerekli');
    }

    const adData = {
      ad_space_id,
      title,
      type,
      content: finalContent,
      link_url: link_url || null,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: is_active ? 1 : 0,
      priority: priority || 0,
      click_count: 0,
      view_count: 0
    };

    const id = await insert('ads', adData);
    return await this.getAdById(id);
  }

  async updateAd(id, data, imageFile = null) {
    const existing = await this.getAdById(id);
    if (!existing) {
      throw new Error('Reklam bulunamadı');
    }

    // Eğer yeni resim yüklenmişse, content'i güncelle
    if (imageFile && imageFile.path) {
      data.content = imageFile.path;
    }

    await update('ads', id, data);
    return await this.getAdById(id);
  }

  async deleteAd(id) {
    const existing = await this.getAdById(id);
    if (!existing) {
      throw new Error('Reklam bulunamadı');
    }

    await deleteRecord('ads', id);
    return { message: 'Reklam başarıyla silindi' };
  }

  // Tıklama sayacını artır
  async incrementClickCount(id) {
    await executeQuery(
      'UPDATE ads SET click_count = click_count + 1 WHERE id = ?',
      [id]
    );
    return await this.getAdById(id);
  }

  // Görüntülenme sayacını artır
  async incrementViewCount(id) {
    await executeQuery(
      'UPDATE ads SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );
    return await this.getAdById(id);
  }

  // İstatistikler
  async getAdStats(adId) {
    const ad = await this.getAdById(adId);
    if (!ad) {
      throw new Error('Reklam bulunamadı');
    }

    return {
      id: ad.id,
      title: ad.title,
      click_count: ad.click_count,
      view_count: ad.view_count,
      ctr: ad.view_count > 0 ? ((ad.click_count / ad.view_count) * 100).toFixed(2) : 0
    };
  }

  async getAllStats() {
    const totalAds = await getOne('SELECT COUNT(*) as count FROM ads');
    const activeAds = await getOne('SELECT COUNT(*) as count FROM ads WHERE is_active = 1');
    const totalClicks = await getOne('SELECT SUM(click_count) as total FROM ads');
    const totalViews = await getOne('SELECT SUM(view_count) as total FROM ads');

    return {
      total_ads: totalAds.count,
      active_ads: activeAds.count,
      total_clicks: totalClicks.total || 0,
      total_views: totalViews.total || 0,
      overall_ctr: totalViews.total > 0 
        ? ((totalClicks.total / totalViews.total) * 100).toFixed(2) 
        : 0
    };
  }
}

export default new AdService();


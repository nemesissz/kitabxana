import { executeQuery, getOne, insert, update, deleteRecord } from '../config/database.js';

const ADS_DISABLED = true;

class AdService {
  async getAllAdSpaces() {
    if (ADS_DISABLED) return [];
    try { return await executeQuery('SELECT * FROM ad_spaces ORDER BY position ASC'); } catch (_) { return []; }
  }

  async getAdSpaceById(id) {
    if (ADS_DISABLED) return null;
    try { return await getOne('SELECT * FROM ad_spaces WHERE id = ?', [id]); } catch (_) { return null; }
  }

  async getAdSpaceByPosition(position) {
    if (ADS_DISABLED) return null;
    try { return await getOne('SELECT * FROM ad_spaces WHERE position = ? AND is_active = 1', [position]); } catch (_) { return null; }
  }

  async createAdSpace(data) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async updateAdSpace(id, data) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async deleteAdSpace(id) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async getAllAds(filters = {}) {
    if (ADS_DISABLED) return [];
    try {
      return await executeQuery(`
        SELECT a.*, s.name as space_name, s.position as space_position
        FROM ads a LEFT JOIN ad_spaces s ON a.ad_space_id = s.id
        ORDER BY a.priority DESC, a.created_at DESC
      `);
    } catch (_) { return []; }
  }

  async getAdById(id) {
    if (ADS_DISABLED) return null;
    try {
      return await getOne(`
        SELECT a.*, s.name as space_name, s.position as space_position
        FROM ads a LEFT JOIN ad_spaces s ON a.ad_space_id = s.id
        WHERE a.id = ?
      `, [id]);
    } catch (_) { return null; }
  }

  async getActiveAdsByPosition(position) {
    if (ADS_DISABLED) return [];
    try {
      const today = new Date().toISOString().slice(0, 10);
      return await executeQuery(`
        SELECT a.*, s.name as space_name, s.position as space_position, s.width, s.height
        FROM ads a
        INNER JOIN ad_spaces s ON a.ad_space_id = s.id
        WHERE s.position = ? AND s.is_active = 1 AND a.is_active = 1
          AND (
            (a.start_date IS NULL AND a.end_date IS NULL) OR
            (a.start_date IS NULL AND DATE(a.end_date) >= ?) OR
            (a.end_date IS NULL AND DATE(a.start_date) <= ?) OR
            (DATE(a.start_date) <= ? AND DATE(a.end_date) >= ?)
          )
        ORDER BY a.priority DESC, a.created_at DESC
      `, [position, today, today, today, today]);
    } catch (_) { return []; }
  }

  async createAd(data, imageFile = null) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async updateAd(id, data, imageFile = null) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async deleteAd(id) {
    throw new Error('Reklam sistemi deaktivdir');
  }

  async incrementClickCount(id) {
    return null;
  }

  async incrementViewCount(id) {
    return null;
  }

  async getAdStats(adId) {
    return { id: adId, click_count: 0, view_count: 0, ctr: 0 };
  }

  async getAllStats() {
    return { total_ads: 0, active_ads: 0, total_clicks: 0, total_views: 0, overall_ctr: 0 };
  }
}

export default new AdService();

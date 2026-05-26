import { executeQuery, getOne, insert } from '../config/database.js';

class SettingsService {

  async getEffectiveLimitForUser(userId) {
    const userLimit = await getOne(
      "SELECT limit_mb FROM upload_limits WHERE scope_type = 'user' AND scope_id = ?",
      [userId]
    );
    if (userLimit) return { limit_mb: Number(userLimit.limit_mb), source: 'user' };

    const user = await getOne('SELECT institution_id FROM users WHERE id = ?', [userId]);
    if (user?.institution_id) {
      const instLimit = await getOne(
        "SELECT limit_mb FROM upload_limits WHERE scope_type = 'institution' AND scope_id = ?",
        [user.institution_id]
      );
      if (instLimit) return { limit_mb: Number(instLimit.limit_mb), source: 'institution', institution_id: user.institution_id };
    }

    const def = await getOne(
      "SELECT limit_mb FROM upload_limits WHERE scope_type = 'default' AND scope_id IS NULL ORDER BY updated_at DESC LIMIT 1"
    );
    return { limit_mb: Number(def?.limit_mb || 20), source: 'default', institution_id: user?.institution_id ?? null };
  }

  async setDefaultLimit(limitMb, updatedBy) {
    const result = await executeQuery(
      `UPDATE upload_limits SET limit_mb = ?, updated_by = ? WHERE scope_type = 'default' AND scope_id IS NULL`,
      [limitMb, updatedBy]
    );
    if ((result?.affectedRows ?? 0) === 0) {
      await executeQuery(
        `INSERT INTO upload_limits (scope_type, scope_id, limit_mb, updated_by) VALUES ('default', NULL, ?, ?)`,
        [limitMb, updatedBy]
      );
    }
    return { limit_mb: Number(limitMb) };
  }

  async setInstitutionLimit(institutionId, limitMb, updatedBy) {
    await executeQuery(
      `INSERT INTO upload_limits (scope_type, scope_id, limit_mb, updated_by)
       VALUES ('institution', ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_mb = VALUES(limit_mb), updated_by = VALUES(updated_by)`,
      [institutionId, limitMb, updatedBy]
    );
    return { institution_id: institutionId, limit_mb: Number(limitMb) };
  }

  async removeInstitutionLimit(institutionId) {
    await executeQuery(
      `DELETE FROM upload_limits WHERE scope_type = 'institution' AND scope_id = ?`,
      [institutionId]
    );
  }

  async setUserLimit(userId, limitMb, updatedBy) {
    await executeQuery(
      `INSERT INTO upload_limits (scope_type, scope_id, limit_mb, updated_by)
       VALUES ('user', ?, ?, ?)
       ON DUPLICATE KEY UPDATE limit_mb = VALUES(limit_mb), updated_by = VALUES(updated_by)`,
      [userId, limitMb, updatedBy]
    );
    return { user_id: userId, limit_mb: Number(limitMb) };
  }

  async removeUserLimit(userId) {
    await executeQuery(
      `DELETE FROM upload_limits WHERE scope_type = 'user' AND scope_id = ?`,
      [userId]
    );
  }

  async getDailyCountLimit() {
    const row = await getOne(
      "SELECT setting_value FROM global_settings WHERE setting_key = 'contributor_daily_upload_limit'"
    );
    return row ? (parseInt(row.setting_value) || 0) : 0;
  }

  async getHomepageCollageIds() {
    const row = await getOne(
      "SELECT setting_value FROM global_settings WHERE setting_key = 'homepage_collage_pdf_ids'"
    );
    if (!row || !row.setting_value) return [];
    return row.setting_value.split(',').map(Number).filter(Boolean);
  }

  async setHomepageCollageIds(ids) {
    const val = (ids || []).slice(0, 8).join(',');
    await executeQuery(
      `INSERT INTO global_settings (setting_key, setting_value)
       VALUES ('homepage_collage_pdf_ids', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [val]
    );
  }

  async setDailyCountLimit(count) {
    const val = parseInt(count) || 0;
    await executeQuery(
      `INSERT INTO global_settings (setting_key, setting_value)
       VALUES ('contributor_daily_upload_limit', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [String(val)]
    );
    return { daily_upload_limit: val };
  }

  async getAllLimits() {
    const defaultRow = await getOne(
      'SELECT limit_mb FROM upload_limits WHERE scope_type = "default" AND scope_id IS NULL ORDER BY updated_at DESC LIMIT 1'
    );

    const institutions = await executeQuery(`
      SELECT i.id, i.name,
        ul.limit_mb,
        ul.id AS limit_id
      FROM institutions i
      LEFT JOIN upload_limits ul ON ul.scope_type = 'institution' AND ul.scope_id = i.id
      WHERE i.is_active = 1
      ORDER BY i.name
    `);

    const users = await executeQuery(`
      SELECT u.id, u.login, u.upload_permission,
        ul.limit_mb,
        ul.id AS limit_id
      FROM users u
      LEFT JOIN upload_limits ul ON ul.scope_type = 'user' AND ul.scope_id = u.id
      WHERE u.institution_id IS NULL
        AND u.upload_permission IN ('pending', 'free')
        AND u.role = 1
      ORDER BY u.login
    `);

    const dailyLimit = await this.getDailyCountLimit();

    return {
      default_limit_mb: Number(defaultRow?.limit_mb || 20),
      daily_upload_limit: dailyLimit,
      institutions: institutions.map(r => ({
        id: r.id,
        name: r.name,
        limit_mb: r.limit_mb !== null ? Number(r.limit_mb) : null,
      })),
      users: users.map(r => ({
        id: r.id,
        login: r.login,
        upload_permission: r.upload_permission,
        limit_mb: r.limit_mb !== null ? Number(r.limit_mb) : null,
      })),
    };
  }
}

export default new SettingsService();

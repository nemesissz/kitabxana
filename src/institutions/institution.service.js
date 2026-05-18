import { executeQuery, getOne } from '../config/database.js';

class InstitutionService {
  async getAll() {
    const sql = `
      SELECT
        i.id, i.name, i.logo_path, i.is_active, i.is_main,
        i.created_at, i.updated_at,
        COUNT(u.id) AS member_count
      FROM institutions i
      LEFT JOIN users u ON u.institution_id = i.id
      GROUP BY i.id
      ORDER BY i.is_main DESC, i.created_at DESC
    `;
    return executeQuery(sql);
  }

  async getById(id) {
    const institution = await getOne('SELECT * FROM institutions WHERE id = ?', [id]);
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async create(data) {
    const { name, logo_path } = data;
    if (!name?.trim()) throw new Error('Name is required');
    const result = await executeQuery(
      'INSERT INTO institutions (name, logo_path) VALUES (?, ?)',
      [name.trim(), logo_path || null]
    );
    return this.getById(result.insertId);
  }

  async update(id, data) {
    await this.getById(id);
    const allowed = ['name', 'logo_path', 'is_active', 'is_main'];
    const fields = Object.keys(data).filter(k => allowed.includes(k));
    if (fields.length === 0) throw new Error('No valid fields to update');
    // If setting is_main=1, clear all others first
    if (data.is_main == 1) {
      await executeQuery('UPDATE institutions SET is_main = 0 WHERE id != ?', [id]);
    }
    const sql = `UPDATE institutions SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
    await executeQuery(sql, [...fields.map(f => data[f]), id]);
    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);
    // Əvvəlcə institution-a aid userləri unassign et
    await executeQuery('UPDATE users SET institution_id = NULL WHERE institution_id = ?', [id]);
    await executeQuery('DELETE FROM institutions WHERE id = ?', [id]);
  }

  async getMembers(id) {
    await this.getById(id);
    return executeQuery(
      `SELECT id, login, email, role, upload_permission AS uploadPermission
       FROM users WHERE institution_id = ? ORDER BY role DESC, login ASC`,
      [id]
    );
  }

  async assignUser(institutionId, userId) {
    await this.getById(institutionId);
    await executeQuery('UPDATE users SET institution_id = ? WHERE id = ?', [institutionId, userId]);
  }

  async removeUser(userId) {
    await executeQuery('UPDATE users SET institution_id = NULL WHERE id = ?', [userId]);
  }

  async getPublic() {
    return executeQuery(
      'SELECT id, name FROM institutions WHERE is_active = 1 ORDER BY is_main DESC, name ASC'
    );
  }

  async createJoinRequest(userId, institutionId) {
    const inst = await getOne('SELECT id FROM institutions WHERE id = ? AND is_active = 1', [institutionId]);
    if (!inst) throw new Error('Institution not found');
    const user = await getOne('SELECT institution_id FROM users WHERE id = ?', [userId]);
    if (user?.institution_id === institutionId) throw new Error('already_member');
    const existing = await getOne(
      'SELECT id FROM institution_join_requests WHERE user_id = ? AND institution_id = ? AND status = ?',
      [userId, institutionId, 'pending']
    );
    if (existing) throw new Error('already_requested');
    await executeQuery(
      'INSERT INTO institution_join_requests (user_id, institution_id) VALUES (?, ?)',
      [userId, institutionId]
    );
  }

  async getJoinRequests(institutionId) {
    return executeQuery(
      `SELECT r.id, r.user_id, r.institution_id, r.status, r.created_at,
              u.login
       FROM institution_join_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.institution_id = ? AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [institutionId]
    );
  }

  async approveJoinRequest(requestId, reviewerId) {
    const req = await getOne('SELECT * FROM institution_join_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Request not found');
    await executeQuery('UPDATE users SET institution_id = ? WHERE id = ?', [req.institution_id, req.user_id]);
    await executeQuery(
      'UPDATE institution_join_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', reviewerId, requestId]
    );
  }

  async rejectJoinRequest(requestId, reviewerId) {
    const req = await getOne('SELECT * FROM institution_join_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('Request not found');
    await executeQuery(
      'UPDATE institution_join_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', reviewerId, requestId]
    );
  }
}

export default new InstitutionService();

import { executeQuery, getOne, insert } from '../config/database.js';

class LanguageService {
  async getAll() {
    return executeQuery(
      'SELECT id, code, name, flag FROM languages WHERE is_active = 1 ORDER BY name ASC'
    );
  }

  async add({ code, name, flag }) {
    if (!code || !name) throw new Error('code_and_name_required');
    const existing = await getOne('SELECT id FROM languages WHERE code = ?', [code.toLowerCase()]);
    if (existing) throw new Error('code_exists');
    const id = await insert('languages', {
      code: code.toLowerCase(),
      name,
      flag: flag || null,
    });
    return { id, code: code.toLowerCase(), name, flag: flag || null };
  }

  async remove(id) {
    const lang = await getOne('SELECT id FROM languages WHERE id = ?', [id]);
    if (!lang) throw new Error('not_found');
    const usage = await getOne('SELECT COUNT(*) AS count FROM pdfs WHERE language_id = ?', [id]);
    if (usage.count > 0) throw new Error('language_in_use');
    await executeQuery('DELETE FROM languages WHERE id = ?', [id]);
  }

  // --- Request methods ---

  async submitRequest({ code, name, flag }, userId, institutionId) {
    if (!code || !name) throw new Error('code_and_name_required');
    const id = await insert('language_requests', {
      code: code.toLowerCase(),
      name,
      flag: flag || null,
      status: 'pending',
      requested_by: userId,
      requester_institution_id: institutionId || null,
    });
    return getOne('SELECT * FROM language_requests WHERE id = ?', [id]);
  }

  async getRequests({ status = 'pending', institutionId = null } = {}) {
    const conditions = [];
    const params = [];
    if (status && status !== 'all') {
      conditions.push('lr.status = ?');
      params.push(status);
    }
    if (institutionId) {
      conditions.push('lr.requester_institution_id = ?');
      params.push(institutionId);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    return executeQuery(`
      SELECT lr.*, u.login AS requester_login,
             inst.name AS institution_name
      FROM language_requests lr
      JOIN users u ON lr.requested_by = u.id
      LEFT JOIN institutions inst ON lr.requester_institution_id = inst.id
      ${where}
      ORDER BY lr.created_at DESC
    `, params);
  }

  async approveRequest(requestId, reviewerUserId) {
    const req = await getOne('SELECT * FROM language_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('not_found');
    if (req.status !== 'pending') throw new Error('already_processed');

    const existing = await getOne('SELECT id FROM languages WHERE code = ?', [req.code]);
    if (!existing) {
      await this.add({ code: req.code, name: req.name, flag: req.flag });
    }

    await executeQuery(
      'UPDATE language_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['approved', reviewerUserId, requestId]
    );
    return { message: 'Request approved' };
  }

  async rejectRequest(requestId, reviewerUserId) {
    const req = await getOne('SELECT * FROM language_requests WHERE id = ?', [requestId]);
    if (!req) throw new Error('not_found');
    if (req.status !== 'pending') throw new Error('already_processed');

    await executeQuery(
      'UPDATE language_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['rejected', reviewerUserId, requestId]
    );
    return { message: 'Request rejected' };
  }
}

export default new LanguageService();

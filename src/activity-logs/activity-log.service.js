import { executeQuery, getOne, insert } from '../config/database.js';

class ActivityLogService {
  async log({ eventType, actorEmail = null, targetType = null, targetId = null, details = null }) {
    try {
      await insert('activity_logs', {
        event_type: eventType,
        actor_email: actorEmail,
        target_type: targetType,
        target_id: targetId,
        details: details ? JSON.stringify(details) : null,
      });
    } catch (err) {
      // Logging xətası əsas prosesi dayandırmamalıdır
      console.error('ActivityLog error:', err.message);
    }
  }

  async getLogs({ page = 1, limit = 30, eventType = null } = {}) {
    const validPage = Math.max(parseInt(page) || 1, 1);
    const validLimit = Math.min(parseInt(limit) || 30, 100);
    const offset = (validPage - 1) * validLimit;

    const conditions = [];
    const params = [];

    if (eventType && eventType !== 'all') {
      const typeMap = {
        users: ['user_registered', 'user_deleted', 'user_login', 'admin_login'],
        pdfs:  ['pdf_uploaded', 'pdf_approved', 'pdf_rejected', 'pdf_deleted'],
      };
      const types = typeMap[eventType];
      if (types) {
        conditions.push(`event_type IN (${types.map(() => '?').join(',')})`);
        params.push(...types);
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = (await getOne(`SELECT COUNT(*) as cnt FROM activity_logs ${where}`, params))?.cnt || 0;

    const logs = await executeQuery(
      `SELECT id, event_type, actor_email, target_type, target_id, details, created_at
       FROM activity_logs ${where}
       ORDER BY created_at DESC
       LIMIT ${validLimit} OFFSET ${offset}`,
      params
    );

    // details JSON string-dən parse et
    const parsed = logs.map(l => ({
      ...l,
      details: l.details ? (() => { try { return JSON.parse(l.details); } catch { return {}; } })() : {},
    }));

    return {
      logs: parsed,
      pagination: {
        current_page: validPage,
        per_page: validLimit,
        total,
        total_pages: Math.ceil(total / validLimit),
      },
    };
  }
}

export default new ActivityLogService();

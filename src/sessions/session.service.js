import { executeQuery, getOne } from '../config/database.js';

const MAX_DELTA = 120; // saniyə — anomaliyaları önləmək üçün

class SessionService {
  async heartbeat({ session_id, user_id, delta }) {
    const safeDelta = Math.min(Math.max(parseInt(delta) || 0, 0), MAX_DELTA);
    if (!session_id || safeDelta <= 0) return;

    const existing = await getOne(
      'SELECT id, user_id FROM user_sessions WHERE session_id = ?',
      [session_id]
    );

    if (existing) {
      const updateFields = ['total_seconds = total_seconds + ?', 'last_seen = NOW()'];
      const params = [safeDelta];

      // user_id yoxdursa əlavə et
      if (user_id && !existing.user_id) {
        updateFields.push('user_id = ?');
        params.push(user_id);
      }
      params.push(session_id);

      await executeQuery(
        `UPDATE user_sessions SET ${updateFields.join(', ')} WHERE session_id = ?`,
        params
      );
    } else {
      await executeQuery(
        'INSERT INTO user_sessions (session_id, user_id, total_seconds) VALUES (?, ?, ?)',
        [session_id, user_id || null, safeDelta]
      );
    }
  }

  async getTimeStats() {
    const row = await getOne(`
      SELECT
        COALESCE(SUM(total_seconds), 0)                                        AS totalSeconds,
        COUNT(DISTINCT session_id)                                             AS totalSessions,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END)                      AS anonSessions,
        COUNT(DISTINCT user_id)                                                AS uniqueUsers
      FROM user_sessions
    `);

    const topByTime = await executeQuery(`
      SELECT u.login, u.email, SUM(s.total_seconds) AS totalSeconds
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      GROUP BY s.user_id, u.login, u.email
      ORDER BY totalSeconds DESC
      LIMIT 10
    `);

    return { ...row, topByTime };
  }
}

export default new SessionService();

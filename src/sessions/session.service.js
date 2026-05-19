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

  async getStatsByPeriod(period, value) {
    // period: 'day' | 'month'
    // value:  'YYYY-MM-DD' | 'YYYY-MM'
    try {
      let where;
      if (period === 'day') {
        where = `DATE(last_seen) = ?`;
      } else {
        const [y, m] = value.split('-');
        where = `YEAR(last_seen) = ${parseInt(y)} AND MONTH(last_seen) = ${parseInt(m)}`;
        value = null;
      }
      const params = value ? [value] : [];

      const row = await getOne(`
        SELECT
          COALESCE(SUM(total_seconds), 0) AS totalSeconds,
          COUNT(DISTINCT session_id)      AS totalSessions,
          SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonSessions,
          COUNT(DISTINCT user_id)         AS uniqueUsers
        FROM user_sessions WHERE ${where}
      `, params);

      const topByTime = await executeQuery(`
        SELECT u.login, SUM(s.total_seconds) AS totalSeconds
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE ${where}
        GROUP BY s.user_id, u.login
        ORDER BY totalSeconds DESC
        LIMIT 10
      `, params);

      return { ...row, topByTime };
    } catch (_) {
      return { totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0, topByTime: [] };
    }
  }

  async getTimeStats() {
    try {
      const row = await getOne(`
        SELECT
          COALESCE(SUM(total_seconds), 0) AS totalSeconds,
          COUNT(DISTINCT session_id)      AS totalSessions,
          SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonSessions,
          COUNT(DISTINCT user_id)         AS uniqueUsers
        FROM user_sessions
      `);

      const todayRow = await getOne(`
        SELECT
          COALESCE(SUM(total_seconds), 0) AS totalSeconds,
          COUNT(DISTINCT session_id)      AS totalSessions,
          SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonSessions,
          COUNT(DISTINCT user_id)         AS uniqueUsers
        FROM user_sessions
        WHERE DATE(last_seen) = CURDATE()
      `);

      const monthRow = await getOne(`
        SELECT
          COALESCE(SUM(total_seconds), 0) AS totalSeconds,
          COUNT(DISTINCT session_id)      AS totalSessions,
          SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS anonSessions,
          COUNT(DISTINCT user_id)         AS uniqueUsers
        FROM user_sessions
        WHERE YEAR(last_seen) = YEAR(NOW()) AND MONTH(last_seen) = MONTH(NOW())
      `);

      const topByTime = await executeQuery(`
        SELECT u.login, SUM(s.total_seconds) AS totalSeconds
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        GROUP BY s.user_id, u.login
        ORDER BY totalSeconds DESC
        LIMIT 10
      `);

      const dailyChart = await executeQuery(`
        SELECT
          DATE(last_seen)                 AS day,
          COALESCE(SUM(total_seconds), 0) AS totalSeconds,
          COUNT(DISTINCT session_id)      AS sessions,
          COUNT(DISTINCT user_id)         AS uniqueUsers
        FROM user_sessions
        WHERE last_seen >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
        GROUP BY DATE(last_seen)
        ORDER BY day ASC
      `);

      return {
        ...row,
        today: todayRow,
        thisMonth: monthRow,
        topByTime,
        dailyChart,
      };
    } catch (_) {
      return {
        totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0,
        today: { totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0 },
        thisMonth: { totalSeconds: 0, totalSessions: 0, anonSessions: 0, uniqueUsers: 0 },
        topByTime: [],
        dailyChart: [],
      };
    }
  }
}

export default new SessionService();

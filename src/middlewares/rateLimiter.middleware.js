import { executeQuery } from '../config/database.js';

async function ensureTable() {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action VARCHAR(64) NOT NULL,
      ref_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_user_action_time (user_id, action, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
}

export function rateLimitByAction({ action, windowSeconds, maxCount, refIdFromParams = null }) {
  return async function rateLimiter(req, res, next) {
    try {
      if (!req.user?.id) return next();

      await ensureTable();

      const userId = req.user.id;
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowSeconds * 1000);
      const refId = refIdFromParams ? refIdFromParams(req) : null;

      // Pəncərə içində neçə fəaliyyət var?
      const rows = await executeQuery(
        `SELECT COUNT(*) as cnt
         FROM user_activity_logs
         WHERE user_id = ? AND action = ? AND created_at >= ?`,
        [userId, action, windowStart]
      );
      const count = rows?.[0]?.cnt || 0;

      if (count >= maxCount) {
        return res.status(429).json({
          status: 'error',
          message: 'Limit aşildi. Bir müddət sonra yenidən cəhd edin.'
        });
      }

      // Log yaz (fire-and-forget)
      executeQuery(
        `INSERT INTO user_activity_logs (user_id, action, ref_id) VALUES (?, ?, ?)`,
        [userId, action, refId]
      ).catch(() => {});

      next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      next();
    }
  };
}

export default rateLimitByAction;



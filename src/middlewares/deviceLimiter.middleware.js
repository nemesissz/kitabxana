import crypto from 'crypto';
import { executeQuery } from '../config/database.js';

function getClientIp(req) {
  const xfwd = req.headers['x-forwarded-for'];
  if (typeof xfwd === 'string' && xfwd.length > 0) {
    return xfwd.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '';
}

function buildDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLang = req.headers['accept-language'] || '';
  const ip = getClientIp(req) || '';
  const raw = `${userAgent}::${acceptLang}::${ip}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function ensureTables() {
  await executeQuery(
    `CREATE TABLE IF NOT EXISTS user_devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      device_fingerprint VARCHAR(128) NOT NULL,
      user_agent TEXT,
      ip VARCHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_device (user_id, device_fingerprint)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  );
}

export function deviceLimiter(maxDevices = 2) {
  return async function deviceLimiterMiddleware(req, res, next) {
    try {
      if (!req.user?.id) return next();

      await ensureTables();

      const userId = req.user.id;
      const userAgent = req.headers['user-agent'] || '';
      const ip = getClientIp(req) || '';
      const fingerprint = buildDeviceFingerprint(req);

      // Upsert cihaz
      await executeQuery(
        `INSERT INTO user_devices (user_id, device_fingerprint, user_agent, ip)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP, user_agent = VALUES(user_agent), ip = VALUES(ip)`,
        [userId, fingerprint, userAgent, ip]
      );

      // Aktiv cihaz sayını yoxla
      const devices = await executeQuery(
        `SELECT device_fingerprint FROM user_devices WHERE user_id = ? ORDER BY last_seen DESC`,
        [userId]
      );

      const isKnown = devices.some(d => d.device_fingerprint === fingerprint);
      const distinctCount = devices.length;

      if (!isKnown && distinctCount > maxDevices) {
        return res.status(403).json({
          status: 'error',
          message: `Bu hesabla maksimum ${maxDevices} cihazdan istifadə edilə bilər. Yeni cihaz təsbit edildi.`
        });
      }

      next();
    } catch (err) {
      console.error('Device limiter error:', err);
      next();
    }
  };
}

export default deviceLimiter;



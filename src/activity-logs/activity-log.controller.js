import activityLogService from './activity-log.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, eventType } = req.query;
    const scope = await resolveAdminScope(req.user);
    let institutionId = null;
    let actorEmail = null;

    if (scope.type === 'institution') {
      const { getOne } = await import('../config/database.js');
      const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [scope.institutionId]);
      if (!inst?.is_main) {
        institutionId = scope.institutionId;
      } else if (req.user.role === 2) {
        // Main institution worker — own logs only
        actorEmail = req.user.login;
      }
    } else if (req.query.institutionId) {
      institutionId = Number(req.query.institutionId) || null;
    }

    const result = await activityLogService.getLogs({ page, limit, eventType, institutionId, actorEmail });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

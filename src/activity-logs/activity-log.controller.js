import activityLogService from './activity-log.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, eventType } = req.query;
    const scope = await resolveAdminScope(req.user);
    let institutionId = scope.type === 'institution' ? scope.institutionId : null;
    if (scope.type !== 'institution' && req.query.institutionId) {
      institutionId = Number(req.query.institutionId) || null;
    }
    const result = await activityLogService.getLogs({ page, limit, eventType, institutionId });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

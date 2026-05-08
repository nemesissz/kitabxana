import activityLogService from './activity-log.service.js';

export const getActivityLogs = async (req, res, next) => {
  try {
    const { page, limit, eventType } = req.query;
    const result = await activityLogService.getLogs({ page, limit, eventType });
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

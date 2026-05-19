import sessionService from './session.service.js';

export const heartbeat = async (req, res, next) => {
  try {
    const { session_id, user_id, delta } = req.body;
    await sessionService.heartbeat({ session_id, user_id, delta });
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};

export const getTimeStats = async (req, res, next) => {
  try {
    const stats = await sessionService.getTimeStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (err) {
    next(err);
  }
};

export const getStatsByPeriod = async (req, res, next) => {
  try {
    const { period, value } = req.query;
    if (!period || !value) return res.status(400).json({ status: 'error', message: 'period və value tələb olunur' });
    if (!['day', 'month'].includes(period)) return res.status(400).json({ status: 'error', message: 'period: day | month' });
    const stats = await sessionService.getStatsByPeriod(period, value);
    res.status(200).json({ status: 'success', data: stats });
  } catch (err) {
    next(err);
  }
};

import settingsService from './settings.service.js';

export const getMyLimit = async (req, res, next) => {
  try {
    const limit_mb = await settingsService.getEffectiveLimitForUser(req.user.id);
    res.json({ status: 'success', data: { limit_mb } });
  } catch (err) { next(err); }
};

export const getAllLimits = async (req, res, next) => {
  try {
    const data = await settingsService.getAllLimits();
    res.json({ status: 'success', data });
  } catch (err) { next(err); }
};

export const setDefaultLimit = async (req, res, next) => {
  try {
    const { limit_mb } = req.body;
    if (!limit_mb || isNaN(limit_mb) || Number(limit_mb) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Düzgün limit daxil edin' });
    }
    const result = await settingsService.setDefaultLimit(Number(limit_mb), req.user.id);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

export const setInstitutionLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit_mb } = req.body;
    if (!limit_mb || isNaN(limit_mb) || Number(limit_mb) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Düzgün limit daxil edin' });
    }
    const result = await settingsService.setInstitutionLimit(Number(id), Number(limit_mb), req.user.id);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

export const removeInstitutionLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    await settingsService.removeInstitutionLimit(Number(id));
    res.json({ status: 'success', message: 'Limit sıfırlandı' });
  } catch (err) { next(err); }
};

export const setUserLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit_mb } = req.body;
    if (!limit_mb || isNaN(limit_mb) || Number(limit_mb) <= 0) {
      return res.status(400).json({ status: 'error', message: 'Düzgün limit daxil edin' });
    }
    const result = await settingsService.setUserLimit(Number(id), Number(limit_mb), req.user.id);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

export const removeUserLimit = async (req, res, next) => {
  try {
    const { id } = req.params;
    await settingsService.removeUserLimit(Number(id));
    res.json({ status: 'success', message: 'Limit sıfırlandı' });
  } catch (err) { next(err); }
};

export const getDailyUploadLimit = async (req, res, next) => {
  try {
    const limit = await settingsService.getDailyCountLimit();
    res.json({ status: 'success', data: { daily_upload_limit: limit } });
  } catch (err) { next(err); }
};

export const setDailyUploadLimit = async (req, res, next) => {
  try {
    const count = parseInt(req.body.daily_upload_limit);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ status: 'error', message: 'Düzgün limit daxil edin (0 = limitsiz)' });
    }
    const result = await settingsService.setDailyCountLimit(count);
    res.json({ status: 'success', data: result });
  } catch (err) { next(err); }
};

import settingsService from './settings.service.js';
import pdfService from '../pdfs/pdf.service.js';

export const getMyLimit = async (req, res, next) => {
  try {
    const result = await settingsService.getEffectiveLimitForUser(req.user.id);
    res.json({ status: 'success', data: result });
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

export const getHomepageCollage = async (req, res, next) => {
  try {
    const ids = await settingsService.getHomepageCollageIds();
    if (ids.length === 0) {
      const result = await pdfService.getAllPdfs({ limit: 8, sortBy: 'popular', status: 'approved' });
      return res.json({ status: 'success', data: { pdfs: result.pdfs, isCustom: false } });
    }
    const result = await pdfService.getAllPdfs({ ids, limit: 8, status: 'approved' });
    const ordered = ids.map(id => result.pdfs.find(p => p.id === id)).filter(Boolean);
    return res.json({ status: 'success', data: { pdfs: ordered, isCustom: true } });
  } catch (err) { next(err); }
};

export const setHomepageCollage = async (req, res, next) => {
  try {
    if ((req.user?.role ?? 0) < 4)
      return res.status(403).json({ status: 'error', message: 'Superadmin tələb olunur' });
    const { ids } = req.body;
    await settingsService.setHomepageCollageIds(ids || []);
    res.json({ status: 'success', message: 'Kollaj yeniləndi' });
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

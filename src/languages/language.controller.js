import languageService from './language.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';

export const getLanguages = async (req, res, next) => {
  try {
    const languages = await languageService.getAll();
    res.json({ status: 'success', data: { languages } });
  } catch (err) { next(err); }
};

export const addLanguage = async (req, res, next) => {
  try {
    const scope = await resolveAdminScope(req.user);
    if (scope.type === 'institution') {
      const lp = req.user.languagePermission;
      if (lp === 'none') return res.status(403).json({ status: 'error', message: 'Dil yaratma icazəniz yoxdur.' });
      if (lp !== 'direct') return res.status(403).json({ status: 'error', message: 'Dili birbaşa yarada bilməzsiniz. Sorğu göndərin.' });
    }
    const { code, name, flag } = req.body;
    const language = await languageService.add({ code, name, flag });
    res.status(201).json({ status: 'success', data: { language } });
  } catch (err) {
    if (err.message === 'code_exists')
      return res.status(409).json({ status: 'error', message: 'Bu dil kodu artıq mövcuddur' });
    if (err.message === 'code_and_name_required')
      return res.status(400).json({ status: 'error', message: 'Kod və ad tələb olunur' });
    next(err);
  }
};

export const removeLanguage = async (req, res, next) => {
  try {
    await languageService.remove(Number(req.params.id));
    res.json({ status: 'success', message: 'Dil silindi' });
  } catch (err) {
    if (err.message === 'not_found')
      return res.status(404).json({ status: 'error', message: 'Dil tapılmadı' });
    if (err.message === 'language_in_use')
      return res.status(400).json({ status: 'error', message: 'Bu dilə bağlı PDF-lər var. Əvvəlcə həmin PDF-ləri silin və ya başqa dilə köçürün.' });
    next(err);
  }
};

export const submitRequest = async (req, res, next) => {
  try {
    if (req.user.languagePermission === 'none') {
      return res.status(403).json({ status: 'error', message: 'Dil yaratma icazəniz yoxdur.' });
    }
    const { code, name, flag } = req.body;
    const userId = req.user.id;
    const institutionId = req.user.institutionId || null;
    const request = await languageService.submitRequest({ code, name, flag }, userId, institutionId);
    res.status(201).json({ status: 'success', data: { request } });
  } catch (err) {
    if (err.message === 'code_and_name_required')
      return res.status(400).json({ status: 'error', message: 'Kod və ad tələb olunur' });
    next(err);
  }
};

export const getRequests = async (req, res, next) => {
  try {
    const scope = await resolveAdminScope(req.user);
    const institutionId = scope.type === 'institution' ? scope.institutionId : null;
    const requests = await languageService.getRequests({ status: 'pending', institutionId });
    res.json({ status: 'success', data: { requests } });
  } catch (err) { next(err); }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId || null;
    const requests = await languageService.getRequests({ status: 'all', institutionId });
    res.json({ status: 'success', data: { requests } });
  } catch (err) { next(err); }
};

export const approveRequest = async (req, res, next) => {
  try {
    const result = await languageService.approveRequest(Number(req.params.id), req.user.id);
    res.json({ status: 'success', ...result });
  } catch (err) {
    if (err.message === 'not_found')
      return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
    if (err.message === 'already_processed')
      return res.status(400).json({ status: 'error', message: 'Sorğu artıq işlənib' });
    next(err);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const result = await languageService.rejectRequest(Number(req.params.id), req.user.id);
    res.json({ status: 'success', ...result });
  } catch (err) {
    if (err.message === 'not_found')
      return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
    if (err.message === 'already_processed')
      return res.status(400).json({ status: 'error', message: 'Sorğu artıq işlənib' });
    next(err);
  }
};

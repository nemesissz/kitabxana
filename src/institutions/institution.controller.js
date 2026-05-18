import institutionService from './institution.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';

const toWebPath = (p) => {
  if (!p) return null;
  const idx = p.indexOf('uploads');
  if (idx !== -1) return '/' + p.substring(idx).replace(/\\/g, '/');
  return p;
};

export const getAll = async (req, res, next) => {
  try {
    const institutions = await institutionService.getAll();
    res.json({ status: 'success', data: { institutions } });
  } catch (err) { next(err); }
};

export const getById = async (req, res, next) => {
  try {
    const institution = await institutionService.getById(Number(req.params.id));
    res.json({ status: 'success', data: { institution } });
  } catch (err) {
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const logo_path = req.file ? toWebPath(req.file.path) : null;
    const institution = await institutionService.create({ ...req.body, logo_path });
    res.status(201).json({ status: 'success', data: { institution } });
  } catch (err) {
    if (err.message === 'Name is required') return res.status(400).json({ status: 'error', message: 'Ad tələb olunur' });
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.logo_path = toWebPath(req.file.path);
    if (data.is_active !== undefined) data.is_active = data.is_active === 'true' || data.is_active === true || data.is_active === 1 ? 1 : 0;
    if (data.is_main !== undefined) data.is_main = data.is_main === 'true' || data.is_main === true || data.is_main === 1 ? 1 : 0;
    const institution = await institutionService.update(Number(req.params.id), data);
    res.json({ status: 'success', data: { institution } });
  } catch (err) {
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await institutionService.delete(Number(req.params.id));
    res.json({ status: 'success', message: 'Müəssisə silindi' });
  } catch (err) {
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const members = await institutionService.getMembers(Number(req.params.id));
    res.json({ status: 'success', data: { members } });
  } catch (err) {
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const assignUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ status: 'error', message: 'userId tələb olunur' });
    await institutionService.assignUser(Number(req.params.id), Number(userId));
    res.json({ status: 'success', message: 'İstifadəçi müəssisəyə əlavə edildi' });
  } catch (err) {
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const removeUser = async (req, res, next) => {
  try {
    await institutionService.removeUser(Number(req.params.userId));
    res.json({ status: 'success', message: 'İstifadəçi müəssisədən çıxarıldı' });
  } catch (err) { next(err); }
};

export const getPublic = async (req, res, next) => {
  try {
    const institutions = await institutionService.getPublic();
    res.json({ status: 'success', data: { institutions } });
  } catch (err) { next(err); }
};

export const createJoinRequest = async (req, res, next) => {
  try {
    await institutionService.createJoinRequest(req.user.id, Number(req.params.id));
    res.status(201).json({ status: 'success', message: 'Sorğunuz göndərildi' });
  } catch (err) {
    if (err.message === 'already_member') return res.status(400).json({ status: 'error', message: 'Artıq bu müəssisənin üzvüsünüz' });
    if (err.message === 'already_requested') return res.status(400).json({ status: 'error', message: 'Bu müəssisəyə artıq sorğu göndərmisiniz' });
    if (err.message === 'Institution not found') return res.status(404).json({ status: 'error', message: 'Müəssisə tapılmadı' });
    next(err);
  }
};

export const getJoinRequests = async (req, res, next) => {
  try {
    const scope = await resolveAdminScope(req.user);
    const institutionId = scope.type === 'institution' ? scope.institutionId : Number(req.query.institutionId);
    if (!institutionId) return res.status(400).json({ status: 'error', message: 'institutionId tələb olunur' });
    const requests = await institutionService.getJoinRequests(institutionId);
    res.json({ status: 'success', data: { requests } });
  } catch (err) { next(err); }
};

export const approveJoinRequest = async (req, res, next) => {
  try {
    await institutionService.approveJoinRequest(Number(req.params.id), req.user.id);
    res.json({ status: 'success', message: 'Sorğu təsdiqləndi' });
  } catch (err) {
    if (err.message === 'Request not found') return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
    next(err);
  }
};

export const rejectJoinRequest = async (req, res, next) => {
  try {
    await institutionService.rejectJoinRequest(Number(req.params.id), req.user.id);
    res.json({ status: 'success', message: 'Sorğu rədd edildi' });
  } catch (err) {
    if (err.message === 'Request not found') return res.status(404).json({ status: 'error', message: 'Sorğu tapılmadı' });
    next(err);
  }
};

import announcementService from './announcement.service.js';
import { resolveAdminScope } from '../middlewares/resolveScope.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadDir = join(__dirname, '..', '..', 'uploads', 'announcements');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `ann_${Date.now()}.${ext}`);
  },
});
export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function buildImageUrl(req, filename) {
  return filename ? `${req.protocol}://${req.get('host')}/uploads/announcements/${filename}` : null;
}

// Public — filtered by user's institution if authenticated
export const getActive = async (req, res, next) => {
  try {
    const userInstitutionId = req.user?.institutionId || null;
    const announcements = await announcementService.getActive(userInstitutionId);
    const data = announcements.map(a => ({
      ...a,
      image: buildImageUrl(req, a.image),
    }));
    res.json({ status: 'success', data: { announcements: data } });
  } catch (err) { next(err); }
};

// Admin list — scoped to own institution for non-main admins
export const getAll = async (req, res, next) => {
  try {
    const scope = await resolveAdminScope(req.user);
    const institutionId = scope.type === 'institution' ? scope.institutionId : null;
    const announcements = await announcementService.getAll(institutionId);
    const data = announcements.map(a => ({
      ...a,
      image: buildImageUrl(req, a.image),
    }));
    res.json({ status: 'success', data: { announcements: data } });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !description) {
      return res.status(400).json({ status: 'error', message: 'Ad və təsvir tələb olunur' });
    }
    const scope = await resolveAdminScope(req.user);
    const institution_id = scope.type === 'institution' ? scope.institutionId : null;
    const image = req.file ? req.file.filename : null;
    const ann = await announcementService.create({ title, description, image, priority, institution_id });
    res.status(201).json({ status: 'success', data: { announcement: { ...ann, image: buildImageUrl(req, ann.image) } } });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, is_active } = req.body;
    const scope = await resolveAdminScope(req.user);
    const institutionId = scope.type === 'institution' ? scope.institutionId : null;
    const image = req.file ? req.file.filename : undefined;
    const ann = await announcementService.update(id, { title, description, image, priority, is_active }, institutionId);
    res.json({ status: 'success', data: { announcement: { ...ann, image: buildImageUrl(req, ann.image) } } });
  } catch (err) {
    if (err.message === 'Elan tapılmadı') return res.status(404).json({ status: 'error', message: err.message });
    if (err.message.includes('icazəniz yoxdur')) return res.status(403).json({ status: 'error', message: err.message });
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const scope = await resolveAdminScope(req.user);
    const institutionId = scope.type === 'institution' ? scope.institutionId : null;
    await announcementService.delete(req.params.id, institutionId);
    res.json({ status: 'success', message: 'Elan silindi' });
  } catch (err) {
    if (err.message === 'Elan tapılmadı') return res.status(404).json({ status: 'error', message: err.message });
    if (err.message.includes('icazəniz yoxdur')) return res.status(403).json({ status: 'error', message: err.message });
    next(err);
  }
};

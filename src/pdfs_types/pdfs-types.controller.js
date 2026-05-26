import { getAll } from './pdfs-types.service.js';

export const getAllTypes = async (req, res, next) => {
  try {
    const types = await getAll();
    res.json({ status: 'success', data: { types } });
  } catch (e) {
    next(e);
  }
};

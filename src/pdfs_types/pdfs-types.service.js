import { executeQuery } from '../config/database.js';

const BASE_TYPES = ['kitab-elektron', 'kitab-fiziki', 'kitab-hər ikisi'];

export const getAll = async () => {
  await executeQuery(
    `INSERT IGNORE INTO pdfs_types (name) VALUES ${BASE_TYPES.map(() => '(?)').join(',')}`,
    BASE_TYPES
  ).catch(() => {});
  return executeQuery('SELECT * FROM pdfs_types ORDER BY id');
};

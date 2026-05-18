import { executeQuery, getOne, insert, deleteRecord } from '../config/database.js';

const WITH_INST = `
  SELECT a.id, a.title, a.description, a.image, a.priority,
         a.is_active, a.institution_id, a.created_at,
         i.name as institution_name
  FROM announcements a
  LEFT JOIN institutions i ON a.institution_id = i.id
`;

class AnnouncementService {
  // Public feed: filter by user's institution
  async getActive(userInstitutionId = null) {
    if (userInstitutionId) {
      return await executeQuery(
        `${WITH_INST}
         WHERE a.is_active = 1
           AND (a.institution_id IS NULL OR a.institution_id = ?)
         ORDER BY a.priority = 'urgent' DESC, a.created_at DESC`,
        [userInstitutionId]
      );
    }
    return await executeQuery(
      `${WITH_INST}
       WHERE a.is_active = 1 AND a.institution_id IS NULL
       ORDER BY a.priority = 'urgent' DESC, a.created_at DESC`
    );
  }

  // Admin list: global sees all, institution admin sees only own
  async getAll(institutionId = null) {
    if (institutionId) {
      return await executeQuery(
        `${WITH_INST} WHERE a.institution_id = ? ORDER BY a.created_at DESC`,
        [institutionId]
      );
    }
    return await executeQuery(`${WITH_INST} ORDER BY a.created_at DESC`);
  }

  async create({ title, description, image = null, priority = 'normal', institution_id = null }) {
    const insertId = await insert('announcements', {
      title, description, image, priority, is_active: 1, institution_id,
    });
    return await getOne(
      `${WITH_INST} WHERE a.id = ?`,
      [insertId]
    );
  }

  async update(id, { title, description, image, priority, is_active }, institutionId = null) {
    const existing = await getOne('SELECT id, institution_id FROM announcements WHERE id = ?', [id]);
    if (!existing) throw new Error('Elan tapılmadı');

    // Institution-scoped admin can only update their own announcements
    if (institutionId !== null && existing.institution_id !== institutionId) {
      throw new Error('Bu elanı redaktə etmək icazəniz yoxdur');
    }

    const fields = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (image !== undefined) fields.image = image;
    if (priority !== undefined) fields.priority = priority;
    if (is_active !== undefined) fields.is_active = is_active;

    if (Object.keys(fields).length > 0) {
      await executeQuery(
        `UPDATE announcements SET ${Object.keys(fields).map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...Object.values(fields), id]
      );
    }
    return await getOne(`${WITH_INST} WHERE a.id = ?`, [id]);
  }

  async delete(id, institutionId = null) {
    const existing = await getOne('SELECT id, institution_id FROM announcements WHERE id = ?', [id]);
    if (!existing) throw new Error('Elan tapılmadı');

    if (institutionId !== null && existing.institution_id !== institutionId) {
      throw new Error('Bu elanı silmək icazəniz yoxdur');
    }
    await deleteRecord('announcements', id);
  }
}

export default new AnnouncementService();

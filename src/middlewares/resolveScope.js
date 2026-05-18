import { getOne } from '../config/database.js';

/**
 * Resolve the admin's data scope.
 * - Superadmin (role >= 4): global scope
 * - İşçi/müdiri (role 2-3) from main institution (is_main=1): global scope
 * - İşçi/müdiri (role 2-3) from non-main institution: institution scope
 * - No institution assigned: global scope (legacy / early admins)
 * Returns: { type: 'global' } | { type: 'institution', institutionId: N }
 */
export async function resolveAdminScope(user) {
  if (!user || user.role >= 4) return { type: 'global' };
  if (!user.institutionId) return { type: 'global' };

  const inst = await getOne('SELECT is_main FROM institutions WHERE id = ?', [user.institutionId]);
  if (!inst) return { type: 'global' };
  // Only manager (role 3) from main institution gets global scope; workers (role 2) do not
  if (inst.is_main && user.role >= 3) return { type: 'global' };

  return { type: 'institution', institutionId: user.institutionId };
}

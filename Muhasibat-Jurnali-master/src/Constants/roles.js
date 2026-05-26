// Tək həqiqət mənbəyi — bütün komponentlər buradan import edir
//
// DB rol nömrələri (migrate-roles.sql çalışdırıldıqdan sonra):
//   1 = adi istifadəçi  (oxuyucu / töhfəçi — upload_permission ilə fərqlənir)
//   2 = kitabxana işçisi (worker_type ilə: 'elektron' | 'fiziki' | null)
//   3 = kitabxana müdiri
//   4 = super admin

// AdminProfilePage-də istifadə: ROLE_LABELS[user.role]
export const ROLE_LABELS = {
  1: "İstifadəçi",
  2: "Kitabxana işçisi",
  3: "Kitabxana müdiri",
  4: "Super Admin",
};

// ProfilPage-də istifadə: getRoleBadge(user) — workerType-a görə dinamik
export const ROLE_META = {
  1: { label: "İstifadəçi",       color: "#1565c0", bg: "#e3f2fd" },
  2: { label: "Kitabxana işçisi", color: "#1a7a3a", bg: "#e8f8ee" },
  3: { label: "Kitabxana müdiri", color: "#6a1b9a", bg: "#f3e5f5" },
  4: { label: "Super Admin",      color: "#b71c1c", bg: "#fce4ec" },
};

// AdminUsersPage-də istifadə: idarəetmə UI-nin kombine rolları
// Açar (1-5) → DB role + upload_permission + worker_type dəyərləri
export const COMBINED_ROLES = {
  1: { label: "Oxuyucu",          role: 1, upload_permission: "none",    worker_type: null,       color: "#888",    bg: "#f0f0f0" },
  2: { label: "Tövhəçi",          role: 1, upload_permission: "pending", worker_type: null,       color: "#b07d00", bg: "#fff8e1" },
  3: { label: "İşçi (elektron)",  role: 2, upload_permission: "free",    worker_type: "elektron", color: "#1a7a3a", bg: "#e8f8ee" },
  4: { label: "Kitabxana müdiri", role: 3, upload_permission: "free",    worker_type: null,       color: "#032062", bg: "#e8eaf6" },
  5: { label: "İşçi (fiziki)",    role: 2, upload_permission: "free",    worker_type: "fiziki",   color: "#7a4a1a", bg: "#fdf3e8" },
};

export const SUPERADMIN_BADGE = { label: "Baş kitabxana müdiri", color: "#7b1fa2", bg: "#f3e5f5" };

// İstifadəçi obyektini kombine rol açarına çevirir (AdminUsersPage üçün)
export function getCombinedRole(user) {
  if (user.role >= 3) return 4;
  if (user.role === 2 && user.workerType === 'fiziki') return 5;
  if (user.role === 2) return 3;
  if (user.uploadPermission === "pending") return 2;
  return 1;
}

// İstifadəçi üçün badge meta-sı qaytarır (rəng + etiket)
export function getRoleBadge(user) {
  if (user.role >= 4) return SUPERADMIN_BADGE;
  return COMBINED_ROLES[getCombinedRole(user)];
}

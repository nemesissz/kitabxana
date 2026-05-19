-- SuperAdmin hesabı yaratmaq
-- Şifrə: SuperAdmin555@
-- login-i öz seçiminizə görə dəyişdirin

INSERT INTO users (login, password, role, is_verified, upload_permission)
VALUES (
  'superadmin',
  '$2b$10$n9cP4xvBiRjd55jJT4oeG.GcmA2kEtigXoEYTEjMjyJTL7okHO1zm',
  4,
  1,
  'free'
);

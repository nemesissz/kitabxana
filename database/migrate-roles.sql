-- Variant A: 4-pilleli rol sistemi
-- role=1: adi istifadeci (oxuyucu / tovheci)
-- role=2: kitabxana iscisi (yeni)
-- role=3: kitabxana mudiri (eskiden role=2)
-- role=4: superadmin (eskiden role=3)

-- Adim 1: Movcud admin rollarini bir pillə yuxari sür (müdiri 2→3, superadmin 3→4)
UPDATE users SET role = role + 1 WHERE role >= 2;

-- Adim 2: Kitabxana iscilerini (role=1, upload_permission='free', muesisesi olan) role=2-ye yukselt
UPDATE users SET role = 2 WHERE role = 1 AND upload_permission = 'free' AND institution_id IS NOT NULL;

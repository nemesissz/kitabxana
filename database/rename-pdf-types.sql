-- PDF tip adlarını yenilə
UPDATE pdfs_types SET name = 'elektron kitab'  WHERE name = 'kitab-elektron';
UPDATE pdfs_types SET name = 'çap kitab'       WHERE name = 'kitab-fiziki';
UPDATE pdfs_types SET name = 'elektron və çap' WHERE name = 'kitab-hər ikisi';

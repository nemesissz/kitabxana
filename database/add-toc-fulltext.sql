-- Köhnə FULLTEXT indexi silib table_of_contents-i də əlavə edirik
ALTER TABLE pdfs DROP INDEX IF EXISTS ft_pdfs_search;
ALTER TABLE pdfs ADD FULLTEXT INDEX ft_pdfs_search (title, description, order_number, table_of_contents);

-- Seed default expense categories

INSERT INTO "public"."expense_categories" ("name", "budget_limit", "color")
VALUES 
    ('Gaji & Honor', 50000000, 'bg-emerald-500'),
    ('Sarana & Prasarana', 10000000, 'bg-blue-500'),
    ('ATK & Perlengkapan', 5000000, 'bg-amber-500'),
    ('Kegiatan Siswa', 15000000, 'bg-purple-500'),
    ('Listrik, Air & Internet', 3000000, 'bg-cyan-500'),
    ('Konsumsi', 2000000, 'bg-orange-500'),
    ('Lain-lain', 1000000, 'bg-gray-500')
ON CONFLICT ("name") DO NOTHING;

-- Sync sequence
SELECT setval('expense_categories_id_seq', COALESCE((SELECT MAX(id) FROM "public"."expense_categories"), 1));

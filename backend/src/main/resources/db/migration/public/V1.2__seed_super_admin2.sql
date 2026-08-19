-- V1.2__seed_super_admin2.sql
-- Seed Super Admin user superadmin2@gmail.com

INSERT INTO super_admin (id, email, password_hash, status, version, created_by, is_deleted)
VALUES ('00000000-0000-0000-0000-000000000002', 'superadmin2@gmail.com', '$2a$10$uoNhgNHS52G8iuEkYv5JHOTjpSP5KOhafn7zjp2K2dVuxatAxHl/y', 'ACTIVE', 0, 'system', false)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'ACTIVE';

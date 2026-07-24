-- V1.1__seed_super_admin.sql
-- Seed default Super Admin user for development login

INSERT INTO super_admin (id, email, password_hash, status, version, created_by, is_deleted)
VALUES ('00000000-0000-0000-0000-000000000000', 'superadmin@example.com', '$2a$10$4X8klwauTwbXLHBTSl7b7.M/pgCiWnDN.VZXXI9oZbr6orlnfbdIW', 'ACTIVE', 0, 'system', false)
ON CONFLICT (email) DO NOTHING;

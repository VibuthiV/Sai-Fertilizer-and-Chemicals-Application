-- ============================================================
-- Seed: 001_admin_user.sql
-- Description: Seeds the default admin user
-- Default credentials: admin / admin123
-- ⚠️  CHANGE THE PASSWORD BEFORE GOING TO PRODUCTION!
-- ============================================================

-- The password hash below is for: admin123
-- Generated with bcrypt, cost factor 12
-- To regenerate: node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 12));"

INSERT INTO users (username, password_hash, role, is_active, admin_name)
VALUES (
    'admin',
    '$2a$12$jPbTVnA/h6A204ezYfa..upjeaKcp5TPocTdbrJeHT9Pp2BixaIEa',
    'admin',
    TRUE,
    'Admin'
)
ON CONFLICT (username) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    updated_at = NOW();

SELECT 'Admin user seeded successfully ✅' AS result;
SELECT 'Username: admin | Password: admin123' AS credentials;
SELECT '⚠️  CHANGE PASSWORD BEFORE PRODUCTION!' AS warning;

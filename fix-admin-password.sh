#!/bin/bash

# Fix Admin Password Script
# Resets the admin password to 'admin123'

echo "🔧 Fixing Admin Password"
echo "======================="
echo ""

# Check if PostgreSQL container is running
if ! docker ps | grep -q admin-postgres; then
    echo "❌ Error: PostgreSQL container 'admin-postgres' is not running"
    echo "   Run: docker start admin-postgres"
    exit 1
fi

echo "📝 Resetting admin password to: admin123"
echo ""

# Generate bcrypt hash for 'admin123' (10 rounds)
# Hash: $2b$10$u9Jes/jgyMGikQJJpzxd3esujnQbnzZLVwFl7E2jJfekgW4qr.QqW

docker exec -i admin-postgres psql -U admin -d admin_system << 'EOF'
-- Update admin password
UPDATE users 
SET password_hash = '$2b$10$u9Jes/jgyMGikQJJpzxd3esujnQbnzZLVwFl7E2jJfekgW4qr.QqW'
WHERE email = 'admin@example.com';

-- Verify the update
SELECT email, role, is_active, 
       CASE 
         WHEN password_hash = '$2b$10$u9Jes/jgyMGikQJJpzxd3esujnQbnzZLVwFl7E2jJfekgW4qr.QqW' 
         THEN '✅ Password hash correct'
         ELSE '❌ Password hash incorrect'
       END as status
FROM users 
WHERE email = 'admin@example.com';

-- Clear all refresh tokens (force re-login)
DELETE FROM refresh_tokens WHERE user_id IN (
  SELECT id FROM users WHERE email = 'admin@example.com'
);

SELECT '✅ Cleared all refresh tokens for admin user' as result;
EOF

echo ""
echo "✅ Admin password has been reset!"
echo ""
echo "📋 Next steps:"
echo "1. Clear your browser storage (localStorage)"
echo "   - Press F12 → Application → Local Storage → Clear"
echo "2. Go to http://localhost:5173/admin/login"
echo "3. Login with:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""

# Made with Bob

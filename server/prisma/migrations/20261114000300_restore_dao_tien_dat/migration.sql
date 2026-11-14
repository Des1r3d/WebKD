INSERT INTO "users" (
    "id", "email", "password_hash", "full_name", "phone",
    "role", "reputation_score", "status"
)
SELECT 'usr-dat-01', 'dat.dt@synchub.vn',
       '$2b$10$6y8GsgbWJjx0UIU6WMCjy.9IC3UJYQLtNoiIKe5KMnxfVFoKHyyiu',
       'Đào Tiến Đạt', '0909234567', 'HOST', 98, 'ACTIVE'
FROM "users"
WHERE "id" = 'usr-host-01' AND "email" = 'nguyen.minh.phat@synchub.vn'
ON CONFLICT DO NOTHING;

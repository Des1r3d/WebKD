UPDATE "users" AS u
SET "full_name" = names.new_name
FROM (VALUES
    ('usr-host-01', 'Đào Tiến Đạt (Host)', 'Nguyễn Minh Phát'),
    ('usr-mem-02', 'Trần Quang Minh', 'Khương Thảo Vy'),
    ('usr-mem-03', 'Lê Hoàng Linh', 'Trần Minh Quang'),
    ('usr-mem-04', 'Nguyễn Tuấn Kiệt', 'Nguyễn Quang Bảo')
) AS names(id, old_name, new_name)
WHERE u."id" = names.id AND u."full_name" = names.old_name;

UPDATE "users" AS u
SET "email" = accounts.new_email
FROM (VALUES
    ('usr-host-01', 'dat.dt@synchub.vn', 'nguyen.minh.phat@synchub.vn'),
    ('usr-mem-02', 'minh.b@synchub.vn', 'khuong.thao.vy@synchub.vn'),
    ('usr-mem-03', 'linh.c@synchub.vn', 'tran.minh.quang@synchub.vn')
) AS accounts(id, old_email, new_email)
WHERE u."id" = accounts.id AND u."email" = accounts.old_email;

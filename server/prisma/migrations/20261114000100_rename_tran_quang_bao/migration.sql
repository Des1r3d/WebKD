UPDATE "users"
SET "full_name" = 'Trần Quang Bảo',
    "email" = 'tran.quang.bao@synchub.vn'
WHERE "id" = 'usr-mem-04'
  AND "email" = 'kiet.d@synchub.vn'
  AND "full_name" IN ('Nguyễn Quang Bảo', 'Nguyễn Tuấn Kiệt');

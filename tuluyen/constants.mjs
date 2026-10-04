const REALMS = [
  { index: 0,  name: "Phàm Nhân",           baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Luyện Khí",            baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Trúc Cơ",             baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Kim Đan",             baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Nguyên Anh",          baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Hóa Thần",            baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Động Hư",             baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Hợp Thể",             baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Đại Thừa",            baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Độ Kiếp",             baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Phi Tiên",            baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Chân Tiên",           baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Thiên Tiên",          baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Huyền Tiên",          baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Tiên Quân",           baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Tiên Vương",          baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Tiên Hoàng",          baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Tiên Đế",             baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Tiên Tôn",            baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Chuẩn Thần",          baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Chân Thần",           baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Thiên Thần",          baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Thần Vương",          baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Thần Hoàng",          baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Thần Đế",             baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Vĩnh Hằng Chân Thần", baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Thần Chủ",   baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn (Cảnh)",       baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Chân Thần",    baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Thần Chủ",     baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Sáng Thế Thần",        baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Hỗn Độn Đạo Tôn",      baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Cảnh",           baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Chân Thần",      baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Thần Chủ",       baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Cảnh",       baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Chân Thần",  baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Thần Chủ",   baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Cảnh",          baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Chân Thần (Cảnh)", baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Chí Tôn (Cảnh)",    baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Tiên Tôn (Cảnh)", baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Sáng Thế Đạo Tổ (Cảnh)",   baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Sáng Thế Thần Chủ (Cảnh)", baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Quy Tắc Chi Chủ (Cảnh)",   baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Đại Đạo Chi Chủ (Cảnh)",   baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Vạn Giới Chúa Tể (Cảnh)",  baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Giả (Cảnh)",    baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Bất Diệt Chân Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Hạn Nguyên Tôn (Cảnh)",  baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Hư Vô Tối Thượng (Cảnh)",  baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Đại La (Cảnh)",  baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Hỗn Nguyên Vô Cực (Cảnh)",   baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Đạo Tiên Tôn (Cảnh)",     baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Thần Tôn (Cảnh)",    baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Tạo Hóa Thánh Giả (Cảnh)",   baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Kỷ Nguyên Chúa Tể (Cảnh)",   baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Đạo Bổn Nguyên (Cảnh)",  baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Chân Mệnh Thiên Chủ (Cảnh)", baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Lăng Giá Cửu Thiên (Cảnh)",  baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Chí Tôn Căn Nguyên (Cảnh)",  baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Sơ Tiên Tôn (Cảnh)",    baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Thái Sơ Thần Tôn (Cảnh)",    baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Thái Sơ Chi Chủ (Cảnh)",     baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Thái Thủy Ngưng Tụ (Cảnh)",  baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thái Thủy Chân Nhân (Cảnh)", baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Thái Thủy Nguyên Tôn (Cảnh)", baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Thái Thủy Chi Chủ (Cảnh)",   baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Thái Tố Hóa Hình (Cảnh)",    baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Thái Tố Cổ Thần (Cảnh)",     baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Thái Tố Chí Tôn (Cảnh)",     baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Thái Tố Chi Chủ (Cảnh)",     baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Thái Cực Phân Lưỡng Nghi (Cảnh)", baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Thái Cực Đạo Quân (Cảnh)",   baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Thái Cực Thánh Nhân (Cảnh)", baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Thái Cực Chi Chủ (Cảnh)",    baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Vô Cực Hỗn Độn (Cảnh)",      baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Vô Cực Thiên Tôn (Cảnh)",    baseExp: 1e175, breakthroughRate: 0 },
];

const MA_REALMS = [
  { index: 0,  name: "Phàm Nhân",            baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Ngưng Huyết",           baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Đoạn Cốt",             baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Ma Đan",               baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Ma Anh",               baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Hóa Ma",               baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Luyện Hư",             baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Hợp Ma",               baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Ma Tướng",             baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Thiên Ma",             baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Ma Tiên",              baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Chân Ma",              baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Thiên Ma Vương",        baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Huyền Ma",             baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Ma Quân",              baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Ma Vương",             baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Ma Hoàng",             baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Ma Đế",               baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Huyết Đế",            baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Chuẩn Ma Thần",        baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Chân Ma Thần",         baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Thiên Ma Thần",        baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Ma Thần Vương",        baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Ma Thần Hoàng",        baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Ma Thần Đế",           baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Vĩnh Hằng Ma Thần",    baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Ma Chủ",     baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn Ma (Cảnh)",    baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Ma Thần",      baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Ma Chủ",       baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Diệt Thế Ma Thần",     baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Hỗn Độn Ma Đế",        baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Ma Cảnh",        baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Ma Thần",        baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Ma Chủ",         baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Ma Cảnh",    baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Ma Thần",    baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Ma Chủ",     baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Ma Cảnh",       baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Ma Thần (Cảnh)", baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Ma Tôn (Cảnh)",   baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Ma Tôn (Cảnh)", baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Sáng Thế Ma Tổ (Cảnh)",  baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Sáng Thế Ma Chủ (Cảnh)", baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Hủy Diệt Chi Chủ (Cảnh)", baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Cửu U Đại Đạo Chủ (Cảnh)", baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Vạn Ma Chúa Tể (Cảnh)",  baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Ma Thần (Cảnh)", baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Tịch Diệt Chân Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Tận Ma Tôn (Cảnh)",   baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Hỗn Độn Tối Thượng (Cảnh)", baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Ma La (Cảnh)", baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Hỗn Nguyên Oán Khí (Cảnh)",  baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Ma Tôn Giả (Cảnh)",       baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Ma Thần (Cảnh)",     baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Thôn Phệ Thánh Giả (Cảnh)",  baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Diệt Kỷ Cổ Ma (Cảnh)",       baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Ác Bổn Nguyên (Cảnh)",   baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Vô Dục Ma Chủ (Cảnh)",       baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Nghịch Loạn Cửu Thiên (Cảnh)", baseExp: 1e85, breakthroughRate: 0 },
  { index: 60, name: "Ác Quỷ Chí Tôn (Cảnh)",      baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Sơ Ma Tôn (Cảnh)",      baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Thái Sơ Tà Thần (Cảnh)",     baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Thái Sơ Ác Chủ (Cảnh)",      baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Nguyên Thủy Hóa Ma (Cảnh)",  baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thái Thủy Chân Ma (Cảnh)",   baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Thái Thủy Huyết Tôn (Cảnh)", baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Thái Thủy Ác Chủ (Cảnh)",    baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Thái Tố Ngưng Sát (Cảnh)",   baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Thái Tố Cổ Ma (Cảnh)",       baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Thái Tố Tà Tôn (Cảnh)",      baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Thái Tố Ma Chủ (Cảnh)",      baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Thái Cực Nghịch Lưỡng Nghi (Cảnh)", baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Thái Cực Ma Quân (Cảnh)",    baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Thái Cực Tà Nhân (Cảnh)",    baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Thái Cực Ác Chủ (Cảnh)",     baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Vô Cực Huyết Hải (Cảnh)",    baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Vô Cực Ma Tôn (Cảnh)",       baseExp: 1e175, breakthroughRate: 0 },
];

const NHO_REALMS = [
  { index: 0,  name: "Học Trò (Nhập Môn)",    baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Tu Tâm",                 baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Tu Thân",                baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Nhân Giả",               baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Nho Sinh",               baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Đức Hành",               baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Quân Tử",                baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Bất Hoặc",               baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Lập Mệnh",               baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Thiên Mệnh",             baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Đại Nho",                baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Á Thánh",                baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Thánh Nhân",             baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Đại Thánh",              baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Nho Thánh",              baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Khổng Thánh",            baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Mạnh Thánh",             baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Nhan Thánh",             baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Văn Đạo Chí Tôn",        baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Vạn Thế Sư Biểu",        baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Văn Khúc Tinh Quân",     baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Hạo Nhiên Đại Thánh",    baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Nhân Đạo Chí Thánh",     baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Thánh Đức Cổ Phật",      baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Đạo Tổ",                 baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Chí Cao Văn Đế",         baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Văn Chủ",     baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn Văn Thánh",     baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Văn Tổ",        baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Văn Chủ",       baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Văn Minh Khởi Nguyên",  baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Vĩnh Hằng Đạo Sư",      baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Văn Thánh",       baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Văn Tổ",          baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Văn Chủ",         baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Văn Thánh",   baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Văn Tổ",      baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Văn Chủ",     baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Văn Thánh",      baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Văn Tổ (Cảnh)", baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Văn Đế (Cảnh)",  baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Nho Tôn (Cảnh)", baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Sáng Thế Nho Tổ (Cảnh)", baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Sáng Thế Thánh Chủ (Cảnh)", baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Thiên Đạo Chi Chủ (Cảnh)", baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Vạn Pháp Đại Đạo Chủ (Cảnh)", baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Chư Thiên Thánh Tể (Cảnh)", baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Thánh Nhân (Cảnh)", baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Hạo Nhiên Chân Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Ngã Nho Tôn (Cảnh)",  baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Thái Mạc Tối Thượng (Cảnh)", baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Thánh Nhân (Cảnh)", baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Hỗn Nguyên Đạo Thư (Cảnh)",    baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Nho Tiên Tôn (Cảnh)",       baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Văn Thần (Cảnh)",      baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Giáo Hóa Thánh Giả (Cảnh)",    baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Trí Tuệ Chúa Tể (Cảnh)",       baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Tự Bổn Nguyên (Cảnh)",     baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Chân Lý Thiên Chủ (Cảnh)",     baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Minh Triết Cửu Thiên (Cảnh)",  baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Đạo Thư Căn Nguyên (Cảnh)",    baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Sơ Giáo Hóa (Cảnh)",      baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Thái Sơ Văn Tổ (Cảnh)",        baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Thái Sơ Thánh Nho (Cảnh)",     baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Nguyên Thủy Đạo Thư (Cảnh)",   baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thái Thủy Cổ Thánh (Cảnh)",   baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Thái Thủy Văn Quy (Cảnh)",    baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Thái Thủy Minh Đức (Cảnh)",   baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Thái Tố Ngưng Thư (Cảnh)",    baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Thái Tố Thánh Sư (Cảnh)",     baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Thái Tố Văn Đạo (Cảnh)",      baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Thái Tố Trí Tuệ (Cảnh)",      baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Thái Cực Lưỡng Nghi Kinh (Cảnh)", baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Thái Cực Hiền Giả (Cảnh)",    baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Thái Cực Thánh Quân (Cảnh)",  baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Thái Cực Giáo Chủ (Cảnh)",    baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Vô Cực Thánh Đức (Cảnh)",     baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Vô Cực Nho Tổ (Cảnh)",        baseExp: 1e175, breakthroughRate: 0 },
];

const YEU_REALMS = [
  { index: 0,  name: "Khai Trí (Nhập Môn)",  baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Tụ Khí",                baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Thối Thể",              baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Yêu Đan",               baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Hóa Hình",              baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Yêu Tướng",             baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Yêu Vương",             baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Đại Yêu",               baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Thiên Yêu",             baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Yêu Kiếp",              baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Yêu Tiên",              baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Chân Yêu",              baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Yêu Linh",              baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Huyền Yêu",             baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Yêu Quân",              baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Yêu Tôn",               baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Yêu Hoàng",             baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Yêu Đế",                baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Tổ Yêu",                baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Chuẩn Yêu Thần",        baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Chân Yêu Thần",         baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Thiên Yêu Thần",        baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Yêu Thần Vương",        baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Yêu Thần Hoàng",        baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Yêu Thần Đế",           baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Vĩnh Hằng Yêu Thần",    baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Yêu Chủ",     baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn Yêu (Cảnh)",    baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Yêu Tổ",        baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Yêu Chủ",       baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Khởi Nguyên Yêu Thần",  baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Hỗn Độn Cổ Yêu",        baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Yêu Cảnh",        baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Yêu Tổ",          baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Yêu Chủ",         baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Yêu Cảnh",    baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Yêu Tổ",      baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Yêu Chủ",     baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Yêu Cảnh",       baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Yêu Tổ (Cảnh)", baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Yêu Tôn (Cảnh)",  baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Yêu Tôn (Cảnh)", baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Sáng Thế Yêu Tổ (Cảnh)", baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Sáng Thế Thú Chủ (Cảnh)", baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Hoang Cổ Chi Chủ (Cảnh)", baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Vạn Sáng Đại Đạo Chủ (Cảnh)", baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Đại Hoang Chúa Tể (Cảnh)", baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Yêu Thần (Cảnh)", baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Bất Tử Thú Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Cực Yêu Tôn (Cảnh)",  baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Nguyên Thủy Tối Thượng (Cảnh)", baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Yêu La (Cảnh)", baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Hỗn Nguyên Hung Thú (Cảnh)",  baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Yêu Tiên Tôn (Cảnh)",      baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Thú Thần (Cảnh)",     baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Khai Nguyên Thánh Giả (Cảnh)", baseExp: 1e68, breakthroughRate: 0 },
  { index: 56, name: "Chư Tộc Chúa Tể (Cảnh)",      baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Thú Bổn Nguyên (Cảnh)",   baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Huyết Mạch Thiên Chủ (Cảnh)", baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Cuồng Nộ Cửu Thiên (Cảnh)",   baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Dã Tính Nguồn Cội (Cảnh)",    baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Sơ Tổ Thú (Cảnh)",       baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Thái Sơ Huyết Thể (Cảnh)",    baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Thái Sơ Thú Hoàng (Cảnh)",    baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Thái Thủy Hung Linh (Cảnh)",  baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thái Thủy Cổ Cự (Cảnh)",     baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Thái Thủy Cuồng Long (Cảnh)", baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Thái Thủy Độc Thú (Cảnh)",   baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Thái Tố Ngưng Huyết (Cảnh)", baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Thái Tố Cự Thú (Cảnh)",      baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Thái Tố Man Thể (Cảnh)",     baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Thái Tố Thú Đế (Cảnh)",      baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Thái Cực Đại Hoang Đồ (Cảnh)", baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Thái Cực Thần Thú (Cảnh)",   baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Thái Cực Cuồng Tôn (Cảnh)",  baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Thái Cực Hoàng Tể (Cảnh)",   baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Vô Cực Man Hoang (Cảnh)",    baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Vô Cực Yêu Đế (Cảnh)",       baseExp: 1e175, breakthroughRate: 0 },
];

const LO_REALMS = [
  { index: 0,  name: "Lọ Đồ (Nhập Môn)",       baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Luyện Lọ (Nháy)",         baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Trúc Lọ (Nháy)",          baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Kim Lọ (Nháy)",           baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Lọ Anh (Nháy)",           baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Hóa Lọ (Nháy)",           baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Ảo Lọ (Nháy)",            baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Hợp Lọ (Nháy)",           baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Đại Lọ (Nháy)",           baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Lọ Kiếp (Nháy)",          baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Lọ Tiên (Tầng)",          baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Chân Lọ (Tầng)",          baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Thiên Lọ (Tầng)",         baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Huyền Lọ (Tầng)",         baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Lọ Quân (Tầng)",          baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Lọ Vương (Tầng)",         baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Lọ Hoàng (Tầng)",         baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Tiên Lọ Đế (Tầng)",       baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Lọ Đế (Tầng)",            baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Chuẩn Lọ Thần (Tầng)",    baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Chân Lọ Thần (Tầng)",     baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Thiên Lọ Thần (Tầng)",    baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Lọ Thần Vương (Tầng)",    baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Lọ Thần Hoàng (Tầng)",    baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Lọ Thần Đế (Tầng)",       baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Vĩnh Hằng Lọ Thần (Tầng)", baseExp: 500000000000000,     breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Lọ Chủ (Tầng)",  baseExp: 1000000000000000,    breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn Lọ (Cảnh)",        baseExp: 5000000000000000,    breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Lọ Thần",          baseExp: 20000000000000000,   breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Lọ Chủ",           baseExp: 100000000000000000,  breakthroughRate: 0.01 },
  { index: 30, name: "Sáng Thế Lọ Thần",         baseExp: 500000000000000000,  breakthroughRate: 0.001 },
  { index: 31, name: "Tuyệt Thế Lọ Tôn",         baseExp: 1000000000000000000, breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Lọ Cảnh",            baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Lọ Thần",            baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Lọ Chủ",             baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Lọ Cảnh",        baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Lọ Tổ",          baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Lọ Chủ",         baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Lọ Cảnh",           baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Lọ Thần (Cảnh)",   baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Quỷ Thủ (Cảnh)",   baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Lọ Tôn (Cảnh)",  baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Cứu Thế Lọ Tổ (Cảnh)",    baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Tạo Lọ Thần Chủ (Cảnh)",  baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Quy Tắc Lọ Chủ (Cảnh)",   baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Lọ Đạo Chi Chủ (Cảnh)",   baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Vạn Nháy Chúa Tể (Cảnh)", baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Lọ Giả (Cảnh)", baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Bất Diệt Lọ Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Hạn Tốc Thủ (Cảnh)",  baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Tối Thượng Thần Lọ (Cảnh)", baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Đại Lọ (Cảnh)", baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Lọ Nguyên Vô Cực (Cảnh)",   baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Đạo Lọ Tôn (Cảnh)",      baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Độc Thủ (Cảnh)",    baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Tạo Hóa Thánh Thủ (Cảnh)",  baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Kỷ Nguyên Quay Tay (Cảnh)", baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Lọ Bổn Nguyên (Cảnh)",  baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Chân Mệnh Lọ Chủ (Cảnh)",   baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Lăng Giá Quần Tôn (Cảnh)",  baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Tối Cao Độc Thủ (Cảnh)",    baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Cổ Thận Tôn (Cảnh)",   baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Hoang Cổ Tốc Thủ (Cảnh)",   baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Vạn Kiếp Chấn Lọ (Cảnh)",   baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Thái Cổ Độc Thủ (Cảnh)",    baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thời Không Nháy (Cảnh)",   baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Tuế Nguyệt Đảo Lọ (Cảnh)", baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Xuyên Không Tốc Thủ (Cảnh)", baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Quang Âm Lọ Chủ (Cảnh)",   baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Cửu Lục Chí Tôn (Tư Thế)", baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Mộng Tinh Hư Cảnh (Cảnh)", baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Dục Vọng Chi Mộng (Cảnh)", baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Phá Mộng Lọ Tôn (Cảnh)",   baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Ảo Giác Tối Thượng (Cảnh)", baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Cường Thận Cảnh (Cảnh)",   baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Bổ Huyết Tôn Giả (Cảnh)",  baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Hồi Dương Lọ Chủ (Cảnh)",  baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Niết Bàn Độc Thủ (Cảnh)",  baseExp: 1e175, breakthroughRate: 0 },
];

const QUY_REALMS = [
  { index: 0,  name: "Du Hồn (Nhập Môn)",      baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Tụ Âm",                  baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Ngưng Hồn",              baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Âm Đan",                 baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Âm Anh",                 baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Hóa Quỷ",                baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Luyện Hồn",              baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Hợp Quỷ",                baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Quỷ Tướng",              baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Quỷ Kiếp",               baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Quỷ Tiên",               baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Chân Quỷ",               baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Thiên Quỷ",              baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Huyền Quỷ",              baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Quỷ Quân",               baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Quỷ Vương",              baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Quỷ Hoàng",              baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Quỷ Đế",                 baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Minh Đế",                baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Chuẩn Quỷ Thần",         baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Chân Quỷ Thần",          baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Thiên Quỷ Thần",         baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Quỷ Thần Vương",         baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Quỷ Thần Hoàng",         baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Quỷ Thần Đế",            baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "Vĩnh Hằng Âm Thần",      baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Vĩnh Hằng Minh Chủ",     baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Hỗn Độn Âm Quỷ",         baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Hỗn Độn Quỷ Thần",       baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Hỗn Độn Minh Chủ",       baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Diệt Hồn Thần",          baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Hỗn Độn Minh Đế",        baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Hư Vô Âm Cảnh",          baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Hư Vô Quỷ Thần",         baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Hư Vô Minh Chủ",         baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Hồng Mông Âm Cảnh",      baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Hồng Mông Quỷ Thần",     baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Hồng Mông Minh Chủ",     baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Bất Hủ Âm Cảnh",         baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Bất Hủ Quỷ Thần (Cảnh)", baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Bất Hủ Quỷ Tôn (Cảnh)",  baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Sáng Thế Quỷ Tôn (Cảnh)", baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Sáng Thế Quỷ Tổ (Cảnh)", baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Sáng Thế Minh Chủ (Cảnh)", baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Luân Hồi Chi Chủ (Cảnh)", baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Sinh Tử Đại Đạo Chủ (Cảnh)", baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Thập Điện Chúa Tể (Cảnh)", baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Siêu Thoát Minh Thần (Cảnh)", baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Vô Lượng Âm Linh (Cảnh)", baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Biên Quỷ Tôn (Cảnh)", baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "U Minh Tối Thượng (Cảnh)", baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Hỗn Nguyên Quỷ Khách (Cảnh)", baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Hỗn Nguyên Bất Tử (Cảnh)",   baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Cổ Quỷ Tiên Tôn (Cảnh)",     baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Viễn Cổ Minh Thần (Cảnh)",   baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Táng Diệt Thánh Giả (Cảnh)", baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Hoàng Tuyền Chúa Tể (Cảnh)", baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Vạn Tiên Bổn Nguyên (Cảnh)", baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Yểm Khí Thiên Chủ (Cảnh)",   baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Vô Định Cửu Thiên (Cảnh)",   baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Diêm La Khởi Nguyên (Cảnh)", baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Thái Sơ Vô Ảnh (Cảnh)",      baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Thái Sơ Oán Hồn (Cảnh)",     baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Thái Sơ Minh Thần (Cảnh)",   baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Thái Thủy Hóa Linh (Cảnh)",  baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Thái Thủy Cốt Tôn (Cảnh)",   baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Thái Thủy Yểm Thần (Cảnh)",  baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Thái Thủy Minh Vương (Cảnh)", baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Thái Tố Ngưng Phách (Cảnh)", baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Thái Tố Ma Anh (Cảnh)",      baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Thái Tố Âm Đế (Cảnh)",       baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Thái Tố Vong Linh (Cảnh)",   baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Thái Cực Luân Hồi Kinh (Cảnh)", baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Thái Cực Quỷ Tướng (Cảnh)",  baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Thái Cực Minh Quân (Cảnh)",  baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Thái Cực Tà Tể (Cảnh)",      baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Vô Cực Khổ Hải (Cảnh)",      baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Vô Cực Minh Tổ (Cảnh)",      baseExp: 1e175, breakthroughRate: 0 },
];

const PHAT_REALMS = [
  { index: 0,  name: "Phàm Nhân",           baseExp: 100,                  breakthroughRate: 100 },
  { index: 1,  name: "Phật Tử",             baseExp: 500,                  breakthroughRate: 90  },
  { index: 2,  name: "Tín Đồ",              baseExp: 2000,                 breakthroughRate: 80  },
  { index: 3,  name: "Thiện Nhân",           baseExp: 10000,                breakthroughRate: 70  },
  { index: 4,  name: "Tu Tâm",              baseExp: 50000,                breakthroughRate: 60  },
  { index: 5,  name: "Tịnh Tâm",            baseExp: 200000,               breakthroughRate: 50  },
  { index: 6,  name: "Minh Tâm",            baseExp: 800000,               breakthroughRate: 45  },
  { index: 7,  name: "Kiến Tánh",           baseExp: 3000000,              breakthroughRate: 40  },
  { index: 8,  name: "Ngộ Đạo",             baseExp: 10000000,             breakthroughRate: 35  },
  { index: 9,  name: "Khai Ngộ",            baseExp: 50000000,             breakthroughRate: 30  },
  { index: 10, name: "Sơ Thiền",            baseExp: 200000000,            breakthroughRate: 25  },
  { index: 11, name: "Nhị Thiền",           baseExp: 500000000,            breakthroughRate: 20  },
  { index: 12, name: "Tam Thiền",           baseExp: 1000000000,           breakthroughRate: 15  },
  { index: 13, name: "Tứ Thiền",            baseExp: 2500000000,           breakthroughRate: 12  },
  { index: 14, name: "Ngũ Thiền",           baseExp: 5000000000,           breakthroughRate: 10  },
  { index: 15, name: "Lục Thiền",           baseExp: 10000000000,          breakthroughRate: 8   },
  { index: 16, name: "Thất Thiền",          baseExp: 25000000000,          breakthroughRate: 6   },
  { index: 17, name: "Bát Thiền",           baseExp: 50000000000,          breakthroughRate: 5   },
  { index: 18, name: "Cửu Thiền",           baseExp: 100000000000,         breakthroughRate: 3   },
  { index: 19, name: "Thập Thiền",          baseExp: 500000000000,         breakthroughRate: 2   },
  { index: 20, name: "Kim Cương Tâm",       baseExp: 1000000000000,        breakthroughRate: 1.5 },
  { index: 21, name: "Kim Cương Thân",      baseExp: 5000000000000,        breakthroughRate: 1.2 },
  { index: 22, name: "Kim Cương Hồn",       baseExp: 20000000000000,       breakthroughRate: 1   },
  { index: 23, name: "Kim Cương Ý",         baseExp: 50000000000000,       breakthroughRate: 0.8 },
  { index: 24, name: "Kim Cương Niệm",      baseExp: 100000000000000,      breakthroughRate: 0.5 },
  { index: 25, name: "La Hán",              baseExp: 500000000000000,      breakthroughRate: 0.3 },
  { index: 26, name: "Đại La Hán",          baseExp: 1000000000000000,     breakthroughRate: 0.2 },
  { index: 27, name: "Chân La Hán",         baseExp: 5000000000000000,     breakthroughRate: 0.1 },
  { index: 28, name: "Kim Cương La Hán",    baseExp: 20000000000000000,    breakthroughRate: 0.05 },
  { index: 29, name: "Vô Lậu La Hán",       baseExp: 100000000000000000,   breakthroughRate: 0.01 },
  { index: 30, name: "Địa Tạng",            baseExp: 500000000000000000,   breakthroughRate: 0.001 },
  { index: 31, name: "Văn Thù",             baseExp: 1000000000000000000,  breakthroughRate: 0 },
  { index: 32, name: "Phổ Hiền",            baseExp: 100000000000000000000,      breakthroughRate: 0.001 },
  { index: 33, name: "Quan Âm",             baseExp: 10000000000000000000000,    breakthroughRate: 0.0005 },
  { index: 34, name: "Đại Bồ Tát",          baseExp: 1000000000000000000000000,  breakthroughRate: 0.0001 },
  { index: 35, name: "Chân Bồ Tát",         baseExp: 100000000000000000000000000,      breakthroughRate: 0 },
  { index: 36, name: "Kim Cương Bồ Tát",    baseExp: 10000000000000000000000000000,    breakthroughRate: 0 },
  { index: 37, name: "Vô Lượng Bồ Tát",     baseExp: 1000000000000000000000000000000,  breakthroughRate: 0 },
  { index: 38, name: "Pháp Tướng Bồ Tát",   baseExp: 100000000000000000000000000000000, breakthroughRate: 0 },
  { index: 39, name: "Pháp Thân Bồ Tát",    baseExp: 1e34, breakthroughRate: 0 },
  { index: 40, name: "Chuẩn Phật",          baseExp: 1e36, breakthroughRate: 0 },
  { index: 41, name: "Bán Phật",            baseExp: 1e38, breakthroughRate: 0 },
  { index: 42, name: "Chân Phật",           baseExp: 1e40, breakthroughRate: 0 },
  { index: 43, name: "Đại Phật",            baseExp: 1e42, breakthroughRate: 0 },
  { index: 44, name: "Thiên Phật",          baseExp: 1e44, breakthroughRate: 0 },
  { index: 45, name: "Vạn Phật",            baseExp: 1e46, breakthroughRate: 0 },
  { index: 46, name: "Cổ Phật",             baseExp: 1e48, breakthroughRate: 0 },
  { index: 47, name: "Thánh Phật",          baseExp: 1e50, breakthroughRate: 0 },
  { index: 48, name: "Kim Cương Phật",      baseExp: 1e52, breakthroughRate: 0 },
  { index: 49, name: "Vô Lượng Phật",       baseExp: 1e54, breakthroughRate: 0 },
  { index: 50, name: "Vô Thượng Phật",      baseExp: 1e56, breakthroughRate: 0 },
  { index: 51, name: "Pháp Tắc Phật",       baseExp: 1e58, breakthroughRate: 0 },
  { index: 52, name: "Đại Đạo Phật",        baseExp: 1e60,  breakthroughRate: 0 },
  { index: 53, name: "Hồng Mông Phật",      baseExp: 1e62,  breakthroughRate: 0 },
  { index: 54, name: "Hỗn Độn Phật",        baseExp: 1e65,  breakthroughRate: 0 },
  { index: 55, name: "Thời Không Phật",     baseExp: 1e68,  breakthroughRate: 0 },
  { index: 56, name: "Nhân Quả Phật",       baseExp: 1e71,  breakthroughRate: 0 },
  { index: 57, name: "Luân Hồi Phật",       baseExp: 1e75,  breakthroughRate: 0 },
  { index: 58, name: "Sinh Diệt Phật",      baseExp: 1e80,  breakthroughRate: 0 },
  { index: 59, name: "Vạn Pháp Phật",       baseExp: 1e85,  breakthroughRate: 0 },
  { index: 60, name: "Chư Thiên Phật",      baseExp: 1e90,  breakthroughRate: 0 },
  { index: 61, name: "Chư Giới Phật",       baseExp: 1e95,  breakthroughRate: 0 },
  { index: 62, name: "Chư Đạo Phật",        baseExp: 1e100, breakthroughRate: 0 },
  { index: 63, name: "Vạn Cổ Phật",         baseExp: 1e105, breakthroughRate: 0 },
  { index: 64, name: "Bất Diệt Phật",       baseExp: 1e110, breakthroughRate: 0 },
  { index: 65, name: "Bất Hủ Phật",         baseExp: 1e115, breakthroughRate: 0 },
  { index: 66, name: "Bất Tử Phật",         baseExp: 1e120, breakthroughRate: 0 },
  { index: 67, name: "Vô Sinh Phật",        baseExp: 1e125, breakthroughRate: 0 },
  { index: 68, name: "Vô Diệt Phật",        baseExp: 1e130, breakthroughRate: 0 },
  { index: 69, name: "Vô Ngã Phật",         baseExp: 1e135, breakthroughRate: 0 },
  { index: 70, name: "Vô Tướng Phật",       baseExp: 1e140, breakthroughRate: 0 },
  { index: 71, name: "Vô Niệm Phật",        baseExp: 1e145, breakthroughRate: 0 },
  { index: 72, name: "Vô Cực Phật",         baseExp: 1e150, breakthroughRate: 0 },
  { index: 73, name: "Vô Lượng Phật Tổ",    baseExp: 1e155, breakthroughRate: 0 },
  { index: 74, name: "Chí Cao Phật Tổ",     baseExp: 1e160, breakthroughRate: 0 },
  { index: 75, name: "Vạn Phật Chi Tổ",     baseExp: 1e165, breakthroughRate: 0 },
  { index: 76, name: "Phật Đạo Chi Chủ",    baseExp: 1e170, breakthroughRate: 0 },
  { index: 77, name: "Phật Đạo Chí Tôn",    baseExp: 1e175, breakthroughRate: 0 },
  { index: 78, name: "Vô Thượng Niết Bàn",  baseExp: 1e180, breakthroughRate: 0 },
];

const MINOR_REALM_NAMES = {
  1: "Tầng 1", 2: "Tầng 2", 3: "Tầng 3", 4: "Tầng 4", 5: "Tầng 5",
  6: "Tầng 6", 7: "Tầng 7", 8: "Tầng 8", 9: "Tầng 9",
};

const TALENTS = {
  pham:      { name: "Phàm Nhân",          multiplier: 1.0, emoji: "⚪", ngoBase: 10, phucBase: 10 },
  binh:      { name: "Bình Thường",         multiplier: 1.2, emoji: "🟢", ngoBase: 22, phucBase: 15 },
  uu:        { name: "Ưu Tú",              multiplier: 1.5, emoji: "🔵", ngoBase: 38, phucBase: 22 },
  thien_tai: { name: "Thiên Tài",           multiplier: 2.0, emoji: "🟡", ngoBase: 58, phucBase: 32 },
  thien_tu:  { name: "Thiên Tư Quốc Sắc",  multiplier: 3.0, emoji: "🟠", ngoBase: 78, phucBase: 50 },
  thien_co:  { name: "Thiên Cơ Chi Tử",    multiplier: 5.0, emoji: "🔴", ngoBase: 95, phucBase: 72 },
};

const TALENT_WEIGHTS = [
  { key: "pham", weight: 30 }, { key: "binh", weight: 28 }, { key: "uu", weight: 20 },
  { key: "thien_tai", weight: 13 }, { key: "thien_tu", weight: 7 }, { key: "thien_co", weight: 2 },
];

const WEAPONS = [
  { id: "w1",         name: "Thiết Kiếm",             emoji: "⚔️",  atk: 50,                    hp: 0,       spd: 0,     crit: 1,   def: 0,     lifesteal: 0,  price: 100,            tier: "common",  desc: "Kiếm sắt thường, trang bị cơ bản cho người mới nhập môn." },
  { id: "w_dep_1",    name: "Dép Tổ Ong",              emoji: "🩴",  atk: 120,                   hp: 0,       spd: 0,     crit: 100, def: 0,     lifesteal: 0,  trueDmg: 100,  price: 120,            tier: "common",  desc: "[Vũ Khí Của Mẹ] Bay là trúng, trúng là đau. Crit 100%, ST Chuẩn 100% — không thứ giáp nào đỡ nổi!" },
  { id: "w_ice_1",    name: "Băng Vũ Kiếm",            emoji: "🧊",  atk: 90,                    hp: 0,       spd: 5,     crit: 1,   def: 0,     lifesteal: 0,  price: 250,            tier: "common",  desc: "Kiếm băng phách sơ cấp, chém ra hơi lạnh." },
  { id: "w2",         name: "Thanh Phong Kiếm",         emoji: "🌬️", atk: 150,                   hp: 0,       spd: 10,    crit: 2,   def: 0,     lifesteal: 0,  price: 500,            tier: "common",  desc: "Kiếm nhẹ tựa gió, tăng tốc độ ra đòn." },
  { id: "w3",         name: "Huyết Đao",               emoji: "🔪",  atk: 300,                   hp: -100,    spd: 0,     crit: 5,   def: 0,     lifesteal: 0,  price: 1500,           tier: "rare",    desc: "Đao tà khí, tăng mạnh sát thương nhưng hao tổn sinh lực." },
  { id: "w_thunder_1",name: "Lôi Đình Trượng",          emoji: "⚡",  atk: 1600,                  hp: 0,       spd: 0,     crit: 12,  def: 0,     lifesteal: 0,  price: 6000,           tier: "rare",    desc: "Trượng chứa sấm sét, tê liệt kẻ thù." },
  { id: "w4",         name: "Lôi Thần Búa",             emoji: "🔨",  atk: 1000,                  hp: 0,       spd: 0,     crit: 10,  def: 50,    lifesteal: 0,  price: 5000,           tier: "rare",    desc: "Búa thần chứa sấm sét, sức công phá hủy diệt." },
  { id: "w5",         name: "Hỏa Long Kiếm",            emoji: "🔥",  atk: 2500,                  hp: 500,     spd: 0,     crit: 15,  def: 0,     lifesteal: 0,  price: 10000,          tier: "rare",    desc: "Kiếm rèn từ vảy rồng lửa, thiêu đốt mọi kẻ thù." },
  { id: "w6",         name: "Băng Phách Thần Châm",     emoji: "❄️",  atk: 5000,                  hp: 0,       spd: 50,    crit: 30,  def: 0,     lifesteal: 0,  price: 20000,          tier: "epic",    desc: "Châm lạnh thấu xương, tấn công điểm yếu (Crit cao)." },
  { id: "w9",         name: "Vạn Hồn Phiên",            emoji: "👻",  atk: 8000,                  hp: 0,       spd: 0,     crit: 15,  def: 0,     lifesteal: 10, price: 30000,          tier: "epic",    desc: "Phiên vũ khí tụ hồn, hút máu kẻ địch (10% Life Steal)." },
  { id: "w_nho_1",    name: "Thiên Quan Bút",           emoji: "🖌️", atk: 5000,                  hp: 0,       spd: 0,     crit: 0,   def: 500,   lifesteal: 0,  price: 8000,           tier: "epic",    desc: "Bút lông ngự ban, nét chữ chứa hạo nhiên khí." },
  { id: "w7",         name: "Hiên Viên Kiếm",           emoji: "🗡️",  atk: 10000,                 hp: 0,       spd: 0,     crit: 0,   def: 2000,  lifesteal: 0,  price: 50000,          tier: "epic",    desc: "Thánh kiếm của hoàng đế, mang lại may mắn và sức mạnh." },
  { id: "w_lo_1",     name: "Giấy Vệ Sinh Bạch Kim",   emoji: "🧻",  atk: 15000,                 hp: -5000,   spd: 300,   crit: 25,  def: 0,     lifesteal: 0,  price: 40000,          tier: "epic",    desc: "Lau dọn mọi vết tích, tốc độ vung vẩy cực nhanh." },
  { id: "w10",        name: "Tháp Thần Kiếm",           emoji: "🗼",  atk: 15000,                 hp: 0,       spd: 150,   crit: 25,  def: 0,     lifesteal: 0,  price: 200000,         tier: "epic",    desc: "Tầng 10: Kiếm thần từ tháp. Có tiền là mua được!" },
  { id: "w_mid_1",    name: "Thất Tinh Kiếm",           emoji: "🌟",  atk: 30000,                 hp: 0,       spd: 100,   crit: 20,  def: 0,     lifesteal: 0,  price: 90000,          tier: "legend",  desc: "Kiếm khắc bảy ngôi sao, dẫn động tinh lực." },
  { id: "w_nho_2",    name: "Xuân Thu Bút",             emoji: "📜",  atk: 40000,                 hp: 0,       spd: 0,     crit: 0,   def: 2000,  lifesteal: 0,  price: 100000,         tier: "legend",  desc: "Bút viết nên lịch sử, trấn áp tà ma." },
  { id: "w_mid_2",    name: "Phá Thiên Kích",           emoji: "💥",  atk: 75000,                 hp: 0,       spd: 0,     crit: 25,  def: 5000,  lifesteal: 0,  price: 200000,         tier: "legend",  desc: "Kích phá vỡ bầu trời, sức mạnh kinh hoàng." },
  { id: "w11",        name: "Thiên Long Thương",         emoji: "🐉",  atk: 50000,                 hp: 0,       spd: 0,     crit: 30,  def: 0,     lifesteal: 0,  price: 500000,         tier: "legend",  desc: "Tầng 40: Thương rồng trời. Giá chát nhưng chất." },
  { id: "w_mid_3",    name: "Cửu Kiếp Kiếm",            emoji: "☠️",  atk: 130000,                hp: 0,       spd: 500,   crit: 30,  def: 0,     lifesteal: 2,  price: 350000,         tier: "legend",  desc: "Kiếm qua chín kiếp luân hồi, sát khí ngút trời." },
  { id: "w_lo_2",     name: "Chuột Gaming RGB",          emoji: "🖱️", atk: 150000,                hp: 0,       spd: 2000,  crit: 50,  def: -10000, lifesteal: 0,  price: 350000,         tier: "legend",  desc: "Click liên hoàn! Tốc độ bàn thờ, phòng thủ bằng 0." },
  { id: "w8",         name: "Tru Tiên Kiếm",            emoji: "⚡",  atk: 200000,                hp: 0,       spd: 0,     crit: 40,  def: 0,     lifesteal: 5,  price: 150000,         tier: "vip",     desc: "Kiếm tiên giới rơi xuống phàm trần. Sát thần diệt phật!" },
  { id: "w12",        name: "Hồng Hoang Búa",            emoji: "🔱",  atk: 80000,                 hp: 0,       spd: 0,     crit: 25,  def: 5000,  lifesteal: 0,  price: 2000000,        tier: "vip",     desc: "Tầng 70: Búa thái cổ. Đã bị phong ấn một phần sức mạnh." },
  { id: "w_vip_2",    name: "Hiên Viên Thần Kiếm",      emoji: "👑",  atk: 500000,                hp: 0,       spd: 0,     crit: 50,  def: 0,     lifesteal: 10, price: 550000,         tier: "vip",     desc: "Thánh kiếm của Hoàng Đế. Thống nhất tam giới!" },
  { id: "w_god_1",    name: "Thần Ma Diệt Thế Kiếm",    emoji: "🌑",  atk: 500000000000000,       hp: 0,       spd: 0,     crit: 60,  def: 0,     lifesteal: 15, price: 100000000,      tier: "god",     desc: "Kiếm diệt thế, chém đứt luân hồi." },
  { id: "w_god_2",    name: "Táng Thiên Kiếm",          emoji: "🌌",  atk: 1000000000000000,      hp: 0,       spd: 0,     crit: 100, def: 0,     lifesteal: 25, price: 500000000,      tier: "god",     desc: "Kiếm chôn vùi cả bầu trời." },
  { id: "w_divine_1", name: "Vô Thượng Kiếm",           emoji: "✨",  atk: 3000000000000000,      hp: 0,       spd: 12000000, crit: 40, def: 0,   lifesteal: 0,  price: 6000000000,    tier: "supreme", desc: "Thanh kiếm của thần linh." },
  { id: "w_supreme_1",name: "Khai Thiên Phủ",           emoji: "🌠",  atk: 9007199254740992,      hp: 0,       spd: 15000000, crit: 100, def: 0, lifesteal: 25, price: 10000000000,   tier: "supreme", desc: "Sức mạnh khai thiên tích địa. Bỏ qua 50% DEF." },
  { id: "w_tinhvan_1",name: "Tinh Vân Kiếm",            emoji: "☁️",  atk: 500000000000000000,    hp: 0,       spd: 1000000000, crit: 100, def: 0, lifesteal: 30, trueDmg: 10, critDmg: 25, bossScale: 95, price: 50000000000, tier: "supreme", desc: "[THẦN THOẠI] Kiếm tinh vân chém phá thiên hà. ATK 500Qa, hút máu 30%, ST Bạo +25%, ST Chuẩn 10%, kháng 95% Boss Scaling Tháp (thay thế kháng từ giáp)." },
  { id: "w_legendary_1", name: "Thạch Phong Thần Kiếm", emoji: "🗿", atk: 40000000000000000, hp: 0, spd: 0, crit: 0, def: 0, lifesteal: 40, critDmg: 20, dmgReduction: 5, price: 0, tier: "mythical", noShop: true, desc: "[THẦN THOẠI] Kiếm thần thoại bị cắm trong đá ngàn năm. Chỉ kẻ có duyên mới rút ra được (.tl rutkiem — 0.5%). Hút máu 40%, ST Bạo +20%, Giảm thương 5%." },
  { id: "w_yama_1",    name: "Yama - Vong Giả Chi Đao", emoji: "☠️", atk: 100000000000000000, hp: 0, spd: 100000000000, crit: 60, def: 0, lifesteal: 0, trueDmg: 40, price: 0, tier: "mythical", noShop: true, desc: "[NGUYỀN RỦA] Kiếm của Yama - vua cõi chết. Chỉ những kẻ dám liều mạng mời gọi cái chết mới được nó công nhận (.tl thurut). ATK 100Qa, SPD 100B, CRIT 60%, ST Chuẩn 40%. Cầm nó mới có thể gây sát thương lên Boss Hỗn Độn (cảnh 27)." },
  { id: "w_tushita_1", name: "Tushita - Hóa Nhạc Kiếm", emoji: "🌸", atk: 100000000000000000, hp: 0, spd: 100000000000, crit: 60, def: 0, lifesteal: 0, trueDmg: 40, price: 0, tier: "mythical", noShop: true, desc: "[NGUYỀN RỦA] Kiếm của Tushita - chúa tể lạc viên. Hạ gục Boss Hỗn Độn (cảnh 27) khi đang cầm Yama để đoạt kiếm từ tay nó. ATK 100Qa, SPD 100B, CRIT 60%, ST Chuẩn 40%." },
  { id: "w_oden_2",    name: "Oden - Song Kiếm Trảm Long", emoji: "⚔️", atk: 200000000000000000, hp: 0, spd: 200000000000, crit: 120, def: 0, lifesteal: 0, trueDmg: 80, price: 0, tier: "supreme", noShop: true, desc: "[HUYỀN THOẠI] Song kiếm Oden sinh ra khi Yama phản ứng với Tushita - hai linh hồn kiếm hợp nhất. Chỉ số cộng dồn của cả hai: ATK 200Qa, SPD 200B, CRIT 120%, ST Chuẩn 80%. KHÔNG thể mua ở bất kỳ đâu." },
  { id: "w_oden_3",    name: "Oden - Song Kiếm Thức Tỉnh", emoji: "🔱", atk: 400000000000000000, hp: 0, spd: 200000000000, crit: 120, def: 0, lifesteal: 0, trueDmg: 80, price: 0, tier: "supreme", noShop: true, desc: "[THỨC TỈNH] Song kiếm Oden sau khi hấp thụ linh khí của Thạch Phong Thần Kiếm. ATK ×2 (400Qa), SPD 200B, CRIT 120%, ST Chuẩn 80%. Chỉ có thể tạo bằng .tl thuctinh." },
  { id: "w_error_1",   name: "Glitch Kiếm",               emoji: "👾", atk: 1000000000000000000,    hp: 0,  spd: 0, crit: 50, def: 0, lifesteal: 30, critDmg: 60, price: 120000000000, tier: "mythical", desc: "[LỖI HỔNG THỰC TẠI] Thanh kiếm bị lỗi dữ liệu rơi ra từ khe hở thế giới. ATK 1Qi, hút máu 30%, ST Bạo +60%, Tỉ lệ Bạo Kích +50%. Đôi khi nó... biến mất rồi xuất hiện lại sau lưng đối thủ." },
  { id: "w_tdai_1",    name: "TĐai Kiếm",                 emoji: "👑", atk: 1000000000000000000000000, hp: 500000000000000000000, spd: 0, crit: 0, def: 0, lifesteal: 60, critDmg: 60, trueDmg: 30, dmgReduction: 10, price: 500000000000, tier: "supreme", desc: "[THƯỢNG TỐN] Kiếm của vị quản lý tu tiên giới. ATK 1Sp, HP 500Qi, ST Bạo +60% (khi crit ×2.6 dame), ST Chuẩn 30% (bỏ qua 30% giảm thương), Hút máu 60%, Giảm 10% ST (kể cả phản). Sở hữu nó nghĩa là được chính Đạo Tổ công nhận." },
  { id: "w_fire_1",    name: "Kiếm Lửa",                  emoji: "🔥", atk: 100000000000000000, hp: 0, spd: 0, crit: 10, def: 0, lifesteal: 0, trueDmg: 0, critDmg: 0, price: 0, tier: "mythical", noShop: true, burnDmg: 1, healReduce: 35, desc: "[LỬA CỦA THẦN CHẾT] Kiếm được rèn từ lửa thiêng. ATK 100Qa, CRIT +10%, Bỏ qua giảm thương. Đánh trúng gây hiệu ứng thiêu đốt 1% máu tối đa địch mỗi hiệp, giảm 35% hiệu quả hút máu/hồi máu kẻ địch trong trận." },
  { id: "w_reaper_1",  name: "Lưỡi Hái Tử Thần",          emoji: "💀", atk: 120000000000000000, hp: 0, spd: 0, crit: 0, def: 0, lifesteal: 0, trueDmg: 0, critDmg: 0, price: 0, tier: "mythical", noShop: true, bypassDR: true, dodgePen: 15, desc: "[TỬ THẦN] Lưỡi hái của Thần Chết. ATK 120Qa, Bỏ qua hoàn toàn giảm thương, xuyên 15% né đòn." },
];

// ── CHỢ ĐỒ CŨ: vũ khí hư hỏng (½ chỉ số, giá rẻ hơn) ──
// Giá = 50%~54% giá gốc (vd: Tàng Thiên Kiếm 500tr → 250tr~270tr), cố định theo ID
function oldPricePct(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 997;
  return 50 + (h % 5);
}

export const OLD_WEAPONS = WEAPONS
  .filter(w => w.price >= 100000 && !w.noShop)
  .map(w => {
    const pct = oldPricePct(w.id);
    const half = (v) => (typeof v === "number" ? Math.floor(v / 2) : v);
    return {
      ...w,
      id: `old_${w.id}`,
      name: `${w.name} (Bị Hỏng ½)`,
      emoji: w.emoji,
      atk: half(w.atk),
      hp: half(w.hp ?? 0),
      spd: half(w.spd ?? 0),
      crit: half(w.crit ?? 0),
      def: half(w.def ?? 0),
      lifesteal: half(w.lifesteal ?? 0),
      ...(w.critDmg !== undefined ? { critDmg: half(w.critDmg) } : {}),
      ...(w.bossScale !== undefined ? { bossScale: half(w.bossScale) } : {}),
      price: Math.max(1, Math.floor(w.price * pct / 100)),
      tier: "old",
      desc: `[ĐỒ CŨ] ${w.name} hư hỏng nặng, chỉ còn nửa sức mạnh — bán giá rẻ.`,
    };
  });

// Cho vào danh sách WEAPONS để equip/bag/calcStats/tra cứu hoạt động như vũ khí thường
WEAPONS.push(...OLD_WEAPONS);

const ARMORS = [
  // ── Chung / Đặc Biệt ──
  { id: "a_vip",   name: "Thái Hư Giáp",             emoji: "🛡️", dao: "",      def: 30000, hp: 200000,   spd: 50,                                 price: 100000,  desc: "Giáp hư không, miễn nhiễm bụi trần. (VIP)" },
  { id: "a1",      name: "Áo Vải",                   emoji: "👕", dao: "",      def: 20,    hp: 100,                                                            price: 100,     desc: "Áo vải thô sơ, che thân là chính." },
  { id: "a2",      name: "Hộ Tâm Giáp",              emoji: "🛡️", dao: "",      def: 100,   hp: 500,                                                            price: 500,     desc: "Giáp che ngực bằng sắt, bảo vệ tim mạch." },
  { id: "a3",      name: "Thiên Tằm Y",              emoji: "🧥", dao: "",      def: 300,   hp: 2000,    spd: 20,                                 price: 1500,    desc: "Dệt từ tơ Thiên Tằm, nhẹ và bền, tăng thân pháp." },
  { id: "a4",      name: "Huyền Vũ Giáp",            emoji: "🐢", dao: "",      atk: -50,  def: 1000,   hp: 10000,                             price: 5000,    desc: "Giáp nặng tựa núi, phòng thủ tuyệt đối nhưng giảm tốc độ." },
  { id: "a5",      name: "Liệt Hỏa Giáp",            emoji: "🔥", dao: "",      atk: 200,  def: 2000,   hp: 5000,                             price: 10000,   desc: "Giáp lửa bao quanh, vừa phòng thủ vừa thiêu đốt kẻ địch." },
  { id: "a6",      name: "Hàn Băng Y",               emoji: "❄️", dao: "",      def: 3000,  hp: 15000,   spd: 50,                                 price: 20000,   desc: "Áo choàng băng giá, làm chậm kẻ địch, tăng tốc bản thân." },
  { id: "a_mid_1", name: "Bạch Hổ Giáp",             emoji: "🐯", dao: "",      atk: 100,  def: 5000,   hp: 30000,                             price: 30000,   desc: "Giáp da Bạch Hổ, tăng khả năng sát phạt." },
  { id: "a_mid_2", name: "Chu Tước Y",               emoji: "🐦", dao: "",      def: 12000, hp: 80000,   spd: 100,                                price: 60000,   desc: "Áo lông Chu Tước, rực lửa tái sinh." },
  { id: "a_god_1", name: "Bất Diệt Kim Thân",        emoji: "🛡️", dao: "",      def: 200000000000000, hp: 2000000000000000, spd: 500000, dmgReduction: 5, bossScale: 10, price: 100000000, desc: "Kim thân bất diệt, vạn pháp bất xâm. Kháng 10% Boss Scaling. (GOD TIER)" },
  { id: "a_god_2", name: "Thái Cổ Thần Giáp",        emoji: "🌐", dao: "",      def: 120000000000, hp: 500000000000, dmgReduction: 10, price: 500000000, desc: "Giáp thần cổ đại, vạn hộ thể. Giảm 10% ST nhận vào." },
  { id: "a_hdang_1", name: "Di Vật Cựu Admin",       emoji: "🏛️", dao: "",      def: 1000000000000000000000000, hp: 1000000000000000000000000, atk: 500000000000000000000, crit: 50, critDmg: 30, dmgReduction: 50, reflect: 50, price: 500000000000, desc: "[DI VẬT] Vị cựu admin đã để lại. DEF 1Sp, HP 1Sp, ATK 500Qi, Tỉ lệ Bạo 50%, ST Bạo +30%, Giảm 50% ST, Phản 50%." },
  { id: "a_bomkeo", name: "Bom Keo",                 emoji: "🧨", dao: "",      atk: 1000000000000000000, hp: 1000000000000000000000, dmgReduction: 40, price: 120000000000, desc: "[ĐẶC BIỆT] Vừa ngọt vừa nổ! HP 1Sx, ATK 1Qi, Giảm 40% ST nhận vào. Ngọt thì ăn, nổ là bay!" },

  // ── Nho Đạo ──
  { id: "a_nho_1", name: "Áo Vải Nho Sinh",          emoji: "🎓", dao: "nho",   def: 4000,  hp: 30000,                             price: 15000,   desc: "Áo vải giản dị nhưng được thánh hiền che chở." },
  { id: "a_nho_2", name: "Sách Thánh Hiền",          emoji: "📖", dao: "nho",   def: 10000, hp: 100000,                            price: 80000,   desc: "Sách chứa đạo lý thánh hiền, vạn pháp bất xâm (Pháp Bảo)." },
  { id: "a_nho_3", name: "Thánh Hiền Bảo Y",         emoji: "🕊️", dao: "nho",   def: 50000, hp: 300000, reflect: 15,                      price: 250000,  desc: "Bảo y của bậc thánh hiền, phản chấn yêu tà." },
  { id: "a_nho_5", name: "Vạn Thế Sư Biểu Bào",      emoji: "🎓", dao: "nho",   def: 20000000000000000, hp: 1000000000000000000, luck: 20000, reflect: 75, expBonus: 100, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Trường bào Thánh Hiền. Phản 75% ST, x2 EXP, kháng 90% Boss Scaling." },

  // ── Lọ Đạo ──
  { id: "a_lo_1",  name: "Quần Đùi Mặc Nhà",         emoji: "🩳", dao: "lo",    def: 10,    hp: 500,     spd: 500,                                price: 15000,   desc: "Cực kỳ mỏng mát, gia tăng sự cơ động lên mức tối đa." },
  { id: "a_lo_2",  name: "Áo Choàng Tàng Hình (Fake)", emoji: "🕶️", dao: "lo", def: -5000, hp: -100000, spd: 3000, crit: 30,               price: 150000,  desc: "Đã mỏng manh nay còn tự bóp. Đổi lại là tốc độ kinh hoàng" },
  { id: "a_lo_5",  name: "Thái Cổ Độc Thủ Vô Ảnh Bào", emoji: "🕶️", dao: "lo", atk: 50000000000000000, hp: 5000000000000000, spd: 60000000000000000, crit: 100, dodge: 40, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Giáp độc quyền Lọ Đạo. +100% Bạo Kích, Siêu Tốc Độ, Né 40%, kháng 90% Boss Scaling." },

  // ── Chính Đạo ──
  { id: "a_chinh_1", name: "Hạo Nhiên Bào",          emoji: "⚪", dao: "chinh", def: 800,   hp: 5000,                             price: 2000,    desc: "Trường bào tràn đầy chính khí." },
  { id: "a_chinh_2", name: "Kim Quang Giáp",         emoji: "🥇", dao: "chinh", def: 5000,  hp: 30000,                            price: 15000,   desc: "Giáp vàng rực rỡ, hộ thể an nhiên." },
  { id: "a_chinh_3", name: "Thái Hư Thánh Giáp",     emoji: "✨", dao: "chinh", def: 25000, hp: 150000,                            price: 50000,   desc: "Thánh giáp hư vô, vạn tà bất xâm." },
  { id: "a_chinh_4", name: "Vạn Đạo Bất Hủ Bào",     emoji: "🌟", dao: "chinh", def: 50000000, hp: 1000000000,                    price: 1000000, desc: "Bất hủ vĩnh hằng, vạn đạo quy nhất." },
  { id: "a_chinh_5", name: "Cửu Thiên Huyền Kinh Giáp", emoji: "👑", dao: "chinh", def: 50000000000000000, hp: 2000000000000000000, dmgReduction: 60, maxDmgPct: 8, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Giáp chín tầng trời. Giảm 60% ST, Chặn ST tối đa 8% HP, kháng 90% Boss Scaling." },

  // ── Ma Đạo ──
  { id: "a_ma_1",  name: "Huyết Sát Y",              emoji: "🩸", dao: "ma",    atk: 300,  def: 200,    spd: 100,                             price: 2500,    desc: "Y phục nhuộm máu quân thù, tăng sát khí." },
  { id: "a_ma_2",  name: "Cửu Ma Giáp",              emoji: "💀", dao: "ma",    atk: 1500, def: 1000,   spd: 500,                             price: 18000,   desc: "Giáp được luyện từ chín đại ma đầu." },
  { id: "a_ma_5",  name: "Thái Cổ Ma Thần Giáp",     emoji: "💀", dao: "ma",    atk: 20000000000000000, def: 10000000000000000, spd: 10000000000000000, lifesteal: 40, armorPen: 50, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Chiến giáp Ma Thần. Hút 40% ST, Bỏ qua 50% DEF, kháng 90% Boss Scaling." },

  // ── Yêu Đạo ──
  { id: "a_yeu_5", name: "Khởi Nguyên Hồng Hoang Giáp", emoji: "🐾", dao: "yeu", def: 100000000000000000, hp: 100000000000000000000, spd: -2000, reflect: 60, dmgReduction: 40, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Giáp nguyên thủy. Phản 60% ST, Giảm 40% ST, kháng 90% Boss Scaling." },

  // ── Quỷ Đạo ──
  { id: "a_quy_5", name: "U Minh Luân Hồi Y",        emoji: "👻", dao: "quy",   hp: 80000000000000000, spd: 30000000000000000, crit: 30, dodge: 35, trueDmg: 5, bossScale: 90, price: 50000000000, desc: "[THẦN THOẠI] Y phục Luân Hồi. Né 35%, 5% ST Chuẩn, kháng 90% Boss Scaling." },

  // ── Phật Đạo ──
  { id: "a_phat_1", name: "Cà Sa Kinh Mẫu",          emoji: "🪷", dao: "phat",  atk: 50,    hp: 2000,    dmgReduction: 5,                       price: 5000,    desc: "Cà sa dệt từ kinh văn, che chở đệ tử Phật môn. Giảm 5% ST nhận vào." },
  { id: "a_phat_2", name: "Áo Cà Sa",                emoji: "🥋", dao: "phat",  atk: 5000,  hp: 50000,   reflect: 10, dmgReduction: 15,          price: 1500000, desc: "Áo cà sa trang nghiêm, phản chấn tà ma. Phản 10% ST, Giảm 15% ST nhận vào." },
  { id: "a_phat_3", name: "Phù Sa Chú",              emoji: "📿", dao: "phat",  hp: 50000000, beguanNoInjury: true,                            price: 5000000, desc: "Bùa hộ mệnh Phật môn. HP +50M. Nội tại: đang mặc khi bế quan quá giờ vẫn mất EXP nhưng miễn nhiễm trọng thương." },
  { id: "a_phat_5", name: "Bảo Hộ Thần Thánh",       emoji: "🪷", dao: "phat",  hp: 5e21, maxDmgPct: 50, bossScale: 90,                  price: 50000000000, desc: "[THẦN THOẠI] Hộ thể Phật quang. HP +5Sx, chặn ST tối đa 50% HP mỗi đòn (địch mạnh cỡ nào cũng cần 2 hit), kháng 90% Boss Scaling. Upgrade chỉ tăng HP gốc, không tăng % nội tại." },
];

const POTIONS = [
  { id: "1",  name: "Huyết Khí Đan",       price: 30,          emoji: "🔴", desc: "Hồi phục toàn bộ HP và chữa trị thương thế ngay lập tức." },
  { id: "2",  name: "Tụ Linh Đan",          price: 70,          emoji: "🌀", desc: "Tăng 20% EXP cho lần tu luyện/bí cảnh tới." },
  { id: "3",  name: "Hộ Tâm Đan",           price: 120,         emoji: "💛", desc: "Giảm 50% thời gian bị thương nếu tẩu hỏa." },
  { id: "4",  name: "Đột Phá Đan",          price: 2500,        emoji: "⚡", desc: "Mỗi viên +10% tỉ lệ đột phá thành công. Cộng dồn, chỉ có tác dụng trong 1 lần đột phá (.dp) kế tiếp." },
  { id: "5",  name: "Hồi Thể Đan",          price: 100,         emoji: "🟢", desc: "Hồi phục 100 điểm thể lực." },
  { id: "6",  name: "Tẩy Tủy Đan",          price: 5000000,     emoji: "🌟", desc: "Random lại chỉ số vĩnh viễn (Căn Cốt, Thể Chất, Vận Mệnh) và giới hạn tu luyện." },
  { id: "7",  name: "Thông Tuệ Đan",        price: 150,         emoji: "🔵", desc: "Tăng 5-10 điểm Ngộ Tính vĩnh viễn (trong ngày)." },
  { id: "8",  name: "Hồng Phúc Đan",        price: 25000,       emoji: "🍀", desc: "Tăng mạnh Phúc Duyên (+200) trong 60 phút." },
  { id: "9",  name: "Bổ Thiên Đan",         price: 200,         emoji: "⏰", desc: "Tăng giới hạn tu luyện thêm 60 phút (trong ngày)." },
  { id: "10", name: "Quỷ Hồn Đan",          price: 15000,       emoji: "👻", desc: "Nhận ngay 10.000 EXP." },
  { id: "11", name: "Yêu Huyết Đan",        price: 250,         emoji: "🩸", desc: "Hồi 100% HP và tăng 10% HP Max trong ngày." },
  { id: "20", name: "Huyết Sát Đan",        price: 300,         emoji: "🔪", desc: "Ma: +30% Tốc độ. Chính: +30% Tốc độ, Trừ 50% HP hiện tại." },
  { id: "21", name: "Âm Hồn Đan",           price: 3000,        emoji: "🌑", desc: "Ma: +5000 EXP. Chính: +2000 EXP, +50% Rủi ro." },
  { id: "22", name: "Nghịch Thiên Đan",     price: 1000,        emoji: "🌊", desc: "Ma: Full HP & Thể Lực. Chính: Full HP, Trừ 5 Phúc Duyên." },
  { id: "23", name: "Thanh Tâm Đan",        price: 300,         emoji: "🍃", desc: "Chính: Giảm 50% Rủi ro. Ma: Giảm 30% EXP tu luyện." },
  { id: "24", name: "Sinh Mệnh Đan",        price: 800,         emoji: "❤️‍🔥", desc: "Chính: Hồi 100% HP & Thể Lực. Ma: Mất 90% HP." },
  { id: "25", name: "Ma Khí Tán",           price: 750,         emoji: "🖤", desc: "Ma: +500 EXP, +5% Risk. Chính: +100 EXP, +10% Risk." },
  { id: "26", name: "Tĩnh Tâm Trà",        price: 50,          emoji: "🍵", desc: "Chính: -10% Rủi ro. Ma: -5% Rủi ro, -500 EXP." },
  { id: "27", name: "Hộ Mệnh Đan",          price: 150,         emoji: "🛡️", desc: "Giảm 30% sát thương nhận trong lần thám hiểm bí cảnh tiếp theo." },
  { id: "28", name: "Thám Hiểm Đan",        price: 200,         emoji: "🗺️", desc: "Tăng 25% EXP nhận được từ bí cảnh lần tới." },
  { id: "29", name: "Tầm Bảo Đan",          price: 250,         emoji: "💎", desc: "Tăng 20% tỷ lệ rơi vật phẩm quý trong lần thám hiểm tới." },
  { id: "30", name: "Bùa Tốc Hành",         price: 100,         emoji: "💨", desc: "Tạm thời +20% SPD trong 30 phút." },
  { id: "31", name: "Bùa Hộ Mạng",          price: 150,         emoji: "🔮", desc: "Tạm thời +30% HP trong 60 phút." },
  { id: "32", name: "Bùa Thần Lực",         price: 200,         emoji: "💪", desc: "Tạm thời +25% ATK trong 60 phút." },
  { id: "33", name: "Thẻ Tốc Độ",           price: 500,         emoji: "🃏", desc: "Tăng 100% (x2) EXP tu luyện trong 24 giờ." },
  { id: "35", name: "Thất Sát Phù",         price: 500000,      emoji: "📜", desc: "Giảm 50% sức mạnh Scaling của Boss trong 60 phút." },
  { id: "36", name: "Thiên Thiên Bảo Hộ",  price: 900000,      emoji: "🏯", desc: "Giới hạn sát thương nhận tối đa 15% HP mỗi đòn trong Tháp (60 phút)." },
  { id: "37", name: "Thần Hành Đan",        price: 15000,       emoji: "🏃", desc: "Tăng x2 tốc độ thám hiểm Bí Cảnh trong lần tiếp theo." },
  { id: "38", name: "Dẫn Hồn Hương",        price: 20000,       emoji: "🕯️", desc: "Thu hút Boss, x2 tỷ lệ sự kiện đặc biệt trong Bí Cảnh." },
  { id: "39", name: "Hàu Sữa Đại Bổ",      price: 1500,        emoji: "🦪", desc: "Hồi phục 500 Thể Lực (Dành riêng cho Lọ Đạo)." },
  { id: "43", name: "Đơn Tâm Đan",          price: 1500000,     emoji: "🌀", desc: "Phá bỏ giới hạn: mỗi đòn TRÚNG vào Boss trong Tháp Ma Tôn gây tối thiểu 1.5% HP Boss (30 phút). Boss né thì không có dame." },
  { id: "50", name: "Cuồng Bạo Đan",        price: 500,         emoji: "🔥", desc: "Tăng 20% ATK, giảm 10% DEF trong 30 phút." },
  { id: "51", name: "Kim Chung Đan",         price: 500,         emoji: "🔔", desc: "Tăng 20% DEF, giảm 10% SPD trong 30 phút." },
  { id: "52", name: "Tật Phong Đan",         price: 500,         emoji: "🌬️", desc: "Tăng 20% SPD trong 30 phút." },
  { id: "60", name: "Thần Tài Đan",          price: 2000,        emoji: "🪙", desc: "Tăng 10% tiền thắng cược trong 5 ván tiếp theo." },
  { id: "61", name: "Tán Tài Đan",           price: 1000,        emoji: "💸", desc: "Hoàn trả 10% tiền thua cược trong 5 ván tiếp theo." },
  { id: "70", name: "Tẩy Tâm Đan",           price: 5000,        emoji: "🕊️", desc: "Xóa 1 điểm PK (Giảm nghiệp chướng)." },
];

const CONGPHA = [
  { id: "34", name: "Bí Kiếp Cửu Chuyền Thể", emoji: "📜", price: 5000, maxStamina: 600, desc: "Tăng giới hạn Thể Lực lên 600 (vĩnh viễn)." },
  { id: "213", name: "Bách Mạch Thông Thể", emoji: "🌊", price: 500000000, maxStamina: 1600, desc: "Yêu cầu học Bí Kiếp Cửu Chuyền Thể (id 34). Giới hạn Thể Lực +1000, đạt 1600 (vĩnh viễn)." },
];

const SPECIAL_ITEMS = [
  { id: "phong_thuat", name: "Phong Thuật", emoji: "🌪️", price: 20000000000, primeRequired: 2, desc: "Kỹ năng bị động. Trong PK, lượt đầu phóng Phong Cuồng Nộ: gây 50% ATK cơ bản (không thể crit), giảm 30% hiệu quả né của địch và tăng 50% né cho bản thân trong lượt tấn công kế tiếp của địch." },
  { id: "hoa_thuat", name: "Hỏa Thuật", emoji: "🔥", price: 50000000000, primeRequired: 2, desc: "Kỹ năng bị động. Trong PK, lượt đầu phóng Hỏa Diệt Thế: giảm 10% hiệu quả hồi máu của địch, thiêu đốt địch 1% máu tối đa mỗi hiệp và tăng 5% sát thương bản thân trong trận." },
  { id: "thien_loi", name: "Thiên Lôi Thuật", emoji: "⚡", price: 100000000000, primeRequired: 2, vipRequired: 4, desc: "Đặc quyền VIP 4. Kỹ năng bị động. Trong PK, lượt đầu giáng Thiên Lôi: gây 30% máu tối đa của địch và giảm 20% hiệu quả hút máu của địch trong trận." },
];

// ── PHÁP BẢO (trang bị đặc biệt, slot riêng) ────────────────
const PHAP_BAO = [
  { id: "pb_legendary_1", name: "Thiên Tôn Ấn",       emoji: "🔮", atk: 100000,     def: 50000,     hp: 1000000,      expBonus: 0,    price: 10000000,      tier: "legend",  desc: "Ấn triện của Thiên Tôn. Chỉ dành cho đại gia siêu cấp. (🏆 Tầng 100)" },
  { id: "pb_kyu_cauldron", name: "Cửu Châu Đỉnh",     emoji: "🫕", atk: 100000000000000, def: 50000000000000, hp: 1000000000000000, expBonus: 100, price: 12000000000, tier: "mythical", desc: "Đỉnh luyện hóa cả cửu châu. (TU VI — EXP +100%)" },
  { id: "pb_pangu_seal",   name: "Bàn Cổ Thần Ấn",    emoji: "🏺", atk: 20000000000000000, def: 8000000000000000, hp: 2000000000000000000, expBonus: 0, bossScale: 100, price: 25000000000, tier: "mythical", desc: "Thần ấn của Bàn Cổ, trấn áp chư thiên. Kháng 100% Boss Scaling. (TỐI THƯỢNG)" },
  { id: "pb_taiji_chart",  name: "Thái Cực Đồ",      emoji: "☯️", atk: 0,          def: 5000000000000000, hp: 0,           expBonus: 0,    reflect: 50,    price: 15000000000, tier: "mythical", desc: "Bản đồ thái cực, chuyển hóa âm dương. Phản 50% sát thương. (PHÒNG NGỰ)" },
  { id: "pb_donghuang_bell", name: "Đông Hoàng Chuông", emoji: "🔔", atk: 0,       def: 0,          hp: 500000000000000000, expBonus: 20, price: 15000000000, tier: "mythical", desc: "Tiếng chuông vang vọng khắp thái cổ. (KHÍ VẬN — EXP +20%, HP vô song)" },
];

// ── DANH HIỆU ──────────────────────────────────────────────
const TITLES = [
  { id: "manh_thuong_quan", name: "Mạnh Thường Quân", emoji: "💰", hpPct: 5, atkPct: 5, ltBonusPct: 0, specialEffect: null, condition: "Tổng donate ≥ 1.000đ", desc: "Thiên hạ đại phú, generosity siêu phàm. +5% HP, +5% ATK." },
  { id: "hoan_vu_chi_cao", name: "Hoàn Vũ Chí Cao", emoji: "🌌", hpPct: 0, atkPct: 0, ltBonusPct: 20, specialEffect: "oneHitQuote", condition: "Top 3 Lực Chiến toàn server", desc: "Vô địch thiên hạ. +20% LT khi được bank. Khi One Hit hoặc kết liễu: 'Pháp tắc dòng thời không nhấn chìm ngươi mãi mãi chìm vào vô cực'." },
];

function checkAutoTitles(player) {
  if (!player.titles) player.titles = [];
  const donated = player.donated || 0;
  let newTitle = null;
  if (donated >= 1000 && !player.titles.includes("manh_thuong_quan")) {
    player.titles.push("manh_thuong_quan");
    newTitle = "manh_thuong_quan";
  }
  return newTitle;
}

function checkTop3Title(data) {
  if (!data || !data.players) return [];
  const granted = [];
  const entries = Object.entries(data.players)
    .map(([key, player]) => ({ key, player, battlePower: calcStats(player).battlePower }))
    .sort((a, b) => b.battlePower - a.battlePower);
  const top3Keys = entries.slice(0, 3).map(e => e.key);
  for (const [key, player] of Object.entries(data.players)) {
    if (!player.titles) player.titles = [];
    const inTop3 = top3Keys.includes(key);
    if (inTop3 && !player.titles.includes("hoan_vu_chi_cao")) {
      player.titles.push("hoan_vu_chi_cao");
      granted.push(key);
    } else if (!inTop3 && player.titles.includes("hoan_vu_chi_cao")) {
      player.titles = player.titles.filter(t => t !== "hoan_vu_chi_cao");
      if (player.equippedTitle === "hoan_vu_chi_cao") player.equippedTitle = null;
    }
  }
  return granted;
}

// ── VẬT PHẨM ĐẶC BIỆT (chỉ nhận qua lệnh admin .tl buff item) ──
const TOKEN_ITEMS = [
  { id: "an_tu_vi_lenh",   name: "Ẩn Tu Vi Lệnh",  emoji: "🌫️", desc: "Khi có trong túi, cảnh giới của bạn bị ẩn khỏi mọi bảng xếp hạng (.tl top). Dù tu vi cao đến đâu cũng không hiển thị." },
  { id: "hien_nguyen_hinh", name: "Hiện Nguyên Hình", emoji: "👁️", desc: "Tiêu hao Ẩn Tu Vi Lệnh trong túi và thay thế bằng lá bùa này — hiện lại tu vi trên bảng xếp hạng như bình thường." },
  { id: "sang_the_lenh",   name: "Sáng Thế Lệnh",   emoji: "🔱", desc: "Vật phẩm thiêng liêng chỉ Đấng Sáng Thế mới có thể ban cho. Khi mang trong túi, mở ra quyền năng quản trị cấp cao — có thể sử dụng các lệnh admin tu luyện." },
];

// ── NGUYÊN LIỆU LUYỆN ĐAN ──────────────────────────────
// dropWeight: trọng số rơi trong bí cảnh (càng đắt càng hiếm)
const MATERIALS = [
  { id: "101", name: "Thảo Dược Thường", emoji: "🌿", price: 5,   dropWeight: 30,  desc: "Dùng để luyện đan cấp thấp." },
  { id: "103", name: "Khoáng Thạch",     emoji: "🪨", price: 10,  dropWeight: 25,  desc: "Nguyên liệu chế tác và luyện đan." },
  { id: "102", name: "Linh Thảo",        emoji: "🌱", price: 15,  dropWeight: 22,  desc: "Thảo dược chứa linh khí." },
  { id: "106", name: "Nhân Sâm",         emoji: "🥕", price: 20,  dropWeight: 18,  desc: "Thảo dược bồi bổ nguyên khí." },
  { id: "107", name: "Hà Thủ Ô",         emoji: "🍠", price: 25,  dropWeight: 16,  desc: "Giúp tóc đen, khí huyết lưu thông." },
  { id: "104", name: "Tinh Thiết",       emoji: "🔩", price: 30,  dropWeight: 14,  desc: "Khoáng thạch tinh khiết." },
  { id: "105", name: "Yêu Đan (Sơ)",     emoji: "🟠", price: 50,  dropWeight: 11,  desc: "Kết tinh sức mạnh yêu thú cấp thấp." },
  { id: "108", name: "Chu Quả",          emoji: "🍒", price: 100, dropWeight: 8,   desc: "Trái cây đỏ rực chứa hỏa khí nồng đậm." },
  { id: "109", name: "Tuyết Liên Hoa",   emoji: "🪷", price: 120, dropWeight: 7,   desc: "Hoa sen mọc trên núi tuyết, hàn khí bức người." },
  { id: "110", name: "Yêu Đan (Trung)",  emoji: "💠", price: 150, dropWeight: 6,   desc: "Yêu đan của yêu thú tu vi cao." },
  { id: "114", name: "Huyền Thiết",      emoji: "⚫", price: 150, dropWeight: 5,   desc: "Sắt đen lạnh lẽo, cực kỳ cứng chắc." },
  { id: "111", name: "Huyết Bồ Đề",      emoji: "📿", price: 300, dropWeight: 4,   desc: "Thần vật chữa trị thương thế, tăng công lực." },
  { id: "112", name: "Vảy Rồng",         emoji: "🐲", price: 500, dropWeight: 2.5, desc: "Vảy rụng ra từ Giao Long hoặc Chân Long." },
  { id: "113", name: "Tụ Hồn Châu",      emoji: "🔮", price: 800, dropWeight: 1.5, desc: "Châu ngọc chứa vạn hồn, dùng luyện đan cao cấp." },
];

// ── CÔNG THỨC LUYỆN ĐAN ────────────────────────────────
// mats: nguyên liệu cần (bị tiêu hao dù thành hay thất bại), rate: % thành công
const RECIPES = {
  "1":  { mats: { "101": 1, "106": 1 },                 rate: 90 },
  "26": { mats: { "101": 2, "102": 1 },                 rate: 85 },
  "2":  { mats: { "102": 2, "106": 1 },                 rate: 82 },
  "5":  { mats: { "106": 2, "107": 1 },                 rate: 80 },
  "30": { mats: { "102": 2, "104": 1 },                 rate: 78 },
  "28": { mats: { "105": 1, "102": 2, "107": 1 },       rate: 75 },
  "11": { mats: { "105": 1, "106": 2, "107": 1 },       rate: 75 },
  "3":  { mats: { "104": 1, "107": 2 },                 rate: 75 },
  "27": { mats: { "101": 1, "104": 1, "107": 2 },       rate: 75 },
  "7":  { mats: { "102": 1, "106": 2, "107": 2 },       rate: 72 },
  "31": { mats: { "104": 1, "107": 3 },                 rate: 72 },
  "32": { mats: { "104": 1, "105": 1, "107": 2 },       rate: 72 },
  "9":  { mats: { "107": 1, "108": 1 },                 rate: 70 },
  "29": { mats: { "105": 1, "108": 1 },                 rate: 70 },
  "23": { mats: { "102": 1, "109": 1 },                 rate: 70 },
  "20": { mats: { "105": 2, "108": 1 },                 rate: 70 },
  "50": { mats: { "105": 1, "108": 2 },                 rate: 68 },
  "51": { mats: { "104": 2, "108": 2 },                 rate: 68 },
  "52": { mats: { "105": 1, "109": 2 },                 rate: 68 },
  "33": { mats: { "105": 2, "109": 1 },                 rate: 66 },
  "39": { mats: { "107": 2, "108": 2, "111": 2 },       rate: 65 },
  "24": { mats: { "106": 2, "108": 1, "111": 1 },       rate: 65 },
  "61": { mats: { "108": 2, "110": 1, "111": 1 },       rate: 65 },
  "22": { mats: { "109": 2, "111": 1 },                 rate: 63 },
  "21": { mats: { "110": 2, "111": 3 },                 rate: 62 },
  "60": { mats: { "112": 2 },                           rate: 62 },
  "4":  { mats: { "111": 2, "112": 1 },                 rate: 60 },
  "70": { mats: { "110": 6, "111": 6 },                 rate: 60 },
  "10": { mats: { "111": 6, "113": 5 },                 rate: 55 },
  "37": { mats: { "112": 6, "113": 3 },                 rate: 55 },
  "38": { mats: { "112": 6, "113": 7 },                 rate: 52 },
  "8":  { mats: { "111": 10, "113": 8 },                rate: 50 },
  "35": { mats: { "111": 200, "112": 150, "113": 120 }, rate: 45 },
  "36": { mats: { "111": 350, "112": 250, "113": 200 }, rate: 40 },
  "43": { mats: { "111": 600, "112": 450, "113": 330 }, rate: 40 },
  "6":  { mats: { "111": 2000, "112": 1500, "113": 1200 }, rate: 35 },
};

const THECHAT = [
  { id: 1,  name: "Phàm Nhân Chi Thể",          emoji: "🔘", tier: "basic",   weight: 25, def: 10,  hp: 10,                                                                                          desc: "Thể xác phàm nhân bình thường." },
  { id: 2,  name: "Hàn Độc Chi Thể",            emoji: "🔵", tier: "epic",    weight: 14, def: 10,  hp: 10,  spd: 10,                                                                                 desc: "Thân thể chứa hàn độc lạnh buốt." },
  { id: 3,  name: "Thiên Tuyệt Chi Thể",        emoji: "🔵", tier: "epic",    weight: 14, def: 10,  hp: 10,  spd: 10,                                                                                 desc: "Thể chất thiên tuyệt, cơ thể linh hoạt." },
  { id: 4,  name: "Thiên Sinh Thần Lực",        emoji: "🟢", tier: "rare",    weight: 18, atk: 30,  def: 80,  hp: 80,  spd: 20,  critResist: 15,                                                   desc: "Bẩm sinh thần lực vô song." },
  { id: 5,  name: "Đồng Bì Thiết Cốt",          emoji: "🟢", tier: "rare",    weight: 18, def: 10,  hp: 10,                                                                                          desc: "Da đồng xương sắt, vững chãi." },
  { id: 6,  name: "Bách Mạch Thông Suốt",       emoji: "🟢", tier: "rare",    weight: 18, def: 10,  hp: 10,                                                                                          desc: "Trăm mạch thông suốt, linh khí dễ vận." },
  { id: 7,  name: "Thuần Âm Chi Thể",           emoji: "🔵", tier: "epic",    weight: 14, atk: 20,  def: 40,  hp: 40,                                                                                 desc: "Thuần âm chi khí ngưng tụ." },
  { id: 8,  name: "Thuần Dương Chi Thể",        emoji: "🔵", tier: "epic",    weight: 14, atk: 20,  def: 40,  hp: 40,                                                                                 desc: "Thuần dương chi hỏa rực cháy." },
  { id: 9,  name: "Tiên Thiên Đạo Thể",         emoji: "🔵", tier: "epic",    weight: 14, atk: 30,  def: 80,  hp: 80,  spd: 20,  critResist: 15,                                                   desc: "Tiên thiên đạo thể, gần với thiên đạo." },
  { id: 10, name: "Vô Cấu Chi Thể",             emoji: "🟢", tier: "rare",    weight: 18, atk: 20,  def: 40,  hp: 40,                                                                                 desc: "Thân thể trong sạch không tì vết." },
  { id: 11, name: "Kiếm Linh Chi Thể",          emoji: "🔵", tier: "epic",    weight: 14, def: 10,  hp: 10,                                                                                          desc: "Thân mang kiếm linh, bẩm sinh hợp kiếm." },
  { id: 12, name: "Vạn Độc Chi Thể",            emoji: "🔵", tier: "epic",    weight: 14, def: 10,  hp: 10,                                                                                          desc: "Cơ thể nuôi dưỡng vạn độc." },
  { id: 13, name: "Ngũ Hành Linh Thể",          emoji: "🔵", tier: "epic",    weight: 14, def: 10,  hp: 10,                                                                                          desc: "Ngũ hành hội tụ, sinh sôi vô tận." },
  { id: 14, name: "Hoang Cổ Thánh Thể",         emoji: "🟡", tier: "legend",  weight: 10, atk: 30,  def: 80,  hp: 80,  spd: 20,  critResist: 15,                                                   desc: "Thánh thể thời hoang cổ." },
  { id: 15, name: "Trấn Ngục Thần Thể",         emoji: "🟣", tier: "mythic",  weight: 6,  atk: 30,  def: 80,  hp: 80,  spd: 20,  critResist: 15,                                                   desc: "Thần thể trấn áp ngục giới." },
  { id: 16, name: "Phệ Hồn Ma Thể",             emoji: "🟣", tier: "mythic",  weight: 6,  atk: 120, hp: 50,               lifesteal: 8,                                                        desc: "Ma thể nuốt hồn, hút máu kẻ địch." },
  { id: 17, name: "Thái Cổ Long Tượng Thể",     emoji: "🟡", tier: "legend",  weight: 10, atk: 20,  def: 40,  hp: 40,                                                                                 desc: "Thái cổ long tượng chi lực." },
  { id: 18, name: "Thôn Thiên Ma Thể",          emoji: "⚪", tier: "common",  weight: 22, atk: 120, hp: 50,               lifesteal: 8,                                                        desc: "Ma thể thôn thiên, cuồng bạo." },
  { id: 19, name: "Hồng Mông Đạo Thể",          emoji: "⚪", tier: "common",  weight: 22, atk: 150, def: 150, hp: 150, spd: 150, critResist: 30,                          lifesteal: 5,           desc: "Đạo thể từ hồng mông sơ khai." },
  { id: 20, name: "Luân Hồi Thể",               emoji: "⚪", tier: "common",  weight: 22, def: 10,  hp: 10,                                                                                          desc: "Thể mang ấn luân hồi." },
  { id: 21, name: "Tiên Thiên Thánh Thể Đạo Thai", emoji: "🟡", tier: "legend", weight: 10, atk: 50, def: 50, hp: 50, spd: 100, dodge: 20,              expBonus: 50,                   desc: "Tiên thiên thánh thể tái tạo đạo thai." },
  { id: 22, name: "Chí Tôn Cốt",                emoji: "🔴", tier: "god",     weight: 3,  def: 10,  hp: 10,                                                                                          desc: "Cốt chí tôn, uy áp chúng sinh." },
  { id: 23, name: "Nhật Nguyệt Tinh Thần Thể",  emoji: "🟡", tier: "legend",  weight: 10, atk: 50,  def: 50,  hp: 50,  spd: 100, dodge: 20,              expBonus: 50,                   desc: "Hấp thu tinh hoa nhật nguyệt." },
  { id: 24, name: "Vạn Đạo Đế Thể",             emoji: "🟡", tier: "legend",  weight: 10, atk: 150, hp: 100,             expBonus: 80,           towerPower: 50,                 desc: "Đế thể quán thông vạn đạo." },
  { id: 25, name: "Cửu Khiếu Linh Lung Thể",    emoji: "🟡", tier: "legend",  weight: 10, atk: 50,  def: 50,  hp: 50,  spd: 100, dodge: 20,              expBonus: 50,                   desc: "Chín khiếu thông suốt, tâm linh tinh xảo." },
  { id: 26, name: "Hỗn Độn Thể",                emoji: "🔴", tier: "god",     weight: 3,  atk: 150, def: 150, hp: 150, spd: 150, critResist: 30,                         lifesteal: 5,           desc: "Hỗn độn chưa khai, thôn nạp vạn vật." },
  { id: 27, name: "Thương Thiên Bá Thể",        emoji: "💖", tier: "supreme", weight: 1,  atk: 300, def: 200, hp: 200, spd: 100, crit: 30, critResist: 0, trueDmg: 20, dmgReduction: 30, armorPen: 20, lifesteal: 10, desc: "Bá thể do thương thiên chọn lựa." },
];

const THECHAT_WEIGHTS = [
  { key: "basic",   weight: 25 },
  { key: "common",  weight: 22 },
  { key: "rare",    weight: 18 },
  { key: "epic",    weight: 14 },
  { key: "legend",  weight: 10 },
  { key: "mythic",  weight: 6 },
  { key: "god",     weight: 3 },
  { key: "supreme", weight: 1 },
];

const HUYETMACH = [
  { id: 1,  name: "Huyết Mạch Phàm Nhân",          emoji: "🔘", tier: "basic",   weight: 25, crit: 5,                                                                                                                                                            desc: "Huyết mạch phàm nhân bình thường." },
  { id: 2,  name: "Huyết Mạch Yêu Thú (Tạp)",      emoji: "🔵", tier: "epic",    weight: 14, atk: 20, spd: 50, crit: 5,  dodge: 10,                                                                                                                             desc: "Mang huyết mạch yêu thú tạp loại." },
  { id: 3,  name: "Huyết Mạch Hoàng Tộc (Nhân Giới)", emoji: "🔵", tier: "epic", weight: 14, crit: 5,                                                                                                                                                            desc: "Huyết mạch hoàng tộc nhân giới." },
  { id: 4,  name: "Lang Tộc Huyết Mạch",           emoji: "🟢", tier: "rare",    weight: 18, atk: 20, spd: 50, crit: 5,  dodge: 10,                                                                                                                             desc: "Huyết mạch sói hoang nhanh nhẹn." },
  { id: 5,  name: "Thanh Khâu Hồ Tộc (Cửu Vĩ)",    emoji: "🟣", tier: "mythic",  weight: 6,  atk: 20, spd: 50, crit: 5,  dodge: 10,                                                                                                                             desc: "Cửu vĩ hồ tộc linh hoạt huyền ảo." },
  { id: 6,  name: "Giao Long Huyết Mạch",          emoji: "🟡", tier: "legend",  weight: 10, atk: 40, def: 30, hp: 30, spd: 30, crit: 10, critResist: 10,                                                                                                        desc: "Huyết mạch giao long thủy hà." },
  { id: 7,  name: "Thiên Yêu Huyết Mạch",          emoji: "🔵", tier: "epic",    weight: 14, atk: 20, spd: 50, crit: 10, dodge: 10,                                                                                                                             desc: "Huyết mạch thiên yêu cường đại." },
  { id: 8,  name: "Chân Long Huyết Mạch",          emoji: "🟡", tier: "legend",  weight: 10, atk: 40, def: 30, hp: 30, spd: 30, crit: 10, critResist: 10,                                                                                                        desc: "Chân long huyết mạch chí tôn." },
  { id: 9,  name: "Phượng Hoàng Huyết Mạch",       emoji: "🟡", tier: "legend",  weight: 10, atk: 40, def: 30, hp: 30, spd: 30, crit: 10, critResist: 10,                                                                                                        desc: "Phượng hoàng huyết mạch trường sinh." },
  { id: 10, name: "Kỳ Lân Huyết Mạch",             emoji: "🟡", tier: "legend",  weight: 10, atk: 40, def: 30, hp: 30, spd: 30, crit: 10, critResist: 10,                                                                                                        desc: "Kỳ lân huyết mạch cát tường." },
  { id: 11, name: "Thái Cổ Hung Thú (Thao Thiết)", emoji: "🔵", tier: "epic",   weight: 14, crit: 20,                                                                                                                                                           desc: "Hung thú thao thiết tham lam sát khí." },
  { id: 12, name: "Thái Cổ Hung Thú (Cùng Kỳ)",    emoji: "🔵", tier: "epic",    weight: 14, crit: 20,                                                                                                                                                           desc: "Hung thú cùng kỳ tàn bạo." },
  { id: 13, name: "Thần Ma Huyết Mạch",            emoji: "🔴", tier: "god",     weight: 3,  atk: 120, def: 50, hp: 50, spd: 80, crit: 20, lifesteal: 5,                                                                                                         desc: "Huyết mạch thần ma hủy diệt." },
  { id: 14, name: "Tu La Huyết Mạch",              emoji: "🔴", tier: "god",     weight: 3,  crit: 5,                                                                                                                                                            desc: "Huyết mạch tu la chiến đấu." },
  { id: 15, name: "Thái Cổ Thần Tộc",              emoji: "🔴", tier: "god",     weight: 3,  atk: 150, def: 300, hp: 400, spd: -50, crit: 20,                                                                                                                   desc: "Thần tộc thái cổ trấn áp vạn vật." },
  { id: 16, name: "Vu Tộc Huyết Mạch (Bàn Cổ)",    emoji: "⚪", tier: "common",  weight: 22, atk: 150, def: 300, hp: 400, spd: -50, crit: 10,                                                                                                                   desc: "Huyết mạch vu tộc kế thừa bàn cổ." },
  { id: 17, name: "Bất Tử Tiên Hoàng",             emoji: "💖", tier: "supreme", weight: 1,  def: 150, hp: 300, crit: 5, dmgReduction: 40, lifesteal: 15,                                                                                                        desc: "Tiên hoàng bất tử vĩnh hằng." },
  { id: 18, name: "Thái Âm U Oánh",                emoji: "🟡", tier: "legend",  weight: 10, atk: 100, spd: 300, crit: 45, dodge: 40, armorPen: 50,                                                                                                              desc: "Thái âm u oánh ảo diệu vô ảnh." },
  { id: 19, name: "Thái Dương Chúc Chiếu",         emoji: "🟡", tier: "legend",  weight: 10, atk: 300, hp: 100, crit: 5, trueDmg: 30, critDmg: 100,                                                                                                             desc: "Thái dương chúc chiếu vạn cổ quang minh." },
  { id: 20, name: "Thời Gian Chi Chủ Huyết Mạch",  emoji: "🌌", tier: "galaxy",  weight: 2,  atk: 120, def: 50, hp: 50, spd: 80, crit: 5, lifesteal: 5,                                                                                                           desc: "Huyết mạch chúa tể thời gian." },
  { id: 21, name: "Nguyên Thủy Tổ Ma",             emoji: "🔴", tier: "god",     weight: 3,  atk: 120, def: 50, hp: 50, spd: 80, crit: 20, lifesteal: 5,                                                                                                         desc: "Tổ ma nguyên thủy man hoang." },
  { id: 22, name: "Cổ Thần Huyết Mạch",            emoji: "🔴", tier: "god",     weight: 3,  atk: 150, def: 300, hp: 400, spd: -50, crit: 5,                                                                                                                    desc: "Huyết mạch cổ thần hồng hoang." },
  { id: 23, name: "Hỗn Độn Thần Ma Huyết Mạch",    emoji: "🔴", tier: "god",     weight: 3,  atk: 120, def: 50, hp: 50, spd: 80, crit: 20, lifesteal: 5,                                                                                                         desc: "Hỗn độn thần ma thôn phệ tam giới." },
];

const HUYETMACH_WEIGHTS = [
  { key: "basic",   weight: 25 },
  { key: "common",  weight: 22 },
  { key: "rare",    weight: 18 },
  { key: "epic",    weight: 14 },
  { key: "legend",  weight: 10 },
  { key: "mythic",  weight: 6 },
  { key: "galaxy",  weight: 2 },
  { key: "god",     weight: 3 },
  { key: "supreme", weight: 1 },
];

const LINH_CAN = [
  { id: 1,  name: "Phế Linh Căn",                 emoji: "🔘", tier: "basic",   weight: 25, expMult: 0.5,  pham: "Phế Phẩm",    desc: "Linh căn phế bỏ, tu luyện chậm chạp." },
  { id: 2,  name: "Ngũ Hành Tạp Linh Căn",        emoji: "🔘", tier: "basic",   weight: 25, expMult: 0.5,  pham: "Hạ Phẩm",     desc: "Ngũ hành tạp loạn, khó tụ linh khí." },
  { id: 3,  name: "Tứ Hệ Linh Căn",               emoji: "🟢", tier: "rare",    weight: 18, expMult: 1,    pham: "Hạ Phẩm",     desc: "Bốn hệ thuộc tính lẫn lộn." },
  { id: 4,  name: "Tam Hệ Linh Căn",              emoji: "🟢", tier: "rare",    weight: 18, expMult: 1,    pham: "Trung Phẩm",  desc: "Ba hệ thuộc tính quân bình." },
  { id: 5,  name: "Song Hệ Linh Căn",             emoji: "🟢", tier: "rare",    weight: 18, expMult: 1,    pham: "Thượng Phẩm", desc: "Hai hệ thuộc tính tương sinh." },
  { id: 6,  name: "Dị Linh Căn (Lôi)",            emoji: "🔵", tier: "epic",    weight: 14, expMult: 1.5,  pham: "Địa Phẩm",    desc: "Lôi linh căn hiếm có." },
  { id: 7,  name: "Dị Linh Căn (Băng)",           emoji: "🔵", tier: "epic",    weight: 14, expMult: 1.5,  pham: "Địa Phẩm",    desc: "Băng linh căn hiếm có." },
  { id: 8,  name: "Dị Linh Căn (Phong)",          emoji: "🔵", tier: "epic",    weight: 14, expMult: 1.5,  pham: "Địa Phẩm",    desc: "Phong linh căn hiếm có." },
  { id: 9,  name: "Dị Linh Căn (Ám)",             emoji: "🔵", tier: "epic",    weight: 14, expMult: 1.5,  pham: "Địa Phẩm",    desc: "Ám linh căn bí ẩn." },
  { id: 10, name: "Thiên Linh Căn (Hỏa)",         emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Hỏa thiên linh căn chí thượng." },
  { id: 11, name: "Thiên Linh Căn (Thủy)",        emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Thủy thiên linh căn chí thượng." },
  { id: 12, name: "Thiên Linh Căn (Mộc)",         emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Mộc thiên linh căn chí thượng." },
  { id: 13, name: "Thiên Linh Căn (Kim)",         emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Kim thiên linh căn chí thượng." },
  { id: 14, name: "Thiên Linh Căn (Thổ)",         emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Thổ thiên linh căn chí thượng." },
  { id: 15, name: "Âm Dương Song Linh Căn",       emoji: "🔵", tier: "epic",    weight: 14, expMult: 1.5,  pham: "Tiên Phẩm",    desc: "Âm dương giao hòa." },
  { id: 16, name: "Thái Cực Âm Dương Căn",        emoji: "🟡", tier: "legend",  weight: 10, expMult: 1.5,  pham: "Tiên Phẩm",    desc: "Thái cực âm dương xoay chuyển." },
  { id: 17, name: "Ám Ảnh Căn",                   emoji: "🔴", tier: "god",     weight: 3,  expMult: 1,    pham: "Thiên Phẩm",   desc: "Ám ảnh căn che giấu thiên cơ." },
  { id: 18, name: "Sinh Mệnh Thụ Căn",            emoji: "🟡", tier: "legend",  weight: 10, expMult: 1,    pham: "Thiên Phẩm",   desc: "Sinh mệnh thụ căn trường tồn." },
  { id: 19, name: "Tịch Diệt Lôi Căn",            emoji: "🔴", tier: "god",     weight: 3,  expMult: 1,    pham: "Thiên Phẩm",   desc: "Tịch diệt lôi căn hủy diệt." },
  { id: 20, name: "Ngũ Hành Hỗn Nguyên",          emoji: "🟣", tier: "mythic",  weight: 6,  expMult: 1.5,  pham: "Thiên Phẩm",   desc: "Ngũ hành hỗn nguyên nhất thể." },
  { id: 21, name: "Thời Không Chi Căn",           emoji: "🌌", tier: "galaxy",  weight: 2,  expMult: 1,    pham: "Tiên Phẩm",    desc: "Thời không chi căn xuyên việt." },
  { id: 22, name: "Hỗn Độn Hư Vô Căn",            emoji: "🔴", tier: "god",     weight: 3,  expMult: 2,    pham: "Thần Phẩm",    desc: "Hỗn độn hư vô, tu luyện nhanh gấp đôi." },
  { id: 23, name: "Thái Sơ Hỗn Độn Căn",          emoji: "⚪", tier: "common",  weight: 22, expMult: 2,    pham: "Thần Phẩm",    desc: "Thái sơ hỗn độn căn, nghịch thiên." },
];

const LINH_CAN_WEIGHTS = [
  { key: "basic",   weight: 25 },
  { key: "common",  weight: 22 },
  { key: "rare",    weight: 18 },
  { key: "epic",    weight: 14 },
  { key: "legend",  weight: 10 },
  { key: "mythic",  weight: 6 },
  { key: "galaxy",  weight: 2 },
  { key: "god",     weight: 3 },
  { key: "supreme", weight: 1 },
];

const MAX_MAJOR_REALM = REALMS.length - 1;
const MAX_MINOR_REALM = 9;
const PK_REWARD_WINNER = 500;
const PK_REWARD_POINTS = 20;
const TAX_RATE = 0.14;

const SECRET_REALMS = [
  { id: "40", name: "Vĩnh Cửu Tận Thế",      requiredRealm: 40, staminaCost: 900, expMultiplier: 0.34, desc: "Tận cùng mọi tồn tại, đỉnh cao tuyệt đối." },
  { id: "39", name: "Bất Hủ Ma Uyên",        requiredRealm: 39, staminaCost: 800, expMultiplier: 0.32, desc: "Vực sâu cuối cùng, nơi Bất Hủ Ma Thần bị trấn áp." },
  { id: "38", name: "Bất Hủ Chiến Trường",      requiredRealm: 38, staminaCost: 750, expMultiplier: 0.30, desc: "Chiến trường vĩnh cửu, các Bất Hủ giao tranh vô tận." },
  { id: "37", name: "Hồng Mông Thần Trì",       requiredRealm: 37, staminaCost: 700, expMultiplier: 0.28, desc: "Ao thần nơi các Ma Chủ tôi luyện, đầy sức mạnh nguyên thủy." },
  { id: "36", name: "Hồng Mông Ma Quốc",        requiredRealm: 36, staminaCost: 650, expMultiplier: 0.26, desc: "Quốc độ ma tộc giữa lòng Hồng Mông." },
  { id: "35", name: "Hồng Mông Cấm Hải",        requiredRealm: 35, staminaCost: 600, expMultiplier: 0.24, desc: "Vùng biển cấm của Hồng Mông, sóng có thể hủy thế giới." },
  { id: "34", name: "Hư Vô Tận Thế",            requiredRealm: 34, staminaCost: 560, expMultiplier: 0.22, desc: "Biên giới cuối cùng của Hư Vô, nơi vũ trụ tan rã." },
  { id: "33", name: "Hư Vô Ma Hải",             requiredRealm: 33, staminaCost: 520, expMultiplier: 0.20, desc: "Biển hư vô mênh mông, nuốt chửng mọi thứ dám bước vào." },
  { id: "32", name: "Hư Vô Chi Cảnh",           requiredRealm: 32, staminaCost: 500, expMultiplier: 0.19, desc: "Hư không tuyệt đối, không ánh sáng, không thời gian." },
  { id: "110", name: "Lọ Thần Cấm Địa",         requiredRealm: 31, staminaCost: 490, expMultiplier: 0.18, desc: "Cấm địa chỉ dành cho Lọ Thần, bước vào là sinh tử bất định." },
  { id: "31", name: "Sáng Thế Phế Tích",        requiredRealm: 30, staminaCost: 480, expMultiplier: 0.17, desc: "Phế tích từ khi Sáng Thế Thần khai thiên lập địa." },
  { id: "30", name: "Hỗn Độn Thần Điện",        requiredRealm: 29, staminaCost: 450, expMultiplier: 0.16, desc: "Thần điện tối cổ lưu lạc trong dòng hỗn độn." },
  { id: "29", name: "Hỗn Độn Ma Uyên",          requiredRealm: 28, staminaCost: 420, expMultiplier: 0.15, desc: "Vực sâu ma hóa trong lòng hỗn độn." },
  { id: "28", name: "Hỗn Độn Nguyên Hải",       requiredRealm: 27, staminaCost: 400, expMultiplier: 0.14, desc: "Biển hỗn độn nguyên thủy, nơi vạn vật sinh ra." },
  { id: "27", name: "Kỷ Nguyên Hoang Tàn",      requiredRealm: 26, staminaCost: 380, expMultiplier: 0.13, desc: "Tàn tích của một kỷ nguyên đã sụp đổ." },
  { id: "26",  name: "Vĩnh Hằng Chi Hải",        requiredRealm: 25, staminaCost: 360, expMultiplier: 0.12, desc: "Biển Vĩnh Hằng bao la, ẩn chứa quy tắc thiên đạo." },
  { id: "25",  name: "Vĩnh Hằng Chi Tháp",        requiredRealm: 24, staminaCost: 340, expMultiplier: 0.11, desc: "Ngọn tháp xuyên không gian thời gian." },
  { id: "24",  name: "Thần Hoả Liên Ngục",        requiredRealm: 23, staminaCost: 320, expMultiplier: 0.11, desc: "Lò luyện Thần Hoả, đốt cháy mọi tạp chất." },
  { id: "15",  name: "Hỗn Độn Hư Không",          requiredRealm: 22, staminaCost: 300, expMultiplier: 0.10, desc: "Vùng rìa vũ trụ, chỉ có hỗn độn khí." },
  { id: "23",  name: "Cửu U Minh Phủ",           requiredRealm: 21, staminaCost: 250, expMultiplier: 0.10, desc: "Chín tầng địa phủ u minh, linh hồn bất diệt cản đường." },
  { id: "22",  name: "Thần Giới Biên Hoang",      requiredRealm: 20, staminaCost: 220, expMultiplier: 0.10, desc: "Vùng biên giới hoang vu của Thần Giới." },
  { id: "14",  name: "Thần Mộ",                   requiredRealm: 19, staminaCost: 200, expMultiplier: 0.09, desc: "Nơi chôn cất các vị thần sa ngã." },
  { id: "21",  name: "Thái Cổ Chiến Trường",      requiredRealm: 18, staminaCost: 180, expMultiplier: 0.09, desc: "Chiến trường từ thời Thái Cổ, oán khí xung thiên." },
  { id: "20",  name: "Thiên Kiếp Lôi Trì",        requiredRealm: 17, staminaCost: 170, expMultiplier: 0.09, desc: "Hồ thiên lôi tích tụ sức mạnh kiếp lôi ngàn thu." },
  { id: "19",  name: "Tiên Đế Mê Cung",           requiredRealm: 16, staminaCost: 160, expMultiplier: 0.08, desc: "Mê cung do Tiên Đế bố trí, đầy cơ quan trận pháp." },
  { id: "13",  name: "Vạn Cổ Tiên Đình",          requiredRealm: 15, staminaCost: 150, expMultiplier: 0.08, desc: "Phế tích của triều đại Tiên Đế cổ xưa." },
  { id: "18",  name: "Vạn Yêu Quốc",              requiredRealm: 14, staminaCost: 140, expMultiplier: 0.08, desc: "Quốc độ của vạn loài yêu tu, đấu trường bất tận." },
  { id: "17",  name: "Tiên Trủng Cấm Địa",        requiredRealm: 13, staminaCost: 130, expMultiplier: 0.08, desc: "Nghĩa trang Tiên nhân sa đọa, tử khí hoá hình." },
  { id: "12",  name: "Thiên Hà Tinh Vực",         requiredRealm: 12, staminaCost: 120, expMultiplier: 0.08, desc: "Du hành giữa các vì sao, đối mặt tinh không quái thú." },
  { id: "16",  name: "Linh Thú Viên Lâm",         requiredRealm: 11, staminaCost: 110, expMultiplier: 0.07, desc: "Vườn linh thú bị bỏ hoang, vô số yêu thú đột biến." },
  { id: "11",  name: "Tiên Linh Đảo",             requiredRealm: 10, staminaCost: 100, expMultiplier: 0.07, desc: "Đảo bay lơ lửng, linh khí nồng đậm gấp trăm lần." },
  { id: "10",  name: "Lôi Phạt Chi Địa",          requiredRealm: 9,  staminaCost: 90,  expMultiplier: 0.07, desc: "Vùng đất chịu sự trừng phạt của sấm sét." },
  { id: "9",   name: "Cửu Trọng Thiên",           requiredRealm: 8,  staminaCost: 80,  expMultiplier: 0.06, desc: "Tầng trời thứ 9, nơi ở của Tiên nhân." },
  { id: "dihoa_dungeon_3", name: "Đế Viêm Phong Ấn", requiredRealm: 8, staminaCost: 120, expMultiplier: 0.07, desc: "Nơi Đế Viêm bị phong ấn." },
  { id: "8",   name: "Thiên Ngoại Thiên",         requiredRealm: 7,  staminaCost: 70,  expMultiplier: 0.06, desc: "Vùng trời ngoài trời, linh khí nồng đậm." },
  { id: "109", name: "Tinh Vân Cổ Đạo",           requiredRealm: 7,  staminaCost: 70,  expMultiplier: 0.06, desc: "Con đường cổ xưa giữa các tinh vân." },
  { id: "7",   name: "Cấm Địa Hư Không",          requiredRealm: 6,  staminaCost: 60,  expMultiplier: 0.06, desc: "Vùng không gian hỗn loạn, nguy hiểm cực độ." },
  { id: "107", name: "Vạn Độc Cốc",               requiredRealm: 6,  staminaCost: 65,  expMultiplier: 0.06, desc: "Thung lũng độc dược." },
  { id: "dihoa_dungeon_2", name: "Dị Hỏa Luyện Viện", requiredRealm: 6, staminaCost: 80, expMultiplier: 0.06, desc: "Luyện đan phục vụ Dị Hỏa." },
  { id: "6",   name: "Vực Thẳm Ma Giới",          requiredRealm: 5,  staminaCost: 50,  expMultiplier: 0.05, desc: "Nơi giao thoa ma giới." },
  { id: "108", name: "Rừng Ma Quái",              requiredRealm: 5,  staminaCost: 50,  expMultiplier: 0.05, desc: "Khu rừng ma ám đầy tử khí." },
  { id: "sect_map_3", name: "Thánh Địa Tông Môn (Cao)", requiredRealm: 5, staminaCost: 100, expMultiplier: 0.06, desc: "Cấm địa tối cao, nơi Tổ Sư khai sơn lập phái tọa hóa." },
  { id: "5",   name: "Đảo Bồng Lai",              requiredRealm: 4,  staminaCost: 40,  expMultiplier: 0.05, desc: "Tiên đảo huyền bí, nơi ẩn cư của cao nhân." },
  { id: "105", name: "Hỏa Diệm Sơn",              requiredRealm: 4,  staminaCost: 40,  expMultiplier: 0.05, desc: "Núi lửa phun trào, hỏa khí ngút trời." },
  { id: "dihoa_dungeon", name: "Dị Hỏa Chi Địa",   requiredRealm: 4,  staminaCost: 50,  expMultiplier: 0.05, desc: "Vùng đất bị Dị Hỏa thiêu đốt." },
  { id: "4",   name: "Di Tích Cổ",                requiredRealm: 3,  staminaCost: 30,  expMultiplier: 0.04, desc: "Tàn tích cổ đại." },
  { id: "104", name: "Băng Cung",                 requiredRealm: 3,  staminaCost: 30,  expMultiplier: 0.04, desc: "Cung điện băng giá ngàn năm." },
  { id: "106", name: "Hải Tộc Vương Quốc",        requiredRealm: 3,  staminaCost: 35,  expMultiplier: 0.04, desc: "Sâu dưới đáy đại dương." },
  { id: "sect_map_2", name: "Thánh Địa Tông Môn (Trung)", requiredRealm: 3, staminaCost: 60, expMultiplier: 0.05, desc: "Trung tâm linh khí, nơi các trưởng lão tu luyện." },
  { id: "3",   name: "Hang Yêu Thú",              requiredRealm: 2,  staminaCost: 20,  expMultiplier: 0.035, desc: "Hang động tối tăm, yêu thú hung hãn." },
  { id: "103", name: "Rừng Sương Mù",             requiredRealm: 2,  staminaCost: 20,  expMultiplier: 0.035, desc: "Sương mù dày đặc, yêu thú ẩn hiện." },
  { id: "chientruong", name: "Chiến Trường Cổ Đại (PvP)", requiredRealm: 2, staminaCost: 50, expMultiplier: 0.05, desc: "Nơi giao tranh khốc liệt giữa các tu sĩ." },
  { id: "2",   name: "Thác Nước Bạc",             requiredRealm: 1,  staminaCost: 15,  expMultiplier: 0.03, desc: "Dòng thác ẩn chứa linh khí." },
  { id: "102", name: "Hoang Mạc Cát",             requiredRealm: 1,  staminaCost: 15,  expMultiplier: 0.03, desc: "Nắng chói chang, sản sinh khoáng vật." },
  { id: "sect_map_1", name: "Thánh Địa Tông Môn (Sơ)", requiredRealm: 1, staminaCost: 30, expMultiplier: 0.035, desc: "Vùng đất tổ tiên sơ khai, dành cho đệ tử ngoại môn." },
  { id: "1",   name: "Rừng Hoang",                requiredRealm: 0,  staminaCost: 10,  expMultiplier: 0.03, desc: "Nơi cư trú của dã thú đê cấp." },
  { id: "101", name: "Đầm Lầy Chết",             requiredRealm: 0,  staminaCost: 10,  expMultiplier: 0.03, desc: "Đầm lầy độc khí, nhiều thảo dược lạ." },
];

function rollTalent() {
  const total = TALENT_WEIGHTS.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const { key, weight } of TALENT_WEIGHTS) {
    r -= weight;
    if (r <= 0) return key;
  }
  return "pham";
}

function rollTheChat() {
  const weighted = [];
  for (const tc of THECHAT) {
    const w = THECHAT_WEIGHTS.find(t => t.key === tc.tier)?.weight || 10;
    weighted.push({ tc, w });
  }
  const total = weighted.reduce((s, t) => s + t.w, 0);
  let r = Math.random() * total;
  for (const { tc, w } of weighted) {
    r -= w;
    if (r <= 0) return tc.id;
  }
  return 1;
}

function rollHuyetMach() {
  const weighted = [];
  for (const hm of HUYETMACH) {
    const w = HUYETMACH_WEIGHTS.find(t => t.key === hm.tier)?.weight || 10;
    weighted.push({ hm, w });
  }
  const total = weighted.reduce((s, t) => s + t.w, 0);
  let r = Math.random() * total;
  for (const { hm, w } of weighted) {
    r -= w;
    if (r <= 0) return hm.id;
  }
  return 1;
}

function rollLinhCan() {
  const weighted = [];
  for (const lc of LINH_CAN) {
    const w = LINH_CAN_WEIGHTS.find(t => t.key === lc.tier)?.weight || 10;
    weighted.push({ lc, w });
  }
  const total = weighted.reduce((s, t) => s + t.w, 0);
  let r = Math.random() * total;
  for (const { lc, w } of weighted) {
    r -= w;
    if (r <= 0) return lc.id;
  }
  return 1;
}

function getRealmList(daotam) {
  if (daotam === "ma") return MA_REALMS;
  if (daotam === "nho") return NHO_REALMS;
  if (daotam === "yeu") return YEU_REALMS;
  if (daotam === "lo") return LO_REALMS;
  if (daotam === "quy") return QUY_REALMS;
  if (daotam === "phat") return PHAT_REALMS;
  return REALMS;
}

function getMaxMajorRealm(daotam = "chinh") {
  return getRealmList(daotam).length - 1;
}

function getRealmByIndex(index, daotam = "chinh") {
  const list = getRealmList(daotam);
  return list[index] || list[0];
}

function getRealmExpBase(majorRealm, minorRealm, daotam = "chinh") {
  const realm = getRealmByIndex(majorRealm, daotam);
  const nextRealm = getRealmList(daotam)[majorRealm + 1];
  const cap = nextRealm ? nextRealm.baseExp * 2 : realm.baseExp * 100;
  const step = Math.min(Math.max(minorRealm - 1, 0), MAX_MINOR_REALM - 1);
  const ratio = Math.pow(cap / realm.baseExp, step / (MAX_MINOR_REALM - 1));
  return Math.max(1, Math.floor(realm.baseExp * ratio));
}

function getMaxExp(majorRealm, minorRealm, daotam = "chinh") {
  const base = getRealmExpBase(majorRealm, minorRealm, daotam);
  return Math.floor(base * Math.pow(1.08, majorRealm));
}

function getRealmDisplay(major, minor, daotam = "chinh") {
  const list = getRealmList(daotam);
  const realm = list[major] || list[0];
  if (major === 0) return realm.name;
  const minorName = MINOR_REALM_NAMES[minor] || `Tầng ${minor}`;
  return `${realm.name} — ${minorName}`;
}

function getRealmDisplayFull(player) {
  const base = getRealmDisplay(player.majorRealm, player.minorRealm, player.daotam);
  const count = player.phithangCount || 0;
  if (count <= 0) return base;
  let ptLabel;
  if (count < 10000) {
    ptLabel = String(count);
  } else {
    const exp = Math.floor(Math.log10(count));
    const mant = count / Math.pow(10, exp);
    ptLabel = `${mant.toFixed(2)}e${exp}`;
  }
  return `${base} [Pt: ${ptLabel}]`;
}

function rollBreakthrough(majorRealm, bonusPct = 0, daotam = "chinh") {
  const realm = getRealmByIndex(majorRealm, daotam);
  const rate = Math.min(realm.breakthroughRate + bonusPct, 100);
  return Math.random() * 100 < rate;
}

function formatNumber(n) {
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.floor(n));
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad", "Qid", "Sxd", "Spd", "Od", "Nd", "Vg"];
  let val = n;
  let idx = 0;
  while (Math.abs(val) >= 999.5 && idx < suffixes.length - 1) {
    val /= 1000;
    idx++;
  }
  if (Math.abs(val) >= 999.5) {
    const sign = n < 0 ? "-" : "";
    const exp = Math.floor(Math.log10(abs));
    const mantissa = abs / Math.pow(10, exp);
    return `${sign}${mantissa.toFixed(2)}e${exp}`;
  }
  const fmt = idx === 1 ? 1 : 2;
  return `${val.toFixed(fmt)}${suffixes[idx]}`;
}

function formatBig(n) {
  const abs = Math.abs(n);
  if (abs < 1e15) return formatNumber(n);
  const exp = Math.floor(Math.log10(abs));
  const mantissa = abs / Math.pow(10, exp);
  return `${mantissa.toFixed(2)}e${exp}`;
}

function calcStats(player) {
  const talent = TALENTS[player.talent] || TALENTS.pham;
  const m = talent.multiplier;
  const theChat = THECHAT.find(t => t.id === player.theChat) || THECHAT[0];
  const huyetMach = HUYETMACH.find(h => h.id === player.huyetMach) || HUYETMACH[0];
  const linhCan = LINH_CAN.find(l => l.id === player.linhCan) || LINH_CAN[0];

  const atkBonus = (theChat.atk || 0) + (huyetMach.atk || 0);
  const defBonus = (theChat.def || 0) + (huyetMach.def || 0);
  const hpBonus = (theChat.hp || 0) + (huyetMach.hp || 0);
  const spdBonus = (theChat.spd || 0) + (huyetMach.spd || 0);

  // ── Chỉ số cơ bản cảnh giới (chỉ từ cảnh giới × thiên phú) ──
  // Luyện Khí Tầng 1: ATK 1000 / HP 5000 / SPD 500 / DEF 2000
  // Dưới cảnh 25: mỗi đại cảnh x4; từ cảnh 25 trở lên: mỗi đại cảnh x5
  // Mỗi tầng tiểu cảnh nhân x1.5
  const majorMult = player.majorRealm <= 24
    ? Math.pow(4, player.majorRealm - 1)
    : Math.pow(4, 24) * Math.pow(5, player.majorRealm - 25);
  const tierMult = Math.pow(1.5, player.minorRealm - 1);
  const phithang = player.phithangCount || 0;
  const phithangMult = 1 + phithang * 0.20;
  const primeLv = getPrimeLevel(player.donated || 0);
  const primeMult = 1 + primeLv * 0.10;
  const primeObj = PRIME.find(pr => pr.level === primeLv);
  const titleAtkMult = 1 + (primeObj ? primeObj.atkPct : 0) / 100;
  const baseAtk  = Math.floor(1000 * majorMult * tierMult * m * phithangMult * primeMult);
  const baseHp   = Math.floor(5000 * majorMult * tierMult * m * phithangMult * primeMult);
  const baseSpd  = Math.floor(500 * majorMult * tierMult * m * phithangMult * primeMult);
  const baseDef  = Math.floor(2000 * majorMult * tierMult * m * phithangMult * primeMult);
  const baseCrit = Math.round((player.majorRealm * 2) * tierMult * m * phithangMult * primeMult * 10) / 10;
  const baseLuck = Math.min(Math.round((player.majorRealm * 1.2) * tierMult * m * phithangMult * primeMult * 10) / 10, 50);

  // ── Buff tạm thời từ đan dược (hết hạn sẽ bị bỏ qua) ──
  const now = Date.now();
  let buffSpd = 0, buffHp = 0, buffExp = 0, buffAtk = 0, buffDef = 0, buffLife = 0;
  if (player.buffs && player.buffs.length > 0) {
    for (const b of player.buffs) {
      if (b.expiresAt && b.expiresAt <= now) continue;
      if (b.type === "spd_pct") buffSpd += b.value;
      else if (b.type === "hp_max_boost_pct") buffHp += b.value;
      else if (b.type === "exp_boost_pct" || b.type === "secret_exp_boost_pct") buffExp += b.value;
      else if (b.type === "atk_pct") buffAtk += b.value;
      else if (b.type === "def_pct") buffDef += b.value;
      else if (b.type === "lifesteal_pct") buffLife += b.value;
    }
  }

  const upgradeMult = (item) => {
    if (!player.upgradeLevels || !item) return 1;
    const lvl = player.upgradeLevels[item.id] || 0;
    return 1 + lvl * 0.10;
  };

  let wAtk = 0, wHp = 0, wSpd = 0, wCrit = 0, wDef = 0, wLifesteal = 0, wCritDmg = 0, wDmgRed = 0, wTrueDmg = 0;
  if (player.equippedWeapon) {
    const weapon = WEAPONS.find(w => w.id === player.equippedWeapon);
    if (weapon) {
      const uM = upgradeMult(weapon);
      wAtk = Math.floor((weapon.atk || 0) * uM); wHp = Math.floor((weapon.hp || 0) * uM); wSpd = Math.floor((weapon.spd || 0) * uM); wDef = Math.floor((weapon.def || 0) * uM);
      wCrit = weapon.crit; wLifesteal = weapon.lifesteal;
      wCritDmg = weapon.critDmg || 0;
      wDmgRed = weapon.dmgReduction || 0;
      wTrueDmg = weapon.trueDmg || 0;
    }
  }

  let aAtk = 0, aDef = 0, aHp = 0, aSpd = 0, aCrit = 0, aDmgRed = 0, aReflect = 0, aMaxDmgPct = 0, aArmorPen = 0, aLuck = 0, aExpBonus = 0, aDodge = 0, aTrueDmg = 0, aLife = 0;
  if (player.equippedArmor) {
    const armor = ARMORS.find(a => a.id === player.equippedArmor);
    if (armor) {
      const uA = upgradeMult(armor);
      aAtk = Math.floor((armor.atk || 0) * uA); aDef = Math.floor((armor.def || 0) * uA); aHp = Math.floor((armor.hp || 0) * uA);
      aSpd = Math.floor((armor.spd || 0) * uA); aCrit = armor.crit || 0; aDmgRed = armor.dmgReduction || 0;
      aReflect = armor.reflect || 0; aMaxDmgPct = armor.maxDmgPct || 0; aArmorPen = armor.armorPen || 0;
      aLuck = armor.luck || 0; aExpBonus = armor.expBonus || 0; aDodge = armor.dodge || 0; aTrueDmg = armor.trueDmg || 0; aLife = armor.lifesteal || 0;
    }
  }

  let pbAtk = 0, pbDef = 0, pbHp = 0, pbExpBonus = 0, pbBossScale = 0, pbReflect = 0;
  if (player.equippedPhapBao) {
    const pb = PHAP_BAO.find(p => p.id === player.equippedPhapBao);
    if (pb) {
      const uP = upgradeMult(pb);
      pbAtk = Math.floor((pb.atk || 0) * uP); pbDef = Math.floor((pb.def || 0) * uP); pbHp = Math.floor((pb.hp || 0) * uP);
      pbExpBonus = pb.expBonus || 0; pbBossScale = pb.bossScale || 0;
      pbReflect = pb.reflect || 0;
    }
  }

  let titleAtkPct = 0, titleHpPct = 0, titleLtBonusPct = 0, titleSpecialEffect = null;
  if (player.equippedTitle) {
    const title = TITLES.find(t => t.id === player.equippedTitle);
    if (title) {
      titleAtkPct = title.atkPct || 0;
      titleHpPct = title.hpPct || 0;
      titleLtBonusPct = title.ltBonusPct || 0;
      titleSpecialEffect = title.specialEffect || null;
    }
  }

  const atk = Math.floor((baseAtk + wAtk + aAtk + pbAtk) * (1 + (atkBonus + titleAtkPct) / 100) * (1 + buffAtk / 100) * titleAtkMult);
  const hp = Math.floor((baseHp + wHp + aHp + pbHp) * (1 + (hpBonus + titleHpPct) / 100) * (1 + buffHp / 100));
  const spd = Math.max(1, Math.floor((baseSpd + wSpd + aSpd) * (1 + spdBonus / 100) * (1 + buffSpd / 100)));
  const def = Math.floor((baseDef + wDef + aDef + pbDef) * (1 + defBonus / 100) * (1 + buffDef / 100));
  const crit = Math.max(0, baseCrit + wCrit + aCrit + (theChat.crit || 0) + (huyetMach.crit || 0));
  const lifesteal = wLifesteal + (theChat.lifesteal || 0) + (huyetMach.lifesteal || 0) + aLife + buffLife;
  const critResist = (theChat.critResist || 0) + (huyetMach.critResist || 0);
  const dodge = (theChat.dodge || 0) + (huyetMach.dodge || 0) + aDodge;
  const trueDmg = (theChat.trueDmg || 0) + (huyetMach.trueDmg || 0) + aTrueDmg + wTrueDmg;
  const dmgReduction = Math.min((theChat.dmgReduction || 0) + (huyetMach.dmgReduction || 0) + aDmgRed + wDmgRed + Math.min(phithang * 10, 90), 90);
  const armorPen = (theChat.armorPen || 0) + (huyetMach.armorPen || 0) + aArmorPen;
  const luck = baseLuck + aLuck;
  const expBonus = (theChat.expBonus || 0) + (huyetMach.expBonus || 0) + buffExp + aExpBonus + pbExpBonus;
  const towerPower = (theChat.towerPower || 0) + (huyetMach.towerPower || 0);
  const critDmg = wCritDmg + (theChat.critDmg || 0) + (huyetMach.critDmg || 0);
  const reflect = (theChat.reflect || 0) + (huyetMach.reflect || 0) + aReflect + pbReflect;
  const maxDmgPct = (theChat.maxDmgPct || 0) + (huyetMach.maxDmgPct || 0) + aMaxDmgPct;

  const battlePower = Math.floor(atk + hp * 0.05 + spd * 10 + crit * 50 + luck * 30 + def * 0.02
    + critResist * 40 + dodge * 60 + trueDmg * 60 + dmgReduction * 60 + armorPen * 60 + lifesteal * 100 + expBonus * 30 + towerPower * 50 + critDmg * 50 + reflect * 60 + maxDmgPct * 1000
    + Math.max(0, (linhCan.expMult - 1) * 100) * 30);

  return {
    base: { atk: baseAtk, hp: baseHp, spd: baseSpd, def: baseDef, crit: baseCrit, luck },
    atk, hp, spd, crit, def, lifesteal, critResist, dodge, trueDmg, dmgReduction, armorPen, luck, expBonus, towerPower, critDmg, reflect, maxDmgPct, linhCanMult: linhCan.expMult, battlePower,
    titleLtBonusPct, titleSpecialEffect,
  };
}

const DONATE_PACKAGES = [
  { id: "p1", name: "Linh Cơ",   emoji: "🌱", price: 10000,    stones: 50000000,     items: "",                              hot: false },
  { id: "p2", name: "Cơ Duyên",  emoji: "🪷", price: 20000,    stones: 100000000,    items: "",                              hot: false },
  { id: "p3", name: "Kim Cương", emoji: "💎", price: 50000,    stones: 250000000,    items: "10 Đột Phá Đan",                hot: false },
  { id: "p4", name: "Thiên Cơ",  emoji: "🔥", price: 100000,   stones: 500000000,    items: "1 Tẩy Tủy Đan",                 hot: true  },
  { id: "p5", name: "Vô Thượng", emoji: "🌟", price: 200000,   stones: 1000000000,   items: "3 Tẩy Tủy Đan",                 hot: false },
  { id: "p6", name: "Chí Tôn",   emoji: "👑", price: 500000,   stones: 2500000000,   items: "Vũ khí Thần Ma Diệt Thế Kiếm",  hot: false },
  { id: "p7", name: "Đại Đạo",   emoji: "🌌", price: 1000000,  stones: 5000000000,   items: "Giáp THẦN THOẠI + Chí Tôn Cốt", hot: true  },
  { id: "p8", name: "Chân Thần Phi Thăng", emoji: "🌀", price: 50000, stones: 0, phithang: 1, items: "+20% toàn chỉ số cơ bản vĩnh viễn", hot: true },
];

const DONATE_MILESTONES = [
  { key: "50000",  threshold: 50000,  stones: 50000000,   minor: 1, major: 0, label: "50.000đ", desc: "+50.000.000 LT + 1 Tiểu Cảnh Giới" },
  { key: "100000", threshold: 100000, stones: 1000000000,  minor: 2, major: 0, label: "100.000đ", desc: "+1.000.000.000 LT + 2 Tiểu Cảnh Giới" },
  { key: "200000", threshold: 200000, stones: 0,           minor: 0, major: 1, label: "200.000đ", desc: "+1 Đại Cảnh Giới" },
];

const PRIME = [
  { level: 1, name: "Prime 1", threshold: 0,         title: "Mạnh Thường Quân",   statPct: 10, atkPct: 5 },
  { level: 2, name: "Prime 2", threshold: 100000,    title: "Bách Chiến Vô Song", statPct: 20, atkPct: 10 },
  { level: 3, name: "Prime 3", threshold: 200000,    title: "Thiên Kiêu Chiến Thần", statPct: 30, atkPct: 15 },
  { level: 4, name: "Prime 4", threshold: 500000,    title: "Vô Địch Chiến Vương", statPct: 40, atkPct: 20 },
  { level: 5, name: "Prime 5", threshold: 1000000,   title: "Thánh Vương",        statPct: 50, atkPct: 25 },
  { level: 6, name: "Prime 6", threshold: 1200000,   title: "Đại Thánh Chí Tôn",  statPct: 60, atkPct: 30 },
  { level: 7, name: "Prime 7", threshold: 1400000,   title: "Cửu Thiên Chí Tôn",  statPct: 70, atkPct: 35 },
  { level: 8, name: "Prime 8", threshold: 2000000,   title: "Vô Thượng Chí Tôn",  statPct: 80, atkPct: 40 },
];

function getPrimeLevel(donated) {
  if (!(donated > 0)) return 0;
  let level = 1;
  for (const pr of PRIME) {
    if (donated >= pr.threshold && pr.level > level) level = pr.level;
  }
  return level;
}

const DONATE_COMBOS = [
  { id: "c1", name: "Combo Khởi Đầu", emoji: "🗡️", price: 20000, weapon: "w_god_2", armor: "a_god_2", items: "Táng Thiên Kiếm (w_god_2) + Thái Cổ Thần Giáp (a_god_2)", hot: true },
  { id: "c2", name: "Combo Bình Dân", emoji: "✨", price: 100000, weapon: "w_divine_1", stones: 2000000000, potions: [{ id: "6", qty: 15 }], items: "Vô Thượng Kiếm (w_divine_1) + 2 tỷ LT + 15 Tẩy Tủy Đan", hot: true },
  { id: "c3", name: "Combo Chí Tôn", emoji: "🌠", price: 500000, weapon: "w_supreme_1", talent: "thien_co", items: "Khai Thiên Phủ (w_supreme_1) + Thiên Phú Thiên Cơ Chi Tử (×5)", hot: true },
];

const DONATE_OFFERS = [
  "🎁 Nạp LẦN ĐẦU hôm nay: x2 Linh Thạch",
  "💎 Nạp từ 100.000đ tặng thêm 1 Tẩy Tủy Đan",
  "👑 Nạp từ 500.000đ tặng vũ khí Thần Ma Diệt Thế Kiếm",
  "🔥 Ưu đãi đặc biệt reset mỗi ngày 00:00",
];

// ── PHÁP TẮC TU LUYỆN (đường tu riêng, tách biệt Pháp Tắc shop Prime) ──
const PHAPTAC_REQUIRED_REALM = 30;
const PHAPTAC_MAX_LEVEL = 10;

const PHAPTAC_PATHS = {
  thoigian: {
    key: "thoigian",
    name: "Pháp Tắc Thời Gian",
    emoji: "⏳",
    scope: "pk+tower",
    desc: "Ngưng đọng thời gian, làm chậm kẻ địch. Hiệu lực trong PK và Thiên Tầng Tháp.",
    base: { enemySpdRed: 30, enemyDodgeRed: 20 },
    growth: { enemySpdRed: 5, enemyDodgeRed: 5 },
  },
  khonggian: {
    key: "khonggian",
    name: "Pháp Tắc Không Gian",
    emoji: "🌌",
    scope: "pk",
    desc: "Triển khai lãnh địa không gian bao phủ bản thân và địch. Chỉ hiệu lực trong trận đấu (PK).",
    base: { selfDodge: 30, dmgBoost: 20, crit: 100, critDmg: 40 },
    growth: { selfDodge: 5, dmgBoost: 5, crit: 10, critDmg: 5 },
  },
  thoikhong: {
    key: "thoikhong",
    name: "Pháp Tắc Thời Không",
    emoji: "🌀",
    scope: "pk",
    desc: "Đảo ngược dòng thời khắc trong trận đấu: khi gục ngã có cơ hội hồi sinh — chỉ 1 lần duy nhất mỗi trận.",
    base: { reviveChance: 20, reviveHpPct: 10 },
    growth: { reviveChance: 2, reviveHpPct: 0 },
  },
};

function getPhapTacEffects(pathKey, level) {
  const cfg = PHAPTAC_PATHS[pathKey];
  if (!cfg || !level || level < 1) return null;
  const eff = {};
  for (const [k, baseVal] of Object.entries(cfg.base)) {
    eff[k] = baseVal + (cfg.growth[k] || 0) * (level - 1);
  }
  return Object.keys(eff).length ? eff : null;
}

const PHAPTAC_UPGRADE_COSTS = {
  1: 100000000,
  2: 200000000,
  3: 400000000,
  4: 800000000,
  5: 1600000000,
  6: 3200000000,
  7: 6400000000,
  8: 10000000000,
  9: 50000000000,
};

function getPhapTacUpgradeCost(level) {
  return PHAPTAC_UPGRADE_COSTS[Math.max(1, level)] || PHAPTAC_UPGRADE_COSTS[9];
}

const PHAPTAC_REALM_STEP = 5;

function getPhapTacRealmRequired(level) {
  return PHAPTAC_REQUIRED_REALM + Math.max(0, level) * PHAPTAC_REALM_STEP;
}

function describePhapTacEff(eff) {
  if (!eff) return "";
  const parts = [];
  if (eff.enemySpdRed) parts.push(`SPD địch -${eff.enemySpdRed}%`);
  if (eff.enemyDodgeRed) parts.push(`né địch -${eff.enemyDodgeRed}%`);
  if (eff.selfDodge) parts.push(`né bản thân +${eff.selfDodge}%`);
  if (eff.dmgBoost) parts.push(`sát thương +${eff.dmgBoost}%`);
  if (eff.crit) parts.push(`crit +${eff.crit}%`);
  if (eff.critDmg) parts.push(`ST chí mạng +${eff.critDmg}%`);
  if (eff.reviveChance) parts.push(`hồi sinh ${eff.reviveChance}% với ${eff.reviveHpPct || 10}% máu tối đa (1 lần/trận)`);
  return parts.join(", ");
}

export {
  REALMS, MA_REALMS, NHO_REALMS, YEU_REALMS, LO_REALMS, QUY_REALMS, PHAT_REALMS, MINOR_REALM_NAMES, TALENTS, WEAPONS, ARMORS, POTIONS,
  CONGPHA, SPECIAL_ITEMS, TOKEN_ITEMS, PHAP_BAO, TITLES, THECHAT, HUYETMACH, LINH_CAN, SECRET_REALMS, MATERIALS, RECIPES,
  DONATE_PACKAGES, DONATE_OFFERS, DONATE_MILESTONES, DONATE_COMBOS, PRIME, getPrimeLevel,
  MAX_MAJOR_REALM, MAX_MINOR_REALM, getMaxMajorRealm,
  PK_REWARD_WINNER, PK_REWARD_POINTS, TAX_RATE,
  PHAPTAC_REQUIRED_REALM, PHAPTAC_MAX_LEVEL, PHAPTAC_UPGRADE_COSTS, PHAPTAC_PATHS, getPhapTacEffects, getPhapTacUpgradeCost, getPhapTacRealmRequired, describePhapTacEff,
  rollTalent, rollTheChat, rollHuyetMach, rollLinhCan, getRealmList, getRealmByIndex, getMaxExp, getRealmExpBase, getRealmDisplay, getRealmDisplayFull,
  rollBreakthrough, formatNumber, formatBig, calcStats, checkAutoTitles, checkTop3Title,
};

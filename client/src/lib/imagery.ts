export const CATEGORY_IMAGE: Record<string, string> = {
  badminton: '/images/badminton.jpg',
  study_room: '/images/study-room.jpg',
  football: '/images/futsal.jpg',
  coffee: '/images/coffee.jpg',
  milk_tea: '/images/coffee.jpg',
  snack: '/images/coffee.jpg',
};

export const CATEGORY_LABEL: Record<string, string> = {
  badminton: 'Cầu lông',
  study_room: 'Phòng học nhóm',
  football: 'Bóng đá',
  milk_tea: 'Trà sữa',
  coffee: 'Cà phê',
  snack: 'Ăn vặt',
};

export const categoryLabel = (category?: string | null) => (category ? CATEGORY_LABEL[category] ?? category : 'Địa điểm');

export const categoryImage = (category?: string | null, type?: string | null) => {
  if (category && CATEGORY_IMAGE[category]) return CATEGORY_IMAGE[category];
  return type === 'FNB' ? '/images/coffee.jpg' : '/images/badminton.jpg';
};

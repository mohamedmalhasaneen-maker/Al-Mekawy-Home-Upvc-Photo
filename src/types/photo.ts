export type PhotoCategory = 'windows' | 'doors' | 'balconies';

export interface PhotoItem {
  id: string;
  imageUrl: string;
  storagePath: string;
  category: PhotoCategory;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInfo {
  id: PhotoCategory;
  titleAr: string;
  titleEn: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export const CATEGORIES: Record<PhotoCategory, CategoryInfo> = {
  windows: {
    id: 'windows',
    titleAr: 'الشبابيك',
    titleEn: 'Windows',
    icon: '🪟',
    description: 'شبابيك UPVC عازلة للصوت والحرارة والأتربة (جرار، مفصلي، قلاب)',
    badgeColor: 'from-blue-600 to-cyan-500',
  },
  doors: {
    id: 'doors',
    titleAr: 'الأبواب',
    titleEn: 'Doors',
    icon: '🚪',
    description: 'أبواب UPVC أنيقة ومقاومة للرطوبة والمياه بتصميمات عصرية',
    badgeColor: 'from-amber-600 to-orange-500',
  },
  balconies: {
    id: 'balconies',
    titleAr: 'البلكونات',
    titleEn: 'Balconies',
    icon: '🏠',
    description: 'تقفيل بلكونات وواجهات UPVC زجاجية عازلة وعصرية',
    badgeColor: 'from-emerald-600 to-teal-500',
  },
};

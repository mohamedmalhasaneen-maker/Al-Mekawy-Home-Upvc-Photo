export type PhotoCategory = 'windows' | 'doors' | 'balconies';

export type ProductColor = 'white' | 'beige' | 'special';

export interface ColorOptionInfo {
  id: ProductColor | 'all';
  titleAr: string;
  titleEn: string;
  badgeLabel: string;
  dotColorClass: string;
  bgGradient: string;
  borderClass: string;
  glowClass: string;
}

export const PRODUCT_COLORS: Record<ProductColor | 'all', ColorOptionInfo> = {
  all: {
    id: 'all',
    titleAr: 'جميع الألوان',
    titleEn: 'All Colors',
    badgeLabel: 'الكل',
    dotColorClass: 'bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400',
    bgGradient: 'from-blue-600/20 via-cyan-600/20 to-teal-600/20',
    borderClass: 'border-cyan-500/50',
    glowClass: 'shadow-cyan-500/20',
  },
  white: {
    id: 'white',
    titleAr: 'الأبيض (White)',
    titleEn: 'White',
    badgeLabel: 'أبيض',
    dotColorClass: 'bg-white border border-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]',
    bgGradient: 'from-slate-100/15 to-white/10',
    borderClass: 'border-white/50',
    glowClass: 'shadow-white/20',
  },
  beige: {
    id: 'beige',
    titleAr: 'البيج (Beige)',
    titleEn: 'Beige',
    badgeLabel: 'بيج',
    dotColorClass: 'bg-[#e3cb98] border border-[#f5e6c8] shadow-[0_0_8px_rgba(227,203,152,0.8)]',
    bgGradient: 'from-amber-700/20 to-yellow-600/20',
    borderClass: 'border-amber-500/50',
    glowClass: 'shadow-amber-500/20',
  },
  special: {
    id: 'special',
    titleAr: 'الألوان الخاصة (Special Colors)',
    titleEn: 'Special Colors',
    badgeLabel: 'ألوان خاصة (رمادي، أسود، خشبي)',
    dotColorClass: 'bg-gradient-to-tr from-stone-800 via-amber-900 to-stone-400 border border-amber-500/50 shadow-[0_0_8px_rgba(217,119,6,0.6)]',
    bgGradient: 'from-amber-900/25 via-stone-800/25 to-zinc-800/25',
    borderClass: 'border-amber-600/50',
    glowClass: 'shadow-amber-600/20',
  },
};

export interface PhotoItem {
  id: string;
  imageUrl: string;
  storagePath: string;
  category: PhotoCategory;
  color?: ProductColor; // 'white' | 'beige' | 'special'
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

export interface ProductSubtype {
  id: string;
  name: string;
  englishName: string;
  description: string;
  image: string;
  gallery: string[]; // صور إضافية من المعرض لرفعها من قبل المشرف
  features: string[];
  specs: {
    chambers: string;      // عدد الغرف/الحجرات في القطاع
    insulation: string;    // معامل العزل
    glassCompatibility: string; // سمك وتوافق الزجاج
    durability: string;    // العمر الافتراضي والتحمل
    origin: string;        // منشأ القطاع
  };
}

export interface CatalogCategory {
  id: 'doors' | 'windows';
  title: string;
  englishTitle: string;
  description: string;
  image: string;
  subtypes: ProductSubtype[];
}

export interface Advantage {
  icon: string;
  title: string;
  description: string;
}

import React, { useState } from 'react';
import { PhotoItem, CATEGORIES } from '../types/photo';
import { Eye, Image as ImageIcon, Trash2, Edit3, Sparkles } from 'lucide-react';

interface PhotoGridProps {
  photos: PhotoItem[];
  onSelectPhoto: (index: number) => void;
  isAdmin?: boolean;
  onDeletePhoto?: (photo: PhotoItem) => void;
  onEditPhoto?: (photo: PhotoItem) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  onSelectPhoto,
  isAdmin = false,
  onDeletePhoto,
  onEditPhoto,
}) => {
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});

  if (photos.length === 0) {
    return (
      <div className="py-20 text-center px-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-4xl mb-4 text-slate-500 shadow-inner">
          <ImageIcon className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-300 mb-1">
          لا توجد صور في هذا القسم حتى الآن
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {isAdmin
            ? 'يمكنك إضافة صور جديدة فوراً من خلال زر "إضافة صورة" في لوحة التحكم بالأعلى.'
            : 'سيتم إضافة صور تصميمات جديدة قريباً من قبل إدارة Al-Mekawy Home UPVC.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {photos.map((photo, index) => {
        const isLoaded = loadedMap[photo.id];
        const category = CATEGORIES[photo.category] || {
          id: photo.category,
          titleAr: 'منتج',
          titleEn: 'Product',
          icon: '🖼️',
          badgeColor: 'from-blue-600 to-indigo-600',
        };

        return (
          <div
            key={photo.id}
            className="group relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col cursor-pointer"
            onClick={() => onSelectPhoto(index)}
          >
            {/* Image Aspect Box */}
            <div className="relative aspect-4/3 sm:aspect-square w-full bg-slate-950 overflow-hidden">
              {/* Skeleton placeholder while loading */}
              {!isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 animate-pulse flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-700 animate-bounce" />
                </div>
              )}

              <img
                src={photo.imageUrl}
                alt={photo.title || category.titleAr}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoadedMap((prev) => ({ ...prev, [photo.id]: true }))}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Category Tag overlay on top right */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-700/60 shadow-md">
                  <span>{category.icon}</span>
                  <span className="hidden xs:inline">{category.titleAr}</span>
                </span>
              </div>

              {/* Hover overlay for zoom preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
                <div className="flex items-center justify-between text-white">
                  <span className="flex items-center gap-1 text-xs font-semibold text-blue-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>تكبير ومعاينة</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom title & info */}
            <div className="p-3 sm:p-3.5 bg-slate-900 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-blue-400 transition-colors">
                  {photo.title || category.titleAr}
                </h4>
              </div>

              {/* Admin actions if enabled */}
              {isAdmin && (
                <div
                  className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEditPhoto && (
                    <button
                      onClick={() => onEditPhoto(photo)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                      title="تعديل بيانات الصورة"
                    >
                      <Edit3 className="w-3 h-3 text-blue-400" />
                      <span>تعديل</span>
                    </button>
                  )}

                  {onDeletePhoto && (
                    <button
                      onClick={() => onDeletePhoto(photo)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-100 text-[11px] font-semibold border border-red-800/40 transition-colors"
                      title="حذف الصورة من التخزين وقاعدة البيانات"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { PhotoCategory, CATEGORIES } from '../types/photo';
import { Layers, Sparkles } from 'lucide-react';

interface CategoryHeroProps {
  selectedCategory: PhotoCategory | 'all';
  onSelectCategory: (category: PhotoCategory | 'all') => void;
  counts: {
    all: number;
    windows: number;
    doors: number;
    balconies: number;
  };
}

export const CategoryHero: React.FC<CategoryHeroProps> = ({
  selectedCategory,
  onSelectCategory,
  counts,
}) => {
  const categoryKeys: PhotoCategory[] = ['windows', 'doors', 'balconies'];

  return (
    <div className="py-6 sm:py-8">
      {/* Category selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5 mb-6">
        {categoryKeys.map((catKey) => {
          const cat = CATEGORIES[catKey];
          const isSelected = selectedCategory === catKey;
          const count = counts[catKey] || 0;

          return (
            <button
              key={catKey}
              onClick={() => onSelectCategory(catKey)}
              className={`group relative overflow-hidden rounded-2xl p-5 text-right transition-all duration-300 transform active:scale-[0.98] ${
                isSelected
                  ? 'bg-gradient-to-br from-slate-900 to-slate-850 border-2 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-850/90 border border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Background gradient decorative glow */}
              <div
                className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30 bg-gradient-to-br ${cat.badgeColor}`}
              />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-400/40 text-white'
                        : 'bg-slate-800/80 border border-slate-700/60'
                    }`}
                  >
                    <span>{cat.icon}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                        {cat.titleAr}
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold font-mono">
                        ({cat.titleEn})
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {cat.description}
                    </p>
                  </div>
                </div>

                {/* Photo counter badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>{count}</span> <span className="text-[10px] font-normal">صورة</span>
                </div>
              </div>

              {/* Bottom active indicator line */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>عرض كل الصور</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[11px] font-mono">
              {counts.all}
            </span>
          </button>

          {categoryKeys.map((catKey) => {
            const cat = CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => onSelectCategory(catKey)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-blue-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.titleAr}</span>
                <span className="text-xs text-slate-500 font-mono">({counts[catKey] || 0})</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 px-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>تحديث سحابي فوري ومباشر</span>
        </div>
      </div>
    </div>
  );
};

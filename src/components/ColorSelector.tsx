import React from 'react';
import { ProductColor, PRODUCT_COLORS, PhotoCategory, CATEGORIES } from '../types/photo';
import { Palette, Sparkles, Check } from 'lucide-react';

interface ColorSelectorProps {
  selectedCategory: PhotoCategory | 'all';
  selectedColor: ProductColor | 'all';
  onSelectColor: (color: ProductColor | 'all') => void;
  colorCounts: Record<ProductColor | 'all', number>;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedCategory,
  selectedColor,
  onSelectColor,
  colorCounts,
}) => {
  const colorKeys: (ProductColor | 'all')[] = ['all', 'white', 'beige', 'special'];

  const currentCategoryTitle = selectedCategory === 'all'
    ? 'جميع الأقسام'
    : CATEGORIES[selectedCategory]?.titleAr;

  return (
    <div className="mb-8 bg-slate-900/70 border border-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Decorative subtle background glow */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header title for color filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <Palette className="w-4 h-4 glass-icon" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-white font-arabic flex items-center gap-2">
              <span>خيارات ألوان منتجات {currentCategoryTitle}</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 glass-icon" />
            </h4>
            <p className="text-[11px] text-slate-400 font-arabic">
              اختر اللون المطلوب لمشاهدة صور وتصاميم {currentCategoryTitle} المطابقة مباشرة
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full self-start sm:self-center font-arabic">
          تصفية حسب اللون
        </span>
      </div>

      {/* Color Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {colorKeys.map((colKey) => {
          const colorInfo = PRODUCT_COLORS[colKey];
          const isSelected = selectedColor === colKey;
          const count = colorCounts[colKey] || 0;

          return (
            <button
              type="button"
              key={colKey}
              onClick={() => onSelectColor(colKey)}
              className={`group relative overflow-hidden rounded-xl p-2.5 sm:p-3 text-right transition-all duration-300 transform active:scale-[0.97] flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? `bg-slate-900 border-2 ${colorInfo.borderClass} shadow-lg ${colorInfo.glowClass} ring-2 ring-cyan-500/30`
                  : 'bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Active Background Glow */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colorInfo.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                  isSelected ? 'opacity-100' : ''
                }`}
              />

              <div className="relative z-10 flex items-center justify-between w-full">
                {/* Color Dot Indicator */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-110 ${colorInfo.dotColorClass}`}
                  />
                  <span className={`text-[11px] sm:text-xs font-bold font-arabic transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {colorInfo.badgeLabel}
                  </span>
                </div>

                {/* Selected Check icon */}
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-cyan-500/30 border border-cyan-400 text-cyan-300 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Subtitle & Count Badge */}
              <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                <span className="text-slate-400 font-mono">
                  {colorInfo.titleEn}
                </span>
                <span
                  className={`px-1.5 py-0 rounded-full font-mono text-[9px] font-bold ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

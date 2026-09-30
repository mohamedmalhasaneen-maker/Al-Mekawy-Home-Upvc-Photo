import React, { useEffect, useState, useCallback } from 'react';
import { PhotoItem, CATEGORIES } from '../types/photo';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Download,
  Share2,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Layers,
} from 'lucide-react';

interface PhotoLightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setImageLoaded(false);
      setIsZoomed(false);
      onNavigate(currentIndex - 1);
    } else {
      // Loop to end
      setImageLoaded(false);
      setIsZoomed(false);
      onNavigate(photos.length - 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setImageLoaded(false);
      setIsZoomed(false);
      onNavigate(currentIndex + 1);
    } else {
      // Loop to start
      setImageLoaded(false);
      setIsZoomed(false);
      onNavigate(0);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // RTL: ArrowLeft is next in Arabic, ArrowRight is prev
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const category = CATEGORIES[currentPhoto.category] || {
    id: currentPhoto.category,
    titleAr: 'المنتج',
    titleEn: 'Product',
    icon: '🖼️',
    badgeColor: 'from-blue-600 to-indigo-600',
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left -> in RTL, next item
        handleNext();
      } else {
        // Swiped right -> in RTL, prev item
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `مرحباً، أود الاستفسار عن هذا التصميم من منتجات Al-Mekawy Home UPVC (${category.titleAr} - ${currentPhoto.title}):\n${currentPhoto.imageUrl}`
    );
    window.open(`https://wa.me/201141761261?text=${text}`, '_blank');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentPhoto.imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `AlMekawy_UPVC_${currentPhoto.category}_${currentPhoto.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      window.open(currentPhoto.imageUrl, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top action bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30">
            <span>{category.icon}</span>
            <span>{category.titleAr}</span>
          </span>
          <span className="text-xs sm:text-sm text-slate-300 font-mono">
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title={isZoomed ? 'تصغير' : 'تكبير'}
            aria-label="تكبير أو تصغير الصورة"
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
            title="تحميل الصورة"
            aria-label="تحميل الصورة بجودة كاملة"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white transition-colors"
            title="إغلاق (Esc)"
            aria-label="إغلاق نافذة العرض"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Loading Spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

        <img
          src={currentPhoto.imageUrl}
          alt={currentPhoto.title}
          onLoad={() => setImageLoaded(true)}
          className={`max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-all duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsZoomed(!isZoomed)}
        />
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          {/* Previous Button (Right side in RTL) */}
          <button
            onClick={handlePrev}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-slate-700/50 hover:border-blue-400 transition-all active:scale-95"
            aria-label="الصورة السابقة"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Next Button (Left side in RTL) */}
          <button
            onClick={handleNext}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white shadow-xl backdrop-blur-md border border-slate-700/50 hover:border-blue-400 transition-all active:scale-95"
            aria-label="الصورة التالية"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom info banner */}
      <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-white">
              {currentPhoto.title}
            </h4>
            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 mt-1">
              <span>{category.titleAr} - Al Mekawy Home UPVC</span>
              {currentPhoto.createdAt && (
                <span className="flex items-center gap-1 font-mono text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(currentPhoto.createdAt).toLocaleDateString('ar-EG')}
                </span>
              )}
            </div>
          </div>

          {/* Quick WhatsApp Inquiry for this exact item */}
          <button
            onClick={shareViaWhatsApp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>طلب أو استفسار عن هذا التصميم</span>
          </button>
        </div>
      </div>
    </div>
  );
};

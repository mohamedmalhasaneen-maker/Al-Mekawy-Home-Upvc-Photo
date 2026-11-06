import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { CategoryHero } from './components/CategoryHero';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoGridSkeleton } from './components/PhotoGridSkeleton';
import { PhotoLightbox } from './components/PhotoLightbox';
import { AdminModal } from './components/AdminModal';
import { FirebaseInfoModal } from './components/FirebaseInfoModal';

import { ContactSection } from './components/ContactSection';
import { ColorSelector } from './components/ColorSelector';
import { PhotoItem, PhotoCategory, ProductColor, CATEGORIES, PRODUCT_COLORS } from './types/photo';
import {
  subscribeToPhotos,
  deleteProductPhoto,
  updatePhotoMetadata,
} from './services/photoService';
import { getIsAdmin, subscribeAdminAuth, logoutAdmin } from './services/adminAuth';
import {
  PublishingSettings,
  DEFAULT_PUBLISHING_SETTINGS,
  subscribeToPublishingSettings,
} from './services/settingsService';
import { testConnection } from './firebase/config';
import {
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  RefreshCw,
  Plus,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
  Sliders,
} from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('windows');
  const [selectedColor, setSelectedColor] = useState<ProductColor | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Publishing Settings state synced with Firestore
  const [publishingSettings, setPublishingSettings] = useState<PublishingSettings>(DEFAULT_PUBLISHING_SETTINGS);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdmin());

  // Firebase Info Modal
  const [firebaseInfoOpen, setFirebaseInfoOpen] = useState(false);

  // Edit/Delete helper states from main grid when in Admin mode
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);

  // Subscribe to persistent admin auth state
  useEffect(() => {
    const unsubscribeAuth = subscribeAdminAuth((adminState) => {
      setIsAdmin(adminState);
    });
    return () => unsubscribeAuth();
  }, []);

  // Subscribe to real-time publishing settings from Firestore
  useEffect(() => {
    const unsubscribeSettings = subscribeToPublishingSettings((remoteSettings) => {
      setPublishingSettings(remoteSettings);
    });
    return () => unsubscribeSettings();
  }, []);

  // Open admin modal if URL requests it and user is admin
  useEffect(() => {
    if (isAdmin && (location.search.includes('admin=open') || location.search.includes('admin=true'))) {
      setAdminModalOpen(true);
    }
  }, [isAdmin, location.search]);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    testConnection();

    const unsubscribe = subscribeToPhotos(
      (items) => {
        setPhotos(items);
        setLoading(false);
      },
      (error) => {
        console.error('Subscription error in App:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered photos based on category, color, search, and publishing settings
  const filteredPhotos = useMemo(() => {
    let result = photos;

    // Apply real-time publishing settings for public visitors
    if (!isAdmin) {
      if (!publishingSettings.isGalleryPublished) {
        return [];
      }

      // Filter out categories whose publishing is disabled
      result = result.filter((p) => {
        if (p.category === 'windows' && !publishingSettings.publishWindows) return false;
        if (p.category === 'doors' && !publishingSettings.publishDoors) return false;
        if (p.category === 'balconies' && !publishingSettings.publishBalconies) return false;
        return true;
      });

      // Filter out individual photos whose publishing is disabled
      if (publishingSettings.unpublishedPhotoIds.length > 0) {
        const unpublishedSet = new Set(publishingSettings.unpublishedPhotoIds);
        result = result.filter((p) => !unpublishedSet.has(p.id));
      }
    }

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedColor !== 'all') {
      result = result.filter((p) => {
        const itemColor = p.color || 'white';
        return itemColor === selectedColor;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          CATEGORIES[p.category]?.titleAr.includes(q) ||
          CATEGORIES[p.category]?.titleEn.toLowerCase().includes(q)
      );
    }

    return result;
  }, [photos, selectedCategory, selectedColor, searchQuery, isAdmin, publishingSettings]);

  // Photo counts for main categories
  const counts = useMemo(() => {
    const activePhotos = isAdmin
      ? photos
      : (!publishingSettings.isGalleryPublished
          ? []
          : photos.filter((p) => {
              if (p.category === 'windows' && !publishingSettings.publishWindows) return false;
              if (p.category === 'doors' && !publishingSettings.publishDoors) return false;
              if (p.category === 'balconies' && !publishingSettings.publishBalconies) return false;
              if (publishingSettings.unpublishedPhotoIds.includes(p.id)) return false;
              return true;
            }));

    return {
      all: activePhotos.length,
      windows: activePhotos.filter((p) => p.category === 'windows').length,
      doors: activePhotos.filter((p) => p.category === 'doors').length,
      balconies: activePhotos.filter((p) => p.category === 'balconies').length,
    };
  }, [photos, isAdmin, publishingSettings]);

  // Color counts for current selected category
  const colorCounts = useMemo(() => {
    const activePhotos = isAdmin
      ? photos
      : (!publishingSettings.isGalleryPublished
          ? []
          : photos.filter((p) => {
              if (p.category === 'windows' && !publishingSettings.publishWindows) return false;
              if (p.category === 'doors' && !publishingSettings.publishDoors) return false;
              if (p.category === 'balconies' && !publishingSettings.publishBalconies) return false;
              if (publishingSettings.unpublishedPhotoIds.includes(p.id)) return false;
              return true;
            }));

    const categoryPhotos = selectedCategory === 'all'
      ? activePhotos
      : activePhotos.filter((p) => p.category === selectedCategory);

    return {
      all: categoryPhotos.length,
      white: categoryPhotos.filter((p) => p.color === 'white' || (!p.color && true)).length,
      beige: categoryPhotos.filter((p) => p.color === 'beige').length,
      special: categoryPhotos.filter((p) => p.color === 'special').length,
    };
  }, [photos, selectedCategory, isAdmin, publishingSettings]);

  const handleSelectCategory = (category: PhotoCategory | 'all') => {
    setSelectedCategory(category);
    const galleryElement = document.getElementById('photo-gallery-section');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenLightbox = (index: number) => {
    if (!isAdmin && !publishingSettings.allowLightboxViewing) {
      return;
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDeletePhoto = async (photo: PhotoItem) => {
    if (window.confirm(`هل أنت متأكد من حذف صورة "${photo.title || 'هذا المنتج'}"؟`)) {
      try {
        await deleteProductPhoto(photo);
      } catch (err) {
        alert('تعذر حذف الصورة.');
      }
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">

      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        onOpenAdmin={() => navigate('/developer')}
        totalPhotosCount={photos.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Title Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-950/40 to-slate-900/90 backdrop-blur-lg border border-white/20 shadow-2xl shadow-blue-950/40 p-6 sm:p-12 mb-8 text-center ring-1 ring-white/10">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 text-cyan-300 border border-cyan-400/30 text-xs sm:text-sm font-semibold mb-5 backdrop-blur-md shadow-md shadow-cyan-950/40">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse glass-icon" />
              <span className="tracking-wide">منتجات UPVC بأعلى المواصفات الأوروبية</span>
            </div>

            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4 font-['Outfit',sans-serif] drop-shadow-md">
              Al Mekawy Home{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 drop-shadow-sm">
                UPVC Photo
              </span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow">
              معرض صور منتجات Al-Mekawy Home UPVC — شبابيك، أبواب، وتقفيل بلكونات عازلة للصوت والحرارة بأرقى التشطيبات
            </p>
          </div>
        </div>

        {/* 3 Main Category Cards & Switcher */}
        <CategoryHero
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          counts={counts}
        />

        {/* Color Selection Filter Section */}
        <ColorSelector
          selectedCategory={selectedCategory}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          colorCounts={colorCounts}
        />

        {/* Search and Category Summary Bar */}
        <div id="photo-gallery-section" className="scroll-mt-24 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="font-bold text-white">
              {selectedCategory === 'all'
                ? 'جميع صور المعرض'
                : `صور قسم ${CATEGORIES[selectedCategory]?.titleAr}`}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({filteredPhotos.length} صورة متوفرة)
            </span>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 glass-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الصور..."
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Photo Gallery Grid or Paused Notice */}
        {!isAdmin && !publishingSettings.isGalleryPublished ? (
          <div className="py-16 px-6 text-center rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl mb-12 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-icon-box flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 glass-icon" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              معرض الصور قيد التحديث
            </h3>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              {publishingSettings.noticeMessage || 'معرض صور منتجات Al Mekawy Home UPVC قيد التحديث والتجديد وسيعود قريباً بأحدث الأعمال.'}
            </p>
          </div>
        ) : loading ? (
          <PhotoGridSkeleton />
        ) : (
          <PhotoGrid
            photos={filteredPhotos}
            onSelectPhoto={handleOpenLightbox}
            isAdmin={isAdmin}
            onDeletePhoto={handleDeletePhoto}
            onEditPhoto={(photo) => {
              setAdminModalOpen(true);
            }}
            showBadge={publishingSettings.watermarkOrBadgeVisible}
          />
        )}

        {/* Admin Quick Upload Shortcut Banner when in admin mode */}
        {isAdmin && (
          <div className="mt-12 p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass-icon-box-blue flex items-center justify-center text-white shrink-0">
                <Plus className="w-5 h-5 glass-icon" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  أنت في وضع المشرف (Admin Mode)
                </h4>
                <p className="text-xs text-slate-400">
                  يمكنك إضافة المزيد من الصور إلى السحابة فوراً أو تعديل وحذف الصور الحالية.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/developer')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-4 h-4 glass-icon" />
                <span>إعدادات نشر الصور</span>
              </button>
              <button
                onClick={() => setAdminModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 glass-icon" />
                <span>رفع صور</span>
              </button>
              <button
                onClick={async () => {
                  await logoutAdmin();
                  setIsAdmin(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700/50 text-xs sm:text-sm font-bold transition-all"
              >
                خروج من وضع المشرف
              </button>
            </div>
          </div>
        )}

        {/* Contact Section */}
        <ContactSection />
      </main>



      {/* Lightbox Modal */}
      <PhotoLightbox
        photos={filteredPhotos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIndex) => setLightboxIndex(newIndex)}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        photos={photos}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
      />

      {/* Firebase Setup Info Modal */}
      <FirebaseInfoModal
        isOpen={firebaseInfoOpen}
        onClose={() => setFirebaseInfoOpen(false)}
      />
    </div>
  );
}

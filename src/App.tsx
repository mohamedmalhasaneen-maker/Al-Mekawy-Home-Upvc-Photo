import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryHero } from './components/CategoryHero';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoLightbox } from './components/PhotoLightbox';
import { AdminModal } from './components/AdminModal';
import { FirebaseInfoModal } from './components/FirebaseInfoModal';
import { PhotoItem, PhotoCategory, CATEGORIES } from './types/photo';
import {
  subscribeToPhotos,
  deleteProductPhoto,
  updatePhotoMetadata,
} from './services/photoService';
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
} from 'lucide-react';

export default function App() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'all'>('windows');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Admin Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Firebase Info Modal
  const [firebaseInfoOpen, setFirebaseInfoOpen] = useState(false);

  // Edit/Delete helper states from main grid when in Admin mode
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);

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

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    let result = photos;

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
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
  }, [photos, selectedCategory, searchQuery]);

  // Photo counts
  const counts = useMemo(() => {
    return {
      all: photos.length,
      windows: photos.filter((p) => p.category === 'windows').length,
      doors: photos.filter((p) => p.category === 'doors').length,
      balconies: photos.filter((p) => p.category === 'balconies').length,
    };
  }, [photos]);

  const handleOpenLightbox = (index: number) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        isAdmin={isAdmin}
        onOpenAdmin={() => setAdminModalOpen(true)}
        totalPhotosCount={photos.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Title Hero Banner */}
        <div className="text-center py-6 sm:py-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-700/40 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>منتجات UPVC بأعلى المواصفات الأوروبية</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3 font-['Outfit',sans-serif]">
            Al mekawy home <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">UPVC Photo</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-2xl mx-auto">
            معرض صور منتجات Al-Mekawy Home UPVC — شبابيك، أبواب، وتقفيل بلكونات عازلة للصوت والحرارة
          </p>
        </div>

        {/* 3 Main Category Cards & Switcher */}
        <CategoryHero
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={counts}
        />

        {/* Search and Category Summary Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
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
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الصور..."
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Photo Gallery Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-400">
              جاري تحميل معرض الصور السحابي...
            </p>
          </div>
        ) : (
          <PhotoGrid
            photos={filteredPhotos}
            onSelectPhoto={handleOpenLightbox}
            isAdmin={isAdmin}
            onDeletePhoto={handleDeletePhoto}
            onEditPhoto={(photo) => {
              setAdminModalOpen(true);
            }}
          />
        )}

        {/* Admin Quick Upload Shortcut Banner when in admin mode */}
        {isAdmin && (
          <div className="mt-12 p-5 rounded-2xl bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Plus className="w-5 h-5" />
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

            <button
              onClick={() => setAdminModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all"
            >
              + إضافة صورة جديدة للقسم
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
              U
            </div>
            <span className="font-bold text-slate-300">
              Al Mekawy Home UPVC
            </span>
            <span>—</span>
            <span>معرض الصور السحابي الرسمي</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setFirebaseInfoOpen(true)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>معلومات السحابة والتخزين</span>
            </button>

            <span>•</span>

            <button
              onClick={() => setAdminModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isAdmin ? 'لوحة التحكم' : 'دخول المشرف'}
            </button>
          </div>
        </div>
      </footer>

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

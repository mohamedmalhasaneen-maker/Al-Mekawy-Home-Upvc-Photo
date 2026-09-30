import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CategoryHero } from './components/CategoryHero';
import { PhotoGrid } from './components/PhotoGrid';
import { PhotoLightbox } from './components/PhotoLightbox';
import { AdminModal } from './components/AdminModal';
import { FirebaseInfoModal } from './components/FirebaseInfoModal';
import { ContactSection, CONTACT_INFO } from './components/ContactSection';
import logoImg from './assets/images/almekawy_logo_1790781390166.jpg';
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

  const handleSelectCategory = (category: PhotoCategory | 'all') => {
    setSelectedCategory(category);
    // Smooth scroll to the photo gallery section
    const galleryElement = document.getElementById('photo-gallery-section');
    if (galleryElement) {
      galleryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-950/40 to-slate-900/90 backdrop-blur-lg border border-white/20 shadow-2xl shadow-blue-950/40 p-6 sm:p-12 mb-8 text-center ring-1 ring-white/10">
          {/* Vibrant ambient gradient glow lights */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-600/35 to-cyan-400/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-gradient-to-tl from-indigo-600/30 to-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/15 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 text-cyan-300 border border-cyan-400/30 text-xs sm:text-sm font-semibold mb-5 backdrop-blur-md shadow-md shadow-cyan-950/40">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                + إضافة صورة جديدة
              </button>
              <button
                onClick={() => {
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
        {/* Contact Us Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800/80 bg-slate-950/90 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800/80 text-right">
            {/* Column 1: Brand Info */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-amber-500/30 shadow-md flex-shrink-0">
                  <img
                    src={logoImg}
                    alt="Al Mekawy Home Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-white font-['Outfit',sans-serif]">
                  Al Mekawy Home <span className="text-blue-400">UPVC</span>
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-4">
                المعرض الرسمي لمنتجات قطاعات الـ UPVC العالمية — أبواب وشبابيك عازلة للصوت والحرارة والأتربة بأرقى إكسسوارات وتشطيبات مصرية وأوروبية.
              </p>
              <div className="flex items-center gap-3">
                {/* Facebook icon button */}
                <a
                  href={CONTACT_INFO.socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-[#1877F2] text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-colors"
                  title="صفحتنا على فيسبوك"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* TikTok icon button */}
                <a
                  href={CONTACT_INFO.socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-black text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-colors"
                  title="صفحتنا على تيك توك"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 10.86 4.46v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.07z"/>
                  </svg>
                </a>
                {/* Instagram icon button */}
                <a
                  href={CONTACT_INFO.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-[#E1306C] text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-colors"
                  title="صفحتنا على إنستجرام"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Phone & WhatsApp Actions */}
            <div>
              <h5 className="text-sm font-bold text-white mb-3">
                الاتصال السريع وخدمة العملاء
              </h5>
              <div className="space-y-2.5">
                {CONTACT_INFO.phones.map((phone) => (
                  <div key={phone.number} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <a
                      href={`tel:${phone.number}`}
                      className="font-mono text-slate-200 hover:text-blue-400 font-bold transition-colors direction-ltr"
                      dir="ltr"
                    >
                      {phone.formatted}
                    </a>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${phone.number}`}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white transition-colors"
                      >
                        اتصال
                      </a>
                      <a
                        href={`https://wa.me/${phone.intl}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن منتجات Al Mekawy Home UPVC')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white transition-colors"
                      >
                        واتساب
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Quick Navigation */}
            <div>
              <h5 className="text-sm font-bold text-white mb-3">
                روابط سريعة
              </h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      const el = document.getElementById('photo-gallery-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    • جميع صور المعرض
                  </button>
                </li>
                <li>
                  <a
                    href="#contact-us"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    • تواصل معنا وحجز المعاينة
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setFirebaseInfoOpen(true)}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>حالة السحابة وقواعد البيانات</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setAdminModalOpen(true)}
                    className="hover:text-white transition-colors"
                  >
                    • {isAdmin ? 'لوحة تحكم المشرف' : 'دخول المشرف'}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              جميع الحقوق محفوظة © {new Date().getFullYear()} <span className="text-slate-300 font-bold">Al Mekawy Home UPVC</span>.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>متاحون للرد وتلقي الطلبات يومياً</span>
            </div>
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

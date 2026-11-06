import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  LogOut,
  Layers,
  Image as ImageIcon,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Globe,
  Power,
  ToggleLeft,
  ToggleRight,
  Maximize2,
} from 'lucide-react';
import { getIsAdmin, loginAdmin, logoutAdmin, subscribeAdminAuth } from '../services/adminAuth';
import {
  PublishingSettings,
  DEFAULT_PUBLISHING_SETTINGS,
  subscribeToPublishingSettings,
  savePublishingSettings,
} from '../services/settingsService';
import { PhotoItem, PhotoCategory, CATEGORIES } from '../types/photo';
import { subscribeToPhotos } from '../services/photoService';
import logoImg from '../assets/images/almekawy_logo_1790781390166.jpg';

export const DeveloperPage: React.FC = () => {
  const navigate = useNavigate();

  // Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdmin());
  const [authCredential, setAuthCredential] = useState('');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAuthSecret, setShowAuthSecret] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<PublishingSettings>(DEFAULT_PUBLISHING_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<PublishingSettings>(DEFAULT_PUBLISHING_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  // Photos State
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to persistent admin authentication
  useEffect(() => {
    const unsubscribe = subscribeAdminAuth((adminState) => {
      setIsAdmin(adminState);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to real-time publishing settings from Firestore
  useEffect(() => {
    const unsubscribeSettings = subscribeToPublishingSettings((remoteSettings) => {
      setSettings(remoteSettings);
      setInitialSettings(remoteSettings);
    });
    return () => unsubscribeSettings();
  }, []);

  // Fetch photos only if admin is verified
  useEffect(() => {
    if (!isAdmin) {
      setPhotos([]);
      return;
    }

    const unsubscribePhotos = subscribeToPhotos((items) => {
      setPhotos(items);
    });
    return () => unsubscribePhotos();
  }, [isAdmin]);

  // Auth Submit handler (Firebase Auth + Admin Passcode)
  const handleVerifyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCredential.trim()) {
      setAuthError('يرجى إدخال كلمة المرور أو رمز التحقق.');
      return;
    }

    setIsVerifyingAuth(true);
    setAuthError('');

    try {
      await loginAdmin(authCredential);
      setAuthCredential('');
    } catch (err: any) {
      setAuthError(err?.message || 'بيانات الاعتماد غير صحيحة. يرجى إعادة المحاولة.');
    } finally {
      setIsVerifyingAuth(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
  };

  // Toggle master gallery publishing
  const toggleMasterPublish = () => {
    setSettings((prev) => ({
      ...prev,
      isGalleryPublished: !prev.isGalleryPublished,
    }));
  };

  // Toggle specific category publishing
  const toggleCategoryPublish = (cat: PhotoCategory) => {
    setSettings((prev) => {
      if (cat === 'windows') return { ...prev, publishWindows: !prev.publishWindows };
      if (cat === 'doors') return { ...prev, publishDoors: !prev.publishDoors };
      if (cat === 'balconies') return { ...prev, publishBalconies: !prev.publishBalconies };
      return prev;
    });
  };

  // Toggle publishing state of a single photo
  const togglePhotoPublish = (photoId: string) => {
    setSettings((prev) => {
      const isCurrentlyUnpublished = prev.unpublishedPhotoIds.includes(photoId);
      const updatedList = isCurrentlyUnpublished
        ? prev.unpublishedPhotoIds.filter((id) => id !== photoId)
        : [...prev.unpublishedPhotoIds, photoId];

      return {
        ...prev,
        unpublishedPhotoIds: updatedList,
      };
    });
  };

  // Publish all currently filtered photos
  const publishAllFiltered = () => {
    const filteredIds = new Set(filteredPhotos.map((p) => p.id));
    setSettings((prev) => ({
      ...prev,
      unpublishedPhotoIds: prev.unpublishedPhotoIds.filter((id) => !filteredIds.has(id)),
    }));
  };

  // Unpublish all currently filtered photos
  const unpublishAllFiltered = () => {
    const filteredIds = filteredPhotos.map((p) => p.id);
    setSettings((prev) => ({
      ...prev,
      unpublishedPhotoIds: Array.from(new Set([...prev.unpublishedPhotoIds, ...filteredIds])),
    }));
  };

  // Save Settings to Firebase Firestore
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    try {
      await savePublishingSettings(settings);
      setInitialSettings(settings);
      setSaveStatus('success');
      setSaveMessage('تم حفظ إعدادات نشر الصور بنجاح في قاعدة Firebase وتطبيقها على جميع الزوار فوراً ✓');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    } catch (err: any) {
      setSaveStatus('error');
      setSaveMessage(err?.message || 'تعذر حفظ الإعدادات في Firebase. يرجى التحقق من الاتصال بالإنترنت.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to initial
  const handleResetSettings = () => {
    setSettings(initialSettings);
  };

  // Has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings);
  }, [settings, initialSettings]);

  // Filtered photos for the list
  const filteredPhotos = useMemo(() => {
    let result = photos;

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (visibilityFilter === 'published') {
      result = result.filter((p) => !settings.unpublishedPhotoIds.includes(p.id));
    } else if (visibilityFilter === 'unpublished') {
      result = result.filter((p) => settings.unpublishedPhotoIds.includes(p.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          CATEGORIES[p.category]?.titleAr.includes(q)
      );
    }

    return result;
  }, [photos, categoryFilter, visibilityFilter, searchQuery, settings.unpublishedPhotoIds]);

  // Statistics
  const stats = useMemo(() => {
    const total = photos.length;
    const unpublishedCount = photos.filter((p) => settings.unpublishedPhotoIds.includes(p.id)).length;
    const publishedCount = total - unpublishedCount;
    return { total, publishedCount, unpublishedCount };
  }, [photos, settings.unpublishedPhotoIds]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden" dir="rtl">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-600/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-indigo-600/20 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl mb-8 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 shadow-md shrink-0">
              <img
                src={logoImg}
                alt="Al Mekawy Home Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white font-['Outfit',sans-serif]">
                  Al Mekawy Home <span className="text-blue-400">UPVC</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <Sliders className="w-3.5 h-3.5 glass-icon" />
                  <span>إعدادات الموقع</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                التحكم في نشر وظهور صور منتجات المعرض للزوار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 transition-all shadow-sm"
              title="العودة إلى المعرض الرئيسي"
            >
              <Home className="w-4 h-4 glass-icon" />
              <span>المعرض الرئيسي</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800/50 text-xs sm:text-sm font-bold transition-all shadow-sm"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4 glass-icon" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
          </div>
        </div>

        {/* Protection: If Not Authorized, show modern Verification Gate */}
        {!isAdmin ? (
          <div className="max-w-md mx-auto py-12">
            <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl p-6 sm:p-8 text-right">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto rounded-2xl glass-icon-box-blue flex items-center justify-center text-blue-400 mb-3 shadow-lg">
                  <Lock className="w-7 h-7 glass-icon" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  إعدادات الموقع — صلاحيات المشرف
                </h2>
                <p className="text-xs text-slate-400">
                  هذه الصفحة مخصصة فقط لمشرف شركة Al Mekawy Home UPVC للتحكم في نشر الصور
                </p>
              </div>

              <form onSubmit={handleVerifyAccess} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كلمة المرور / رمز المشرف:
                  </label>
                  <div className="relative">
                    <input
                      type={showAuthSecret ? 'text' : 'password'}
                      value={authCredential}
                      onChange={(e) => setAuthCredential(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      className="w-full pr-4 pl-12 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthSecret(!showAuthSecret)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                      title={showAuthSecret ? 'إخفاء' : 'إظهار'}
                    >
                      {showAuthSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 glass-icon" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingAuth}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isVerifyingAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 glass-icon" />
                      <span>تأكيد الصلاحيات وفتح الإعدادات</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة إلى الصفحة الرئيسية</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authorized: Complete Glassmorphism Photo Publishing Settings Dashboard */
          <div className="space-y-8">
            {/* Status alerts */}
            {saveStatus === 'success' && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-sm flex items-center gap-3 shadow-lg shadow-emerald-950/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 glass-icon" />
                <span className="font-semibold">{saveMessage}</span>
              </div>
            )}

            {saveStatus === 'error' && (
              <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-sm flex items-center gap-3 shadow-lg shadow-red-950/30">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 glass-icon" />
                <span className="font-semibold">{saveMessage}</span>
              </div>
            )}

            {/* Section 1: Master Gallery Publishing State */}
            <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-2 rounded-xl glass-icon-box-blue text-blue-400">
                      <Globe className="w-5 h-5 glass-icon" />
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      الحالة العامة لنشر معرض الصور على الموقع
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    التحكم في نشر المعرض بالكامل للزوار أو إيقافه مؤقتاً أثناء التحديثات
                  </p>
                </div>

                {/* Master Switch Button */}
                <button
                  type="button"
                  onClick={toggleMasterPublish}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                    settings.isGalleryPublished
                      ? 'bg-emerald-600/25 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/50 shadow-emerald-950/40'
                      : 'bg-red-600/25 hover:bg-red-600/35 text-red-300 border border-red-500/50 shadow-red-950/40'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${settings.isGalleryPublished ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span>
                    {settings.isGalleryPublished ? 'المعرض منشور ومتاح للزوار' : 'المعرض موقوف عن العرض للزوار'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-black/40">
                    {settings.isGalleryPublished ? 'نشط' : 'معطل'}
                  </span>
                </button>
              </div>

              {/* Message shown to visitors if unpublished */}
              <div className="pt-4">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رسالة التنبيه التي تظهر للزوار في حال إيقاف نشر المعرض:
                </label>
                <input
                  type="text"
                  value={settings.noticeMessage}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, noticeMessage: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Section 2: Category-Level Publishing Controls */}
            <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg glass-icon-box text-cyan-400">
                    <Layers className="w-4 h-4 glass-icon" />
                  </span>
                  <span>التحكم في نشر أقسام المنتجات (الأبواب، الشبابيك، البلكونات)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  يمكنك تفعيل أو إيقاف نشر أي قسم بشكل مستقل ليظهر أو يختفي من واجهة الموقع
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Windows Category */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl glass-icon">🪟</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          settings.publishWindows
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {settings.publishWindows ? 'منشور للزوار' : 'موقوف'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">قسم الشبابيك</h4>
                    <p className="text-xs text-slate-400">
                      شبابيك UPVC العازلة (جرار، مفصلي، قلاب)
                    </p>
                    <div className="text-[11px] text-slate-500 mt-2 font-mono">
                      {photos.filter((p) => p.category === 'windows').length} صورة في هذا القسم
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategoryPublish('windows')}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      settings.publishWindows
                        ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-600/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{settings.publishWindows ? 'إيقاف نشر قسم الشبابيك' : 'تفعيل نشر قسم الشبابيك'}</span>
                  </button>
                </div>

                {/* Doors Category */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl glass-icon">🚪</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          settings.publishDoors
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {settings.publishDoors ? 'منشور للزوار' : 'موقوف'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">قسم الأبواب</h4>
                    <p className="text-xs text-slate-400">
                      أبواب UPVC للحمامات والغرف والواجهات
                    </p>
                    <div className="text-[11px] text-slate-500 mt-2 font-mono">
                      {photos.filter((p) => p.category === 'doors').length} صورة في هذا القسم
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategoryPublish('doors')}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      settings.publishDoors
                        ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-600/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{settings.publishDoors ? 'إيقاف نشر قسم الأبواب' : 'تفعيل نشر قسم الأبواب'}</span>
                  </button>
                </div>

                {/* Balconies Category */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl glass-icon">🏠</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          settings.publishBalconies
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {settings.publishBalconies ? 'منشور للزوار' : 'موقوف'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">قسم تقفيل البلكونات</h4>
                    <p className="text-xs text-slate-400">
                      تقفيل بلكونات عازلة للصوت والحرارة والأتربة
                    </p>
                    <div className="text-[11px] text-slate-500 mt-2 font-mono">
                      {photos.filter((p) => p.category === 'balconies').length} صورة في هذا القسم
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategoryPublish('balconies')}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      settings.publishBalconies
                        ? 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-600/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    <span>{settings.publishBalconies ? 'إيقاف نشر قسم البلكونات' : 'تفعيل نشر قسم البلكونات'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 3: Publishing Display Controls (Lightbox & Badges) */}
            <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg glass-icon-box text-blue-400">
                    <Maximize2 className="w-4 h-4 glass-icon" />
                  </span>
                  <span>خيارات ظهور وتفاعل الصور المنشورة</span>
                </h3>
                <p className="text-xs text-slate-400">
                  التحكم في طريقة تفاعل الزوار مع الصور المنشورة في المعرض
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lightbox toggle */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-white mb-0.5">
                      عارض الصور المكبر (Lightbox)
                    </h5>
                    <p className="text-xs text-slate-400">
                      السماح للزوار بالنقر على الصورة لتكبيرها بدقة عالية وتحميلها
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        allowLightboxViewing: !prev.allowLightboxViewing,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      settings.allowLightboxViewing
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.allowLightboxViewing ? 'مفعل' : 'معطل'}
                  </button>
                </div>

                {/* Badge toggle */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-white mb-0.5">
                      شارة النشر المعتمد لـ Al Mekawy Home
                    </h5>
                    <p className="text-xs text-slate-400">
                      إظهار شارة الاعتماد الرسمية فوق بطاقات الصور في المعرض
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        watermarkOrBadgeVisible: !prev.watermarkOrBadgeVisible,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      settings.watermarkOrBadgeVisible
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.watermarkOrBadgeVisible ? 'مفعل' : 'معطل'}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Individual Photo Publishing State List */}
            <div className="p-6 rounded-3xl bg-slate-900/75 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg glass-icon-box text-emerald-400">
                      <ImageIcon className="w-4 h-4 glass-icon" />
                    </span>
                    <span>التحكم في نشر وظهور الصور الفردية ({photos.length} صورة)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكنك تحديد ما إذا كانت كل صورة منشورة وظاهرة للزوار أو موقوفة عن العرض
                  </p>
                </div>

                {/* Quick actions for all filtered */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={publishAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all"
                  >
                    نشر جميع الصور المعروضة ({filteredPhotos.length})
                  </button>
                  <button
                    type="button"
                    onClick={unpublishAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-red-600/25 hover:bg-red-600/40 text-red-300 text-xs font-bold border border-red-500/30 transition-all"
                  >
                    إيقاف نشر الصور المعروضة ({filteredPhotos.length})
                  </button>
                </div>
              </div>

              {/* Filters bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6">
                {/* Category filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      categoryFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    الكل ({photos.length})
                  </button>
                  {(['windows', 'doors', 'balconies'] as PhotoCategory[]).map((cat) => {
                    const c = photos.filter((p) => p.category === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          categoryFilter === cat
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {CATEGORIES[cat].icon} {CATEGORIES[cat].titleAr} ({c})
                      </button>
                    );
                  })}
                </div>

                {/* Visibility state filter */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      visibilityFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    جميع الحالات ({photos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('published')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      visibilityFilter === 'published' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    المنشورة ({stats.publishedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibilityFilter('unpublished')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      visibilityFilter === 'unpublished' ? 'bg-red-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    الموقوفة ({stats.unpublishedCount})
                  </button>
                </div>
              </div>

              {/* Photos List with toggle status */}
              {filteredPhotos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                  لا توجد صور مطابقة للتصفية المحددة.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px] overflow-y-auto p-1">
                  {filteredPhotos.map((photo) => {
                    const isUnpublished = settings.unpublishedPhotoIds.includes(photo.id);
                    const isPublished = !isUnpublished;
                    const cat = CATEGORIES[photo.category];

                    return (
                      <div
                        key={photo.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                          isPublished
                            ? 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                            : 'bg-red-950/20 border-red-900/40 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                              {photo.title || cat.titleAr}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                                {cat.icon} {cat.titleAr}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPublished
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {isPublished ? 'منشورة ✓' : 'موقوفة ✕'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Publish Toggle Button */}
                        <button
                          type="button"
                          onClick={() => togglePhotoPublish(photo.id)}
                          className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isPublished
                              ? 'bg-emerald-600/25 hover:bg-red-900/40 text-emerald-200 hover:text-red-300 border border-emerald-500/40 hover:border-red-600/40'
                              : 'bg-red-600/25 hover:bg-emerald-900/40 text-red-200 hover:text-emerald-300 border border-red-500/40 hover:border-emerald-600/40'
                          }`}
                          title={isPublished ? 'اضغط لإيقاف نشر الصورة' : 'اضغط لنشر الصورة'}
                        >
                          <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span>{isPublished ? 'إيقاف النشر' : 'نشر للزوار'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Persistent Save Bar */}
            <div className="sticky bottom-4 p-4 rounded-3xl bg-slate-900/90 border border-blue-500/30 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">
                  {hasChanges
                    ? 'لديك تعديلات غير محفوظة في إعدادات النشر.'
                    : 'إعدادات النشر الحالية متطابقة ومحدثة مع Firebase.'}
                </span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold border border-slate-700 transition-colors"
                  >
                    إلغاء التغييرات
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSaving || !hasChanges}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                    hasChanges
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/40 ring-2 ring-blue-400/40'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ في Firebase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 glass-icon" />
                      <span>حفظ إعدادات النشر في Firebase</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

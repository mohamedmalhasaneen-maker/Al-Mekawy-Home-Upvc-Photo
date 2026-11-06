import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Home,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Layers,
  Image as ImageIcon,
  ShieldCheck,
  Search,
  Check,
  X,
  Sparkles,
  PhoneCall,
  Phone,
  Globe,
} from 'lucide-react';
import { getIsAdmin, loginAdmin, logoutAdmin, subscribeAdminAuth } from '../services/adminAuth';

import {
  PhotoItem,
  PhotoCategory,
  ProductColor,
  CATEGORIES,
  PRODUCT_COLORS,
} from '../types/photo';
import {
  uploadProductPhoto,
  deleteProductPhoto,
  updatePhotoMetadata,
  subscribeToPhotos,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../services/photoService';
import {
  PublishingSettings,
  DEFAULT_PUBLISHING_SETTINGS,
  subscribeToPublishingSettings,
  savePublishingSettings,
} from '../services/settingsService';
import {
  ContactConfig,
  DEFAULT_CONTACT_CONFIG,
  subscribeToContactConfig,
  saveContactConfig,
} from '../services/contactService';
import logoImg from '../assets/images/almekawy_logo_1790781390166.jpg';

export const DeveloperPage: React.FC = () => {
  const navigate = useNavigate();

  // Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdmin());
  const [authCredential, setAuthCredential] = useState('');
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAuthSecret, setShowAuthSecret] = useState(false);

  // Photos State
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [publishingSettings, setPublishingSettings] = useState<PublishingSettings>(DEFAULT_PUBLISHING_SETTINGS);
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state for batch deletion / publishing
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Upload state (Supports multiple unlimited images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('windows');
  const [uploadColor, setUploadColor] = useState<ProductColor>('white');
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Edit modal state
  const [photoToEdit, setPhotoToEdit] = useState<PhotoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<PhotoCategory>('windows');
  const [editColor, setEditColor] = useState<ProductColor>('white');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Color Filter state for admin list
  const [colorFilter, setColorFilter] = useState<ProductColor | 'all'>('all');

  // Contact management state
  const [adminActiveTab, setAdminActiveTab] = useState<'photos' | 'contact'>('photos');
  const [contactConfig, setContactConfig] = useState<ContactConfig>(DEFAULT_CONTACT_CONFIG);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSuccessMsg, setContactSuccessMsg] = useState('');
  const [contactErrorMsg, setContactErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to persistent admin authentication
  useEffect(() => {
    const unsubscribe = subscribeAdminAuth((adminState) => {
      setIsAdmin(adminState);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to publishing settings
  useEffect(() => {
    const unsubscribeSettings = subscribeToPublishingSettings((settings) => {
      setPublishingSettings(settings);
    });
    return () => unsubscribeSettings();
  }, []);

  // Subscribe to contact config
  useEffect(() => {
    const unsubscribeContact = subscribeToContactConfig((cfg) => {
      setContactConfig(cfg);
    });
    return () => unsubscribeContact();
  }, []);

  const handleAddPhone = () => {
    const newPhones = [
      ...contactConfig.phones,
      { id: 'phone-' + Date.now(), number: '', label: 'رقم جديد' },
    ];
    setContactConfig({ ...contactConfig, phones: newPhones });
  };

  const handleUpdatePhone = (index: number, field: 'number' | 'label', value: string) => {
    const newPhones = [...contactConfig.phones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    setContactConfig({ ...contactConfig, phones: newPhones });
  };

  const handleDeletePhone = (index: number) => {
    const newPhones = contactConfig.phones.filter((_, idx) => idx !== index);
    setContactConfig({ ...contactConfig, phones: newPhones });
  };

  const handleAddSocial = () => {
    const newSocials = [
      ...contactConfig.socials,
      { id: 'soc-' + Date.now(), platform: 'other' as const, name: 'منصة جديدة', url: 'https://' },
    ];
    setContactConfig({ ...contactConfig, socials: newSocials });
  };

  const handleUpdateSocial = (index: number, field: 'name' | 'url' | 'platform', value: any) => {
    const newSocials = [...contactConfig.socials];
    newSocials[index] = { ...newSocials[index], [field]: value };
    setContactConfig({ ...contactConfig, socials: newSocials });
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = contactConfig.socials.filter((_, idx) => idx !== index);
    setContactConfig({ ...contactConfig, socials: newSocials });
  };

  const handleSaveContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setContactSuccessMsg('');
    setContactErrorMsg('');
    try {
      await saveContactConfig(contactConfig);
      setContactSuccessMsg('تم حفظ وتحديث أرقام التواصل وروابط السوشيال ميديا بنجاح في Firebase.');
      setTimeout(() => setContactSuccessMsg(''), 4000);
    } catch (err: any) {
      setContactErrorMsg(err?.message || 'فشل حفظ إعدادات التواصل.');
    } finally {
      setIsSavingContact(false);
    }
  };

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

  // Auth Submit handler
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

  // Multiple files selection
  const addFiles = (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) return;

    setUploadStatus('idle');
    setUploadErrorMessage('');
    setErrorDetails('');

    const newSelected = [...selectedFiles, ...validImageFiles];
    setSelectedFiles(newSelected);

    validImageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreviews((prev) => [
          ...prev,
          { file, previewUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllSelectedFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadStatus('idle');
    setUploadErrorMessage('');
    setErrorDetails('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload handler for unlimited images sequentially
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setUploadErrorMessage('يرجى اختيار صورة واحدة على الأقل من جهازك.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadErrorMessage('');
    setErrorDetails('');
    setCurrentFileIndex(0);

    const totalCount = selectedFiles.length;
    const successfullyUploaded: string[] = [];
    const errorsList: string[] = [];

    for (let i = 0; i < totalCount; i++) {
      const file = selectedFiles[i];
      setCurrentFileIndex(i + 1);

      const basePercent = Math.round((i / totalCount) * 100);
      setUploadProgress(basePercent);
      setUploadStepText(`جاري رفع الصورة (${i + 1} من ${totalCount}): ${file.name}...`);

      try {
        const titleForThisPhoto =
          uploadTitle.trim()
            ? (totalCount > 1 ? `${uploadTitle.trim()} - (${i + 1})` : uploadTitle.trim())
            : file.name.replace(/\.[^/.]+$/, '');

        await uploadProductPhoto({
          file,
          category: uploadCategory,
          color: uploadColor,
          title: titleForThisPhoto,
          onProgress: (percent, stepText) => {
            const currentItemWeight = 100 / totalCount;
            const overallPercent = Math.min(
              99,
              Math.round(basePercent + (percent / 100) * currentItemWeight)
            );
            setUploadProgress(overallPercent);
            if (stepText) {
              setUploadStepText(`[${i + 1}/${totalCount}] ${stepText}`);
            }
          },
        });

        successfullyUploaded.push(file.name);
      } catch (err: any) {
        console.error(`Failed uploading file [${i + 1}/${totalCount}] ${file.name}:`, err);
        const directMsg = err?.cloudinaryMessage || err?.message || 'فشل رفع الصورة إلى Cloudinary.';
        errorsList.push(`ملف ${file.name}: ${directMsg}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(100);

    if (successfullyUploaded.length === totalCount) {
      setUploadStatus('success');
      setUploadStepText(`تم رفع جميع الصور (${totalCount} صور) بنجاح ونشرها في المعرض.`);
      setSelectedFiles([]);
      setFilePreviews([]);
      setUploadTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else if (successfullyUploaded.length > 0) {
      setUploadStatus('partial');
      setUploadErrorMessage(
        `تم رفع ${successfullyUploaded.length} صور من أصل ${totalCount}. فشل ${errorsList.length} صور.`
      );
      setErrorDetails(errorsList.join('\n'));
    } else {
      setUploadStatus('error');
      setUploadErrorMessage(errorsList[0] || 'فشل رفع الصور.');
      setErrorDetails(errorsList.join('\n'));
    }
  };

  // Toggle single photo publication (unpublish/publish without deleting)
  const togglePhotoPublish = async (photoId: string) => {
    const isUnpublished = publishingSettings.unpublishedPhotoIds.includes(photoId);
    const updatedList = isUnpublished
      ? publishingSettings.unpublishedPhotoIds.filter((id) => id !== photoId)
      : [...publishingSettings.unpublishedPhotoIds, photoId];

    try {
      await savePublishingSettings({ unpublishedPhotoIds: updatedList });
    } catch (err) {
      console.error('Failed to update publication status:', err);
      alert('حدث خطأ أثناء تحديث حالة النشر.');
    }
  };

  // Publish all filtered photos
  const publishAllFiltered = async () => {
    const filteredIds = new Set(filteredPhotos.map((p) => p.id));
    const updatedList = publishingSettings.unpublishedPhotoIds.filter((id) => !filteredIds.has(id));
    try {
      await savePublishingSettings({ unpublishedPhotoIds: updatedList });
    } catch (err) {
      alert('حدث خطأ أثناء النشر.');
    }
  };

  // Unpublish all filtered photos
  const unpublishAllFiltered = async () => {
    const filteredIds = filteredPhotos.map((p) => p.id);
    const updatedList = Array.from(new Set([...publishingSettings.unpublishedPhotoIds, ...filteredIds]));
    try {
      await savePublishingSettings({ unpublishedPhotoIds: updatedList });
    } catch (err) {
      alert('حدث خطأ أثناء إيقاف النشر.');
    }
  };

  // Delete single photo permanently
  const confirmDelete = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProductPhoto(photoToDelete);
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('تعذر حذف الصورة من قاعدة البيانات.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch delete selected photos
  const handleBatchDelete = async () => {
    if (selectedPhotoIds.length === 0) return;
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedPhotoIds.length} صورة نهائياً؟`)) return;

    setIsBatchDeleting(true);
    try {
      const photosToDelete = photos.filter((p) => selectedPhotoIds.includes(p.id));
      for (const p of photosToDelete) {
        await deleteProductPhoto(p);
      }
      setSelectedPhotoIds([]);
    } catch (err) {
      console.error('Batch delete error:', err);
      alert('حدث خطأ أثناء الحذف الجماعي.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Save edit metadata
  const saveEdit = async () => {
    if (!photoToEdit) return;
    setIsSavingEdit(true);
    try {
      await updatePhotoMetadata(photoToEdit.id, {
        title: editTitle,
        category: editCategory,
        color: editColor,
      });
      setPhotoToEdit(null);
    } catch (err) {
      console.error('Edit error:', err);
      alert('حدث خطأ أثناء تحديث بيانات الصورة.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    let result = photos;

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (colorFilter !== 'all') {
      result = result.filter((p) => (p.color || 'white') === colorFilter);
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
  }, [photos, categoryFilter, colorFilter, searchQuery]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden" dir="rtl">


      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl mb-8 shadow-2xl">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-950 border border-amber-500/30 shadow-md shrink-0 p-1">
              <img
                src={logoImg}
                alt="Al Mekawy Home UPVC Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white font-['Outfit',sans-serif]">
                  Al Mekawy Home <span className="text-blue-400">UPVC</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  <Layers className="w-3.5 h-3.5 glass-icon" />
                  <span>إدارة الصور ونشرها</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                لوحة التحكم المخصصة لرفع ونشر وإدارة صور المعرض
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

        {/* Protection Gate */}
        {!isAdmin ? (
          <div className="max-w-md mx-auto py-12">
            <div className="rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl p-6 sm:p-8 text-right">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto rounded-2xl glass-icon-box-blue flex items-center justify-center text-blue-400 mb-3 shadow-lg">
                  <Lock className="w-7 h-7 glass-icon" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  تسجيل دخول المشرف
                </h2>
                <p className="text-xs text-slate-400">
                  يرجى إدخال كلمة المرور للوصول إلى لوحة إدارة الصور ونشرها
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
                      <span>تسجيل الدخول للوحة الإدارة</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>العودة إلى الصفحة الرئيسية</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authorized Dashboard with Tabs */
          <div className="space-y-8">
            {/* Admin Navigation Tabs */}
            <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl mb-8 shadow-xl">
              <button
                type="button"
                onClick={() => setAdminActiveTab('photos')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 font-arabic ${
                  adminActiveTab === 'photos'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-4 h-4 glass-icon" />
                <span>إدارة الصور ونشر المعرض</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminActiveTab('contact')}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 font-arabic ${
                  adminActiveTab === 'contact'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PhoneCall className="w-4 h-4 glass-icon" />
                <span>إدارة أرقام التواصل والسوشيال ميديا</span>
              </button>
            </div>

            {adminActiveTab === 'contact' ? (
              <>
                {/* Contact & Socials Management Panel */}
                <div className="bg-slate-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                      <PhoneCall className="w-6 h-6 glass-icon" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-arabic">إدارة أرقام التواصل وحسابات السوشيال ميديا</h3>
                      <p className="text-xs text-slate-400 font-arabic">تعديل الأرقام والروابط وحفظها بشكل دائم في Firebase لتظهر للزوار فوراً</p>
                    </div>
                  </div>

                  {contactSuccessMsg && (
                    <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs sm:text-sm flex items-center gap-2 font-arabic">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 glass-icon" />
                      <span>{contactSuccessMsg}</span>
                    </div>
                  )}

                  {contactErrorMsg && (
                    <div className="p-4 rounded-xl bg-red-950/80 border border-red-600 text-red-200 text-xs sm:text-sm flex items-center gap-2 font-arabic">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 glass-icon" />
                      <span>{contactErrorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveContactSubmit} className="space-y-8">
                    {/* Phone Numbers Management */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-white font-arabic flex items-center gap-2">
                          <Phone className="w-5 h-5 text-cyan-400 glass-icon" />
                          <span>أرقام الهواتف والاتصال</span>
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddPhone}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <Plus className="w-4 h-4 glass-icon" />
                          <span>إضافة رقم جديد</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {contactConfig.phones.map((phone, idx) => (
                          <div key={phone.id || idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full sm:w-1/3">
                              <label className="block text-xs text-slate-400 mb-1 font-arabic">وصف الرقم (التسمية)</label>
                              <input
                                type="text"
                                value={phone.label}
                                onChange={(e) => handleUpdatePhone(idx, 'label', e.target.value)}
                                placeholder="مثال: الرقم الأول للمبيعات"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                            <div className="w-full sm:flex-1">
                              <label className="block text-xs text-slate-400 mb-1 font-arabic">رقم الهاتف (مثال: 01141761261)</label>
                              <input
                                type="text"
                                value={phone.number}
                                onChange={(e) => handleUpdatePhone(idx, 'number', e.target.value)}
                                placeholder="01141761261"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono direction-ltr text-right"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeletePhone(idx)}
                              className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all self-end sm:self-center mt-2 sm:mt-5"
                              title="حذف الرقم"
                            >
                              <Trash2 className="w-4 h-4 glass-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Media Links Management */}
                    <div className="space-y-4 pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-white font-arabic flex items-center gap-2">
                          <Globe className="w-5 h-5 text-blue-400 glass-icon" />
                          <span>روابط السوشيال ميديا</span>
                        </h4>
                        <button
                          type="button"
                          onClick={handleAddSocial}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 font-arabic"
                        >
                          <Plus className="w-4 h-4 glass-icon" />
                          <span>إضافة منصة جديدة</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {contactConfig.socials.map((social, idx) => (
                          <div key={social.id || idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full sm:w-1/4">
                              <label className="block text-xs text-slate-400 mb-1 font-arabic">المنصة</label>
                              <select
                                value={social.platform}
                                onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                              >
                                <option value="facebook">Facebook</option>
                                <option value="tiktok">TikTok</option>
                                <option value="instagram">Instagram</option>
                                <option value="other">أخرى</option>
                              </select>
                            </div>
                            <div className="w-full sm:w-1/4">
                              <label className="block text-xs text-slate-400 mb-1 font-arabic">اسم المنصة (عرض)</label>
                              <input
                                type="text"
                                value={social.name}
                                onChange={(e) => handleUpdateSocial(idx, 'name', e.target.value)}
                                placeholder="Facebook"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="w-full sm:flex-1">
                              <label className="block text-xs text-slate-400 mb-1 font-arabic">رابط الصفحة (URL)</label>
                              <input
                                type="text"
                                value={social.url}
                                onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                                placeholder="https://www.facebook.com/..."
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-mono direction-ltr text-left"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteSocial(idx)}
                              className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 transition-all self-end sm:self-center mt-2 sm:mt-5"
                              title="حذف المنصة"
                            >
                              <Trash2 className="w-4 h-4 glass-icon" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isSavingContact}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 font-arabic"
                      >
                        {isSavingContact && <RefreshCw className="w-4 h-4 animate-spin glass-icon" />}
                        <span>حفظ وتحديث بيانات التواصل</span>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="space-y-8">
                {/* 1. Upload Section */}
                <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl glass-icon-box-blue flex items-center justify-center text-blue-400 shadow-md">
                      <Upload className="w-5 h-5 glass-icon" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        رفع ونشر صور جديدة على المعرض
                      </h3>
                      <p className="text-xs text-slate-400">
                        رفع مباشر ودائم عبر Cloudinary وحفظ فوري في Firebase Firestore
                      </p>
                    </div>
                  </div>

              <form onSubmit={handleUploadSubmit} className="space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2">
                    1. اختر القسم:
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['windows', 'doors', 'balconies'] as PhotoCategory[]).map((cat) => {
                      const info = CATEGORIES[cat];
                      const isSelected = uploadCategory === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setUploadCategory(cat)}
                          className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white font-bold ring-2 ring-blue-500/20'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-2xl glass-icon">{info.icon}</span>
                          <span className="text-xs sm:text-sm">{info.titleAr}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-2 font-arabic">
                    2. اختر تصنيف اللون للمنتج:
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['white', 'beige', 'special'] as ProductColor[]).map((col) => {
                      const info = PRODUCT_COLORS[col];
                      const isSelected = uploadColor === col;
                      return (
                        <button
                          type="button"
                          key={col}
                          onClick={() => setUploadColor(col)}
                          className={`p-3 rounded-xl border text-center transition-all flex items-center justify-center gap-2 font-arabic ${
                            isSelected
                              ? 'bg-cyan-600/20 border-cyan-500 text-white font-bold ring-2 ring-cyan-500/20 shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${info.dotColorClass}`} />
                          <span className="text-xs">{info.badgeLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5 font-arabic">
                    3. عنوان أو وصف الصورة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="مثال: شباك جرار دبل قطاع تركي عازل للصوت"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Dropzone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs sm:text-sm font-bold text-slate-200">
                      4. اختر الصور من جهازك (يدعم رفع عدد لا نهائي من الصور دفعة واحدة):
                    </label>
                    {selectedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllSelectedFiles}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                      >
                        مسح الكل ({selectedFiles.length})
                      </button>
                    )}
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl bg-slate-950/60 hover:bg-slate-900/50 cursor-pointer text-center transition-all group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 mx-auto rounded-2xl glass-icon-box-blue flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform mb-3 shadow-md">
                      <Upload className="w-6 h-6 glass-icon" />
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      اضغط هنا لاختيار صور من جهازك أو اسحبها وأفلتها هنا
                    </div>
                    <div className="text-xs text-slate-400">
                      يمكنك تحديد صورة واحدة أو عدد لا نهائي من الصور معاً (JPG, PNG, WEBP)
                    </div>
                  </div>

                  {/* Previews Grid */}
                  {filePreviews.length > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-3 text-xs text-slate-300 font-bold">
                        <span>الصور المحددة للرفع ونشرها ({filePreviews.length}):</span>
                        <span className="text-slate-500 font-normal">انقر على × لإزالة أي صورة</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-1">
                        {filePreviews.map((item, index) => (
                          <div
                            key={index}
                            className="relative group rounded-xl overflow-hidden border border-slate-700 aspect-square bg-slate-900"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSelectedFile(index);
                              }}
                              className="absolute top-1 left-1 p-1 rounded-full bg-red-600/90 text-white hover:bg-red-500 shadow-md transition-all opacity-80 group-hover:opacity-100"
                              title="إزالة"
                            >
                              <X className="w-3 h-3 glass-icon" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-1 py-0.5 text-[9px] text-slate-300 truncate text-center">
                              {item.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress / Status */}
                {isUploading && (
                  <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-blue-300 font-bold">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 glass-icon" />
                        <span>{uploadStepText || 'جاري الرفع والنشر...'}</span>
                      </div>
                      <span className="font-mono text-cyan-300">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 glass-icon" />
                    <span>{uploadStepText}</span>
                  </div>
                )}

                {(uploadStatus === 'error' || uploadStatus === 'partial') && (
                  <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs sm:text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 glass-icon" />
                    <div>
                      <div className="font-bold mb-1">{uploadErrorMessage}</div>
                      {errorDetails && (
                        <pre className="text-[11px] font-mono text-red-300 whitespace-pre-wrap">{errorDetails}</pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isUploading || selectedFiles.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all ${
                    isUploading || selectedFiles.length === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 active:scale-[0.99]'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-cyan-300 glass-icon" />
                      <span>جاري رفع ونشر الصور ({currentFileIndex} من {selectedFiles.length}) — {uploadProgress}%</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 glass-icon" />
                      <span>
                        {selectedFiles.length > 1
                          ? `رفع ونشر جميع الصور (${selectedFiles.length} صور) على الموقع الآن`
                          : selectedFiles.length === 1
                          ? 'رفع ونشر الصورة على الموقع الآن'
                          : 'اختر صوراً للرفع'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 2. Photo Grid & Publication/Deletion Management */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white mb-1 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg glass-icon-box text-emerald-400">
                      <ImageIcon className="w-4 h-4 glass-icon" />
                    </span>
                    <span>إدارة ونشر صور المعرض ({photos.length} صورة)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    إيقاف النشر يخفي الصورة عن الزوار دون حذفها. الحذف يزيلها نهائياً.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={publishAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all"
                  >
                    نشر الكل ({filteredPhotos.length})
                  </button>
                  <button
                    type="button"
                    onClick={unpublishAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all"
                  >
                    إيقاف نشر الكل ({filteredPhotos.length})
                  </button>
                  {selectedPhotoIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchDelete}
                      disabled={isBatchDeleting}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5"
                    >
                      {isBatchDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>حذف المحدد ({selectedPhotoIds.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6">
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

                {/* Color Filters */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 sm:pt-0 sm:border-r border-slate-800 sm:pr-3">
                  <span className="text-xs text-slate-400 font-bold ml-1 font-arabic">اللون:</span>
                  {(['all', 'white', 'beige', 'special'] as (ProductColor | 'all')[]).map((col) => {
                    const info = PRODUCT_COLORS[col];
                    const isSel = colorFilter === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColorFilter(col)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 font-arabic ${
                          isSel
                            ? 'bg-cyan-600 text-white shadow-md'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${info.dotColorClass}`} />
                        <span>{info.badgeLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="w-full sm:w-64 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 glass-icon" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في الصور..."
                    className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Photos Grid */}
              {filteredPhotos.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                  لا توجد صور مطابقة.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPhotos.map((photo) => {
                    const isUnpublished = publishingSettings.unpublishedPhotoIds.includes(photo.id);
                    const isPublished = !isUnpublished;
                    const isSelected = selectedPhotoIds.includes(photo.id);
                    const cat = CATEGORIES[photo.category];

                    return (
                      <div
                        key={photo.id}
                        className={`relative rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                          isPublished
                            ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                            : 'bg-amber-950/15 border-amber-900/40 opacity-85'
                        }`}
                      >
                        {/* Image preview */}
                        <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />

                          {/* Checkbox for batch select */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPhotoIds((prev) =>
                                isSelected ? prev.filter((id) => id !== photo.id) : [...prev, photo.id]
                              );
                            }}
                            className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-black/60 text-transparent hover:text-slate-300 border border-white/30'
                            }`}
                            title="تحديد الصورة"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          {/* Status Badge */}
                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                                isPublished
                                  ? 'bg-emerald-500/90 text-white'
                                  : 'bg-amber-600/90 text-white'
                              }`}
                            >
                              {isPublished ? 'منشورة ✓' : 'موقوفة النشر ✕'}
                            </span>
                          </div>
                        </div>

                        {/* Details & Actions */}
                        <div className="p-3.5 space-y-3">
                          <div>
                            <h5 className="text-xs font-bold text-white line-clamp-1">
                              {photo.title || cat.titleAr}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                                {cat.icon} {cat.titleAr}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('ar-EG') : ''}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
                            {/* Publish / Unpublish Toggle */}
                            <button
                              type="button"
                              onClick={() => togglePhotoPublish(photo.id)}
                              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                                isPublished
                                  ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/40'
                                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-600/40'
                              }`}
                            >
                              <span>{isPublished ? 'إيقاف النشر' : 'نشر للزوار'}</span>
                            </button>

                            {/* Edit Metadata */}
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoToEdit(photo);
                                setEditTitle(photo.title);
                                setEditCategory(photo.category);
                                setEditColor(photo.color || 'white');
                              }}
                              className="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                              title="تعديل العنوان"
                            >
                              <Edit3 className="w-3 h-3 text-blue-400" />
                              <span>تعديل</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setPhotoToDelete(photo)}
                              className="py-1.5 px-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </main>

      {/* Delete Confirmation Modal */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-red-800/60 rounded-3xl p-6 text-right shadow-2xl">
            <div className="w-12 h-12 rounded-2xl glass-icon-box-red flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-950/50">
              <Trash2 className="w-6 h-6 glass-icon" />
            </div>

            <h4 className="text-lg font-bold text-white mb-2">تأكيد حذف الصورة</h4>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">
              هل أنت متأكد من حذف هذه الصورة؟ سيتم حذفها نهائياً من قاعدة بيانات <b>Firestore</b> ومن سحابة Cloudinary.
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 mb-6 border border-slate-800">
              <img
                src={photoToDelete.imageUrl}
                alt={photoToDelete.title}
                className="w-14 h-14 object-cover rounded-lg bg-slate-900"
              />
              <span className="text-xs font-bold text-slate-200 line-clamp-1">
                {photoToDelete.title || 'صورة بدون عنوان'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-colors flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin glass-icon" /> : <Trash2 className="w-4 h-4 glass-icon" />}
                <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Dialog */}
      {photoToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-right shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-4">تعديل بيانات الصورة</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-arabic">
                  القسم:
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PhotoCategory)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-arabic"
                >
                  <option value="windows">🪟 الشبابيك</option>
                  <option value="doors">🚪 الأبواب</option>
                  <option value="balconies">🏠 البلكونات</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 font-arabic">
                  تصنيف اللون:
                </label>
                <select
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value as ProductColor)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-arabic"
                >
                  <option value="white">⚪ الأبيض (White)</option>
                  <option value="beige">🟡 البيج (Beige)</option>
                  <option value="special">🎨 الألوان الخاصة (Special Colors)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  العنوان / الوصف:
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setPhotoToEdit(null)}
                disabled={isSavingEdit}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {isSavingEdit && <RefreshCw className="w-4 h-4 animate-spin glass-icon" />}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

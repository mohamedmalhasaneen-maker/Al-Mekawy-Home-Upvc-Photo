import React, { useState, useRef } from 'react';
import { PhotoItem, PhotoCategory, CATEGORIES } from '../types/photo';
import {
  uploadProductPhoto,
  deleteProductPhoto,
  updatePhotoMetadata,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../services/photoService';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  Cloud,
  ExternalLink,
} from 'lucide-react';
import { auth, firebaseConfig } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  photos,
  isAdmin,
  setIsAdmin,
}) => {
  // Auth state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [manageCategoryFilter, setManageCategoryFilter] = useState<PhotoCategory | 'all'>('all');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('windows');
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);

  // Delete modal state
  const [photoToDelete, setPhotoToDelete] = useState<PhotoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state
  const [photoToEdit, setPhotoToEdit] = useState<PhotoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<PhotoCategory>('windows');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Admin PIN login (PIN "1234")
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === 'admin123' || pinInput.toLowerCase() === 'upvc') {
      setIsAdmin(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('رمز المرور غير صحيح. حاول مرة أخرى (الرمز الافتراضي: 1234)');
    }
  };

  // Handle Google Auth
  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      setPinError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsAdmin(true);
    } catch (err: any) {
      console.warn('Google Sign-in notice:', err);
      setPinError('يمكنك استخدام رمز المرور المباشر: 1234');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsAdmin(false);
  };

  // Handle File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadErrorMessage('');
      setErrorDetails('');
      setLastUploadedUrl(null);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadErrorMessage('');
      setErrorDetails('');
      setLastUploadedUrl(null);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadErrorMessage('يرجى اختيار صورة من جهازك أولاً.');
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStepText('جاري بدء الاتصال بسحابة Cloudinary...');
    setUploadStatus('idle');
    setUploadErrorMessage('');
    setErrorDetails('');
    setLastUploadedUrl(null);

    try {
      const createdItem = await uploadProductPhoto({
        file: selectedFile,
        category: uploadCategory,
        title: uploadTitle,
        onProgress: (percent, stepText) => {
          setUploadProgress(percent);
          if (stepText) setUploadStepText(stepText);
        },
      });

      setUploadStatus('success');
      setLastUploadedUrl(createdItem.imageUrl);
      setSelectedFile(null);
      setFilePreview(null);
      setUploadTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error('Upload Error Detailed:', err);
      setUploadStatus('error');
      setUploadErrorMessage(err?.message || 'فشل رفع الصورة إلى Cloudinary.');
      setErrorDetails(err?.stack || JSON.stringify(err, null, 2) || String(err));
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProductPhoto(photoToDelete);
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('حدث خطأ أثناء حذف الصورة من قاعدة البيانات.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Edit Save
  const saveEdit = async () => {
    if (!photoToEdit) return;
    setIsSavingEdit(true);
    try {
      await updatePhotoMetadata(photoToEdit.id, {
        title: editTitle,
        category: editCategory,
      });
      setPhotoToEdit(null);
    } catch (err) {
      console.error('Edit error:', err);
      alert('حدث خطأ أثناء تحديث بيانات الصورة.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredPhotos =
    manageCategoryFilter === 'all'
      ? photos
      : photos.filter((p) => p.category === manageCategoryFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                لوحة تحكم المشرف — Al Mekawy Home UPVC
              </h3>
              <p className="text-xs text-slate-400">
                رفع دائم عبر Cloudinary ومزامنة فورية عبر Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isAdmin ? (
            /* Login Form */
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">تسجيل دخول المشرف</h4>
                <p className="text-xs text-slate-400">
                  لوحة الإدارة مخصصة فقط لمشرف شركة Al-Mekawy Home UPVC
                </p>
              </div>

              <form onSubmit={handlePinLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أدخل رمز مرور المشرف (PIN):
                  </label>
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="الرمز الافتراضي: 1234"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-widest"
                    autoFocus
                  />
                </div>

                {pinError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
                >
                  دخول للوحة التحكم
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-xs text-slate-500 font-bold">أو</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <span>تسجيل الدخول باستخدام Google</span>
                </button>
              </form>
            </div>
          ) : (
            /* Admin Panel Dashboard */
            <div>
              {/* Cloudinary Status Bar */}
              <div className="mb-5 p-3 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">سحابة الصور:</span>
                  <span className="font-mono text-blue-300 font-bold">Cloudinary ({CLOUDINARY_CLOUD_NAME})</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Preset:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{CLOUDINARY_UPLOAD_PRESET}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>جاهز ومفعل للرفع الدائم</span>
                </div>
              </div>

              {/* Top Admin Controls & Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      activeTab === 'upload'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ إضافة صورة جديدة</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                      activeTab === 'manage'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>إدارة الصور ({photos.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700/50 text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Upload Photo */}
              {activeTab === 'upload' && (
                <div className="bg-slate-950/40 p-5 sm:p-6 rounded-2xl border border-slate-800/80">
                  <form onSubmit={handleUploadSubmit} className="space-y-5">
                    {/* Step 1: Select Category */}
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
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                              }`}
                            >
                              <span className="text-2xl">{info.icon}</span>
                              <span className="text-xs sm:text-sm">{info.titleAr}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Title / Description */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                        2. عنوان أو وصف الصورة (اختياري):
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="مثال: شباك جرار دبل قطاع جامبو عازل للصوت"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>

                    {/* Step 3: Choose Image File */}
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                        3. اختر ملف الصورة من جهازك:
                      </label>

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          filePreview
                            ? 'border-blue-500/60 bg-blue-950/10'
                            : 'border-slate-700 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {filePreview ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <img
                              src={filePreview}
                              alt="معاينة"
                              className="w-32 h-32 object-cover rounded-xl border border-blue-500/40 shadow-lg"
                            />
                            <div className="text-center sm:text-right">
                              <p className="text-sm font-bold text-white">
                                {selectedFile?.name}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                الحجم: {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} ميجابايت
                              </p>
                              <p className="text-xs text-blue-400 font-semibold mt-2">
                                اضغط لتغيير الصورة
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                              <Upload className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-200">
                                اضغط لاختيار صورة من جهازك أو اسحبها هنا
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                يتم الرفع مباشرة إلى سحابة Cloudinary للحصول على رابط دائم وتخزينه في Firestore
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator during upload */}
                    {isUploading && (
                      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span>{uploadStepText || 'جاري الرفع إلى Cloudinary...'}</span>
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {uploadStatus === 'success' && (
                      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-sm space-y-2">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-bold">تم رفع الصورة بنجاح إلى Cloudinary وحفظها في Firestore ✓</p>
                            <p className="text-xs text-emerald-400/80">
                              الصورة الآن محفوظة برابط دائم وتظهر مباشرة في المعرض لجميع العملاء في أي مكان.
                            </p>
                          </div>
                        </div>
                        {lastUploadedUrl && (
                          <div className="mt-2 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 font-mono truncate max-w-xs sm:max-w-md">
                              {lastUploadedUrl}
                            </span>
                            <a
                              href={lastUploadedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-emerald-300 hover:text-white font-bold underline"
                            >
                              <span>فتح الرابط</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Error Message */}
                    {uploadStatus === 'error' && (
                      <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm space-y-2">
                        <div className="flex items-center gap-2.5">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <p className="font-bold">{uploadErrorMessage}</p>
                        </div>
                        {errorDetails && (
                          <div className="p-2.5 bg-black/40 rounded-lg text-xs font-mono text-red-300 overflow-x-auto ltr text-left">
                            <pre className="whitespace-pre-wrap">{errorDetails}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                        isUploading || !selectedFile
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                      }`}
                    >
                      <Upload className="w-5 h-5" />
                      <span>{isUploading ? 'جاري رفع الصورة...' : 'رفع الصورة إلى المعرض الآن'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Manage Photos (Edit & Delete) */}
              {activeTab === 'manage' && (
                <div>
                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <button
                      onClick={() => setManageCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        manageCategoryFilter === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل ({photos.length})
                    </button>
                    {(['windows', 'doors', 'balconies'] as PhotoCategory[]).map((cat) => {
                      const count = photos.filter((p) => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          onClick={() => setManageCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            manageCategoryFilter === cat
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {CATEGORIES[cat].icon} {CATEGORIES[cat].titleAr} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Photos List */}
                  {filteredPhotos.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      لا توجد صور في هذا القسم. اضغط على "+ إضافة صورة جديدة" للبدء.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPhotos.map((photo) => {
                        const cat = CATEGORIES[photo.category];
                        return (
                          <div
                            key={photo.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={photo.imageUrl}
                                alt={photo.title}
                                className="w-16 h-16 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-900"
                              />
                              <div>
                                <h5 className="text-sm font-bold text-white line-clamp-1">
                                  {photo.title || cat.titleAr}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                                    {cat.icon} {cat.titleAr}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {photo.createdAt
                                      ? new Date(photo.createdAt).toLocaleDateString('ar-EG')
                                      : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Edit button */}
                              <button
                                onClick={() => {
                                  setPhotoToEdit(photo);
                                  setEditTitle(photo.title);
                                  setEditCategory(photo.category);
                                }}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                title="تعديل العنوان والقسم"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                                <span className="hidden sm:inline">تعديل</span>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => setPhotoToDelete(photo)}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold transition-colors"
                                title="حذف من قاعدة البيانات"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span className="hidden sm:inline">حذف</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Firebase Project:</span>
            <span className="font-mono text-slate-400">{firebaseConfig.projectId}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Al Mekawy Home UPVC Cloudinary Storage System
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {photoToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-red-800/60 rounded-3xl p-6 text-right shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="text-lg font-bold text-white mb-2">تأكيد حذف الصورة</h4>
            <p className="text-xs sm:text-sm text-slate-400 mb-4">
              هل أنت متأكد من حذف هذه الصورة؟ سيتم حذفها نهائياً من قاعدة بيانات <b>Firestore</b> ولن تظهر لأي عميل.
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
                onClick={() => setPhotoToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-colors flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Photo Dialog */}
      {photoToEdit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 text-right shadow-2xl">
            <h4 className="text-lg font-bold text-white mb-4">تعديل بيانات الصورة</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  القسم:
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PhotoCategory)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                >
                  <option value="windows">🪟 الشبابيك</option>
                  <option value="doors">🚪 الأبواب</option>
                  <option value="balconies">🏠 البلكونات</option>
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
                onClick={() => setPhotoToEdit(null)}
                disabled={isSavingEdit}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={saveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
              >
                {isSavingEdit && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

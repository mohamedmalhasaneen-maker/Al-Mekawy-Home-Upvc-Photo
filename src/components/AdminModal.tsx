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
import { signOut } from 'firebase/auth';

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

  // Upload state (Supports multiple unlimited images)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>('windows');
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [uploadErrorMessage, setUploadErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

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

  // Handle Admin PIN login (PIN "662006")
  const handlePinLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '662006') {
      setIsAdmin(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('رمز المرور غير صحيح. يرجى إدخال رمز المرور الصحيح.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setIsAdmin(false);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle adding multiple files (unlimited)
  const addFiles = (files: FileList | File[]) => {
    const validImageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validImageFiles.length === 0) return;

    setUploadStatus('idle');
    setUploadErrorMessage('');
    setErrorDetails('');
    setUploadedUrls([]);

    const newSelected = [...selectedFiles, ...validImageFiles];
    setSelectedFiles(newSelected);

    // Generate previews for each newly added file
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
    setUploadedUrls([]);
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
    setUploadedUrls([]);
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

        const createdItem = await uploadProductPhoto({
          file,
          category: uploadCategory,
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

        successfullyUploaded.push(createdItem.imageUrl);
        setUploadedUrls([...successfullyUploaded]);
      } catch (err: any) {
        console.error(`Failed uploading file [${i + 1}/${totalCount}] ${file.name}:`, err);
        const directCloudinaryMsg =
          err?.cloudinaryMessage ||
          err?.rawCloudinaryError?.message ||
          err?.message ||
          'فشل رفع الصورة إلى Cloudinary.';
        errorsList.push(`ملف ${file.name}: ${directCloudinaryMsg}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(100);

    if (successfullyUploaded.length === totalCount) {
      setUploadStatus('success');
      setUploadStepText(`تم رفع جميع الصور (${totalCount} صور) بنجاح وحفظها في المعرض.`);
      // Clear inputs on full success
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
      setUploadErrorMessage(errorsList[0] || 'فشل رفع الصور إلى سحابة Cloudinary.');
      setErrorDetails(errorsList.join('\n'));
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
                    placeholder="••••••"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-lg tracking-widest"
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

                    {/* Step 3: Choose Image Files (Unlimited) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs sm:text-sm font-bold text-slate-200">
                          3. اختر الصور من جهازك (يدعم عدد لا نهائي من الصور دفعة واحدة):
                        </label>
                        {selectedFiles.length > 0 && !isUploading && (
                          <button
                            type="button"
                            onClick={clearAllSelectedFiles}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold"
                          >
                            إلغاء تحديد الكل ({selectedFiles.length})
                          </button>
                        )}
                      </div>

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          filePreviews.length > 0
                            ? 'border-blue-500/60 bg-blue-950/10'
                            : 'border-slate-700 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />

                        {filePreviews.length > 0 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-blue-300 border-b border-blue-900/40 pb-2">
                              <span className="font-bold">
                                تم تحديد {filePreviews.length} صورة جاهزة للرفع السحابي:
                              </span>
                              <span className="text-slate-400">
                                اضغط أو اسحب لإضافة المزيد من الصور
                              </span>
                            </div>

                            {/* Grid of selected image previews */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-1"
                            >
                              {filePreviews.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-square shadow"
                                >
                                  <img
                                    src={item.previewUrl}
                                    alt={item.file.name}
                                    className={`w-full h-full object-cover transition-opacity ${
                                      isUploading && currentFileIndex > idx
                                        ? 'opacity-40'
                                        : isUploading && currentFileIndex === idx + 1
                                        ? 'opacity-80 ring-2 ring-cyan-400'
                                        : 'opacity-100'
                                    }`}
                                  />

                                  {/* Upload status overlay on item */}
                                  {isUploading && currentFileIndex === idx + 1 && (
                                    <div className="absolute inset-0 bg-blue-950/80 flex flex-col items-center justify-center p-1">
                                      <RefreshCw className="w-5 h-5 animate-spin text-cyan-300 mb-1" />
                                      <span className="text-[9px] text-white font-bold">جاري الرفع</span>
                                    </div>
                                  )}

                                  {isUploading && currentFileIndex > idx + 1 && (
                                    <div className="absolute inset-0 bg-emerald-950/70 flex items-center justify-center">
                                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                  )}

                                  {/* Remove file button */}
                                  {!isUploading && (
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedFile(idx)}
                                      className="absolute top-1 left-1 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow opacity-90 hover:opacity-100 hover:scale-110 transition-all"
                                      title="حذف هذه الصورة"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 px-1 py-0.5 text-[9px] text-slate-300 truncate text-center">
                                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                                  </div>
                                </div>
                              ))}
                            </div>

                            <p className="text-xs text-blue-400 font-semibold pt-1">
                              {isUploading ? 'جاري المعالجة والرفع السحابي المتتابع...' : '+ اضغط هنا لاختيار صور إضافية'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                              <Upload className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-200">
                                اضغط لاختيار عدد لا نهائي من الصور من جهازك أو اسحبها هنا دفعة واحدة
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                يمكنك تحديد 10 أو 50 أو 100+ صورة، وسيتم رفعها سحابياً تلقائياً إلى Cloudinary وحفظها في Firestore
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress indicator & loading spinner during upload */}
                    {isUploading && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/40 shadow-lg shadow-blue-950/30 space-y-3 animate-pulse">
                        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-blue-300">
                          <span className="flex items-center gap-2.5">
                            <div className="relative flex items-center justify-center">
                              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                              <span className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                            </div>
                            <span className="text-white font-bold">{uploadStepText || 'جاري الرفع السحابي إلى Cloudinary...'}</span>
                          </span>
                          <span className="font-mono text-cyan-300 text-sm font-black">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400/50"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            تم إنجاز {uploadedUrls.length} من {selectedFiles.length} صورة
                          </span>
                          <span>يرجى عدم إغلاق النافذة أثناء الرفع</span>
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {uploadStatus === 'success' && (
                      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-sm space-y-2">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="font-bold">
                              تم رفع {uploadedUrls.length} صورة بنجاح إلى Cloudinary وحفظها في المعرض ✓
                            </p>
                            <p className="text-xs text-emerald-400/80">
                              جميع الصور المرفوعة أصبحت متاحة فوراً لجميع العملاء في الموقع.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Partial Upload Message */}
                    {uploadStatus === 'partial' && (
                      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-sm space-y-2">
                        <div className="flex items-center gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                          <p className="font-bold">{uploadErrorMessage}</p>
                        </div>
                        {errorDetails && (
                          <div className="p-2.5 bg-black/40 rounded-lg text-xs font-mono text-amber-200 overflow-x-auto ltr text-left">
                            <pre className="whitespace-pre-wrap">{errorDetails}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Error Message from Cloudinary */}
                    {uploadStatus === 'error' && (
                      <div className="p-4 rounded-2xl bg-red-950/50 border border-red-700/60 text-red-200 text-sm space-y-3 shadow-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-extrabold text-white text-sm">
                                تنبيه: خطأ أثناء الرفع إلى Cloudinary
                              </p>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/60 border border-red-700/50 text-red-300">
                                Cloudinary API Error
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-red-300 font-bold mt-1">
                              {uploadErrorMessage}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              تحقق من اتصال الإنترنت أو إعدادات السحابة ثم أعد المحاولة.
                            </p>
                          </div>
                        </div>

                        {errorDetails && (
                          <div className="mt-2 p-3 bg-black/60 rounded-xl border border-red-900/50 text-xs font-mono text-red-300/90 overflow-x-auto ltr text-left">
                            <div className="text-[10px] uppercase tracking-wider text-red-400/80 mb-1 border-b border-red-900/40 pb-1">
                              تفاصيل الأخطاء
                            </div>
                            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{errorDetails}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button with Loading Spinner */}
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
                          <RefreshCw className="w-5 h-5 animate-spin text-cyan-300" />
                          <span>
                            جاري رفع الصور السحابية ({currentFileIndex} من {selectedFiles.length}) — {uploadProgress}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>
                            {selectedFiles.length > 1
                              ? `رفع جميع الصور (${selectedFiles.length} صور) إلى المعرض الآن`
                              : selectedFiles.length === 1
                              ? 'رفع الصورة إلى المعرض الآن'
                              : 'اختر صوراً للرفع'}
                          </span>
                        </>
                      )}
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

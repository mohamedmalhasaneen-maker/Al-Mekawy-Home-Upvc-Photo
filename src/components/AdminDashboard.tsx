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
  Upload,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Layers,
  LogOut,
  RefreshCw,
  Cloud,
  Home,
} from 'lucide-react';
import { firebaseConfig } from '../firebase/config';

interface AdminDashboardProps {
  photos: PhotoItem[];
  onLogout: () => void;
  onGoHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  photos,
  onLogout,
  onGoHome,
}) => {
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
    <div className="space-y-6 text-right" dir="rtl">
      {/* Cloudinary Status Bar */}
      <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-400 glass-icon" />
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4 glass-icon" />
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
            <Layers className="w-4 h-4 glass-icon" />
            <span>إدارة الصور ({photos.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors"
            >
              <Home className="w-3.5 h-3.5 glass-icon" />
              <span>المعرض الرئيسي</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-700/50 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 glass-icon" />
            <span>تسجيل الخروج</span>
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
                      <span className="text-2xl glass-icon">{info.icon}</span>
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
                placeholder="مثال: شباك جرار دبل قطاع تركي عازل للصوت"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Step 3: Choose Multiple Files */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs sm:text-sm font-bold text-slate-200">
                  3. اختر الصور من جهازك (يدعم رفع عدد لا نهائي من الصور دفعة واحدة):
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

              {/* Drag and drop area */}
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

              {/* Selected Files Preview Grid */}
              {filePreviews.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-300 font-bold">
                    <span>الصور المحددة للرفع ({filePreviews.length}):</span>
                    <span className="text-slate-500 font-normal">
                      انقر على × لإزالة أي صورة قبل البدء
                    </span>
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
                          title="إزالة هذه الصورة"
                        >
                          <Trash2 className="w-3 h-3 glass-icon" />
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

            {/* Progress Bar & Status Spinner */}
            {isUploading && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-blue-300 font-bold">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 glass-icon" />
                    <span>{uploadStepText || 'جاري معالجة الرفع السحابي...'}</span>
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

            {/* Success Alert */}
            {uploadStatus === 'success' && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 glass-icon" />
                <div>
                  <div className="font-bold mb-1">{uploadStepText}</div>
                  <p className="text-xs text-emerald-300/80">
                    تم تخزين الصور بشكل دائم ومزامنتها مباشرة على المعرض العام.
                  </p>
                </div>
              </div>
            )}

            {/* Error or Partial Alert with Direct Cloudinary message */}
            {(uploadStatus === 'error' || uploadStatus === 'partial') && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 glass-icon" />
                <div className="w-full">
                  <div className="font-bold mb-1">
                    {uploadStatus === 'partial' ? 'تم الرفع الجزئي مع بعض الأخطاء' : 'فشل رفع الصور'}
                  </div>
                  <div className="text-xs text-red-300 mb-2">{uploadErrorMessage}</div>
                  {errorDetails && (
                    <pre className="p-2.5 rounded-lg bg-black/60 border border-red-900/50 text-[11px] font-mono text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {errorDetails}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
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
                  <span>
                    جاري رفع الصور السحابية ({currentFileIndex} من {selectedFiles.length}) — {uploadProgress}%
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 glass-icon" />
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
                  <span className="glass-icon inline-block ml-1">{CATEGORIES[cat].icon}</span> {CATEGORIES[cat].titleAr} ({count})
                </button>
              );
            })}
          </div>

          {/* Photos List */}
          {filteredPhotos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
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
                            <span className="glass-icon inline-block ml-1">{cat.icon}</span> {cat.titleAr}
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
                      <button
                        onClick={() => {
                          setPhotoToEdit(photo);
                          setEditTitle(photo.title);
                          setEditCategory(photo.category);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        title="تعديل العنوان والقسم"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400 glass-icon" />
                        <span className="hidden sm:inline">تعديل</span>
                      </button>

                      <button
                        onClick={() => setPhotoToDelete(photo)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-xs font-semibold transition-colors"
                        title="حذف من قاعدة البيانات"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400 glass-icon" />
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

      {/* Delete Confirmation Dialog */}
      {photoToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-red-800/60 rounded-3xl p-6 text-right shadow-2xl">
            <div className="w-12 h-12 rounded-2xl glass-icon-box-red flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-950/50">
              <Trash2 className="w-6 h-6 glass-icon" />
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
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin glass-icon" /> : <Trash2 className="w-4 h-4 glass-icon" />}
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
                {isSavingEdit && <RefreshCw className="w-4 h-4 animate-spin glass-icon" />}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Firebase Project:</span>
          <span className="font-mono text-slate-400">{firebaseConfig.projectId}</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Al Mekawy Home UPVC Cloudinary Storage System
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, ExternalLink, ShieldCheck, Database, Cloud, CheckCircle2 } from 'lucide-react';
import { firebaseConfig } from '../firebase/config';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../services/photoService';

interface FirebaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseInfoModal: React.FC<FirebaseInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 text-right shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                إعدادات التخزين السحابي — Al Mekawy Home UPVC
              </h3>
              <p className="text-xs text-slate-400">
                قاعدة بيانات Firestore: <span className="font-mono text-blue-400">{firebaseConfig.projectId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <Cloud className="w-4 h-4" />
              <span>1. سحابة Cloudinary لتخزين الصور بشكل دائم:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              يتم رفع الصور مباشرة إلى سحابة Cloudinary عبر الـ Endpoint الرسمي:
            </p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-blue-300 border border-slate-800 ltr text-left">
              <div>Cloud Name: <span className="text-white font-bold">{CLOUDINARY_CLOUD_NAME}</span></div>
              <div>Upload Preset: <span className="text-emerald-400 font-bold">{CLOUDINARY_UPLOAD_PRESET}</span></div>
              <div>Endpoint: <span className="text-slate-400">https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload</span></div>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>جاهز ومربوط مباشرة بدون الحاجة لأي مفتاح سري (API Secret).</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Database className="w-4 h-4" />
              <span>2. قاعدة بيانات Cloud Firestore (حفظ الروابط والتصنيفات):</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              يتم حفظ الرابط الدائم (<span className="font-mono text-white">secure_url</span>) وبيانات القسم في الـ Collection: <span className="font-mono text-white">photos</span>، مع تحديث لحظي لجميع أجهزة العملاء.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>مزامنة فورية حية تعمل عبر هواتف الآيفون والأندرويد والكمبيوتر.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

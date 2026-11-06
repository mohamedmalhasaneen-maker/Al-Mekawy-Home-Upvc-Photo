import React from 'react';
import { PhotoItem } from '../types/photo';
import { X, Lock, ExternalLink } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { logoutAdmin } from '../services/adminAuth';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAdmin(false);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass-icon-box-blue flex items-center justify-center text-blue-400 shadow-md">
              <Lock className="w-5 h-5 glass-icon" />
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate('/developer');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              <span>فتح في صفحة مستقلة</span>
              <ExternalLink className="w-3 h-3 glass-icon" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5 glass-icon" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!isAdmin ? (
            <div className="max-w-md mx-auto py-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl glass-icon-box-blue flex items-center justify-center text-blue-400 mb-3 shadow-lg">
                <Lock className="w-8 h-8 glass-icon" />
              </div>
              <h4 className="text-lg font-bold text-white">تسجيل الدخول مطلوب</h4>
              <p className="text-xs text-slate-400">
                لوحة الإدارة مخصصة فقط لمشرف الموقع. يرجى التوجه لصفحة تسجيل الدخول المستقلة.
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/developer');
                }}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all"
              >
                الانتقال إلى صفحة إعدادات الموقع (/developer)
              </button>
            </div>
          ) : (
            <AdminDashboard
              photos={photos}
              onLogout={handleLogout}
              onGoHome={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

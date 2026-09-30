import React from 'react';
import { ShieldCheck, Phone, MessageSquare, Sparkles, Image as ImageIcon, Lock } from 'lucide-react';
import logoImg from '../assets/images/almekawy_logo_1790781390166.jpg';

interface HeaderProps {
  isAdmin: boolean;
  onOpenAdmin: () => void;
  totalPhotosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onOpenAdmin,
  totalPhotosCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-lg transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-amber-500/30 shadow-md shadow-amber-950/20 flex-shrink-0">
              <img
                src={logoImg}
                alt="Al Mekawy Home Logo"
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-['Outfit',sans-serif]">
                  Al Mekawy Home <span className="text-blue-400">UPVC</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Photo Gallery
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-400">
                معرض صور منتجات Al-Mekawy Home UPVC
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contact Us button */}
            <a
              href="#contact-us"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-emerald-500/40 transition-all shadow-sm"
            >
              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>تواصل معنا</span>
            </a>

            {/* Admin Dashboard Button */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                isAdmin
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-400/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600'
              }`}
            >
              {isAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-200" />
                  <span>لوحة المشرف</span>
                  <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>دخول المشرف</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

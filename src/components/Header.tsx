import React from 'react';
import { ShieldCheck, MessageSquare, Sparkles, Image as ImageIcon, Lock, Globe, ExternalLink } from 'lucide-react';
import { PhoneCallIcon } from './BrandIcons';
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
            <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#0A1220] border border-amber-500/30 shadow-lg shadow-black/40 flex-shrink-0 p-0.5">
              <img
                src={logoImg}
                alt="Al Mekawy Home UPVC Logo"
                className="w-full h-full object-contain rounded-xl"
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
          </div>
        </div>
      </div>
    </header>
  );
};

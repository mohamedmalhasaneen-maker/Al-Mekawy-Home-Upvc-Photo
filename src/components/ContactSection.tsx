import React, { useState, useEffect } from 'react';
import {
  ContactConfig,
  DEFAULT_CONTACT_CONFIG,
  subscribeToContactConfig,
} from '../services/contactService';
import {
  GlassIconBadge,
  WhatsAppIcon,
  PhoneCallIcon,
  FacebookIcon,
  TikTokIcon,
  InstagramIcon,
} from './BrandIcons';
import logoImg from '../assets/images/almekawy_logo_1790781390166.jpg';

export const ContactSection: React.FC = () => {
  const [config, setConfig] = useState<ContactConfig>(DEFAULT_CONTACT_CONFIG);

  // Subscribe to real-time contact config from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToContactConfig((newConfig) => {
      setConfig(newConfig);
    });
    return () => unsubscribe();
  }, []);

  const formatWhatsAppUrl = (number: string) => {
    const cleanNum = (number || '').replace(/\D/g, '');
    const intl = cleanNum.startsWith('0') ? '20' + cleanNum.slice(1) : cleanNum;
    return `https://wa.me/${intl || '201141761261'}`;
  };

  const formatTelUrl = (number: string) => {
    const cleanNum = (number || '').replace(/\D/g, '');
    const intl = cleanNum.startsWith('0') ? '+20' + cleanNum.slice(1) : '+' + cleanNum;
    return `tel:${intl || '+201141761261'}`;
  };

  const phone1 = config.phones[0]?.number || '01141761261';
  const phone2 = config.phones[1]?.number || '01060524985';

  const facebookUrl = config.socials.find((s) => s.platform === 'facebook')?.url || 'https://www.facebook.com/almekawy.home';
  const tiktokUrl = config.socials.find((s) => s.platform === 'tiktok')?.url || 'https://www.tiktok.com/@almekawy.home';
  const instagramUrl = config.socials.find((s) => s.platform === 'instagram')?.url || 'https://www.instagram.com/almekawy.home';

  return (
    <section id="contact-us" className="py-10 sm:py-16 relative overflow-hidden bg-slate-950">
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex justify-center">
        
        {/* Rectangular Glassmorphic Contact Card */}
        <div className="w-full max-w-md sm:max-w-lg bg-slate-900/80 border border-white/15 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          
          {/* Top Decorative Cyan-Blue Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />
          
          {/* Header with Official Logo */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 rounded-2xl bg-slate-950/90 border border-amber-500/30 p-1.5 flex items-center justify-center shadow-xl shadow-slate-950/50">
              <img
                src={logoImg}
                alt="Al-Mekawy Home UPVC Official Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              تواصل معنا
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              يسعدنا تواصلكم واستقبال استفساراتكم على مدار الساعة
            </p>
          </div>

          {/* Phone Numbers Rows */}
          <div className="space-y-3.5 mb-6">
            
            {/* Phone 1 Row */}
            <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-white tracking-wider font-mono dir-ltr">
                  {phone1}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Call Action Icon in Glassmorphism Badge */}
                <a
                  href={formatTelUrl(phone1)}
                  className="group block"
                  title={`اتصال بـ ${phone1}`}
                  aria-label={`اتصال بـ ${phone1}`}
                >
                  <GlassIconBadge className="w-11 h-11" glowBg="bg-cyan-500">
                    <PhoneCallIcon className="w-5 h-5" />
                  </GlassIconBadge>
                </a>

                {/* WhatsApp Action Icon in Glassmorphism Badge */}
                <a
                  href={formatWhatsAppUrl(phone1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  title={`واتساب ${phone1}`}
                  aria-label={`واتساب ${phone1}`}
                >
                  <GlassIconBadge className="w-11 h-11" glowBg="bg-emerald-500">
                    <WhatsAppIcon className="w-5 h-5" />
                  </GlassIconBadge>
                </a>
              </div>
            </div>

            {/* Phone 2 Row */}
            <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-800/60 border border-white/10 hover:border-blue-500/40 transition-all duration-300 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold text-white tracking-wider font-mono dir-ltr">
                  {phone2}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Call Action Icon in Glassmorphism Badge */}
                <a
                  href={formatTelUrl(phone2)}
                  className="group block"
                  title={`اتصال بـ ${phone2}`}
                  aria-label={`اتصال بـ ${phone2}`}
                >
                  <GlassIconBadge className="w-11 h-11" glowBg="bg-blue-500">
                    <PhoneCallIcon className="w-5 h-5" />
                  </GlassIconBadge>
                </a>

                {/* WhatsApp Action Icon in Glassmorphism Badge */}
                <a
                  href={formatWhatsAppUrl(phone2)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                  title={`واتساب ${phone2}`}
                  aria-label={`واتساب ${phone2}`}
                >
                  <GlassIconBadge className="w-11 h-11" glowBg="bg-emerald-500">
                    <WhatsAppIcon className="w-5 h-5" />
                  </GlassIconBadge>
                </a>
              </div>
            </div>

          </div>

          {/* Elegant Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-white/10" />
            <span className="absolute px-3 bg-slate-900 text-xs text-slate-400 font-medium rounded-full">
              تابعنا على
            </span>
          </div>

          {/* Social Media Row - Glassmorphic Icons Only */}
          <div className="flex items-center justify-center gap-5 sm:gap-6">
            {/* Facebook */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              title="فيسبوك"
              aria-label="Facebook"
            >
              <GlassIconBadge className="w-12 h-12 sm:w-13 sm:h-13" glowBg="bg-blue-600">
                <FacebookIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              </GlassIconBadge>
            </a>

            {/* TikTok */}
            <a
              href={tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              title="تيك توك"
              aria-label="TikTok"
            >
              <GlassIconBadge className="w-12 h-12 sm:w-13 sm:h-13" glowBg="bg-slate-400">
                <TikTokIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              </GlassIconBadge>
            </a>

            {/* Instagram */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              title="إنستغرام"
              aria-label="Instagram"
            >
              <GlassIconBadge className="w-12 h-12 sm:w-13 sm:h-13" glowBg="bg-pink-600">
                <InstagramIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5" />
              </GlassIconBadge>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
};

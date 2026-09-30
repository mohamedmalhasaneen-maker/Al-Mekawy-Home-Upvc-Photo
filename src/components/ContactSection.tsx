import React from 'react';
import { Phone, MessageCircle, Sparkles } from 'lucide-react';

// Contact Data constants (hardcoded as requested)
export const CONTACT_INFO = {
  phones: [
    { number: '01141761261', formatted: '0114 176 1261', intl: '201141761261' },
    { number: '01060524985', formatted: '0106 052 4985', intl: '201060524985' },
  ],
  socials: {
    facebook: 'https://www.facebook.com/share/1FM7yzL2Wx/',
    tiktok: 'https://www.tiktok.com/@almekawy.home?_r=1&_t=ZS-9AARNosDKOS',
    instagram: 'https://www.instagram.com/almekawy.home?stkn=bXBqZmw3NGt4bzVs',
  },
};

export const ContactSection: React.FC = () => {
  return (
    <section id="contact-us" className="scroll-mt-24 my-14">
      {/* Background card with Glassmorphism and gradient lights */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-blue-950/40 to-slate-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Ambient glow lights */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-xs font-bold mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>خدمة عملاء ومعاينة مجانية</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              تواصل مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400">Al Mekawy Home UPVC</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-300">
              يسعدنا دائماً الرد على استفساراتكم وحجز المقاسات وتقديم الاستشارات الفنية على مدار الساعة
            </p>
          </div>

          {/* Grid: Phones & Direct Actions + Social Media */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Phone & WhatsApp Action Cards (8 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>أرقام الاتصال المباشر والواتساب (اضغط للتواصل فوراً)</span>
              </div>

              {CONTACT_INFO.phones.map((phone, idx) => (
                <div
                  key={phone.number}
                  className="rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10"
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30 flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium block">
                        خط الاتصال {idx + 1}
                      </span>
                      <a
                        href={`tel:${phone.number}`}
                        className="text-lg sm:text-xl font-black text-white hover:text-blue-400 font-mono tracking-wider transition-colors direction-ltr inline-block"
                        dir="ltr"
                        title="اتصال هاتفي مباشر"
                      >
                        {phone.formatted}
                      </a>
                    </div>
                  </div>

                  {/* Dual Action Buttons: Call & WhatsApp */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Call Button */}
                    <a
                      href={`tel:${phone.number}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all hover:scale-[1.03] active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      <span>اتصال</span>
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/${phone.intl}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن منتجات Al Mekawy Home UPVC')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.03] active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Media Channels (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-slate-900/60 border border-slate-800 p-5 sm:p-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  صفحاتنا على وسائل التواصل الاجتماعي
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                  تابعوا أحدث أعمالنا وفيديوهات التركيبات والتشطيبات الحصرية وتجارب العزل يومياً عبر منصاتنا:
                </p>

                {/* Social Buttons */}
                <div className="space-y-3">
                  {/* Facebook */}
                  <a
                    href={CONTACT_INFO.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-[#1877F2]/15 border border-slate-700 hover:border-[#1877F2]/40 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1877F2] text-white flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors block">
                          فيسبوك (Facebook)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          صفحة Al Mekawy Home الرسمية
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-blue-400 group-hover:translate-x-[-4px] transition-transform">
                      متابعة ←
                    </span>
                  </a>

                  {/* TikTok */}
                  <a
                    href={CONTACT_INFO.socials.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-black/40 border border-slate-700 hover:border-slate-600 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center border border-slate-700 shadow-md">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.68a6.34 6.34 0 0 0 10.86 4.46v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.07z"/>
                        </svg>
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors block">
                          تيك توك (TikTok)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          @almekawy.home — فيديوهات الواقع
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 group-hover:translate-x-[-4px] transition-transform">
                      مشاهدة ←
                    </span>
                  </a>

                  {/* Instagram */}
                  <a
                    href={CONTACT_INFO.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-[#E4405F]/15 border border-slate-700 hover:border-[#E4405F]/40 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center shadow-md">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors block">
                          إنستجرام (Instagram)
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          @almekawy.home — صور الأعمال
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-pink-400 group-hover:translate-x-[-4px] transition-transform">
                      زيارة ←
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { siWhatsapp, siFacebook, siTiktok, siInstagram } from 'simple-icons';
import { Phone } from 'lucide-react';

/**
 * Glassmorphic Badge Wrapper
 * Specifications requested by user:
 * - Transparent semi-reflective background
 * - backdrop-filter: blur(12px)
 * - Translucent white border rgba(255, 255, 255, 0.25)
 * - Soft shadow giving depth
 * - Top specular light reflection
 * - Soft rounded corners
 * - Smooth hover scale & click effects
 */
export const GlassIconBadge: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowBg?: string;
}> = ({ children, className = 'w-11 h-11', glowBg = '' }) => (
  <div
    className={`relative flex items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-[12px] border border-white/25 shadow-lg shadow-black/40 transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-white/15 group-hover:border-white/40 group-active:scale-95 overflow-hidden ${className}`}
  >
    {/* Specular reflection gradient overlay on top half */}
    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />

    {/* Optional ambient background accent */}
    {glowBg && (
      <div className={`absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none ${glowBg}`} />
    )}

    {/* Icon Content */}
    <div className="relative z-10 flex items-center justify-center">
      {children}
    </div>
  </div>
);

// 1. Phone / Call Icon (Lucide Phone in official Cyan-Blue tone inside Glassmorphism)
export const PhoneCallIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Phone className={`${className} text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.5)]`} />
);

// 2. WhatsApp Official Simple Icon (Official #25D366 SVG path from Simple Icons)
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siWhatsapp.hex}`}
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(37, 211, 102, 0.5))' }}
    aria-hidden="true"
  >
    <path d={siWhatsapp.path} />
  </svg>
);

// 3. Facebook Official Simple Icon (Official #1877F2 SVG path from Simple Icons)
export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siFacebook.hex}`}
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(24, 119, 242, 0.5))' }}
    aria-hidden="true"
  >
    <path d={siFacebook.path} />
  </svg>
);

// 4. TikTok Official Simple Icon (Official TikTok SVG path from Simple Icons)
export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="#FFFFFF"
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.4))' }}
    aria-hidden="true"
  >
    <path d={siTiktok.path} />
  </svg>
);

// 5. Instagram Official Simple Icon with Official Brand Colors (#E4405F)
export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siInstagram.hex}`}
    style={{ filter: 'drop-shadow(0px 2px 4px rgba(228, 64, 95, 0.5))' }}
    aria-hidden="true"
  >
    <path d={siInstagram.path} />
  </svg>
);

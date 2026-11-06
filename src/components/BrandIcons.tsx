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
}> = ({ children, className = 'w-11 h-11' }) => (
  <div
    className={`relative flex items-center justify-center rounded-xl bg-white/5 border border-white/20 backdrop-blur-[4px] transition-all duration-300 ease-out hover:bg-white/10 hover:border-white/40 active:scale-95 ${className}`}
  >
    {/* Icon Content - Fully opaque and saturated */}
    <div className="relative z-10 flex items-center justify-center">
      {children}
    </div>
  </div>
);

// 1. Phone / Call Icon - Sharp Cyan
export const PhoneCallIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <Phone className={`${className} text-[#06B6D4]`} />
);

// 2. WhatsApp Official - Fully saturated
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siWhatsapp.hex}`}
    aria-hidden="true"
  >
    <path d={siWhatsapp.path} />
  </svg>
);

// 3. Facebook Official - Fully saturated
export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siFacebook.hex}`}
    aria-hidden="true"
  >
    <path d={siFacebook.path} />
  </svg>
);

// 4. TikTok Official - Fully saturated
export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="#FFFFFF"
    aria-hidden="true"
  >
    <path d={siTiktok.path} />
  </svg>
);

// 5. Instagram Official - Fully saturated
export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={`#${siInstagram.hex}`}
    aria-hidden="true"
  >
    <path d={siInstagram.path} />
  </svg>
);

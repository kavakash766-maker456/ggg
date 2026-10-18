'use client';
import { useEffect } from 'react';

interface AdBannerProps {
  type?: 'banner' | 'banner2';
  className?: string;
  label?: string;
}

const AD_SCRIPTS = {
  banner: 'https://pl31895748.profitableratecpmnetwork.com/2b/d7/76/2bd7764c6933416d1850ace87d134341.js',
  banner2: 'https://pl31895749.profitableratecpmnetwork.com/60/75/30/60753090640fb29bd1394006c21e90b3.js',
};

export default function AdBanner({ type = 'banner', className = '', label = 'Advertisement' }: AdBannerProps) {
  const scriptId = `adsterra-${type}-script`;
  const scriptUrl = AD_SCRIPTS[type];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => console.warn(`Ad script failed to load: ${scriptUrl}`);
    document.body.appendChild(script);
    return () => {
      const s = document.getElementById(scriptId);
      if (s && document.body.contains(s)) document.body.removeChild(s);
    };
  }, [scriptId, scriptUrl]);

  return (
    <div
      className={`w-full flex items-center justify-center py-3 min-h-[60px] ${className}`}
      aria-label={label}
      role="complementary"
    />
  );
}

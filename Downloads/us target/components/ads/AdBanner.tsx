'use client';
import { useEffect, useRef } from 'react';

interface AdBannerProps { className?: string; label?: string; }

export default function AdBanner({ className = '', label = 'Advertisement' }: AdBannerProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSTERRA_PUBLISHER_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!publisherId || typeof window === 'undefined') return;
    // Adsterra script injection would go here when publisher ID is configured
  }, [publisherId]);
  return (
    <div className={`w-full flex items-center justify-center py-3 ${className}`} ref={containerRef}>
      {!publisherId && (
        <div className='w-full max-w-2xl h-16 bg-obsidian-700 border border-white/5 rounded-sm flex items-center justify-center'>
          <span className='text-white/20 text-xs uppercase tracking-widest'>{label}</span>
        </div>
      )}
    </div>
  );
}

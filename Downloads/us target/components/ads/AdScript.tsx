'use client';
import { useEffect } from 'react';

interface AdScriptProps {
  scriptUrl: string;
  containerId: string;
  className?: string;
}

export default function AdScript({ scriptUrl, containerId, className = '' }: AdScriptProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Avoid duplicate scripts
    if (document.getElementById(containerId + '-script')) return;
    const script = document.createElement('script');
    script.id = containerId + '-script';
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => console.warn(`Ad script failed to load: ${scriptUrl}`);
    document.body.appendChild(script);
    return () => {
      const s = document.getElementById(containerId + '-script');
      if (s) document.body.removeChild(s);
    };
  }, [scriptUrl, containerId]);

  return (
    <div
      id={containerId}
      className={`w-full flex items-center justify-center overflow-hidden ${className}`}
      aria-label="Advertisement"
      role="complementary"
    />
  );
}

'use client';
import { useState, useCallback } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Layers } from 'lucide-react';
import { providers, getActiveProviders, type Provider } from '@/lib/providers/registry';

interface VideoPlayerProps {
  tmdbId: number;
  title: string;
}

export default function VideoPlayer({ tmdbId, title }: VideoPlayerProps) {
  const activeProviders = getActiveProviders();
  const [selectedId, setSelectedId] = useState<string>(activeProviders[0]?.id ?? '');
  const [iframeKey, setIframeKey] = useState<number>(0); // force iframe reload
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const selected: Provider | undefined = activeProviders.find((p) => p.id === selectedId);
  const selectedIndex = activeProviders.findIndex((p) => p.id === selectedId);

  const switchProvider = useCallback((id: string) => {
    setSelectedId(id);
    setIframeKey((k) => k + 1);
    setIsLoading(true);
  }, []);

  const goPrev = () => {
    const prev = activeProviders[selectedIndex - 1];
    if (prev) switchProvider(prev.id);
  };

  const goNext = () => {
    const next = activeProviders[selectedIndex + 1];
    if (next) switchProvider(next.id);
  };

  const reload = () => {
    setIframeKey((k) => k + 1);
    setIsLoading(true);
  };

  const qualityColor: Record<string, string> = {
    '1080p': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    '720p+': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    Demo: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  };

  const statusDotColor: Record<string, string> = {
    working: 'bg-emerald-400',
    likely_working: 'bg-emerald-400/70',
    uncertain: 'bg-amber-400',
    likely_down: 'bg-red-400',
  };

  return (
    <div className="w-full bg-[#0a0a0f] rounded-sm overflow-hidden border border-white/5 shadow-2xl">

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <Layers size={14} className="text-amber-400 flex-shrink-0" />
          <span className="text-white/80 font-medium text-sm truncate">{title}</span>
          {selected?.quality && (
            <span
              className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                qualityColor[selected.quality] ?? 'text-white/40 border-white/10 bg-white/5'
              }`}
            >
              {selected.quality}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden md:block text-white/30 text-xs">
            {selectedIndex + 1} / {activeProviders.length} sources
          </span>

          {/* Prev / Next source */}
          <button
            onClick={goPrev}
            disabled={selectedIndex === 0}
            aria-label="Previous source"
            className="p-1.5 rounded-sm text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={goNext}
            disabled={selectedIndex === activeProviders.length - 1}
            aria-label="Next source"
            className="p-1.5 rounded-sm text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>

          {/* Reload */}
          <button
            onClick={reload}
            aria-label="Reload player"
            className="p-1.5 rounded-sm text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Source selector pills ──────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-b border-white/5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 min-w-max">
          {activeProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => switchProvider(p.id)}
              aria-label={`Switch to ${p.name}`}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium whitespace-nowrap transition-all ${
                p.id === selectedId
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {p.name}
              {p.id !== 'demo' && (
                <span
                  className={`ml-1.5 hidden sm:inline-block w-1.5 h-1.5 rounded-full ${
                    statusDotColor[p.status ?? 'uncertain'] ?? 'bg-white/20'
                  }`}
                  title={p.status ?? 'uncertain'}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Status warning for uncertain/down providers */}
      {selected && (selected.status === 'uncertain' || selected.status === 'likely_down') && (
        <div className={`px-4 py-2 border-b border-white/5 flex items-center gap-2 text-xs ${
          selected.status === 'likely_down'
            ? 'bg-red-500/10 text-red-400'
            : 'bg-amber-500/10 text-amber-400'
        }`}>
          <AlertCircle size={12} className='flex-shrink-0' />
          <span>
            {selected.status === 'likely_down'
              ? `${selected.name} may be offline — research indicates this source is likely down. Try another source.`
              : `${selected.name} status is uncertain — this source may or may not work. Try another source if it fails.`
            }
          </span>
        </div>
      )}

      {/* Status legend */}
      <div className='px-4 py-1.5 border-b border-white/5 bg-white/[0.01] flex items-center gap-4 flex-wrap'>
        <span className='text-white/20 text-[10px] uppercase tracking-wider'>Source status:</span>
        {([
          { color: 'bg-emerald-400', label: 'Working' },
          { color: 'bg-amber-400', label: 'Uncertain' },
          { color: 'bg-red-400', label: 'Likely down' },
        ] as { color: string; label: string }[]).map(({ color, label }) => (
          <span key={label} className='flex items-center gap-1 text-white/30 text-[10px]'>
            <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* ── Video iframe ───────────────────────────────────────────────── */}
      <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-white/40 text-xs">Loading {selected?.name}…</span>
            </div>
          </div>
        )}

        {selected ? (
          <iframe
            key={`${selectedId}-${iframeKey}`}
            src={selected.buildUrl(tmdbId)}
            title={`${title} — ${selected.name}`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <AlertCircle size={32} className="text-white/20" />
            <p className="text-white/40 text-sm">No source available</p>
          </div>
        )}
      </div>

      {/* ── Selected source info ───────────────────────────────────────── */}
      {selected && (
        <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01] flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white/50 text-xs">
              <span className="text-white/70 font-medium">{selected.name}</span>
              {' — '}
              {selected.note}
            </p>
          </div>
        </div>
      )}

      {/* ── Disclaimer ─────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-black/30 flex items-start gap-2 border-t border-white/5">
        <AlertCircle size={12} className="text-white/20 flex-shrink-0 mt-0.5" />
        <p className="text-white/20 text-[11px] leading-relaxed">
          We do not host any video content. All {activeProviders.length} sources are third-party embed services.
          Source availability and content vary by region. Use the source switcher if a source fails to load.
        </p>
      </div>
    </div>
  );
}

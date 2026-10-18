'use client';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { providers, getActiveProviders } from '@/lib/providers/registry';

interface VideoPlayerProps { tmdbId: number; title: string; }

export default function VideoPlayer({ tmdbId, title }: VideoPlayerProps) {
  const activeProviders = getActiveProviders();
  const [selectedId, setSelectedId] = useState(activeProviders[0]?.id ?? '');
  const selected = providers.find(p => p.id === selectedId);

  return (
    <div className='w-full bg-obsidian-800 rounded-sm overflow-hidden border border-white/5'>
      <div className='flex items-center justify-between px-4 py-3 border-b border-white/5 bg-obsidian-700/50'>
        <h3 className='text-white font-semibold text-sm'>Now Playing: {title}</h3>
        <div className='flex items-center gap-2'>
          <label htmlFor='provider-select' className='text-white/40 text-xs'>Source:</label>
          <select
            id='provider-select'
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className='bg-obsidian-700 text-white text-xs px-2 py-1.5 rounded-sm border border-white/10 focus:outline-none focus:border-gold/50 cursor-pointer'
          >
            {activeProviders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className='relative w-full' style={{paddingBottom: '56.25%'}}>
        {selected ? (
          <iframe
            key={selectedId}
            src={selected.buildUrl(tmdbId)}
            title={`${title} — ${selected.name}`}
            className='absolute inset-0 w-full h-full'
            allowFullScreen
            allow='autoplay; encrypted-media; picture-in-picture'
            loading='lazy'
            sandbox='allow-scripts allow-same-origin allow-forms allow-presentation'
          />
        ) : (
          <div className='absolute inset-0 flex items-center justify-center bg-obsidian-900'>
            <p className='text-white/40'>No provider available</p>
          </div>
        )}
      </div>

      <div className='px-4 py-3 flex items-start gap-2 bg-obsidian-900/50'>
        <AlertCircle size={14} className='text-white/30 flex-shrink-0 mt-0.5' />
        <p className='text-white/30 text-xs leading-relaxed'>Source availability varies. We do not host any video content. All streams are provided by third-party sources. {selected?.note}</p>
      </div>
    </div>
  );
}

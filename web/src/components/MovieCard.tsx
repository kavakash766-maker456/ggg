'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Calendar } from 'lucide-react';
import RequestModal from '@/components/RequestModal';

export interface MovieCardProps {
  title: string;
  posterPath: string | null;
  year: string;
  rating: number;
  tmdbUrl: string;
  type?: 'movie' | 'tv' | 'game';
}

export default function MovieCard({
  title,
  posterPath,
  year,
  rating,
  tmdbUrl,
  type = 'movie',
}: MovieCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const posterSrc = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : '/placeholder-poster.svg';

  return (
    <>
      <article className="group relative bg-[#141414] rounded-xl overflow-hidden border border-transparent hover:border-[#F5C518]/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-[#F5C518]/10 flex flex-col">
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0a0a0a]">
          <Image
            src={posterSrc}
            alt={`${title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={!posterPath}
          />
          {/* Rating badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
            <Star size={11} className="text-[#F5C518] fill-[#F5C518]" aria-hidden="true" />
            <span className="text-xs font-bold text-[#F5C518]">{rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-2 flex-1">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug" title={title}>
            {title}
          </h3>

          <div className="flex items-center gap-1 text-gray-400">
            <Calendar size={12} aria-hidden="true" />
            <span className="text-xs">{year || 'N/A'}</span>
          </div>

          <div className="mt-auto pt-1">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full rounded-lg bg-[#F5C518] hover:bg-[#d4a017] text-black text-xs font-bold py-2 transition-colors"
              aria-label={`Request ${title}`}
            >
              Request
            </button>
          </div>
        </div>
      </article>

      <RequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={title}
        tmdbUrl={tmdbUrl}
        type={type}
      />
    </>
  );
}

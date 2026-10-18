'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Calendar, Play } from 'lucide-react';
import { TMDBMovie, getPosterUrl, slugify, getReleaseYear } from '@/lib/tmdb/types';
import { cn } from '@/lib/utils';

interface MovieCard3DProps {
  movie: TMDBMovie;
  priority?: boolean;
  className?: string;
}

export default function MovieCard3D({ movie, priority = false, className }: MovieCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -16;
    const rotateY = (x - 0.5) * 16;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`);
    setGlarePos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setTransform('');
    setHovered(false);
  };

  const slug = slugify(movie.title, movie.id);
  const year = getReleaseYear(movie.release_date);
  const rating = movie.vote_average?.toFixed(1) ?? 'N/A';

  return (
    <Link href={`/movie/${slug}`} className={cn('block flex-shrink-0', className)} tabIndex={0}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{transform, transition: hovered ? 'none' : 'transform 0.4s ease', transformStyle: 'preserve-3d'}}
        className='relative w-40 md:w-48 cursor-pointer group'
      >
        <div className='relative aspect-[2/3] rounded-sm overflow-hidden shadow-lg bg-obsidian-700'>
          <Image
            src={getPosterUrl(movie.poster_path, 'w500')}
            alt={movie.title}
            fill
            className='object-cover transition-all duration-500'
            sizes='(max-width: 768px) 160px, 192px'
            priority={priority}
          />
          {hovered && !prefersReducedMotion && (
            <div
              className='absolute inset-0 pointer-events-none'
              style={{ background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.08) 0%, transparent 60%)` }}
            />
          )}
          <div className={cn('absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/30 to-transparent transition-opacity duration-300', hovered ? 'opacity-90' : 'opacity-40')} />
          {hovered && (
            <div className='absolute inset-0 flex flex-col items-center justify-end p-3 gap-2'>
              <div className='w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center shadow-lg'>
                <Play className='w-4 h-4 text-obsidian-900 fill-obsidian-900 ml-0.5' />
              </div>
              <p className='text-white/80 text-xs text-center line-clamp-2 leading-relaxed'>{movie.overview?.slice(0, 80)}...</p>
            </div>
          )}
        </div>
        <div className='mt-2.5 space-y-1 px-0.5'>
          <h3 className='text-white text-sm font-medium leading-tight line-clamp-2 group-hover:text-gold transition-colors'>{movie.title}</h3>
          <div className='flex items-center gap-2 text-xs text-white/50'>
            {year && <span className='flex items-center gap-0.5'><Calendar size={10} />{year}</span>}
            {movie.vote_average > 0 && <span className='flex items-center gap-0.5 text-gold'><Star size={10} className='fill-current' />{rating}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import MovieCard3D from './MovieCard3D';
import { TMDBMovie } from '@/lib/tmdb/types';

interface MovieRowProps {
  title: string;
  movies: TMDBMovie[];
  viewAllHref?: string;
  description?: string;
}

export default function MovieRow({ title, movies, viewAllHref, description }: MovieRowProps) {
  if (!movies?.length) return null;
  return (
    <section className='py-8'>
      <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-end justify-between mb-6'>
          <div>
            <h2 className='text-white text-2xl md:text-3xl font-bold tracking-tight'>{title}</h2>
            {description && <p className='text-white/40 text-sm mt-1'>{description}</p>}
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className='flex items-center gap-1 text-gold hover:text-gold-light text-sm font-medium transition-colors group'>
              See all <ChevronRight size={16} className='group-hover:translate-x-0.5 transition-transform' />
            </Link>
          )}
        </div>
        <div className='flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0'>
          {movies.slice(0, 20).map((movie, i) => (
            <div key={movie.id} className='snap-start'>
              <MovieCard3D movie={movie} priority={i < 5} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

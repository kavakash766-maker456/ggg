import MovieCard3D from './MovieCard3D';
import { TMDBMovie } from '@/lib/tmdb/types';

interface MovieGridProps {
  movies: TMDBMovie[];
  title?: string;
  emptyMessage?: string;
}

export default function MovieGrid({ movies, title, emptyMessage = 'No movies found.' }: MovieGridProps) {
  if (!movies?.length) return (
    <div className='text-center py-24'>
      <p className='text-white/40 text-lg'>{emptyMessage}</p>
    </div>
  );
  return (
    <section>
      {title && <h2 className='text-white text-2xl font-bold mb-8'>{title}</h2>}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6'>
        {movies.map((movie, i) => <MovieCard3D key={movie.id} movie={movie} priority={i < 6} />)}
      </div>
    </section>
  );
}

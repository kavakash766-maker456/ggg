import { getPopular } from '@/lib/tmdb/endpoints';
import MovieGrid from '@/components/movie/MovieGrid';
import { Metadata } from 'next';
export const metadata: Metadata = { title: 'All Movies — WatchFreeMovies' };
export const revalidate = 3600;
export default async function MoviesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams?.page) || 1;
  const data = await getPopular(page);
  const movies = data?.results ?? [];
  return (
    <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='mb-10'>
        <h1 className='text-4xl md:text-5xl font-bold text-white mb-3'>All Movies</h1>
        <p className='text-white/50'>Browse the most popular movies from around the world.</p>
      </div>
      <MovieGrid movies={movies} />
    </div>
  );
}

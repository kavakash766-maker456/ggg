import { getTrending } from '@/lib/tmdb/endpoints';
import MovieGrid from '@/components/movie/MovieGrid';
import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Trending Movies — WatchFreeMovies' };
export const revalidate = 3600;
export default async function TrendingPage() {
  const data = await getTrending();
  return (
    <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='mb-10'>
        <h1 className='text-4xl md:text-5xl font-bold text-white mb-3'>Trending This Week</h1>
        <p className='text-white/50'>The most-watched films right now, globally.</p>
      </div>
      <MovieGrid movies={data?.results ?? []} />
    </div>
  );
}

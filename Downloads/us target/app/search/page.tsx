import { searchMovies } from '@/lib/tmdb/endpoints';
import MovieGrid from '@/components/movie/MovieGrid';
import SearchBar from '@/components/search/SearchBar';
import { Metadata } from 'next';
export const revalidate = 0;
export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const q = searchParams?.q;
  return { title: q ? `"${q}" — Search — WatchFreeMovies` : 'Search — WatchFreeMovies' };
}
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams?.q ?? '';
  const data = q ? await searchMovies(q) : null;
  const movies = data?.results ?? [];
  return (
    <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='mb-10'>
        <h1 className='text-4xl font-bold text-white mb-6'>Search Movies</h1>
        <SearchBar initialQuery={q} />
      </div>
      {q && (
        <div>
          <p className='text-white/40 text-sm mb-8'>{movies.length > 0 ? `${data?.total_results} results for "${q}"` : `No results for "${q}"`}</p>
          <MovieGrid movies={movies} emptyMessage={`No movies found for "${q}". Try a different search.`} />
        </div>
      )}
    </div>
  );
}

import { getMoviesByGenre, getGenres } from '@/lib/tmdb/endpoints';
import MovieGrid from '@/components/movie/MovieGrid';
import { Metadata } from 'next';
export const revalidate = 3600;
function extractGenreId(slug: string): number {
  const parts = slug.split('-');
  return parseInt(parts[parts.length - 1], 10) || 0;
}
function extractGenreName(slug: string): string {
  const parts = slug.split('-');
  parts.pop();
  return parts.join(' ').replace(/\b\w/g, c => c.toUpperCase());
}
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = extractGenreName(params.slug);
  return { title: `${name} Movies — WatchFreeMovies` };
}
export default async function GenrePage({ params }: { params: { slug: string } }) {
  const genreId = extractGenreId(params.slug);
  const genreName = extractGenreName(params.slug);
  const data = await getMoviesByGenre(genreId);
  return (
    <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='mb-10'>
        <p className='text-gold text-sm font-semibold uppercase tracking-widest mb-2'>Genre</p>
        <h1 className='text-4xl md:text-5xl font-bold text-white mb-3'>{genreName}</h1>
        <p className='text-white/50'>Explore the best {genreName.toLowerCase()} movies.</p>
      </div>
      <MovieGrid movies={data?.results ?? []} emptyMessage={`No ${genreName} movies found.`} />
    </div>
  );
}

import MovieCard from '@/components/MovieCard';
import { fetchSeries, getTMDbUrl, type TMDbShow } from '@/lib/tmdb';
import { Tv } from 'lucide-react';

export const metadata = {
  title: 'Series | FilmFeed 4K',
  description: 'Browse popular TV series and request any season in 4K quality.',
};

export default async function SeriesPage() {
  let series: TMDbShow[] = [];
  let error: string | null = null;

  try {
    series = await fetchSeries(1);
  } catch (e) {
    error = 'Could not load series. Please set up your TMDB API key.';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-[#F5C518]/10">
            <Tv size={24} className="text-[#F5C518]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">TV Series</h1>
        </div>
        <p className="text-gray-400 max-w-xl">
          Explore trending TV series from around the world. Request specific
          seasons via WhatsApp in your preferred quality.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Showing page 1 of results. Use the Request button to get any season.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-[#141414] border border-red-500/30 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : series.length === 0 ? (
        <div className="rounded-xl bg-[#141414] border border-white/10 p-6 text-gray-400 text-sm">
          No series found. Make sure NEXT_PUBLIC_TMDB_API_KEY is configured.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {series.map((show) => (
            <MovieCard
              key={show.id}
              title={show.name}
              posterPath={show.poster_path}
              year={show.first_air_date?.slice(0, 4) ?? ''}
              rating={show.vote_average}
              tmdbUrl={getTMDbUrl('tv', show.id)}
              type="tv"
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Showing 20 results per page. Request any season using the button on each card.</p>
      </div>
    </div>
  );
}

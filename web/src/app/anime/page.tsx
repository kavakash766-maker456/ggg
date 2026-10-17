import MovieCard from '@/components/MovieCard';
import { fetchAnime, getTMDbUrl, type TMDbShow } from '@/lib/tmdb';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Anime | FilmFeed 4K',
  description: 'Browse top anime series and request any season in high quality.',
};

export default async function AnimePage() {
  let anime: TMDbShow[] = [];
  let error: string | null = null;

  try {
    anime = await fetchAnime(1);
  } catch (e) {
    error = 'Could not load anime. Please set up your TMDB API key.';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-[#F5C518]/10">
            <Sparkles size={24} className="text-[#F5C518]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Anime</h1>
        </div>
        <p className="text-gray-400 max-w-xl">
          Discover the most popular anime series. Request any title or season
          directly via WhatsApp.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Showing animated genre results. Use the Request button to get any season.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-[#141414] border border-red-500/30 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : anime.length === 0 ? (
        <div className="rounded-xl bg-[#141414] border border-white/10 p-6 text-gray-400 text-sm">
          No anime found. Make sure NEXT_PUBLIC_TMDB_API_KEY is configured.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {anime.map((show) => (
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

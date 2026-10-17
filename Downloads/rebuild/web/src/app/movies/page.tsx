import MovieCard from '@/components/MovieCard';
import { fetchMovies, getTMDbUrl, type TMDbMovie } from '@/lib/tmdb';
import { Film } from 'lucide-react';

export const metadata = {
  title: 'Movies | FilmFeed 4K',
  description: 'Browse popular movies in 4K, 1080p, 720p and 480p quality.',
};

export default async function MoviesPage() {
  let movies: TMDbMovie[] = [];
  let error: string | null = null;

  try {
    movies = await fetchMovies(1);
  } catch (e) {
    error = 'Could not load movies. Please set up your TMDB API key.';
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-[#F5C518]/10">
            <Film size={24} className="text-[#F5C518]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Movies</h1>
        </div>
        <p className="text-gray-400 max-w-xl">
          Discover the most popular movies right now. Request any title directly
          via WhatsApp in your preferred quality.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Showing page 1 of results. Use the Request button to get any title.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl bg-[#141414] border border-red-500/30 p-6 text-red-400 text-sm">
          {error}
        </div>
      ) : movies.length === 0 ? (
        <div className="rounded-xl bg-[#141414] border border-white/10 p-6 text-gray-400 text-sm">
          No movies found. Make sure NEXT_PUBLIC_TMDB_API_KEY is configured.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              posterPath={movie.poster_path}
              year={movie.release_date?.slice(0, 4) ?? ''}
              rating={movie.vote_average}
              tmdbUrl={getTMDbUrl('movie', movie.id)}
              type="movie"
            />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Showing 20 results per page. Request any title using the button on each card.</p>
      </div>
    </div>
  );
}

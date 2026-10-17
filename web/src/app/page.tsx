import Link from 'next/link';
import { Play, MessageCircle, ChevronRight } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import { fetchMovies, fetchSeries, fetchAnime, getTMDbUrl, type TMDbMovie, type TMDbShow } from '@/lib/tmdb';

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm text-[#F5C518] hover:text-[#d4a017] transition-colors font-medium"
      >
        View all <ChevronRight size={16} />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [movies, series, anime] = await Promise.all([
    fetchMovies(1).catch(() => [] as TMDbMovie[]),
    fetchSeries(1).catch(() => [] as TMDbShow[]),
    fetchAnime(1).catch(() => [] as TMDbShow[]),
  ]);

  const featuredMovies = movies.slice(0, 8);
  const featuredSeries = series.slice(0, 8);
  const featuredAnime = anime.slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: '85vh' }}
        aria-label="Hero banner"
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #0a0a0a 0%, #1a1400 40%, #2d2000 60%, #0a0a0a 100%)',
          }}
        />
        {/* Gold glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at 60% 50%, #F5C518 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#F5C518]/10 border border-[#F5C518]/30 rounded-full px-4 py-1.5 text-sm text-[#F5C518] font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#F5C518] animate-pulse" />
            Now Streaming in 4K Ultra HD
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
            Film<span className="text-[#F5C518]">Feed</span>{' '}
            <span className="text-[#F5C518]">4K</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Your ultimate destination for movies, series, anime, and PC games.
            Request any title at any quality — delivered straight to you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 bg-[#F5C518] hover:bg-[#d4a017] text-black font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-[#F5C518]/30"
            >
              <Play size={20} aria-hidden="true" />
              Browse Movies
            </Link>
            <Link
              href="/request"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-[#F5C518] text-[#F5C518] hover:bg-[#F5C518] hover:text-black font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105"
            >
              <MessageCircle size={20} aria-hidden="true" />
              Request Content
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 text-center">
            {[
              { value: '10,000+', label: 'Movies' },
              { value: '5,000+', label: 'TV Series' },
              { value: '2,000+', label: 'Anime' },
              { value: '500+', label: 'PC Games' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-black text-[#F5C518]">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Latest Movies */}
        <section aria-labelledby="movies-heading">
          <SectionHeading title="Latest Movies" href="/movies" />
          {featuredMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {featuredMovies.map((movie) => (
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
          ) : (
            <p className="text-gray-500 text-sm">
              Configure NEXT_PUBLIC_TMDB_API_KEY to load content.
            </p>
          )}
        </section>

        {/* Popular Series */}
        <section aria-labelledby="series-heading">
          <SectionHeading title="Popular Series" href="/series" />
          {featuredSeries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {featuredSeries.map((show) => (
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
          ) : (
            <p className="text-gray-500 text-sm">
              Configure NEXT_PUBLIC_TMDB_API_KEY to load content.
            </p>
          )}
        </section>

        {/* Top Anime */}
        <section aria-labelledby="anime-heading">
          <SectionHeading title="Top Anime" href="/anime" />
          {featuredAnime.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {featuredAnime.map((show) => (
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
          ) : (
            <p className="text-gray-500 text-sm">
              Configure NEXT_PUBLIC_TMDB_API_KEY to load content.
            </p>
          )}
        </section>

        {/* Featured Games */}
        <section aria-labelledby="games-heading">
          <SectionHeading title="Featured Games" href="/games" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              {
                title: 'Cyberpunk 2077',
                genre: 'RPG',
                size: '70 GB',
                poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hna.jpg',
              },
              {
                title: 'Red Dead Redemption 2',
                genre: 'Action-Adventure',
                size: '120 GB',
                poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
              },
              {
                title: 'Elden Ring',
                genre: 'Action RPG',
                size: '60 GB',
                poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
              },
              {
                title: 'God of War Ragnarök',
                genre: 'Action-Adventure',
                size: '90 GB',
                poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5r.jpg',
              },
              {
                title: "Baldur's Gate 3",
                genre: 'RPG',
                size: '150 GB',
                poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6li7.jpg',
              },
            ].map((game) => (
              <Link
                key={game.title}
                href="/games"
                className="group block bg-[#141414] rounded-xl overflow-hidden border border-transparent hover:border-[#F5C518]/60 transition-all duration-300 hover:scale-[1.03]"
              >
                <div className="relative aspect-[2/3] bg-[#0a0a0a]">
                  <img
                    src={game.poster}
                    alt={`${game.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{game.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {game.genre} · {game.size}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

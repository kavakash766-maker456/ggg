import { Suspense } from 'react';
import CinematicHero from '@/components/hero/CinematicHero';
import MovieRow from '@/components/movie/MovieRow';
import AdBanner from '@/components/ads/AdBanner';
import MovieSkeleton from '@/components/movie/MovieSkeleton';
import {
  getTrending, getPopular, getNowPlaying, getUpcoming, getTopRated,
  getMoviesByGenre, getHiddenGems, GENRE_IDS
} from '@/lib/tmdb/endpoints';

export const revalidate = 3600;

async function HomeContent() {
  const [trending, popular, nowPlaying, upcoming, topRated, action, scifi, horror, thriller, comedy, romance, animation, mystery, hiddenGems] = await Promise.allSettled([
    getTrending(),
    getPopular(),
    getNowPlaying(),
    getUpcoming(),
    getTopRated(),
    getMoviesByGenre(GENRE_IDS.Action),
    getMoviesByGenre(GENRE_IDS.SciFi),
    getMoviesByGenre(GENRE_IDS.Horror),
    getMoviesByGenre(GENRE_IDS.Thriller),
    getMoviesByGenre(GENRE_IDS.Comedy),
    getMoviesByGenre(GENRE_IDS.Romance),
    getMoviesByGenre(GENRE_IDS.Animation),
    getMoviesByGenre(GENRE_IDS.Mystery),
    getHiddenGems(),
  ]);

  const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? (r.value?.results ?? []) : [];

  const trendingMovies = get(trending);

  return (
    <>
      <CinematicHero movies={trendingMovies.slice(0, 5)} />
      <AdBanner type='banner' className='my-6' />
      <MovieRow title='Trending This Week' movies={trendingMovies} viewAllHref='/trending' />
      <MovieRow title='Popular Movies' movies={get(popular)} viewAllHref='/movies' />
      <MovieRow title='Top Rated' movies={get(topRated)} description='Critically acclaimed masterpieces' />
      <AdBanner type='banner2' className='my-6' />
      <MovieRow title='Latest Releases' movies={get(nowPlaying)} description='Now playing in theaters' />
      <MovieRow title='Coming Soon' movies={get(upcoming)} description='Upcoming theatrical releases' />
      <MovieRow title='Action & Adventure' movies={get(action)} viewAllHref='/genres/action-28' />
      <AdBanner type='banner' className='my-6' />
      <MovieRow title='Science Fiction' movies={get(scifi)} viewAllHref='/genres/science-fiction-878' />
      <MovieRow title='Horror Nights' movies={get(horror)} viewAllHref='/genres/horror-27' />
      <MovieRow title='Thrillers' movies={get(thriller)} viewAllHref='/genres/thriller-53' />
      <AdBanner type='banner2' className='my-6' />
      <MovieRow title='Comedy Picks' movies={get(comedy)} viewAllHref='/genres/comedy-35' />
      <MovieRow title='Romance' movies={get(romance)} viewAllHref='/genres/romance-10749' />
      <MovieRow title='Animation' movies={get(animation)} viewAllHref='/genres/animation-16' />
      <MovieRow title='Mystery & Crime' movies={get(mystery)} viewAllHref='/genres/mystery-9648' />
      <AdBanner type='banner' className='my-6' />
      <MovieRow title='Hidden Gems' movies={get(hiddenGems)} description='Overlooked films worth watching' />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className='min-h-screen bg-obsidian-900 flex items-center justify-center'>
        <div className='w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin' />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

import { Metadata } from 'next';
import { TMDBMovieDetail } from '../tmdb/types';
import { getPosterUrl, slugify, getReleaseYear } from '../tmdb/types';

export function generateMovieMetadata(movie: TMDBMovieDetail): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://watchfreemovies.vercel.app';
  const slug = slugify(movie.title, movie.id);
  const year = getReleaseYear(movie.release_date);
  const description = movie.overview.length > 155 ? movie.overview.slice(0, 152) + '...' : movie.overview;
  const posterUrl = getPosterUrl(movie.poster_path, 'w500');
  const canonical = `${siteUrl}/movie/${slug}`;

  return {
    title: `${movie.title} (${year}) — WatchFreeMovies`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${movie.title} (${year})`,
      description,
      url: canonical,
      siteName: 'WatchFreeMovies',
      images: [{ url: posterUrl, width: 500, height: 750, alt: movie.title }],
      type: 'video.movie'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.title} (${year}) — WatchFreeMovies`,
      description,
      images: [posterUrl]
    }
  };
}

export function generateSiteMetadata(): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://watchfreemovies.vercel.app';
  return {
    metadataBase: new URL(siteUrl),
    title: { default: 'WatchFreeMovies — Discover & Stream Movies Online', template: '%s — WatchFreeMovies' },
    description: 'Discover trending movies, explore genres, and watch films online. Your premium cinematic experience.',
    keywords: ['movies', 'streaming', 'watch movies online', 'free movies', 'TMDB', 'cinema'],
    openGraph: {
      type: 'website',
      siteName: 'WatchFreeMovies',
      title: 'WatchFreeMovies — Discover & Stream Movies Online',
      description: 'Discover trending movies, explore genres, and watch films online.'
    },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true }
  };
}

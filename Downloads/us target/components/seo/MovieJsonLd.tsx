import { TMDBMovieDetail, TMDBCredits, getPosterUrl, getReleaseYear } from '@/lib/tmdb/types';

interface MovieJsonLdProps { movie: TMDBMovieDetail; credits: TMDBCredits | null; }

export default function MovieJsonLd({ movie, credits }: MovieJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://watchfreemovies.vercel.app';
  const actors = credits?.cast.slice(0, 10).map(c => ({ '@type': 'Person', name: c.name })) ?? [];
  const directors = credits?.crew.filter(c => c.job === 'Director').map(c => ({ '@type': 'Person', name: c.name })) ?? [];
  const year = getReleaseYear(movie.release_date);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    description: movie.overview,
    image: getPosterUrl(movie.poster_path, 'w500'),
    dateCreated: movie.release_date || year,
    genre: movie.genres?.map(g => g.name) ?? [],
    actor: actors,
    director: directors,
    url: `${siteUrl}/movie/${movie.id}`,
    ...(movie.vote_average > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: movie.vote_average.toFixed(1), ratingCount: movie.vote_count, bestRating: '10' }
    })
  };

  return <script type='application/ld+json' dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />;
}

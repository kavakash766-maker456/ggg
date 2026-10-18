import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, Calendar, Globe, Users } from 'lucide-react';
import { getMovieDetail, getMovieCredits, getRecommendations } from '@/lib/tmdb/endpoints';
import { extractIdFromSlug, getPosterUrl, getBackdropUrl, getReleaseYear, formatRuntime, slugify } from '@/lib/tmdb/types';
import { generateMovieMetadata } from '@/lib/seo/metadata';
import VideoPlayer from '@/components/player/VideoPlayer';
import MovieRow from '@/components/movie/MovieRow';
import Badge from '@/components/ui/Badge';
import MovieJsonLd from '@/components/seo/MovieJsonLd';
import AdBanner from '@/components/ads/AdBanner';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const id = extractIdFromSlug(params.slug);
  const movie = await getMovieDetail(id);
  if (!movie) return { title: 'Movie Not Found — WatchFreeMovies' };
  return generateMovieMetadata(movie);
}

export default async function MovieDetailPage({ params }: { params: { slug: string } }) {
  const id = extractIdFromSlug(params.slug);
  if (!id) notFound();

  const [movie, credits, recommendations] = await Promise.allSettled([
    getMovieDetail(id),
    getMovieCredits(id),
    getRecommendations(id),
  ]);

  const movieData = movie.status === 'fulfilled' ? movie.value : null;
  const creditsData = credits.status === 'fulfilled' ? credits.value : null;
  const recsData = recommendations.status === 'fulfilled' ? recommendations.value : null;

  if (!movieData) notFound();

  const year = getReleaseYear(movieData.release_date);
  const director = creditsData?.crew.find(c => c.job === 'Director');
  const cast = creditsData?.cast.slice(0, 8) ?? [];

  return (
    <>
      <MovieJsonLd movie={movieData} credits={creditsData} />
      <div className='min-h-screen bg-obsidian-900'>
        {/* Backdrop header */}
        <div className='relative h-64 md:h-96 overflow-hidden'>
          <Image
            src={getBackdropUrl(movieData.backdrop_path, 'w1280')}
            alt={movieData.title}
            fill
            className='object-cover object-center'
            priority
            sizes='100vw'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-obsidian-900 via-obsidian-900/60 to-obsidian-900/20' />
          <div className='absolute inset-0 bg-gradient-to-r from-obsidian-900/80 to-transparent' />
        </div>

        <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10'>
          <div className='flex flex-col md:flex-row gap-8 md:gap-12 mb-12'>
            {/* Poster */}
            <div className='flex-shrink-0 w-44 md:w-56 lg:w-64 mx-auto md:mx-0'>
              <div className='aspect-[2/3] relative rounded-sm overflow-hidden shadow-2xl border border-white/10'>
                <Image src={getPosterUrl(movieData.poster_path, 'w500')} alt={movieData.title} fill className='object-cover' sizes='(max-width: 768px) 176px, 256px' priority />
              </div>
            </div>

            {/* Info */}
            <div className='flex-1 min-w-0 text-center md:text-left'>
              <div className='flex flex-wrap justify-center md:justify-start gap-2 mb-4'>
                {movieData.genres?.map(g => <Badge key={g.id} variant='genre'>{g.name}</Badge>)}
              </div>
              <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 leading-tight'>{movieData.title}</h1>
              {movieData.tagline && <p className='text-gold/80 italic text-lg mb-4'>"{movieData.tagline}"</p>}

              <div className='flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-white/60 mb-6'>
                {movieData.vote_average > 0 && (
                  <span className='flex items-center gap-1.5 text-gold font-semibold'>
                    <Star size={14} className='fill-current' />{movieData.vote_average.toFixed(1)}
                    <span className='text-white/40 font-normal'>({movieData.vote_count.toLocaleString()} votes)</span>
                  </span>
                )}
                {year && <span className='flex items-center gap-1.5'><Calendar size={14} />{year}</span>}
                {movieData.runtime && <span className='flex items-center gap-1.5'><Clock size={14} />{formatRuntime(movieData.runtime)}</span>}
                {movieData.original_language && <span className='flex items-center gap-1.5'><Globe size={14} />{movieData.original_language.toUpperCase()}</span>}
              </div>

              <p className='text-white/70 leading-relaxed text-base md:text-lg mb-6 max-w-2xl mx-auto md:mx-0'>{movieData.overview}</p>

              {director && (
                <p className='text-white/50 text-sm mb-6'>
                  <span className='text-white/30'>Directed by </span>
                  <span className='text-white font-medium'>{director.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Ad before Player */}
          <AdBanner type='banner' className='my-6' />

          {/* Player */}
          <div className='mb-12'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center gap-2'>Watch {movieData.title}</h2>
            <VideoPlayer tmdbId={movieData.id} title={movieData.title} />
          </div>

          {/* Cast */}
          {cast.length > 0 && (
            <div className='mb-12'>
              <h2 className='text-2xl font-bold text-white mb-6 flex items-center gap-2'><Users size={20} className='text-gold' />Cast</h2>
              <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4'>
                {cast.map(member => (
                  <div key={member.id} className='text-center'>
                    <div className='w-full aspect-square relative rounded-full overflow-hidden bg-obsidian-700 mb-2 border border-white/10'>
                      {member.profile_path ? (
                        <Image src={`https://image.tmdb.org/t/p/w185${member.profile_path}`} alt={member.name} fill className='object-cover' sizes='80px' />
                      ) : (
                        <div className='absolute inset-0 flex items-center justify-center text-white/20 text-2xl font-bold'>{member.name[0]}</div>
                      )}
                    </div>
                    <p className='text-white text-xs font-medium leading-tight'>{member.name}</p>
                    <p className='text-white/40 text-xs leading-tight mt-0.5 line-clamp-1'>{member.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AdBanner type='banner2' className='my-6' />

          {/* Recommendations */}
          {(recsData?.results?.length ?? 0) > 0 && (
            <MovieRow title='You Might Also Like' movies={recsData!.results} />
          )}
        </div>
      </div>
    </>
  );
}

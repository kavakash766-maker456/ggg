import { tmdbFetch } from './client';
import { TMDBPaginatedResponse, TMDBMovie, TMDBMovieDetail, TMDBCredits, TMDBGenre } from './types';

export const GENRE_IDS = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Fantasy: 14, History: 36, Horror: 27,
  Music: 10402, Mystery: 9648, Romance: 10749, SciFi: 878, Thriller: 53,
  War: 10752, Western: 37
} as const;

export async function getTrending(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/trending/movie/week', { page });
}

export async function getPopular(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/popular', { page });
}

export async function getNowPlaying(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/now_playing', { page });
}

export async function getUpcoming(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/upcoming', { page });
}

export async function getTopRated(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/movie/top_rated', { page });
}

export async function getMoviesByGenre(genreId: number, page = 1, extraParams: Record<string, string | number> = {}) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
    ...extraParams
  });
}

export async function getMovieDetail(id: number) {
  return tmdbFetch<TMDBMovieDetail>(`/movie/${id}`);
}

export async function getMovieCredits(id: number) {
  return tmdbFetch<TMDBCredits>(`/movie/${id}/credits`);
}

export async function getSimilarMovies(id: number, page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(`/movie/${id}/similar`, { page });
}

export async function getRecommendations(id: number, page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(`/movie/${id}/recommendations`, { page });
}

export async function searchMovies(query: string, page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/search/movie', { query, page });
}

export async function getGenres() {
  const data = await tmdbFetch<{ genres: TMDBGenre[] }>('/genre/movie/list');
  return data?.genres ?? [];
}

export async function getHiddenGems(page = 1) {
  return tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>('/discover/movie', {
    sort_by: 'vote_average.desc',
    'vote_count.gte': 100,
    'vote_count.lte': 1000,
    'vote_average.gte': 7.5,
    page
  });
}

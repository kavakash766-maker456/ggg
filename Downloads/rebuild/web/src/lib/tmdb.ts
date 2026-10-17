export interface TMDbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDbShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY ?? '';

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`TMDb fetch failed: ${res.status} ${res.statusText} for ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

interface TMDbMovieResponse {
  results: TMDbMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

interface TMDbShowResponse {
  results: TMDbShow[];
  page: number;
  total_pages: number;
  total_results: number;
}

export async function fetchMovies(page: number = 1): Promise<TMDbMovie[]> {
  const data = await tmdbFetch<TMDbMovieResponse>('/movie/popular', {
    page: String(page),
    language: 'en-US',
  });
  return data.results;
}

export async function fetchSeries(page: number = 1): Promise<TMDbShow[]> {
  const data = await tmdbFetch<TMDbShowResponse>('/tv/popular', {
    page: String(page),
    language: 'en-US',
  });
  return data.results;
}

export async function fetchAnime(page: number = 1): Promise<TMDbShow[]> {
  const data = await tmdbFetch<TMDbShowResponse>('/discover/tv', {
    page: String(page),
    language: 'en-US',
    with_genres: '16',
    with_keywords: 'animation',
    sort_by: 'popularity.desc',
  });
  return data.results;
}

export async function searchTMDb(query: string): Promise<(TMDbMovie | TMDbShow)[]> {
  const data = await tmdbFetch<{ results: (TMDbMovie | TMDbShow)[] }>('/search/multi', {
    query,
    language: 'en-US',
    page: '1',
  });
  return data.results;
}

export function getPosterUrl(path: string | null, size: string = 'w500'): string {
  if (!path) return '/placeholder-poster.svg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getTMDbUrl(type: 'movie' | 'tv', id: number): string {
  return `https://www.themoviedb.org/${type}/${id}`;
}

import { TMDBPaginatedResponse, TMDBMovie, TMDBMovieDetail, TMDBCredits, TMDBGenre } from './types';

const BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY environment variable is not set');
  return key;
}

export async function tmdbFetch<T>(path: string, params: Record<string, string | number> = {}, revalidate = 3600): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set('api_key', apiKey);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    next: { revalidate },
    headers: { 'Accept': 'application/json' }
  });

  if (res.status === 404) return null as T;
  if (res.status === 429) throw new Error('TMDB rate limit exceeded');
  if (!res.ok) throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);

  return res.json() as Promise<T>;
}

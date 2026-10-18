export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBMovieDetail extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime: number | null;
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  belongs_to_collection: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBImageConfig {
  base_url: string;
  secure_base_url: string;
  backdrop_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
}

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

export function getPosterUrl(path: string | null, size: ImageSize = 'w500'): string {
  if (!path) return '/placeholder-poster.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: ImageSize = 'w1280'): string {
  if (!path) return '/placeholder-backdrop.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getProfileUrl(path: string | null, size: ImageSize = 'w185'): string {
  if (!path) return '/placeholder-profile.jpg';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function slugify(title: string, id: number): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug}-${id}`;
}

export function extractIdFromSlug(slug: string): number {
  const parts = slug.split('-');
  const id = parseInt(parts[parts.length - 1], 10);
  return isNaN(id) ? 0 : id;
}

export function getReleaseYear(date: string): string {
  if (!date) return '';
  return date.split('-')[0];
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

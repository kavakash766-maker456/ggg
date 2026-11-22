import teledramasRaw from "@/data/teledramas.json";
import { MovieSearchResult, MovieDetail, SeriesEpisode } from "./cinesubz";

export interface TeledramaEpisode {
  episode: number;
  title: string;
  url: string;
  thumb?: string;
}

export interface TeledramaItem {
  id: string;
  slug: string;
  title: string;
  channel: string;
  url: string;
  poster: string;
  backdrop?: string;
  category: string;
  kind: "series";
  quality?: string;
  rating?: string;
  year?: string;
  duration?: string;
  overview?: string;
  episodes: TeledramaEpisode[];
  number_of_episodes?: number;
  number_of_seasons?: number;
}

const teledramasList: TeledramaItem[] = (teledramasRaw as any[]) || [];

export function teledramaToSearchResult(t: TeledramaItem): MovieSearchResult {
  return {
    id: t.id,
    title: `${t.title} (${t.channel})`,
    url: t.url,
    poster: t.poster || "https://col3neg.com/img/category/aaley.jpg",
    rating: t.rating || "9.0",
    year: t.year || "2024",
    quality: t.quality || "1080p HD",
    type: "series",
    category: "teledrama",
  };
}

export function getTeledramas(
  page = 1,
  limit = 24,
  channel?: string
): { teledramas: MovieSearchResult[]; total: number; totalPages: number } {
  let filtered = teledramasList;
  if (channel && channel !== "All") {
    filtered = filtered.filter(
      (t) => t.channel.toLowerCase() === channel.toLowerCase()
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const pageItems = filtered.slice(startIndex, startIndex + limit);

  return {
    teledramas: pageItems.map(teledramaToSearchResult),
    total,
    totalPages,
  };
}

export function getTeledramaDetailsById(id: string): MovieDetail | null {
  const cleanId = id.replace(/^tele-/, "");
  const found = teledramasList.find(
    (t) =>
      t.id === id ||
      t.slug === cleanId ||
      t.url === id ||
      (t.url && id.includes(t.slug))
  );

  if (!found) return null;

  const seriesEpisodes: SeriesEpisode[] = found.episodes.map((ep) => ({
    season: 1,
    episode: ep.episode,
    title: ep.title,
    url: ep.url,
    thumb: ep.thumb || found.poster,
    date: found.year,
  }));

  return {
    title: found.title,
    url: found.url,
    poster: found.poster,
    backdrop: found.backdrop || found.poster,
    year: found.year || "2024",
    quality: found.quality || "1080p HD • Col3neg Official Broadcast",
    imdbRating: found.rating || "9.0",
    duration: `${seriesEpisodes.length} Episodes`,
    genres: ["Teledrama", "Drama", found.channel],
    languages: ["Sinhala"],
    directors: [found.channel],
    cast: [{ name: found.channel, role: "Broadcaster" }],
    description: found.overview || `${found.title} - Sri Lankan Sinhala Teledrama on ${found.channel}.`,
    kind: "series",
    episodes: seriesEpisodes,
    qualities: seriesEpisodes.map((ep) => ({
      label: `Episode ${ep.episode}`,
      meta: "1080p HD • Sinhala",
      quality: "1080p HD",
      sizeText: "Direct",
      language: "Sinhala",
      ztUrl: ep.url,
    })),
  };
}

export function searchTeledramas(query: string): MovieSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const matches = teledramasList.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.channel.toLowerCase().includes(q)
  );

  return matches.map(teledramaToSearchResult);
}

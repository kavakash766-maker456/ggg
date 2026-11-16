import cartoonsRaw from "@/data/cartoons.json";
import { MovieSearchResult, MovieDetail, SeriesEpisode } from "./cinesubz";

export interface CartoonEpisode {
  id: string;
  episode: number;
  title: string;
  streamUrl: string;
  downloadUrl: string;
  quality?: string;
}

export interface CartoonItem {
  id: number | string;
  slug?: string;
  title: string;
  url: string;
  date?: string;
  categories: string[];
  tags?: string[];
  description?: string;
  poster?: string;
  kind?: "movie" | "series";
  stream_url?: string;
  download_url?: string;
  episodes?: CartoonEpisode[];
  download_links?: Array<{ quality?: string; url?: string; type?: string }>;
}

const cartoonsList: CartoonItem[] = (cartoonsRaw as any[]) || [];

function extractYear(title: string, date?: string): string {
  const match = title.match(/\((19\d\d|20\d\d)\)/) || title.match(/\b(19\d\d|20\d\d)\b/);
  if (match) return match[1];
  if (date) return date.split("-")[0];
  return "2024";
}

function cleanTitle(raw: string): { en: string; si?: string } {
  if (raw.includes("|")) {
    const parts = raw.split("|").map((p) => p.trim());
    return { en: parts[0], si: parts[1] };
  }
  return { en: raw.trim() };
}

export function cartoonToSearchResult(c: CartoonItem): MovieSearchResult {
  const titles = cleanTitle(c.title);
  const isSeries = c.kind === "series" || (c.episodes && c.episodes.length > 0);
  return {
    id: `cartoon-${c.id}`,
    title: titles.en,
    url: c.url,
    poster: c.poster || "https://sinhalacartoons.com/wp-content/uploads/2026/10/7f33d6078a87460916917a056ea2c8c7.webp",
    year: extractYear(c.title, c.date),
    quality: "Cloudflare R2 Direct",
    type: isSeries ? "series" : "movie",
    category: "cartoon",
    rating: "9.2",
  };
}

export function getAllCartoons(limit = 40, page = 1, category?: string): { items: MovieSearchResult[]; total: number; totalPages: number } {
  let filtered = cartoonsList;
  if (category && category !== "All") {
    filtered = filtered.filter((c) =>
      c.categories.some((cat) => cat.toLowerCase().includes(category.toLowerCase())) ||
      (category.toLowerCase() === "series" && (c.kind === "series" || (c.episodes && c.episodes.length > 0))) ||
      (category.toLowerCase() === "movies" && c.kind === "movie")
    );
  }

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit).map(cartoonToSearchResult);

  return {
    items,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limit),
  };
}

export function searchCartoons(query: string): MovieSearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return cartoonsList
    .filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        c.categories.some((cat) => cat.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q))
    )
    .map(cartoonToSearchResult);
}

export function getCartoonDetailsById(id: string): MovieDetail | null {
  const cleanId = id.replace(/^cartoon-/, "");
  const found = cartoonsList.find(
    (c) =>
      String(c.id) === cleanId ||
      c.slug === cleanId ||
      c.url === cleanId ||
      (c.url && id.includes(c.slug || ""))
  );
  if (!found) return null;

  const titles = cleanTitle(found.title);
  const isSeries = found.kind === "series" || (found.episodes && found.episodes.length > 0);

  const seriesEpisodes: SeriesEpisode[] = (found.episodes || []).map((ep, idx) => ({
    season: 1,
    episode: ep.episode || idx + 1,
    title: ep.title || `Episode ${idx + 1}`,
    url: ep.streamUrl || ep.downloadUrl || found.url,
    thumb: found.poster || "",
    date: found.date,
  }));

  const directDl = found.download_url || found.stream_url || found.url;
  const directStream = found.stream_url || found.download_url || found.url;

  return {
    title: titles.en,
    url: found.url,
    poster: found.poster || "https://sinhalacartoons.com/wp-content/uploads/2026/10/7f33d6078a87460916917a056ea2c8c7.webp",
    backdrop: found.poster || "",
    year: extractYear(found.title, found.date),
    quality: "1080p FHD • Cloudflare R2 Direct",
    imdbRating: "9.2",
    duration: isSeries ? `${seriesEpisodes.length} Episodes` : "1h 35m",
    genres: found.categories.length > 0 ? found.categories : ["Animation", "Sinhala Dubbed"],
    languages: ["Sinhala Dubbed"],
    directors: ["Sinhala Cartoons R2 Studio"],
    cast: [{ name: "Sinhala Voice Cast" }],
    tagline: titles.si || "Sinhala Dubbed Cartoon / Kids Animation",
    description: found.description || `Watch and download ${found.title} Sinhala Dubbed in 4K/HD via high-speed Cloudflare R2 direct stream.`,
    qualities: [
      {
        label: directDl.includes("drive.google.com")
          ? "720p HD (Google Drive High Speed)"
          : "1080p FHD (Cloudflare R2 Direct Download)",
        meta: directDl.includes("drive.google.com")
          ? "Direct Google Drive Fast Stream"
          : "High Speed Colombo CDN • 1-Click MP4",
        quality: "1080p",
        sizeText: "1.2 GB",
        language: "Sinhala Dubbed",
        ztUrl: directDl,
      },
      {
        label: directDl.includes("drive.google.com")
          ? "480p SD (Fast Google Stream)"
          : "720p HD (Cloudflare Fast Stream)",
        meta: "Zero Buffering CDN Direct Stream",
        quality: "720p",
        sizeText: "750 MB",
        language: "Sinhala Dubbed",
        ztUrl: directStream,
      },
    ],
    kind: isSeries ? "series" : "movie",
    episodes: isSeries ? seriesEpisodes : undefined,
  };
}

export function findCartoonByUrl(url: string): CartoonItem | null {
  const found = cartoonsList.find(
    (c) => c.url === url || `cartoon-${c.id}` === url || String(c.id) === url || c.slug === url
  );
  return found || null;
}

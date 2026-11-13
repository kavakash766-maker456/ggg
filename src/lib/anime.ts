import * as cheerio from "cheerio";
import { MovieSearchResult, MovieDetail, SeriesEpisode } from "./cinesubz";

const ANIMEGG_BASE = "https://www.animegg.org";
const ANILIST_API = "https://graphql.anilist.co";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  romajiTitle?: string;
  url: string;
  poster: string;
  banner?: string;
  rating: string;
  year: string;
  quality: string;
  episodesCount: number;
  genres: string[];
  description?: string;
}

// In-memory cache for fast responses
const ANIME_CACHE = new Map<string, MovieDetail>();
const ANILIST_PAGE_CACHE = new Map<string, { items: MovieSearchResult[]; total: number; totalPages: number }>();

/**
 * Fetch global trending/popular anime from AniList GraphQL
 */
export async function getAnimeSeries(
  limit = 24,
  page = 1,
  genre?: string
): Promise<{ items: MovieSearchResult[]; total: number; totalPages: number }> {
  const cacheKey = `page_${page}_limit_${limit}_genre_${genre || "All"}`;
  if (ANILIST_PAGE_CACHE.has(cacheKey)) {
    return ANILIST_PAGE_CACHE.get(cacheKey)!;
  }

  const query = `
    query ($page: Int, $perPage: Int, $genre: String) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
        }
        media (type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC], genre: $genre) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          episodes
          seasonYear
          averageScore
          genres
          description
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage: limit,
  };
  if (genre && genre !== "All" && genre !== "all") {
    variables.genre = genre;
  }

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const pageData = json.data?.Page;
      if (pageData && Array.isArray(pageData.media)) {
        const items: MovieSearchResult[] = pageData.media.map((m: any) => {
          const mainTitle = m.title?.english || m.title?.romaji || "Anime";
          const ratingVal = m.averageScore ? (m.averageScore / 10).toFixed(1) : "8.8";
          const poster =
            m.coverImage?.extraLarge ||
            m.coverImage?.large ||
            m.coverImage?.medium ||
            "https://vidcache.net:8161/static/b759e355b7ed1e929d89db80dd987d54fe5e5a85/jpeg";

          return {
            id: `anime-${m.id}`,
            title: mainTitle,
            url: `/movies/anime-${m.id}`,
            poster,
            rating: ratingVal,
            year: m.seasonYear ? String(m.seasonYear) : "2024",
            quality: "1080p FHD",
            type: "series" as const,
            category: "anime-series",
          };
        });

        const result = {
          items,
          total: pageData.pageInfo?.total || 1000,
          totalPages: Math.min(pageData.pageInfo?.lastPage || 50, 50),
        };

        ANILIST_PAGE_CACHE.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error("AniList API getAnimeSeries error:", err);
  }

  // Fallback safe return
  return { items: [], total: 0, totalPages: 1 };
}

export async function getAnimeMovies(
  limit = 24,
  page = 1,
  genre?: string
): Promise<{ items: MovieSearchResult[]; total: number; totalPages: number }> {
  return getAnimeSeries(limit, page, genre);
}

/**
 * Search anime globally across AniList + AnimeGG
 */
export async function searchAnime(query: string): Promise<MovieSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const gql = `
    query ($query: String, $perPage: Int) {
      Page (page: 1, perPage: $perPage) {
        media (type: ANIME, search: $query, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          episodes
          seasonYear
          averageScore
          genres
          description
        }
      }
    }
  `;

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({ query: gql, variables: { query: q, perPage: 25 } }),
      next: { revalidate: 1800 },
    });

    if (res.ok) {
      const json = await res.json();
      const mediaList = json.data?.Page?.media || [];
      if (mediaList.length > 0) {
        return mediaList.map((m: any) => {
          const mainTitle = m.title?.english || m.title?.romaji || q;
          const ratingVal = m.averageScore ? (m.averageScore / 10).toFixed(1) : "8.8";
          const poster =
            m.coverImage?.extraLarge ||
            m.coverImage?.large ||
            m.coverImage?.medium ||
            "https://vidcache.net:8161/static/b759e355b7ed1e929d89db80dd987d54fe5e5a85/jpeg";

          return {
            id: `anime-${m.id}`,
            title: mainTitle,
            url: `/movies/anime-${m.id}`,
            poster,
            rating: ratingVal,
            year: m.seasonYear ? String(m.seasonYear) : "2024",
            quality: "1080p FHD",
            type: "series" as const,
            category: "anime-series",
          };
        });
      }
    }
  } catch (err) {
    console.warn("AniList search failed, attempting AnimeGG fallback:", err);
  }

  // AnimeGG live scrape fallback
  try {
    const ggRes = await fetch(`${ANIMEGG_BASE}/search/?q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": UA, Referer: `${ANIMEGG_BASE}/` },
      next: { revalidate: 3600 },
    });
    if (ggRes.ok) {
      const html = await ggRes.text();
      const $ = cheerio.load(html);
      const results: MovieSearchResult[] = [];
      const seen = new Set<string>();

      $("li.mse, a[href*='/series/']").each((_, el) => {
        const href = $(el).attr("href") || $(el).find("a").attr("href") || "";
        if (!href.includes("/series/")) return;

        const slug = href.replace(/.*\/series\//, "").replace(/\/.*$/, "").trim();
        if (!slug || seen.has(slug)) return;
        seen.add(slug);

        const imgTag = $(el).find("img");
        let poster = imgTag.attr("src") || "";
        if (poster && !poster.startsWith("http")) {
          poster = `${ANIMEGG_BASE}${poster}`;
        }
        if (!poster) {
          poster = "https://vidcache.net:8161/static/b759e355b7ed1e929d89db80dd987d54fe5e5a85/jpeg";
        }

        const titleTag = $(el).find("strong");
        let title = titleTag.length ? titleTag.text().trim() : $(el).text().trim();
        title = title.replace(/\s+Episodes.*$/i, "").replace(/^Watch\s+/i, "").trim() || slug.replace(/-/g, " ").toUpperCase();

        results.push({
          id: `anime-${slug}`,
          title,
          url: `/movies/anime-${slug}`,
          poster,
          rating: "8.8",
          year: "2024",
          quality: "1080p FHD",
          type: "series" as const,
          category: "anime-series",
        });
      });

      if (results.length > 0) {
        return results;
      }
    }
  } catch (err) {
    console.warn("AnimeGG search fallback error:", err);
  }

  return [];
}

/**
 * Fetch full anime details and episodes by AniList ID or AnimeGG slug
 */
export async function getAnimeDetailsById(urlOrSlug: string): Promise<MovieDetail | null> {
  let cleanId = "";
  const animeMatch = urlOrSlug.match(/anime-([a-zA-Z0-9_-]+)/i);
  if (animeMatch) {
    cleanId = animeMatch[1];
  } else if (urlOrSlug.includes("/series/")) {
    cleanId = urlOrSlug.split("/series/")[1].split(/[/?#]/)[0].trim();
  } else {
    cleanId = urlOrSlug.replace(/^.*[/\\]/, "").replace(/[?#].*$/, "").trim();
  }

  if (!cleanId || cleanId.toLowerCase() === "series" || cleanId.toLowerCase() === "anime-series-list") {
    cleanId = "solo-leveling";
  }

  if (ANIME_CACHE.has(cleanId)) {
    return ANIME_CACHE.get(cleanId)!;
  }

  const isNumeric = /^\d+$/.test(cleanId);

  // 1. Query AniList GraphQL (by ID if numeric, or by search if slug)
  const gql = isNumeric
    ? `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          episodes
          nextAiringEpisode { episode }
          seasonYear
          averageScore
          genres
          description(asHtml: false)
          status
        }
      }
    `
    : `
      query ($search: String) {
        Media (search: $search, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          episodes
          nextAiringEpisode { episode }
          seasonYear
          averageScore
          genres
          description(asHtml: false)
          status
        }
      }
    `;

  const variables = isNumeric
    ? { id: parseInt(cleanId, 10) }
    : { search: cleanId.replace(/-/g, " ") };

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": UA,
      },
      body: JSON.stringify({ query: gql, variables }),
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const m = json.data?.Media;
      if (m) {
        const mainTitle = m.title?.english || m.title?.romaji || cleanId.replace(/-/g, " ").toUpperCase();
        const romaji = m.title?.romaji || mainTitle;
        const poster =
          m.coverImage?.extraLarge ||
          m.coverImage?.large ||
          m.coverImage?.medium ||
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800";
        const rating = m.averageScore ? (m.averageScore / 10).toFixed(1) : "8.8";
        const year = m.seasonYear ? String(m.seasonYear) : "2024";
        const totalEps = m.episodes || (m.nextAiringEpisode?.episode ? m.nextAiringEpisode.episode - 1 : 24);

        // Build full episodes list conforming to SeriesEpisode
        const episodes: SeriesEpisode[] = [];
        const maxEpsToGenerate = Math.min(totalEps, 1500);
        for (let i = 1; i <= maxEpsToGenerate; i++) {
          episodes.push({
            season: 1,
            episode: i,
            title: `Episode ${i}`,
            url: `https://www.animegg.org/play/${cleanId}/video.mp4`,
            thumb: poster,
            date: year,
          });
        }

        const detail: MovieDetail = {
          title: mainTitle,
          url: `/movies/anime-${m.id}`,
          poster,
          backdrop: m.bannerImage || poster,
          year,
          quality: "1080p FHD",
          imdbRating: rating,
          imdbVotes: "250K Viewers",
          genres: m.genres || ["Action", "Anime", "Fantasy"],
          languages: ["Japanese", "English Dub"],
          directors: ["Official Anime Studio"],
          cast: [
            { name: romaji, role: "Main Character" },
            { name: "Japanese Voice Cast", role: "Original Audio" },
            { name: "English Dub Cast", role: "Dubbed" },
          ],
          description: m.description || `Watch ${mainTitle} full season with high-speed direct downloads on FilmFeed.`,
          qualities: [
            {
              label: "1080p FHD",
              meta: "Full HD Master",
              quality: "1080p",
              sizeText: "240 MB/ep",
              language: "Japanese/English",
              ztUrl: `https://www.animegg.org/play/${cleanId}/video.mp4`,
            },
            {
              label: "720p HD",
              meta: "HD Stream",
              quality: "720p",
              sizeText: "140 MB/ep",
              language: "Japanese/English",
              ztUrl: `https://www.animegg.org/play/${cleanId}/video.mp4`,
            },
          ],
          kind: "series",
          episodes,
        };

        ANIME_CACHE.set(cleanId, detail);
        return detail;
      }
    }
  } catch (err) {
    console.warn("AniList detail error:", err);
  }

  // AnimeGG series slug fallback
  try {
    const targetUrl = `${ANIMEGG_BASE}/series/${cleanId}`;
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": UA, Referer: `${ANIMEGG_BASE}/` },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);

      let title = "";
      const h1Text = $("h1").first().text().trim();
      if (h1Text && !/anime\s*series\s*list/i.test(h1Text) && h1Text.toLowerCase() !== "series") {
        title = h1Text;
      }
      if (!title && $("title").text()) {
        const rawPageTitle = $("title")
          .text()
          .replace(/^Watch\s+/i, "")
          .replace(/\s+Episodes.*$/i, "")
          .replace(/Anime\s*Series\s*List/gi, "")
          .replace(/-?\s*AnimeGG/gi, "")
          .trim();
        if (rawPageTitle && !/anime\s*series\s*list/i.test(rawPageTitle)) {
          title = rawPageTitle;
        }
      }
      if (!title || /anime\s*series\s*list/i.test(title)) {
        const breadcrumbTitle = $("ol.breadcrumb li.active, .series-info h2, strong.series-title").text().trim();
        if (breadcrumbTitle && !/anime\s*series\s*list/i.test(breadcrumbTitle)) {
          title = breadcrumbTitle;
        }
      }
      if (!title || /anime\s*series\s*list/i.test(title)) {
        title = cleanId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      let poster = "";
      for (const img of $("img").toArray()) {
        const src = $(img).attr("src") || "";
        if (src.includes("vidcache.net") || src.includes("/static/")) {
          poster = src.startsWith("http") ? src : `${ANIMEGG_BASE}${src}`;
          break;
        }
      }
      if (!poster) {
        poster = "https://vidcache.net:8161/static/b759e355b7ed1e929d89db80dd987d54fe5e5a85/jpeg";
      }

      const desc = $("div.desc, div.description, div.sinopse").first().text().trim() ||
        `Watch ${title} in 1080p FHD with high-speed direct downloads on FilmFeed.`;

      // Extract real episodes
      const episodes: SeriesEpisode[] = [];
      const seenEps = new Set<number>();

      $("a[href*='-episode-']").each((_, el) => {
        const href = $(el).attr("href") || "";
        const m = href.match(/-episode-(\d+)/);
        if (!m) return;
        const epNum = parseInt(m[1], 10);
        if (seenEps.has(epNum)) return;
        seenEps.add(epNum);

        const epTitle = $(el).text().trim() || `Episode ${epNum}`;
        episodes.push({
          season: 1,
          episode: epNum,
          title: epTitle,
          url: `https://www.animegg.org${href.startsWith("/") ? "" : "/"}${href}`,
          thumb: poster,
          date: "2024",
        });
      });

      episodes.sort((a, b) => a.episode - b.episode);

      const detail: MovieDetail = {
        title,
        url: `/movies/anime-${cleanId}`,
        poster,
        backdrop: poster,
        year: "2024",
        quality: "1080p FHD",
        imdbRating: "8.9",
        imdbVotes: "250K Viewers",
        genres: ["Anime", "Action", "Shounen"],
        languages: ["Japanese", "English Dub"],
        directors: ["Official Studio"],
        cast: [
          { name: title, role: "Main Hero" },
          { name: "Japanese Cast", role: "Original" },
        ],
        description: desc,
        qualities: [
          {
            label: "1080p FHD",
            meta: "Direct Master",
            quality: "1080p",
            sizeText: "240 MB/ep",
            language: "Japanese/English",
            ztUrl: `https://www.animegg.org/series/${cleanId}`,
          },
        ],
        kind: "series",
        episodes,
      };

      ANIME_CACHE.set(cleanId, detail);
      return detail;
    }
  } catch (err) {
    console.warn("AnimeGG detail error:", err);
  }

  return null;
}

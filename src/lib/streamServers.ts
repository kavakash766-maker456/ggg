/**
 * Multi-Server Video Streaming URL Resolver
 * Default Server: Server 2 (VidSrc Cloud - vidsrc_me)
 */

export type ServerId = "vidsrc_me" | "vidsrc_to" | "multiembed" | "two_embed" | "vidsrc_cc";

export interface ServerOption {
  id: ServerId;
  name: string;
  badge: string;
  speed: string;
  description: string;
  isDefault?: boolean;
}

export const STREAM_SERVERS: ServerOption[] = [
  {
    id: "vidsrc_me",
    name: "Server 2 (VidSrc Cloud)",
    badge: "1080p FHD • Primary Default",
    speed: "High Speed",
    description: "Reliable cloud mirror with full subtitle & multi-audio support (Zero Popups)",
    isDefault: true,
  },
  {
    id: "vidsrc_to",
    name: "Server 1 (VidSrc Pro)",
    badge: "4K UHD • High Quality",
    speed: "Ultra Fast",
    description: "High-speed 4K / 1080p CDN stream with auto-adaptive bitrate",
  },
  {
    id: "multiembed",
    name: "Server 3 (MultiEmbed)",
    badge: "Multi-Source",
    speed: "VIP Fast",
    description: "Multi-source aggregator with 10+ instant fallback mirrors",
  },
  {
    id: "two_embed",
    name: "Server 4 (2Embed)",
    badge: "Direct Stream",
    speed: "Fast",
    description: "Direct streaming provider with instant chapter & episode sync",
  },
  {
    id: "vidsrc_cc",
    name: "Server 5 (VidSrc CC)",
    badge: "Backup CDN",
    speed: "Backup",
    description: "Alternative fallback streaming cluster",
  },
];

/**
 * Builds safe embed URL for the selected server with parameter validation
 */
export function getEmbedUrl(
  server: ServerId,
  tmdbId: number,
  type: "movie" | "tv",
  season: number = 1,
  episode: number = 1
): string {
  if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
    return "";
  }

  const s = Math.max(1, season || 1);
  const e = Math.max(1, episode || 1);

  switch (server) {
    case "vidsrc_me": // SERVER 2 (DEFAULT)
      return type === "tv"
        ? `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}`
        : `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;

    case "vidsrc_to": // SERVER 1
      return type === "tv"
        ? `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${tmdbId}`;

    case "multiembed": // SERVER 3
      return type === "tv"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;

    case "two_embed": // SERVER 4
      return type === "tv"
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${tmdbId}`;

    case "vidsrc_cc": // SERVER 5
      return type === "tv"
        ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`
        : `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;

    default:
      return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
  }
}

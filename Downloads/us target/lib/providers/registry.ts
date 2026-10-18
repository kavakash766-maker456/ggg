// ============================================================
// WatchFreeMovies — Video Provider Registry
// Research date: 2026 | Updated with 20+ working embed servers
//
// NOTE: These are third-party embed services. Availability,
// content, and uptime are controlled entirely by each provider.
// We do not host any video content.
// ============================================================

export interface Provider {
  id: string;
  name: string;
  type: 'embed' | 'direct';
  buildUrl: (tmdbId: number) => string;
  isActive: boolean;
  requiresAuth: boolean;
  quality: string;
  note: string;
  priority: number; // lower = shown first
  status: 'working' | 'likely_working' | 'uncertain' | 'likely_down';
}

export const providers: Provider[] = [
  // ── TIER 1: Most Stable & Popular (2026 research) ─────────────────────

  {
    id: 'vidsrc-to',
    name: 'VidSrc',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Multi-server failover, subtitles, auto-updated links',
    priority: 1,
    status: 'working',
  },
  {
    id: 'vidsrc-io',
    name: 'VidSrc Pro',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.io/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Subtitle picker, resume support, built-in server selector',
    priority: 2,
    status: 'working',
  },
  {
    id: 'vidsrc-mov',
    name: 'VidSrc.mov',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.mov/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Auto-updating links, multi-server failover',
    priority: 3,
    status: 'working',
  },
  {
    id: 'vidsrc-buzz',
    name: 'VidSrc Buzz',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.buzz/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'TMDB-based embed, clean player interface',
    priority: 4,
    status: 'likely_working',
  },
  {
    id: 'vidsrc-xyz',
    name: 'VidSrc XYZ',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    isActive: false,
    requiresAuth: false,
    quality: '1080p',
    note: 'NXDOMAIN — domain does not resolve. Likely shut down or expired.',
    priority: 5,
    status: 'likely_down',
  },

  // ── TIER 2: SuperEmbed / MultiEmbed Family ─────────────────────────────

  {
    id: 'superembed',
    name: 'SuperEmbed',
    type: 'embed',
    buildUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Large catalog, multiple internal servers, StreamingNow.mov powered',
    priority: 6,
    status: 'working',
  },
  {
    id: '2embed-cc',
    name: '2Embed',
    type: 'embed',
    buildUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'Widely used TMDB embed, simple integration',
    priority: 7,
    status: 'working',
  },
  {
    id: '2embed-stream',
    name: '2Embed Stream',
    type: 'embed',
    buildUrl: (id) => `https://2embed.stream/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'High-quality video links, fast streaming servers',
    priority: 8,
    status: 'working',
  },

  // ── TIER 3: Reliable Alternatives ─────────────────────────────────────

  {
    id: 'embed-su',
    name: 'EmbedSu',
    type: 'embed',
    buildUrl: (id) => `https://embed.su/embed/movie/${id}`,
    isActive: false,
    requiresAuth: false,
    quality: '1080p',
    note: 'NXDOMAIN — domain does not resolve at all. embed.su appears to have shut down.',
    priority: 9,
    status: 'likely_down',
  },
  {
    id: 'autoembed-co',
    name: 'AutoEmbed',
    type: 'embed',
    buildUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Auto embed, TMDB ID support',
    priority: 10,
    status: 'working',
  },
  {
    id: 'autoembed-app',
    name: 'AutoEmbed Pro',
    type: 'embed',
    buildUrl: (id) => `https://player.autoembed.app/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Multi-server, Wordpress-compatible, server selector',
    priority: 11,
    status: 'uncertain',
  },
  {
    id: 'vidcore',
    name: 'VidCore',
    type: 'embed',
    buildUrl: (id) => `https://vidcore.org/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Developer-focused, HLS streaming, subtitle support, multiple mirrors',
    priority: 12,
    status: 'likely_working',
  },
  {
    id: 'vidspark',
    name: 'VidSpark',
    type: 'embed',
    buildUrl: (id) => `https://vidspark.to/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'High-performance auto-embed, VidSrc/2Embed alternative',
    priority: 13,
    status: 'likely_working',
  },

  // ── TIER 4: More Working Sources ───────────────────────────────────────

  {
    id: 'smashy',
    name: 'SmashyStream',
    type: 'embed',
    buildUrl: (id) => `https://player.smashy.stream/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'Clean streaming player, TMDB-based',
    priority: 14,
    status: 'uncertain',
  },
  {
    id: 'nontongo',
    name: 'NontonGo',
    type: 'embed',
    buildUrl: (id) => `https://www.nontongo.win/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'Aggregates high-speed streaming links, developer API',
    priority: 15,
    status: 'working',
  },
  {
    id: 'vidsrc-sbs',
    name: 'VidSrc SBS',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.sbs/embed/movie/${id}`,
    isActive: false,
    requiresAuth: false,
    quality: '1080p',
    note: 'NXDOMAIN — domain does not resolve. vidsrc.sbs appears to be down or expired.',
    priority: 16,
    status: 'likely_down',
  },
  {
    id: 'vidsrc-party',
    name: 'VidSrc Party',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.party/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'TMDB and IMDB ID support, loads on play button click',
    priority: 17,
    status: 'working',
  },
  {
    id: 'myflixer-api',
    name: 'MyFlixer API',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.myflixerapi.com/embed/movie?tmdb=${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'MyFlixer-powered embed, TMDB ID supported',
    priority: 18,
    status: 'working',
  },
  {
    id: 'streamflizoapi',
    name: 'StreamFlizo',
    type: 'embed',
    buildUrl: (id) => `https://streamflizoapi.top/stream/tmdb/${id}/movie`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'High-speed TMDB streaming, anime + movie support',
    priority: 19,
    status: 'likely_working',
  },

  // ── TIER 5: Backup / Regional Sources ─────────────────────────────────

  {
    id: 'vidsrc-me',
    name: 'VidSrc.me',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'Classic VidSrc mirror, IMDB/TMDB support',
    priority: 20,
    status: 'working',
  },
  {
    id: 'streamingnow',
    name: 'StreamingNow',
    type: 'embed',
    buildUrl: (id) => `https://streamingnow.mov/embed/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'SuperEmbed-powered, multiple videohosts (streamtape, doodstream, mixdrop)',
    priority: 21,
    status: 'likely_working',
  },

  // ── NEW PROVIDERS (2026 research) ──────────────────────────────────────

  {
    id: 'vidsrc-nl',
    name: 'VidSrc NL',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.nl/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Emerged as active alternative in 2025; part of vidsrc ecosystem',
    priority: 22,
    status: 'working',
  },
  {
    id: 'vidsrc-pro',
    name: 'VidSrc Pro',
    type: 'embed',
    buildUrl: (id) => `https://vidsrc.pro/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Popular community-recommended vidsrc variant 2025-2026',
    priority: 23,
    status: 'working',
  },
  {
    id: 'moviesapi',
    name: 'MoviesAPI',
    type: 'embed',
    buildUrl: (id) => `https://moviesapi.club/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '1080p',
    note: 'Frequently mentioned in developer forums as working 2025-2026 alternative',
    priority: 24,
    status: 'working',
  },
  {
    id: 'nontonfilm',
    name: 'NontonFilm',
    type: 'embed',
    buildUrl: (id) => `https://www.NontonFilm.site/embed/movie/${id}`,
    isActive: true,
    requiresAuth: false,
    quality: '720p+',
    note: 'Regional embed provider active in 2025-2026 communities',
    priority: 25,
    status: 'working',
  },

  // ── DEMO / TEST ────────────────────────────────────────────────────────

  {
    id: 'demo',
    name: 'Demo Player',
    type: 'direct',
    buildUrl: (_) => 'https://iframe.mediadelivery.net/embed/85/3b7b74a3-6034-4d2e-b8dc-d80a7d31c7f5',
    isActive: true,
    requiresAuth: false,
    quality: 'Demo',
    note: 'Public CDN sample video — for UI testing only, not real movie content',
    priority: 99,
    status: 'working',
  },
];

// Sort by priority ascending
const sortedProviders = [...providers].sort((a, b) => a.priority - b.priority);

export function getActiveProviders(): Provider[] {
  return sortedProviders.filter((p) => p.isActive);
}

export function getProviderById(id: string): Provider | null {
  return providers.find((p) => p.id === id) ?? null;
}

export function getProviderCount(): number {
  return getActiveProviders().length;
}

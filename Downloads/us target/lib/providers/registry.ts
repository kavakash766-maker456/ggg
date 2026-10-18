export interface Provider {
  id: string;
  name: string;
  type: 'embed' | 'direct';
  buildUrl: (tmdbId: number) => string;
  isActive: boolean;
  requiresAuth: boolean;
  note: string;
}

export const providers: Provider[] = [
  { id: 'vidsrc', name: 'VidSrc', type: 'embed', buildUrl: (id) => `https://vidsrc.to/embed/movie/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'vidsrc2', name: 'VidSrc 2', type: 'embed', buildUrl: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'superembed', name: 'SuperEmbed', type: 'embed', buildUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'embedsu', name: 'EmbedSu', type: 'embed', buildUrl: (id) => `https://embed.su/embed/movie/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'autoembed', name: 'AutoEmbed', type: 'embed', buildUrl: (id) => `https://autoembed.co/movie/tmdb/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'smashy', name: 'SmashyStream', type: 'embed', buildUrl: (id) => `https://player.smashy.stream/movie/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: '2embed', name: 'MovieEmbed', type: 'embed', buildUrl: (id) => `https://www.2embed.cc/embed/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'nontongo', name: 'NontonGo', type: 'embed', buildUrl: (id) => `https://www.nontongo.win/embed/movie/${id}`, isActive: true, requiresAuth: false, note: 'Third-party embed — availability varies' },
  { id: 'demo', name: 'Demo Player', type: 'direct', buildUrl: (_) => 'https://iframe.mediadelivery.net/embed/85/3b7b74a3-6034-4d2e-b8dc-d80a7d31c7f5', isActive: true, requiresAuth: false, note: 'Demo only — not real movie content' },
  { id: 'slot10', name: 'Provider Slot 10', type: 'embed', buildUrl: (id) => `https://example.com/embed/${id}`, isActive: false, requiresAuth: false, note: 'Reserved for authorized provider' }
];

export function getActiveProviders() {
  return providers.filter(p => p.isActive);
}

export function getProviderById(id: string) {
  return providers.find(p => p.id === id) ?? null;
}

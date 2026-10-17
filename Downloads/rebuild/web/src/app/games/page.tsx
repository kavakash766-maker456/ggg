import Link from 'next/link';
import { Gamepad2, HardDrive, Tag, Download } from 'lucide-react';

export const metadata = {
  title: 'PC Games | FilmFeed 4K',
  description: 'Download popular PC games via FitGirl Repacks. Request any title.',
};

interface Game {
  title: string;
  genre: string;
  size: string;
  poster: string;
  fitgirlUrl: string;
  developer: string;
  year: string;
}

const GAMES: Game[] = [
  {
    title: 'Cyberpunk 2077',
    genre: 'RPG / Open World',
    size: '70 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4hna.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/cyberpunk-2077/',
    developer: 'CD Projekt Red',
    year: '2020',
  },
  {
    title: 'Red Dead Redemption 2',
    genre: 'Action-Adventure',
    size: '120 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1q1f.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/red-dead-redemption-2/',
    developer: 'Rockstar Games',
    year: '2019',
  },
  {
    title: 'Elden Ring',
    genre: 'Action RPG',
    size: '60 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4jni.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/elden-ring/',
    developer: 'FromSoftware',
    year: '2022',
  },
  {
    title: 'God of War Ragnarök',
    genre: 'Action-Adventure',
    size: '90 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5s5r.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/god-of-war-ragnarok/',
    developer: 'Santa Monica Studio',
    year: '2023',
  },
  {
    title: "Baldur's Gate 3",
    genre: 'RPG / Turn-Based',
    size: '150 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co6li7.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/baldurs-gate-3/',
    developer: 'Larian Studios',
    year: '2023',
  },
  {
    title: 'The Witcher 3: Wild Hunt',
    genre: 'RPG / Open World',
    size: '50 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/the-witcher-3-wild-hunt/',
    developer: 'CD Projekt Red',
    year: '2015',
  },
  {
    title: 'GTA V',
    genre: 'Action-Adventure',
    size: '95 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/grand-theft-auto-v/',
    developer: 'Rockstar Games',
    year: '2015',
  },
  {
    title: 'Hogwarts Legacy',
    genre: 'Action RPG',
    size: '85 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5va7.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/hogwarts-legacy/',
    developer: 'Avalanche Software',
    year: '2023',
  },
  {
    title: 'Starfield',
    genre: 'RPG / Sci-Fi',
    size: '140 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co52l6.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/starfield/',
    developer: 'Bethesda',
    year: '2023',
  },
  {
    title: 'Spider-Man: Miles Morales',
    genre: 'Action-Adventure',
    size: '75 GB',
    poster: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2pgg.jpg',
    fitgirlUrl: 'https://fitgirl-repacks.site/marvels-spider-man-miles-morales/',
    developer: 'Insomniac Games',
    year: '2022',
  },
];

export default function GamesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-[#F5C518]/10">
            <Gamepad2 size={24} className="text-[#F5C518]" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">PC Games</h1>
        </div>
        <p className="text-gray-400 max-w-xl">
          Curated selection of popular FitGirl Repacks. Click "Download via
          Request" on any game to send a WhatsApp request.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          All sizes are approximate repack sizes. Original game sizes will be
          larger after installation.
        </p>
      </div>

      {/* Games grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {GAMES.map((game) => (
          <article
            key={game.title}
            className="group bg-[#141414] rounded-xl overflow-hidden border border-transparent hover:border-[#F5C518]/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#F5C518]/10 flex flex-col"
          >
            {/* Cover */}
            <div className="relative aspect-[2/3] overflow-hidden bg-[#0a0a0a]">
              <img
                src={game.poster}
                alt={`${game.title} cover`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col gap-2 flex-1">
              <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                {game.title}
              </h2>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Tag size={11} aria-hidden="true" />
                  <span className="text-xs line-clamp-1">{game.genre}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <HardDrive size={11} aria-hidden="true" />
                  <span className="text-xs">{game.size}</span>
                </div>
                <p className="text-xs text-gray-500">{game.developer} · {game.year}</p>
              </div>

              <div className="mt-auto pt-1">
                <Link
                  href="/request"
                  className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#F5C518] hover:bg-[#d4a017] text-black text-xs font-bold py-2 transition-colors"
                  aria-label={`Download ${game.title} via request`}
                >
                  <Download size={12} aria-hidden="true" />
                  Download via Request
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Info banner */}
      <div className="mt-12 rounded-xl bg-[#141414] border border-[#F5C518]/20 p-6">
        <h2 className="text-lg font-bold text-[#F5C518] mb-2">How to Request a Game</h2>
        <p className="text-gray-400 text-sm mb-4">
          Click "Download via Request" on any game above, or use the command
          format below via WhatsApp.
        </p>
        <pre className="bg-[#0a0a0a] rounded-lg p-4 text-xs text-[#F5C518] overflow-x-auto">
          {'!req_game <fitgirl-url> | Parts <start>-<end> | <token>'}
        </pre>
        <p className="text-gray-500 text-xs mt-3">
          Contact us on WhatsApp to get your access token:{' '}
          <a
            href="https://wa.me/94760372547"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F5C518] hover:underline"
          >
            +94 760 372 547
          </a>
        </p>
      </div>
    </div>
  );
}

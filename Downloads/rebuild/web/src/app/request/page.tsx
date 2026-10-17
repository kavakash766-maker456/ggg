import Link from 'next/link';
import { MessageCircle, Film, Tv, Gamepad2, ChevronRight, Info } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/api';

export const metadata = {
  title: 'Request Content | FilmFeed 4K',
  description: 'Request movies, series, anime, or PC games via WhatsApp.',
};

const WA_LINK_GENERAL = buildWhatsAppLink('Hi! I want to request content on FilmFeed 4K.');

interface CommandCardProps {
  icon: React.ReactNode;
  title: string;
  command: string;
  description: string;
}

function CommandCard({ icon, title, command, description }: CommandCardProps) {
  return (
    <div className="bg-[#141414] rounded-xl border border-white/10 p-6 hover:border-[#F5C518]/40 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-[#F5C518]/10">{icon}</div>
        <h2 className="font-bold text-white text-lg">{title}</h2>
      </div>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="rounded-lg bg-[#0a0a0a] border border-white/10 p-4">
        <code className="text-[#F5C518] text-sm break-all">{command}</code>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#F5C518]/10 mb-4">
          <MessageCircle size={32} className="text-[#F5C518]" aria-hidden="true" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Request Content</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Send your request via WhatsApp using the command formats below. Our
          bot will process your request automatically.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-[#141414] border border-[#F5C518]/20 rounded-xl p-5 mb-8 flex gap-3">
        <Info size={20} className="text-[#F5C518] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-gray-300 space-y-1">
          <p className="font-semibold text-white">How it works</p>
          <p>
            1. Get your access token by messaging us on WhatsApp.
          </p>
          <p>
            2. Copy the appropriate command format below.
          </p>
          <p>
            3. Replace the placeholders and send via WhatsApp.
          </p>
          <p>
            4. Your content will be prepared and delivered via a download link.
          </p>
        </div>
      </div>

      {/* Command formats */}
      <div className="grid gap-6 mb-10">
        <CommandCard
          icon={<Film size={20} className="text-[#F5C518]" aria-hidden="true" />}
          title="Request a Movie"
          command="!req <url> | <quality> | <token>"
          description="Request any movie by its TMDB or IMDB URL. Quality options: 480p, 720p, 1080p, 4K."
        />

        <CommandCard
          icon={<Tv size={20} className="text-[#F5C518]" aria-hidden="true" />}
          title="Request a TV Season"
          command="!req_season <url> | S<season> | <quality> | <token>"
          description="Request a specific season of any TV series or anime. Example: S1 for Season 1."
        />

        <CommandCard
          icon={<Gamepad2 size={20} className="text-[#F5C518]" aria-hidden="true" />}
          title="Request a PC Game"
          command="!req_game <fitgirl-url> | Parts <start>-<end> | <token>"
          description="Request a PC game using its FitGirl Repacks URL. Specify the part range to download."
        />
      </div>

      {/* Quality table */}
      <div className="bg-[#141414] rounded-xl border border-white/10 p-6 mb-10">
        <h2 className="font-bold text-white mb-4 text-lg">Quality Options</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Quality options table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[#F5C518] pb-3 pr-4 font-semibold">Quality</th>
                <th className="text-left text-[#F5C518] pb-3 pr-4 font-semibold">Label</th>
                <th className="text-left text-[#F5C518] pb-3 font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-white/5">
              <tr>
                <td className="py-3 pr-4 font-mono">480p</td>
                <td className="py-3 pr-4">SD</td>
                <td className="py-3 text-gray-400">Slow connections, small file sizes</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono">720p</td>
                <td className="py-3 pr-4">HD</td>
                <td className="py-3 text-gray-400">Standard HD viewing</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono">1080p</td>
                <td className="py-3 pr-4">Full HD</td>
                <td className="py-3 text-gray-400">Most TVs and monitors</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-mono">4K</td>
                <td className="py-3 pr-4">Ultra HD</td>
                <td className="py-3 text-gray-400">4K displays, best quality</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="text-center bg-gradient-to-br from-[#141414] to-[#1a1400] rounded-2xl border border-[#F5C518]/30 p-10">
        <h2 className="text-2xl font-black text-white mb-3">Ready to Request?</h2>
        <p className="text-gray-400 mb-6 max-w-sm mx-auto">
          Tap the button below to open WhatsApp and get your access token or
          submit a request.
        </p>
        <a
          href={WA_LINK_GENERAL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-lg shadow-[#25D366]/30"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.552 4.099 1.518 5.826L.057 23.57a.75.75 0 00.918.895l5.9-1.546A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.932 0-3.736-.524-5.283-1.432l-.38-.224-3.5.918.934-3.41-.247-.394A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Open WhatsApp
        </a>

        <p className="text-gray-500 text-sm mt-4">
          Or browse available content first:&nbsp;
          <Link href="/movies" className="text-[#F5C518] hover:underline">
            Movies
          </Link>
          ,{' '}
          <Link href="/series" className="text-[#F5C518] hover:underline">
            Series
          </Link>
          ,{' '}
          <Link href="/anime" className="text-[#F5C518] hover:underline">
            Anime
          </Link>
          ,{' '}
          <Link href="/games" className="text-[#F5C518] hover:underline">
            Games
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { getGenres } from '@/lib/tmdb/endpoints';
import { Metadata } from 'next';
export const metadata: Metadata = { title: 'Movie Genres — WatchFreeMovies' };
export const revalidate = 86400;
const GENRE_COLORS: Record<string, string> = {
  Action: 'from-red-900/60', Adventure: 'from-orange-900/60', Animation: 'from-blue-900/60',
  Comedy: 'from-yellow-900/60', Crime: 'from-gray-900/60', Documentary: 'from-green-900/60',
  Drama: 'from-purple-900/60', Fantasy: 'from-indigo-900/60', History: 'from-amber-900/60',
  Horror: 'from-red-950/80', Mystery: 'from-slate-900/60', Romance: 'from-pink-900/60',
  'Science Fiction': 'from-cyan-900/60', Thriller: 'from-zinc-900/60', War: 'from-stone-900/60',
};
export default async function GenresPage() {
  const genres = await getGenres();
  return (
    <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='mb-10'>
        <h1 className='text-4xl md:text-5xl font-bold text-white mb-3'>Browse by Genre</h1>
        <p className='text-white/50'>Find movies tailored to your taste.</p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
        {genres.map(genre => {
          const slug = `${genre.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${genre.id}`;
          const color = GENRE_COLORS[genre.name] ?? 'from-obsidian-700/60';
          return (
            <Link key={genre.id} href={`/genres/${slug}`} className={`group relative bg-gradient-to-br ${color} to-obsidian-800 border border-white/5 rounded-sm p-6 hover:border-gold/30 transition-all hover:scale-105`}>
              <span className='text-white font-semibold text-base group-hover:text-gold transition-colors'>{genre.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

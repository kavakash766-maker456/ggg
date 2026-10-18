import Link from 'next/link';
import { Film, Twitter, Instagram, Github } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className='bg-obsidian-900 border-t border-white/5 mt-24'>
      <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-10 mb-12'>
          <div className='md:col-span-2'>
            <Link href='/' className='flex items-center gap-2.5 mb-4'>
              <div className='w-8 h-8 rounded-sm bg-gold flex items-center justify-center'><Film className='w-4 h-4 text-obsidian-900' strokeWidth={2.5} /></div>
              <span className='text-white font-bold text-xl'>Watch<span className='text-gold'>Free</span>Movies</span>
            </Link>
            <p className='text-white/50 text-sm leading-relaxed max-w-sm'>Your premium destination for discovering the greatest films ever made. Powered by TMDB metadata.</p>
            <p className='text-white/30 text-xs mt-4'>Movie data provided by <a href='https://www.themoviedb.org' target='_blank' rel='noopener noreferrer' className='text-gold/60 hover:text-gold transition-colors'>The Movie Database (TMDB)</a>.</p>
          </div>
          <div>
            <h3 className='text-white font-semibold text-sm uppercase tracking-wider mb-4'>Discover</h3>
            <ul className='space-y-2'>{[['/', 'Home'], ['/movies', 'All Movies'], ['/trending', 'Trending'], ['/genres', 'Genres']].map(([href, label]) => <li key={href}><Link href={href} className='text-white/50 hover:text-gold text-sm transition-colors'>{label}</Link></li>)}</ul>
          </div>
          <div>
            <h3 className='text-white font-semibold text-sm uppercase tracking-wider mb-4'>Company</h3>
            <ul className='space-y-2'>{[['/about', 'About Us'], ['/contact', 'Contact'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Use']].map(([href, label]) => <li key={href}><Link href={href} className='text-white/50 hover:text-gold text-sm transition-colors'>{label}</Link></li>)}</ul>
          </div>
        </div>
        <div className='border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <p className='text-white/30 text-xs'>© {year} WatchFreeMovies. All rights reserved. Not affiliated with any streaming service.</p>
          <p className='text-white/20 text-xs'>Source availability varies. We do not host any video content.</p>
        </div>
      </div>
    </footer>
  );
}

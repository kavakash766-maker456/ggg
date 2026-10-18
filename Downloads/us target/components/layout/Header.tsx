'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Menu, X, Film, Clapperboard, TrendingUp, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Film },
    { href: '/movies', label: 'Movies', icon: Clapperboard },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/genres', label: 'Genres', icon: Grid3X3 }
  ];

  return (
    <header className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', scrolled ? 'bg-obsidian-900/95 backdrop-blur-md border-b border-white/5 shadow-xl' : 'bg-gradient-to-b from-obsidian-900/80 to-transparent')}>
      <div className='max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          <Link href='/' className='flex items-center gap-2.5 group'>
            <div className='w-8 h-8 rounded-sm bg-gold flex items-center justify-center shadow-lg group-hover:shadow-gold/40 transition-shadow'>
              <Film className='w-4 h-4 text-obsidian-900' strokeWidth={2.5} />
            </div>
            <span className='text-white font-bold text-xl tracking-tight'>
              Watch<span className='text-gold'>Free</span>Movies
            </span>
          </Link>

          <nav className='hidden md:flex items-center gap-1'>
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className={cn('px-4 py-2 text-sm font-medium rounded-sm transition-colors', pathname === href ? 'text-gold bg-gold/10' : 'text-white/70 hover:text-white hover:bg-white/5')}>
                {label}
              </Link>
            ))}
          </nav>

          <div className='flex items-center gap-2'>
            {searchOpen ? (
              <form onSubmit={handleSearch} className='flex items-center'>
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder='Search movies...' className='w-48 sm:w-64 bg-obsidian-700 text-white placeholder-white/40 text-sm px-4 py-2 rounded-l-sm border border-white/10 focus:outline-none focus:border-gold/50 transition-colors' />
                <button type='submit' className='bg-gold text-obsidian-900 px-3 py-2 rounded-r-sm hover:bg-gold-light transition-colors'><Search size={16} /></button>
                <button type='button' onClick={() => setSearchOpen(false)} className='ml-1 p-2 text-white/60 hover:text-white'><X size={16} /></button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} aria-label='Search' className='p-2.5 text-white/70 hover:text-white hover:bg-white/5 rounded-sm transition-colors'><Search size={18} /></button>
            )}
            <button className='md:hidden p-2.5 text-white/70 hover:text-white' onClick={() => setMenuOpen(!menuOpen)} aria-label='Menu'>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className='md:hidden bg-obsidian-900/98 backdrop-blur-md border-t border-white/5'>
          <nav className='max-w-screen-2xl mx-auto px-4 py-3 flex flex-col gap-1'>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm transition-colors', pathname === href ? 'text-gold bg-gold/10' : 'text-white/70 hover:text-white hover:bg-white/5')}>
                <Icon size={16} />{label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

export default function SearchBar({ initialQuery = '', placeholder = 'Search for movies...' }: { initialQuery?: string; placeholder?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className='w-full max-w-2xl mx-auto'>
      <div className='relative flex items-center'>
        <input
          type='search'
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className='w-full bg-obsidian-700 text-white placeholder-white/30 pl-5 pr-14 py-4 text-base rounded-sm border border-white/10 focus:outline-none focus:border-gold/50 transition-all'
        />
        <button type='submit' disabled={isPending} aria-label='Search' className='absolute right-0 h-full px-5 bg-gold text-obsidian-900 rounded-r-sm hover:bg-gold-light transition-colors disabled:opacity-70'>
          {isPending ? <Loader2 size={18} className='animate-spin' /> : <Search size={18} />}
        </button>
      </div>
    </form>
  );
}

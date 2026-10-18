'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className='min-h-screen bg-obsidian-900 flex items-center justify-center px-4'>
      <div className='text-center max-w-md'>
        <p className='text-red-400 text-sm uppercase tracking-widest mb-4'>Something went wrong</p>
        <h2 className='text-3xl font-bold text-white mb-4'>Unexpected Error</h2>
        <p className='text-white/50 mb-8'>{error.message ?? 'An unexpected error occurred. Please try again.'}</p>
        <button onClick={reset} className='bg-gold text-obsidian-900 font-bold px-8 py-3 rounded-sm hover:bg-gold-light transition-colors'>Try Again</button>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-obsidian-900 flex items-center justify-center px-4'>
      <div className='text-center max-w-lg'>
        <p className='text-gold text-sm font-semibold uppercase tracking-widest mb-4'>404 — Not Found</p>
        <h1 className='text-6xl md:text-8xl font-bold text-white mb-6'>Oops.</h1>
        <p className='text-white/50 text-lg mb-8'>The page you're looking for doesn't exist or was moved.</p>
        <Link href='/' className='inline-flex items-center gap-2 bg-gold text-obsidian-900 font-bold px-8 py-3.5 rounded-sm hover:bg-gold-light transition-colors'>Go Home</Link>
      </div>
    </div>
  );
}

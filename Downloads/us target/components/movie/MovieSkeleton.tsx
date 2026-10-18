export default function MovieSkeleton() {
  return (
    <div className='flex-shrink-0 w-40 md:w-48 animate-pulse'>
      <div className='aspect-[2/3] bg-obsidian-600 rounded-sm mb-3' />
      <div className='h-3 bg-obsidian-600 rounded w-4/5 mb-1.5' />
      <div className='h-3 bg-obsidian-600 rounded w-2/5' />
    </div>
  );
}

export function MovieGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='animate-pulse'>
          <div className='aspect-[2/3] bg-obsidian-600 rounded-sm mb-3' />
          <div className='h-3 bg-obsidian-600 rounded w-4/5 mb-1.5' />
          <div className='h-3 bg-obsidian-600 rounded w-2/5' />
        </div>
      ))}
    </div>
  );
}

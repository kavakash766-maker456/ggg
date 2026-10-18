import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StarRating({ rating, maxRating = 10, size = 'sm', className }: StarRatingProps) {
  const normalised = (rating / maxRating) * 5;
  const full = Math.floor(normalised);
  const partial = normalised - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  const sz = size === 'sm' ? 12 : 16;
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`Rating: ${rating.toFixed(1)} out of ${maxRating}`}>
      {Array.from({ length: full }).map((_, i) => <Star key={`f${i}`} size={sz} className='fill-gold text-gold' />)}
      {partial > 0 && <Star size={sz} className='text-gold' style={{ clipPath: `inset(0 ${100 - partial * 100}% 0 0)` }} />}
      {Array.from({ length: empty }).map((_, i) => <Star key={`e${i}`} size={sz} className='text-white/20' />)}
      <span className='ml-1 text-white/60 text-xs font-medium'>{rating.toFixed(1)}</span>
    </span>
  );
}

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'genre' | 'rating' | 'year' | 'status';
  className?: string;
}

export default function Badge({ children, variant = 'genre', className }: BadgeProps) {
  const variants = {
    genre: 'bg-white/10 text-white/80 border border-white/10',
    rating: 'bg-gold/20 text-gold border border-gold/30',
    year: 'bg-accent-blue/20 text-accent-blue border border-accent-blue/30',
    status: 'bg-green-500/20 text-green-400 border border-green-500/30'
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

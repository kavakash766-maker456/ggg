'use client';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
  const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm';
  const variants = {
    primary: 'bg-gold text-obsidian-900 hover:bg-gold-light focus:ring-gold shadow-lg hover:shadow-gold/30',
    secondary: 'bg-obsidian-600 text-white hover:bg-obsidian-500 focus:ring-white/30 border border-white/10',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5 focus:ring-white/20',
    outline: 'border border-gold/50 text-gold hover:bg-gold/10 focus:ring-gold/50'
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm gap-1.5', md: 'px-5 py-2.5 text-base gap-2', lg: 'px-8 py-3.5 text-lg gap-2.5' };
  return (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';
export default Button;

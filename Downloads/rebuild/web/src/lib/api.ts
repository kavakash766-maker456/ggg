import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const WHATSAPP_NUMBER = '94760372547';

/**
 * Build a WhatsApp deep link with a pre-encoded message.
 */
export function buildWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

/**
 * Return a human-readable quality label.
 */
export function formatQuality(q: string): string {
  const map: Record<string, string> = {
    '480p': '480p SD',
    '720p': '720p HD',
    '1080p': '1080p Full HD',
    '4K': '4K Ultra HD',
  };
  return map[q] ?? q;
}

/**
 * Utility: merge class names with Tailwind deduplication.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(...classes));
}

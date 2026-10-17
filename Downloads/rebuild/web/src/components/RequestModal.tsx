'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { buildWhatsAppLink } from '@/lib/api';

export interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tmdbUrl: string;
  type: 'movie' | 'tv' | 'game';
}

const QUALITY_OPTIONS = ['480p', '720p', '1080p', '4K'] as const;

export default function RequestModal({ isOpen, onClose, title, tmdbUrl, type }: RequestModalProps) {
  const [quality, setQuality] = useState<string>('1080p');
  const [token, setToken] = useState('');
  const [season, setSeason] = useState('1');
  const [partsStart, setPartsStart] = useState('1');
  const [partsEnd, setPartsEnd] = useState('4');
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function buildMessage(): string {
    if (type === 'movie') {
      return `!req ${tmdbUrl} | ${quality} | ${token}`;
    }
    if (type === 'tv') {
      return `!req_season ${tmdbUrl} | S${season} | ${quality} | ${token}`;
    }
    // game
    return `!req_game ${tmdbUrl} | Parts ${partsStart}-${partsEnd} | ${token}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const link = buildWhatsAppLink(buildMessage());
    window.open(link, '_blank', 'noopener,noreferrer');
    onClose();
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-[#F5C518]/30 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-white">
              Request Content
            </h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate max-w-[280px]">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Quality</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full rounded-lg bg-[#0a0a0a] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5C518] transition-colors"
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {/* Season — only for TV */}
          {type === 'tv' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Season Number</label>
              <input
                type="number"
                min="1"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-lg bg-[#0a0a0a] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5C518] transition-colors"
                placeholder="1"
                required
              />
            </div>
          )}

          {/* Part range — only for games */}
          {type === 'game' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Parts Start</label>
                <input
                  type="number"
                  min="1"
                  value={partsStart}
                  onChange={(e) => setPartsStart(e.target.value)}
                  className="w-full rounded-lg bg-[#0a0a0a] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5C518] transition-colors"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Parts End</label>
                <input
                  type="number"
                  min="1"
                  value={partsEnd}
                  onChange={(e) => setPartsEnd(e.target.value)}
                  className="w-full rounded-lg bg-[#0a0a0a] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5C518] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Access Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-lg bg-[#0a0a0a] border border-white/20 text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5C518] transition-colors"
              placeholder="Your access token"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Contact us on WhatsApp to get your token.</p>
          </div>

          {/* Command preview */}
          <div className="rounded-lg bg-[#0a0a0a] border border-white/10 p-3">
            <p className="text-xs text-gray-500 mb-1">Command preview</p>
            <code className="text-xs text-[#F5C518] break-all">{buildMessage()}</code>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#F5C518] hover:bg-[#d4a017] text-black font-bold py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.552 4.099 1.518 5.826L.057 23.57a.75.75 0 00.918.895l5.9-1.546A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.932 0-3.736-.524-5.283-1.432l-.38-.224-3.5.918.934-3.41-.247-.394A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
            Send via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

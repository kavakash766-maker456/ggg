import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb/endpoints';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().min(1).max(200),
  page: z.preprocess(
    (val) => (val === null || val === '' ? 1 : val),
    z.coerce.number().min(1).max(500).default(1)
  )
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { q, page } = querySchema.parse({ q: searchParams.get('q'), page: searchParams.get('page') });
    const data = await searchMovies(q, page);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

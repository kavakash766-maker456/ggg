import { NextRequest, NextResponse } from 'next/server';
import { getPopular, getTrending } from '@/lib/tmdb/endpoints';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['popular', 'trending']).default('popular'),
  page: z.preprocess(
    (val) => (val === null || val === '' ? 1 : val),
    z.coerce.number().min(1).max(500).default(1)
  )
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { type, page } = querySchema.parse({ type: searchParams.get('type'), page: searchParams.get('page') });
    const data = type === 'trending' ? await getTrending(page) : await getPopular(page);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}

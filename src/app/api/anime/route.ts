import { NextRequest, NextResponse } from "next/server";
import { getAnimeMovies, getAnimeSeries, searchAnime } from "@/lib/anime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "movies" | "series" | "all"
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "40", 10);
  const genre = searchParams.get("genre") || "All";

  if (q && q.trim()) {
    const results = await searchAnime(q);
    return NextResponse.json({
      anime: results,
      total: results.length,
      page: 1,
      totalPages: 1
    });
  }

  if (type === "series") {
    const data = await getAnimeSeries(limit, page, genre);
    return NextResponse.json({
      anime: data.items,
      total: data.total,
      page,
      totalPages: data.totalPages,
      limit
    });
  }

  // Default to movies / series
  const data = await getAnimeMovies(limit, page, genre);
  return NextResponse.json({
    anime: data.items,
    total: data.total,
    page,
    totalPages: data.totalPages,
    limit
  });
}

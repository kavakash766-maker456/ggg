import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/cinesubz";
import { searchSinhalaSub } from "@/lib/sinhalasub";
import { searchAnime } from "@/lib/anime";
import { searchCartoons } from "@/lib/cartoons";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const tab = searchParams.get("tab");

  if (!q || q.trim() === "") {
    return NextResponse.json({ results: [] });
  }

  if (tab === "anime") {
    const animeResults = await searchAnime(q);
    return NextResponse.json({ results: animeResults });
  }

  if (tab === "cartoons") {
    const cartoonResults = searchCartoons(q);
    return NextResponse.json({ results: cartoonResults });
  }

  // Multi-source concurrent search: CineSubz + SinhalaSub + Cartoons fallback
  const [csRes, shRes] = await Promise.allSettled([
    searchMovies(q),
    searchSinhalaSub(q),
  ]);

  const cinesubzItems = csRes.status === "fulfilled" ? csRes.value : [];
  const sinhalasubItems = shRes.status === "fulfilled" ? shRes.value : [];

  // Combine and deduplicate
  const seenTitles = new Set<string>();
  const combined = [];

  for (const item of cinesubzItems) {
    const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      combined.push(item);
    }
  }

  for (const item of sinhalasubItems) {
    const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      combined.push(item);
    }
  }

  // Also include matching Sinhala Cartoons
  const cartoonMatches = searchCartoons(q);
  for (const item of cartoonMatches) {
    const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seenTitles.has(norm)) {
      seenTitles.add(norm);
      combined.push(item);
    }
  }

  if (combined.length === 0) {
    const animeFallback = await searchAnime(q);
    combined.push(...animeFallback);
  }

  return NextResponse.json({ results: combined });
}

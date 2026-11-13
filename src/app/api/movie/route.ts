import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails } from "@/lib/cinesubz";
import { getSinhalaSubMovieDetails } from "@/lib/sinhalasub";
import { getBaiscopesDetailsById } from "@/lib/baiscopes";
import { getAnimeDetailsById } from "@/lib/anime";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing movie url" }, { status: 400 });
  }

  let details = null;

  if (url.includes("anime") || url.startsWith("anime-") || url.includes("animegg.org")) {
    details = await getAnimeDetailsById(url);
  } else if (url.includes("sinhalasub.lk")) {
    details = await getSinhalaSubMovieDetails(url);
  } else if (url.includes("baiscopes.lk")) {
    details = getBaiscopesDetailsById(url);
  } else {
    details = await getMovieDetails(url);
  }

  if (!details) {
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 404 });
  }

  return NextResponse.json({ movie: details });
}

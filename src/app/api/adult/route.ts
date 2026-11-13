import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface EpornerVideo {
  id: string;
  title: string;
  keywords?: string;
  views?: number;
  rate?: string;
  url: string;
  added?: string;
  length_sec?: number;
  length_min?: string;
  embed?: string;
  default_thumb?: {
    src: string;
    width?: number;
    height?: number;
  };
  thumbs?: Array<{
    src: string;
    width?: number;
    height?: number;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q") || "trending";
    const page = parseInt(searchParams.get("page") || "1", 10) || 1;
    const sort = searchParams.get("sort") || "views";
    const durationFilter = searchParams.get("duration") || "all"; // all | full (60m+) | medium (20-60m) | short (<20m)

    let cleanQuery = rawQuery.trim().toLowerCase();

    // Map categories & keywords
    if (cleanQuery === "trending") {
      cleanQuery = "popular";
    } else if (cleanQuery === "black" || cleanQuery === "ebony") {
      cleanQuery = "ebony";
    } else if (cleanQuery.includes("japanese full") || cleanQuery.includes("jav full")) {
      cleanQuery = "japanese full movie";
    }

    // Map UI sort keys to upstream API orders
    let order = "top-weekly";
    if (sort === "newest") order = "latest";
    else if (sort === "views" || sort === "popular") order = "top-weekly";
    else if (sort === "best" || sort === "rating") order = "top-rated";
    else if (sort === "longest" || durationFilter === "full") order = "longest";

    const apiUrl = `https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(
      cleanQuery
    )}&per_page=30&page=${page}&thumbsize=big&order=${order}`;

    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      next: { revalidate: 120 }, // 2 min cache
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream error status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    let rawList: EpornerVideo[] = data?.videos || [];

    // Optional duration filtering if requested
    if (durationFilter === "full") {
      // 60 minutes or longer (>= 3600 seconds)
      const filtered = rawList.filter((v) => (v.length_sec || 0) >= 3600);
      if (filtered.length >= 5) rawList = filtered;
    } else if (durationFilter === "medium") {
      // 20 - 60 minutes
      const filtered = rawList.filter((v) => (v.length_sec || 0) >= 1200 && (v.length_sec || 0) < 3600);
      if (filtered.length >= 5) rawList = filtered;
    } else if (durationFilter === "short") {
      // < 20 minutes
      const filtered = rawList.filter((v) => (v.length_sec || 0) < 1200);
      if (filtered.length >= 5) rawList = filtered;
    }

    const videos = rawList.map((v) => {
      const dur = v.length_sec || 0;
      let durFormatted = v.length_min || "00:00";

      // If duration is hours long, ensure format is H:MM:SS
      if (dur >= 3600) {
        const hours = Math.floor(dur / 3600);
        const mins = Math.floor((dur % 3600) / 60);
        const secs = dur % 60;
        durFormatted = `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }

      const thumbUrl = v.default_thumb?.src || (v.thumbs && v.thumbs[0]?.src) || "";
      const thumbsList = Array.isArray(v.thumbs) && v.thumbs.length > 0
        ? v.thumbs.map((t) => t.src)
        : [thumbUrl];

      const embedUrl = v.embed || `https://www.eporner.com/embed/${v.id}/`;

      return {
        id: v.id,
        title: v.title || "VIP 18+ Exclusive Video",
        url: v.url || "",
        embed: embedUrl,
        thumbnail: thumbUrl,
        previewThumb: thumbsList[1] || thumbUrl,
        thumbs: thumbsList,
        duration: dur,
        durationFormatted: durFormatted,
        views: v.views || 0,
        quality: "1080p FHD",
        rating: v.rate || "4.5",
        keywords: v.keywords || "",
      };
    });

    return NextResponse.json({
      success: true,
      query: rawQuery,
      page,
      sort,
      duration: durationFilter,
      total: data?.total_count || videos.length,
      totalPages: data?.total_pages || 1,
      videos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch adult catalog" },
      { status: 500 }
    );
  }
}

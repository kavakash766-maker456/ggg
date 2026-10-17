# FilmFeed Web Deployment

A Next.js 14 web application for FilmFeed 4K — stream movies, series, anime, and download PC games via WhatsApp requests.

## Deploy to Vercel

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel and it will auto-deploy on push to `main`.

## Environment Variables

Set the following environment variables in the Vercel dashboard under **Settings → Environment Variables**:

| Variable | Required | Description | Example |
|---|---|---|---|
| `NEXT_PUBLIC_TMDB_API_KEY` | ✅ Yes | TMDB API key for movie/series/anime data | `abc123def456...` |

### Getting a TMDB API Key

1. Create a free account at [https://www.themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API**
3. Request an API key (choose Developer)
4. Copy the **API Key (v3 auth)** value
5. Paste it as the value for `NEXT_PUBLIC_TMDB_API_KEY`

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_TMDB_API_KEY=your_key_here" > .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
  app/
    page.tsx          # Homepage with hero + content sections
    movies/page.tsx   # Movies grid
    series/page.tsx   # TV Series grid
    anime/page.tsx    # Anime grid
    games/page.tsx    # PC Games (static FitGirl list)
    request/page.tsx  # Request portal with WhatsApp integration
    layout.tsx        # Root layout with Navbar
    globals.css       # Global styles + Tailwind
  components/
    Navbar.tsx        # Responsive dark navbar
    MovieCard.tsx     # Reusable media card
    RequestModal.tsx  # WhatsApp request modal
  lib/
    tmdb.ts           # TMDB API wrapper
    api.ts            # Utility functions (WhatsApp link builder, cn)
```

## WhatsApp Request Commands

| Command | Format |
|---|---|
| Movie | `!req <url> \| <quality> \| <token>` |
| TV Season | `!req_season <url> \| S<season> \| <quality> \| <token>` |
| PC Game | `!req_game <fitgirl-url> \| Parts <start>-<end> \| <token>` |

Quality options: `480p`, `720p`, `1080p`, `4K`

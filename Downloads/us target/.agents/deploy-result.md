# Deploy Result

## Status
DEPLOYED

## Deployed URL
https://watchfreemovies-weld.vercel.app

## Changes Deployed
- Research-verified provider statuses (working/likely_working/uncertain/likely_down)
- Provider registry updated with status field and isActive flags
- AdBanner component updated with real Adsterra scripts
- AdScript component created for script injection
- Homepage updated with typed AdBanner placements (banner / banner2)
- Movie detail page updated with ad placements above player and after cast
- VideoPlayer updated with status dot indicators and warning banners

## Build Output
Route (app)                              Size     First Load JS
┌ ○ /                                    3.54 kB         103 kB
├ ○ /_not-found                          155 B          87.2 kB
├ ○ /about                               155 B          87.2 kB
├ ƒ /api/movies                          0 B                0 B
├ ○ /api/providers                       0 B                0 B
├ ƒ /api/search                          0 B                0 B
├ ○ /contact                             155 B          87.2 kB
├ ○ /genres                              175 B            94 kB
├ ƒ /genres/[slug]                       1.78 kB         102 kB
├ ƒ /movie/[slug]                        5.92 kB         106 kB
├ ƒ /movies                              1.78 kB         102 kB
├ ○ /privacy                             155 B          87.2 kB
├ ○ /robots.txt                          0 B                0 B
├ ƒ /search                              2.49 kB         102 kB
├ ○ /sitemap.xml                         0 B                0 B
├ ○ /terms                               155 B          87.2 kB
└ ○ /trending                            1.78 kB         102 kB
+ First Load JS shared by all            87.1 kB

Build: ✓ Compiled successfully
Types: ✓ Linting and checking validity of types
Pages: ✓ Generating static pages (17/17)
Vercel: ✓ Ready in 2m

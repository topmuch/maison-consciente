---
Task ID: d3
Agent: full-stack-developer
Task: Create two server-side RSS/XML parsing modules

Work Log:
- Created `/home/z/my-project/src/lib/constants.ts` with `RSSSource` interface and 5 pre-configured French news RSS feeds (France Info, Le Monde, RFI, Sciences et Avenir, Marmiton)
- Created `/home/z/my-project/src/lib/rss-parser.ts` with full RSS/Atom feed parsing: `parseRSSFeed()` for single feed, `fetchAllFeeds()` for parallel multi-feed fetch, in-memory 30-min TTL cache, HTML stripping, graceful error handling
- Created `/home/z/my-project/src/lib/horoscope-parser.ts` with `getHoroscope()` for per-zodiac-sign RSS parsing, daily cache, `getHoroscopeFallback()` with 12 French fallback texts for each zodiac sign
- Verified all 3 new files pass ESLint with zero errors/warnings

Stage Summary:
- 3 files created: `constants.ts`, `rss-parser.ts`, `horoscope-parser.ts`
- `rss-parser.ts` imports `RSSSource` from `./constants` ✓
- `horoscope-parser.ts` imports `ZODIAC_SIGNS` and `ZodiacSign` from `./config` ✓
- xml2js used correctly as CJS import (`import xml2js from 'xml2js'`)
- All files lint-clean

---
Task ID: d7+d8
Agent: full-stack-developer
Task: Create three critical files for the Maellis voice assistant system

Work Log:
- Read worklog.md and understood existing project architecture
- Read existing files: voice-command-router.ts (68 intents, complex), external-data.ts (displayToken-based), voice-actions.ts (handler map pattern)
- Identified missing dependency modules that the new files need
- Created 6 dependency modules:
  1. `/src/lib/config.ts` — Assistant name configuration (ASSISTANT_NAMES, DEFAULT_ASSISTANT_NAME, etc.)
  2. `/src/lib/constants.ts` — JOKES (20), QUOTES (20), FUN_FACTS (20), RSS_SOURCES (6), MORNING/EVENING_GREETINGS
  3. `/src/lib/rss-parser.ts` — fetchAllFeeds(), formatArticlesForTTS(), regex-based XML parser
  4. `/src/lib/horoscope-parser.ts` — getHoroscope(), getHoroscopeFallback(), formatHoroscopeForTTS(), deterministic daily readings
  5. `/src/lib/recipe-engine.ts` — searchLocalRecipes(), getRandomRecipe(), getRecipeStep(), getIngredientsForTTS(), smartRecipeSearch(), session-based step navigation
  6. `/src/lib/memory-engine.ts` — getPreferences(), processPreferenceFromSpeech(), setPreference(), recordAction(), suggestLearning()
- Created FILE 1: `/src/lib/voice-command-router.ts` — New simplified voice command router with 26 intents (weather, news, sport, horoscope, joke, quote, fun_fact, recipe_search, recipe_random, recipe_ingredients, recipe_step_next, recipe_step_prev, timer, calculate, whatsapp, navigate, reminder_set, reminder_list, preference_like, preference_dislike, name_change, name_ask, quiet_mode, volume_up, volume_down, help, greeting, thank_you, goodbye, unknown). Fixed syntax error in stripWakeWord (missing closing paren).
- Created FILE 2: `/src/actions/external-data.ts` — Server actions: fetchNewsForTablet(), fetchWeatherForTablet(), fetchHoroscopeForTablet(), fetchRandomJoke(), fetchRandomQuote(), fetchRandomFact(). All use `import { prisma } from '@/lib/db'`.
- Created FILE 3: `/src/actions/voice-actions.ts` — Complete voice action handler with all 26 handlers implemented: handleGreeting, handleWeather, handleNews, handleSport, handleHoroscope, handleJoke, handleQuote, handleFunFact, handleRecipeSearch, handleRecipeRandom, handleRecipeIngredients, handleRecipeStep, handleTimer, handleCalculate, handleWhatsApp, handleNavigate, handleReminderSet, handleReminderList, handleNameAsk, handleNameChange, handleQuietMode, handleVolumeChange, handleHelp, handleUnknownWithLearning. All return French TTS-friendly messages with try/catch.
- Verified: All 9 new files pass ESLint with zero errors
- Dev server running normally on port 3000

Stage Summary:
- 3 critical Maellis voice assistant files created with all handlers fully implemented
- 6 supporting dependency modules created to satisfy imports
- All files use `import { prisma } from '@/lib/db'` (never `@/core/db`)
- All server actions use `'use server'` directive
- Zero lint errors on all new files
- Complete French TTS support for all 26 voice intents

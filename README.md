# EntertainHub

A unified entertainment platform aggregating Games, Movies, and TV Series.

## Project Structure

```
/
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql
│   └── functions/
│       ├── fetch-games/
│       ├── fetch-movies-series/
│       ├── generate-wiki/
│       ├── generate-recommendations/
│       └── update-tracking/
├── src/
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── ContentCard.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── ContentDetail.tsx
│   │   ├── GameWiki.tsx
│   │   ├── ForYou.tsx
│   │   ├── Library.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   ├── store/
│   │   └── useStore.ts       # Zustand store
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server.ts                 # Express backend (simulates Edge Functions & DB for preview)
├── package.json
└── vite.config.ts
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# External APIs
RAWG_API_KEY=your_rawg_api_key
TMDB_API_KEY=your_tmdb_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Deployment

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Run the SQL migration located in `supabase/migrations/20240101000000_initial_schema.sql` in the Supabase SQL Editor.
3. Deploy the Edge Functions using the Supabase CLI:
   ```bash
   supabase functions deploy fetch-games
   supabase functions deploy fetch-movies-series
   supabase functions deploy generate-wiki
   supabase functions deploy generate-recommendations
   supabase functions deploy update-tracking
   ```
4. Set the secrets in Supabase:
   ```bash
   supabase secrets set RAWG_API_KEY=your_key TMDB_API_KEY=your_key OPENAI_API_KEY=your_key
   ```

### 2. Frontend Deployment (Blink.new / Vercel)
1. Push this repository to GitHub.
2. Import the project into Vercel or use Blink.new.
3. Set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables.
4. Deploy!

## Seed Script
To seed the database with sample content, you can run the provided `seed.ts` script (requires `tsx`):
```bash
npx tsx seed.ts
```

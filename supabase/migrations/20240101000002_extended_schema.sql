-- =========================
-- 1. USERS EXTENSION
-- =========================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamp default now()
);

-- Trigger to create profile automatically on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- User preferences (genres, moods, etc.)
create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  media_type text check (media_type in ('movie','series','game')),
  genres text[],
  created_at timestamp default now()
);

-- =========================
-- 2. UNIFIED MEDIA TABLE
-- =========================
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  external_id text unique, -- TMDB or RAWG ID (UNIQUE added for upserting)
  media_type text check (media_type in ('movie','series','game')),
  title text not null,
  description text,
  poster_url text,
  backdrop_url text,
  release_date date,
  genres text[],
  rating_global numeric,
  source text, -- tmdb / rawg
  created_at timestamp default now()
);

create index if not exists idx_media_type on media(media_type);
create index if not exists idx_media_title on media(title);

-- =========================
-- 3. USER LIBRARY (CORE FEATURE)
-- =========================
create table if not exists user_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,

  status text check (
    status in ('planned','watching','completed','dropped','on_hold','replay')
  ),

  rating integer check (rating between 1 and 5),
  notes text,

  added_at timestamp default now(),
  updated_at timestamp default now(),
  
  unique(user_id, media_id) -- Ensure a user can only have one entry per media
);

create index if not exists idx_library_user on user_library(user_id);
create index if not exists idx_library_status on user_library(status);

-- =========================
-- 4. PROGRESS TRACKING
-- =========================

-- For series episodes tracking
create table if not exists episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,

  season_number int,
  episode_number int,

  watched boolean default false,
  watched_at timestamp
);

-- For games progress
create table if not exists game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,

  progress_percent int check (progress_percent between 0 and 100),
  hours_played numeric,
  last_played timestamp
);

-- =========================
-- 5. REVIEWS SYSTEM (SOCIAL LAYER BASE)
-- =========================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  media_id uuid references media(id) on delete cascade,

  rating int check (rating between 1 and 5),
  review_text text,

  likes_count int default 0,
  created_at timestamp default now()
);

-- =========================
-- 6. RECOMMENDATION CACHE (AI / ENGINE OUTPUT)
-- =========================
create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,

  media_id uuid references media(id) on delete cascade,
  score numeric,

  reason text, -- "Because you watched..."
  created_at timestamp default now()
);

-- =========================
-- 7. USER ACTIVITY FEED (FOR FUTURE SOCIAL LAYER)
-- =========================
create table if not exists activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,

  action text, 
  -- watched, completed, rated, reviewed

  media_id uuid references media(id) on delete cascade,

  metadata jsonb,
  created_at timestamp default now()
);

-- =========================
-- 8. ROW LEVEL SECURITY (RLS)
-- =========================

alter table profiles enable row level security;
alter table user_preferences enable row level security;
alter table media enable row level security;
alter table user_library enable row level security;
alter table episode_progress enable row level security;
alter table game_progress enable row level security;
alter table reviews enable row level security;
alter table recommendations enable row level security;
alter table activity_feed enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- User Preferences
create policy "Users can view own preferences." on user_preferences for select using (auth.uid() = user_id);
create policy "Users can insert own preferences." on user_preferences for insert with check (auth.uid() = user_id);
create policy "Users can update own preferences." on user_preferences for update using (auth.uid() = user_id);

-- Media (Global, anyone can read, authenticated can insert/update)
create policy "Media is viewable by everyone." on media for select using (true);
create policy "Authenticated users can insert media." on media for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update media." on media for update using (auth.role() = 'authenticated');

-- User Library
create policy "Users can view own library." on user_library for select using (auth.uid() = user_id);
create policy "Users can insert own library." on user_library for insert with check (auth.uid() = user_id);
create policy "Users can update own library." on user_library for update using (auth.uid() = user_id);
create policy "Users can delete own library." on user_library for delete using (auth.uid() = user_id);

-- Reviews
create policy "Reviews are viewable by everyone." on reviews for select using (true);
create policy "Users can insert own reviews." on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews." on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews." on reviews for delete using (auth.uid() = user_id);

--
-- migration: 20251008100000_initial_schema
--
-- description:
--   - sets up the initial database schema for 10xcards.
--   - creates tables for decks, flashcards, generations, and generation_errors.
--   - establishes relationships between tables.
--   - adds indexes for performance optimization.
--   - implements a trigger to automatically update 'updated_at' timestamps.
--   - configures row-level security (rls) policies to protect user data.
--
-- author: gemini 2.5 pro
--

-- section: types
-- description: defines custom data types (enums) used throughout the schema.

create type public.flashcard_creation_type as enum ('manual', 'generated');

-- section: tables
-- description: defines the table structures for the application.

-- table: decks
-- description: stores user-created flashcard decks.
create table public.decks (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    name character varying(100) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    foreign key (user_id) references auth.users(id) on delete cascade
);
comment on table public.decks is 'stores user-created flashcard decks.';

-- table: generations
-- description: stores metrics for each ai flashcard generation event.
create table public.generations (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    deck_id uuid not null,
    duration_ms integer not null,
    generated_cards_count integer not null,
    accepted_cards_count integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    foreign key (user_id) references auth.users(id) on delete cascade,
    foreign key (deck_id) references public.decks(id) on delete cascade
);
comment on table public.generations is 'stores metrics for each ai flashcard generation event.';

-- table: generation_errors
-- description: logs errors that occur during the ai flashcard generation process.
create table public.generation_errors (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    deck_id uuid,
    error_message text not null,
    created_at timestamptz not null default now(),
    primary key (id),
    foreign key (user_id) references auth.users(id) on delete cascade,
    foreign key (deck_id) references public.decks(id) on delete set null
);
comment on table public.generation_errors is 'logs errors that occur during the ai flashcard generation process.';

-- table: flashcards
-- description: stores individual flashcards with front and back content.
create table public.flashcards (
    id uuid not null default gen_random_uuid(),
    deck_id uuid not null,
    generation_id uuid,
    creation_type public.flashcard_creation_type not null,
    front character varying(200) not null,
    back character varying(500) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (id),
    foreign key (deck_id) references public.decks(id) on delete cascade,
    foreign key (generation_id) references public.generations(id) on delete set null
);
comment on table public.flashcards is 'stores individual flashcards with front and back content.';


-- section: triggers
-- description: defines triggers to automate database operations.

-- function: update_updated_at_column
-- description: automatically updates the 'updated_at' timestamp on row modification.
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language 'plpgsql';

-- trigger: set_updated_at_decks
create trigger set_updated_at_decks
before update on public.decks
for each row
execute procedure public.update_updated_at_column();

-- trigger: set_updated_at_generations
create trigger set_updated_at_generations
before update on public.generations
for each row
execute procedure public.update_updated_at_column();

-- trigger: set_updated_at_flashcards
create trigger set_updated_at_flashcards
before update on public.flashcards
for each row
execute procedure public.update_updated_at_column();


-- section: indexes
-- description: creates indexes on foreign key columns to optimize query performance.

create index idx_decks_user_id on public.decks(user_id);
create index idx_generations_user_id on public.generations(user_id);
create index idx_generations_deck_id on public.generations(deck_id);
create index idx_generation_errors_user_id on public.generation_errors(user_id);
create index idx_flashcards_deck_id on public.flashcards(deck_id);
create index idx_flashcards_generation_id on public.flashcards(generation_id);


-- section: row level security (rls)
-- description: enables row-level security and defines policies for data access control.

-- enable rls for all tables
alter table public.decks enable row level security;
alter table public.generations enable row level security;
alter table public.generation_errors enable row level security;
alter table public.flashcards enable row level security;

-- policies for: decks
-- description: users can only manage their own decks.
-- select: authenticated users can view their own decks.
create policy "authenticated users can view their own decks" on public.decks for select to authenticated using (auth.uid() = user_id);
-- insert: authenticated users can create decks.
create policy "authenticated users can create decks" on public.decks for insert to authenticated with check (auth.uid() = user_id);
-- update: authenticated users can update their own decks.
create policy "authenticated users can update their own decks" on public.decks for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- delete: authenticated users can delete their own decks.
create policy "authenticated users can delete their own decks" on public.decks for delete to authenticated using (auth.uid() = user_id);
-- anon: anonymous users are denied all access to decks.
create policy "anon users cannot access decks" on public.decks for all to anon using (false) with check (false);

-- policies for: generations
-- description: users can only manage their own generation events.
-- select: authenticated users can view their own generation events.
create policy "authenticated users can view their own generation events" on public.generations for select to authenticated using (auth.uid() = user_id);
-- insert: authenticated users can create generation events.
create policy "authenticated users can create generation events" on public.generations for insert to authenticated with check (auth.uid() = user_id);
-- update: authenticated users can update their own generation events.
create policy "authenticated users can update their own generation events" on public.generations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- delete: authenticated users can delete their own generation events.
create policy "authenticated users can delete their own generation events" on public.generations for delete to authenticated using (auth.uid() = user_id);
-- anon: anonymous users are denied all access to generations.
create policy "anon users cannot access generations" on public.generations for all to anon using (false) with check (false);


-- policies for: generation_errors
-- description: users can only view and log their own generation errors. update and delete are disallowed.
-- select: authenticated users can view their own errors.
create policy "authenticated users can view their own generation errors" on public.generation_errors for select to authenticated using (auth.uid() = user_id);
-- insert: authenticated users can log their own errors.
create policy "authenticated users can log their own generation errors" on public.generation_errors for insert to authenticated with check (auth.uid() = user_id);
-- update: no one can update error logs.
create policy "users cannot update generation errors" on public.generation_errors for update using (false) with check (false);
-- delete: no one can delete error logs.
create policy "users cannot delete generation errors" on public.generation_errors for delete using (false);
-- anon: anonymous users are denied all access to generation_errors.
create policy "anon users cannot access generation_errors" on public.generation_errors for all to anon using (false) with check (false);

-- policies for: flashcards
-- description: users can only manage flashcards that belong to decks they own.
-- select: authenticated users can view flashcards in their own decks.
create policy "authenticated users can view flashcards in their own decks" on public.flashcards for select to authenticated using (
  exists (
    select 1 from public.decks
    where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
  )
);
-- insert: authenticated users can create flashcards in their own decks.
create policy "authenticated users can create flashcards in their own decks" on public.flashcards for insert to authenticated with check (
  exists (
    select 1 from public.decks
    where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
  )
);
-- update: authenticated users can update flashcards in their own decks.
create policy "authenticated users can update flashcards in their own decks" on public.flashcards for update to authenticated using (
  exists (
    select 1 from public.decks
    where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.decks
    where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
  )
);
-- delete: authenticated users can delete flashcards in their own decks.
create policy "authenticated users can delete flashcards in their own decks" on public.flashcards for delete to authenticated using (
  exists (
    select 1 from public.decks
    where decks.id = flashcards.deck_id and decks.user_id = auth.uid()
  )
);
-- anon: anonymous users are denied all access to flashcards.
create policy "anon users cannot access flashcards" on public.flashcards for all to anon using (false) with check (false);

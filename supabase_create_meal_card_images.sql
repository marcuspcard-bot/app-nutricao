create table if not exists public.meal_card_images (
  key text primary key,
  label text,
  image_url text not null,
  active boolean not null default true,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists meal_card_images_active_idx
  on public.meal_card_images (active);

alter table public.meal_card_images enable row level security;

drop policy if exists "meal card images are readable by authenticated users" on public.meal_card_images;
create policy "meal card images are readable by authenticated users"
on public.meal_card_images
for select
to authenticated
using (active = true);


</*update public.meal_card_images
set image_url = 'https://novo-link.jpg',
    updated_at = timezone('utc', now())
where key = 'almoco';>

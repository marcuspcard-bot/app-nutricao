insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do nothing;

create policy "community images are public to authenticated users"
on storage.objects
for select
to authenticated
using (bucket_id = 'community-images');

create policy "users can upload their own community images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can update their own community images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users can delete their own community images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'community-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

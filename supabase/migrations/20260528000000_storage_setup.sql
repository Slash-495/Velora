-- Migration: Set up Supabase Storage for Resume Photos

-- 1. Create a new storage bucket called 'resume-photos'
insert into storage.buckets (id, name, public)
values ('resume-photos', 'resume-photos', true);

-- 2. RLS Policies for the bucket

-- Allow public access to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'resume-photos' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload photos"
on storage.objects for insert
with check (
  bucket_id = 'resume-photos'
  and auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded images
create policy "Users can update their own photos"
on storage.objects for update
using (
  bucket_id = 'resume-photos'
  and auth.uid() = owner
);

-- Allow users to delete their own uploaded images
create policy "Users can delete their own photos"
on storage.objects for delete
using (
  bucket_id = 'resume-photos'
  and auth.uid() = owner
);

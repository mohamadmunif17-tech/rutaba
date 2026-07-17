-- =========================================================
-- SKEMA DATABASE — RUTABA SHOHIBUL QUR'AN (Rumah Tahfidz Balita)
-- Jalankan seluruh script ini di Supabase: Project > SQL Editor > New query
-- =========================================================

-- Tabel induk: rencana hafalan tiap santri
create table if not exists plans (
  id            text primary key,          -- slug dari nama, cth: ahmad-fauzan
  name          text not null,
  kelas         text default 'Umum',        -- nama kelas/kelompok
  start_date    date not null,
  daily_target  integer not null default 5, -- target ayat per hari
  start_juz     integer not null,
  start_surah   integer not null,
  start_ayat    integer not null,
  libur_days    integer[] not null default '{}', -- 0=Ahad ... 6=Sabtu
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Tabel capaian harian: satu baris = satu tanggal yang sudah ditandai selesai
create table if not exists progress (
  santri_id  text not null references plans(id) on delete cascade,
  date       date not null,
  created_at timestamptz default now(),
  primary key (santri_id, date)
);

-- Tabel catatan perkembangan bulanan (akademik ringkas + non-akademik)
create table if not exists monthly_notes (
  santri_id   text not null references plans(id) on delete cascade,
  year        integer not null,
  month       integer not null,           -- 1-12
  kehadiran   text default '',
  akhlak      text default '',
  sosial      text default '',
  motorik     text default '',
  catatan     text default '',
  updated_at  timestamptz default now(),
  primary key (santri_id, year, month)
);

-- =========================================================
-- ROW LEVEL SECURITY
-- Catatan: untuk kesederhanaan (dipakai internal ustadzah/wali santri lewat
-- satu link bersama, tanpa sistem login), RLS dibuat terbuka untuk baca & tulis
-- memakai anon key. Ini CUKUP untuk penggunaan internal terbatas, TAPI siapa
-- pun yang punya link bisa mengubah data. Kalau ke depan butuh proteksi lebih
-- (misal ustadzah pakai password, wali santri hanya boleh baca), beri tahu
-- saya — perlu ditambahkan Supabase Auth + kebijakan RLS yang lebih ketat.
-- =========================================================
alter table plans enable row level security;
alter table progress enable row level security;
alter table monthly_notes enable row level security;

create policy "public read plans" on plans for select using (true);
create policy "public write plans" on plans for insert with check (true);
create policy "public update plans" on plans for update using (true);
create policy "public delete plans" on plans for delete using (true);

create policy "public read progress" on progress for select using (true);
create policy "public write progress" on progress for insert with check (true);
create policy "public delete progress" on progress for delete using (true);

create policy "public read notes" on monthly_notes for select using (true);
create policy "public write notes" on monthly_notes for insert with check (true);
create policy "public update notes" on monthly_notes for update using (true);

# Rihlah Hafalan — RUTABA SHOHIBUL QUR'AN

Aplikasi penjadwalan & pemantauan target hafalan dengan urutan juz custom
(30→29→28→27→26, lalu 1→25), dilengkapi 4 tampilan (Ustadzah, Santri, Wali
Santri, Laporan/Leaderboard) dan laporan bulanan PDF.

## 1. Di mana "data induk" tersimpan?

Semua data induk (daftar santri, target hafalan, capaian harian, catatan
bulanan) disimpan di **database Supabase** (Postgres) milik Anda sendiri —
BUKAN di server Anthropic/Claude. Struktur tabelnya ada di `supabase/schema.sql`:

- `plans` — data rencana hafalan tiap santri (nama, kelas, target, titik mulai, dst.)
- `progress` — tanggal-tanggal yang sudah ditandai selesai
- `monthly_notes` — catatan akademik ringkas & non-akademik per bulan (untuk laporan PDF)

Anda 100% memegang kendali datanya (bisa dibuka langsung lewat dashboard
Supabase, diekspor, di-backup, dsb).

## 2. Setup Supabase (gratis)

1. Buat akun di https://supabase.com dan buat **New Project**.
2. Buka **SQL Editor** → **New query** → tempel seluruh isi file
   `supabase/schema.sql` → klik **Run**.
3. Buka **Project Settings → API**, catat:
   - `Project URL`
   - `anon public` key

> ⚠️ Catatan keamanan: skema ini membuat data bisa dibaca & ditulis oleh siapa
> pun yang memegang link aplikasi (tanpa login), supaya sederhana dipakai
> ustadzah/santri/wali santri. Kalau ke depan butuh proteksi lebih (misal
> ustadzah pakai password, wali santri read-only sungguhan), beri tahu saya —
> perlu ditambahkan Supabase Auth + kebijakan RLS yang lebih ketat.

## 3. Jalankan lokal (opsional, untuk dicoba dulu)

```bash
npm install
cp .env.local.example .env.local
# lalu isi .env.local dengan URL & anon key dari langkah 2
npm run dev
```

Buka http://localhost:3000

## 4. Deploy ke Vercel

**Opsi A — lewat GitHub (direkomendasikan):**
1. Push folder project ini ke repo GitHub baru.
2. Buka https://vercel.com → **Add New Project** → pilih repo tersebut.
3. Saat konfigurasi, isi **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_LEMBAGA_NAME` = `RUTABA SHOHIBUL QUR'AN`
   - `NEXT_PUBLIC_LEMBAGA_SUBTITLE` = `Rumah Tahfidz Balita`
4. Klik **Deploy**. Selesai — Anda dapat URL seperti `rutaba-hafalan.vercel.app`.

**Opsi B — lewat Vercel CLI (tanpa GitHub):**
```bash
npm install -g vercel
cd rutaba-hafalan
vercel
# ikuti instruksi login & konfirmasi project
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_LEMBAGA_NAME
vercel env add NEXT_PUBLIC_LEMBAGA_SUBTITLE
vercel --prod
```

## 5. Fitur yang tersedia

- **Ustadzah**: buat/edit rencana hafalan per santri (nama, kelas, tanggal
  mulai, target ayat/hari, titik mulai juz-surat-ayat, libur mingguan),
  hapus santri, buat **laporan bulanan PDF** (akademik + non-akademik).
- **Santri**: lihat jadwal harian, tandai target harian sebagai selesai.
- **Wali Santri**: pantau progres & jadwal (read-only).
- **Laporan**: leaderboard dengan filter **kelas** dan **periode**
  (keseluruhan / bulan ini), diurutkan berdasarkan ayat dihafal, %
  konsistensi, atau runtutan hari (streak).

## 6. Keterbatasan yang perlu diketahui

- Target hafalan berbasis **jumlah ayat**, bukan baris — karena data posisi
  ayat per baris cetakan mushaf tidak tersedia secara terbuka/API. Data juz
  & ayat yang dipakai sudah divalidasi sesuai standar Mushaf Madinah (6.236
  ayat, 30 juz).
- Belum ada notifikasi WhatsApp otomatis (perlu integrasi WhatsApp Business
  API/pihak ketiga terpisah — beri tahu saya kalau ingin dilanjutkan).
- Belum ada sistem login/role sungguhan — siapa pun dengan link bisa
  mengedit data (lihat catatan keamanan di bagian 2).


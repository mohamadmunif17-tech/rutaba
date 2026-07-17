import { supabase } from "./supabaseClient";
import { slugify } from "./quranData";

export async function listPlans() {
  const { data, error } = await supabase.from("plans").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function savePlan(plan, existingId) {
  const id = existingId || slugify(plan.name) || ("santri-" + Date.now());
  const row = {
    id,
    name: plan.name,
    kelas: plan.kelas || "Umum",
    start_date: plan.startDate,
    daily_target: plan.dailyTarget,
    start_juz: plan.startJuz,
    start_surah: plan.startSurah,
    start_ayat: plan.startAyat,
    libur_days: plan.liburDays,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("plans").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return id;
}

export async function deletePlan(id) {
  await supabase.from("progress").delete().eq("santri_id", id);
  await supabase.from("monthly_notes").delete().eq("santri_id", id);
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) throw error;
}

export async function listProgress(santriId) {
  const { data, error } = await supabase.from("progress").select("date").eq("santri_id", santriId);
  if (error) throw error;
  return (data || []).map(r => r.date);
}

export async function toggleProgress(santriId, dateIso, markDone) {
  if (markDone) {
    const { error } = await supabase.from("progress").upsert({ santri_id: santriId, date: dateIso }, { onConflict: "santri_id,date" });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("progress").delete().eq("santri_id", santriId).eq("date", dateIso);
    if (error) throw error;
  }
}

export async function getMonthlyNote(santriId, year, month) {
  const { data, error } = await supabase.from("monthly_notes").select("*")
    .eq("santri_id", santriId).eq("year", year).eq("month", month).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveMonthlyNote(santriId, year, month, fields) {
  const row = { santri_id: santriId, year, month, ...fields, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("monthly_notes").upsert(row, { onConflict: "santri_id,year,month" });
  if (error) throw error;
}

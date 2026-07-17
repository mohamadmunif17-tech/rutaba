"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  BookOpen, Users, Eye, Plus, Check, Trash2, Loader2, AlertCircle,
  Trophy, Medal, FileDown, X
} from "lucide-react";
import {
  CUSTOM_ORDER, DAY_NAMES, MONTH_NAMES,
  surahsInJuz, ayahRangeInJuzSurah, fmtDate, fmtDateHuman,
  generateSchedule, computeStreak,
} from "../lib/quranData";
import {
  listPlans, savePlan, deletePlan, listProgress, toggleProgress,
  getMonthlyNote, saveMonthlyNote,
} from "../lib/dataStore";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { generateMonthlyReportPdf } from "../lib/pdfReport";

const LEMBAGA_NAME = process.env.NEXT_PUBLIC_LEMBAGA_NAME || "RUTABA SHOHIBUL QUR'AN";
const LEMBAGA_SUBTITLE = process.env.NEXT_PUBLIC_LEMBAGA_SUBTITLE || "Rumah Tahfidz Balita";

const inputStyle = {
  width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #D8CFB6",
  background: "#FFFDF8", fontSize: 14, fontFamily: "Inter", color: "#23201B", outline: "none",
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#5C5647", marginBottom: 5, letterSpacing: .3, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function Tab({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className="rh-btn"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
        border: "none", cursor: "pointer", fontFamily: "Inter", fontWeight: 600, fontSize: 14,
        borderBottom: active ? "3px solid #B8863B" : "3px solid transparent",
        color: active ? "#16324F" : "#8A8272", background: "transparent",
      }}>
      <Icon size={16} /> {label}
    </button>
  );
}

/* ============================================================ JALUR JUZ ============================================================ */
function JalurJuz({ activeJuzSet, todayJuz }) {
  return (
    <div style={{ overflowX: "auto", padding: "14px 4px" }} className="rh-scroll">
      <div style={{ display: "flex", alignItems: "center", minWidth: CUSTOM_ORDER.length * 34 }}>
        {CUSTOM_ORDER.map((j, i) => {
          const isToday = j === todayJuz;
          return (
            <React.Fragment key={j}>
              <div className="rh-station" title={`Juz ${j}`}
                style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, fontFamily: "IBM Plex Mono",
                  background: isToday ? "#B8863B" : activeJuzSet.has(j) ? "#16324F" : "#E4DBC3",
                  color: isToday || activeJuzSet.has(j) ? "#FFFDF8" : "#8A8272",
                  boxShadow: isToday ? "0 0 0 4px #B8863B33" : "none",
                }}>{j}</div>
              {i < CUSTOM_ORDER.length - 1 && (
                <div style={{ width: 6, height: 2, background: activeJuzSet.has(j) ? "#B8863B" : "#D8CFB6", flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ FORM RENCANA ============================================================ */
function PlanForm({ initial, onSave, onCancel, saving, existingKelas }) {
  const [name, setName] = useState(initial?.name || "");
  const [kelas, setKelas] = useState(initial?.kelas || (existingKelas[0] || "Umum"));
  const [kelasCustom, setKelasCustom] = useState("");
  const [startDate, setStartDate] = useState(initial?.start_date || fmtDate(new Date()));
  const [dailyTarget, setDailyTarget] = useState(initial?.daily_target || 5);
  const [startJuz, setStartJuz] = useState(initial?.start_juz || 30);
  const [startSurah, setStartSurah] = useState(initial?.start_surah || 78);
  const [startAyat, setStartAyat] = useState(initial?.start_ayat || 1);
  const [liburDays, setLiburDays] = useState(initial?.libur_days || [5]);
  const [error, setError] = useState("");

  const suratOptions = useMemo(() => surahsInJuz(startJuz), [startJuz]);
  const ayatOptions = useMemo(() => ayahRangeInJuzSurah(startJuz, startSurah), [startJuz, startSurah]);

  useEffect(() => {
    if (!suratOptions.find(s => s.no === startSurah) && suratOptions.length) setStartSurah(suratOptions[0].no);
  }, [startJuz]); // eslint-disable-line
  useEffect(() => {
    if (ayatOptions.length && !ayatOptions.includes(startAyat)) setStartAyat(ayatOptions[0]);
  }, [startSurah, startJuz]); // eslint-disable-line

  function toggleLibur(dow) {
    setLiburDays(prev => {
      if (prev.includes(dow)) return prev.filter(d => d !== dow);
      if (prev.length >= 2) return prev;
      return [...prev, dow];
    });
  }

  function handleSubmit() {
    if (!name.trim()) { setError("Nama santri wajib diisi."); return; }
    if (!dailyTarget || dailyTarget < 1) { setError("Target ayat per hari minimal 1."); return; }
    const finalKelas = kelas === "__custom__" ? kelasCustom.trim() : kelas;
    if (!finalKelas) { setError("Nama kelas wajib diisi."); return; }
    setError("");
    onSave({ name: name.trim(), kelas: finalKelas, startDate, dailyTarget: Number(dailyTarget), startJuz, startSurah, startAyat, liburDays });
  }

  return (
    <div style={{ background: "#FFFDF8", border: "1px solid #E4DBC3", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Nama Santri">
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="cth. Ahmad Fauzan" />
        </Field>
        <Field label="Kelas">
          <select style={inputStyle} value={kelas} onChange={e => setKelas(e.target.value)}>
            {existingKelas.map(k => <option key={k} value={k}>{k}</option>)}
            <option value="__custom__">+ Kelas baru...</option>
          </select>
          {kelas === "__custom__" && (
            <input style={{ ...inputStyle, marginTop: 8 }} value={kelasCustom} onChange={e => setKelasCustom(e.target.value)} placeholder="Nama kelas baru" />
          )}
        </Field>
        <Field label="Tanggal Mulai">
          <input type="date" style={inputStyle} value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="Target Ayat / Hari">
          <input type="number" min={1} style={inputStyle} value={dailyTarget} onChange={e => setDailyTarget(e.target.value)} />
        </Field>
        <Field label="Mulai Juz (urutan program)">
          <select style={inputStyle} value={startJuz} onChange={e => setStartJuz(Number(e.target.value))}>
            {CUSTOM_ORDER.map((j, idx) => <option key={j} value={j}>Urutan #{idx + 1} — Juz {j}</option>)}
          </select>
        </Field>
        <Field label="Mulai Surat">
          <select style={inputStyle} value={startSurah} onChange={e => setStartSurah(Number(e.target.value))}>
            {suratOptions.map(s => <option key={s.no} value={s.no}>{s.no}. {s.name}</option>)}
          </select>
        </Field>
        <Field label="Mulai Ayat">
          <select style={inputStyle} value={startAyat} onChange={e => setStartAyat(Number(e.target.value))}>
            {ayatOptions.map(a => <option key={a} value={a}>Ayat {a}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Libur Mingguan (pilih maks. 2 hari)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DAY_NAMES.map((d, dow) => (
            <button key={dow} onClick={() => toggleLibur(dow)} className="rh-btn"
              style={{
                padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                border: liburDays.includes(dow) ? "1px solid #16324F" : "1px solid #D8CFB6",
                background: liburDays.includes(dow) ? "#16324F" : "#FFFDF8",
                color: liburDays.includes(dow) ? "#FFFDF8" : "#5C5647", fontWeight: 500,
              }}>{d}</button>
          ))}
        </div>
      </Field>
      {error && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#9B4444", fontSize: 13, marginBottom: 10 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSubmit} disabled={saving} className="rh-btn"
          style={{
            padding: "11px 20px", borderRadius: 9, border: "none", cursor: "pointer",
            background: "#B8863B", color: "#FFFDF8", fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1,
          }}>
          {saving ? <Loader2 size={16} className="rh-spin" /> : <Check size={16} />}
          {initial ? "Simpan Perubahan" : "Buat Rencana Hafalan"}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="rh-btn"
            style={{ padding: "11px 16px", borderRadius: 9, border: "1px solid #D8CFB6", background: "#FFFDF8", color: "#5C5647", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================ JADWAL ============================================================ */
function ScheduleView({ schedule, completedDates, onMarkDone, editable }) {
  const todayIso = fmtDate(new Date());
  const doneSet = useMemo(() => new Set(completedDates), [completedDates]);
  const activeJuzSet = useMemo(() => {
    const s = new Set();
    for (const day of schedule.schedule) {
      if (day.date > todayIso) break;
      day.segments.forEach(seg => s.add(seg.juz));
    }
    return s;
  }, [schedule, todayIso]);
  const todayEntry = schedule.schedule.find(d => d.date === todayIso);
  const todayJuz = todayEntry?.segments?.[0]?.juz;
  const doneCount = schedule.schedule.filter(d => !d.libur && doneSet.has(d.date)).length;
  const totalTargetDays = schedule.schedule.filter(d => !d.libur).length;
  const pct = totalTargetDays ? Math.round((doneCount / totalTargetDays) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ flex: "1 1 220px", background: "#16324F", borderRadius: 14, padding: "16px 18px", color: "#FFFDF8" }}>
          <div style={{ fontSize: 12, opacity: .75, fontWeight: 600, letterSpacing: .4, textTransform: "uppercase" }}>Progres</div>
          <div className="rh-display" style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{pct}%</div>
          <div style={{ fontSize: 12, opacity: .8, marginTop: 2 }}>{doneCount} dari {totalTargetDays} hari target tercapai</div>
        </div>
        <div style={{ flex: "1 1 220px", background: "#FFFDF8", border: "1px solid #E4DBC3", borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ fontSize: 12, color: "#8A8272", fontWeight: 600, letterSpacing: .4, textTransform: "uppercase" }}>Estimasi Khatam</div>
          <div className="rh-display" style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: "#16324F" }}>
            {schedule.completed ? fmtDateHuman(schedule.schedule[schedule.schedule.length - 1]?.date) : "> 1 tahun"}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#5C5647", letterSpacing: .4, textTransform: "uppercase" }}>
        Jalur Hafalan (urutan: 30→29→28→27→26, lalu 1→25)
      </div>
      <div style={{ background: "#FFFDF8", border: "1px solid #E4DBC3", borderRadius: 14 }}>
        <JalurJuz activeJuzSet={activeJuzSet} todayJuz={todayJuz} />
      </div>

      <div style={{ marginTop: 18, marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#5C5647", letterSpacing: .4, textTransform: "uppercase" }}>
        Jadwal Harian
      </div>
      <div className="rh-scroll" style={{ maxHeight: 420, overflowY: "auto", border: "1px solid #E4DBC3", borderRadius: 14, background: "#FFFDF8" }}>
        {schedule.schedule.map((day, i) => {
          const isToday = day.date === todayIso;
          const isDone = doneSet.has(day.date);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderBottom: i < schedule.schedule.length - 1 ? "1px solid #EFEAE0" : "none",
              background: isToday ? "#B8863B14" : "transparent",
            }}>
              <div className="rh-mono" style={{ width: 118, flexShrink: 0, fontSize: 12, color: isToday ? "#B8863B" : "#8A8272", fontWeight: isToday ? 700 : 500 }}>
                {new Date(day.date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                {isToday && <div style={{ fontSize: 10, fontWeight: 700 }}>HARI INI</div>}
              </div>
              <div style={{ flex: 1, fontSize: 14 }}>
                {day.libur ? (
                  <span style={{ color: "#9B4444", fontStyle: "italic" }}>Libur ({DAY_NAMES[new Date(day.date + "T00:00:00").getDay()]})</span>
                ) : (
                  <span>
                    {day.segments.map((seg, si) => (
                      <span key={si} style={{ marginRight: 10 }}>
                        <b>{seg.name}</b>: {seg.ayahFrom === seg.ayahTo ? `ayat ${seg.ayahFrom}` : `ayat ${seg.ayahFrom}-${seg.ayahTo}`}
                        <span className="rh-mono" style={{ color: "#B8863B", fontSize: 11, marginLeft: 5 }}>(Juz {seg.juz})</span>
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {!day.libur && editable && (
                <button onClick={() => onMarkDone(day.date, !isDone)} className="rh-btn"
                  style={{
                    flexShrink: 0, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                    background: isDone ? "#16324F" : "#E4DBC3", color: isDone ? "#FFFDF8" : "#5C5647",
                    fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                  }}>
                  <Check size={13} /> {isDone ? "Selesai" : "Tandai"}
                </button>
              )}
              {!day.libur && !editable && isDone && <div style={{ flexShrink: 0, color: "#16324F" }}><Check size={16} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ MODAL LAPORAN BULANAN (PDF) ============================================================ */
function MonthlyReportModal({ plan, schedule, progress, onClose }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [notes, setNotes] = useState({ kehadiran: "", akhlak: "", sosial: "", motorik: "", catatan: "" });
  const [loadingNote, setLoadingNote] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingNote(true);
      try {
        const existing = await getMonthlyNote(plan.id, year, month);
        setNotes({
          kehadiran: existing?.kehadiran || "",
          akhlak: existing?.akhlak || "",
          sosial: existing?.sosial || "",
          motorik: existing?.motorik || "",
          catatan: existing?.catatan || "",
        });
      } catch { /* noop */ }
      setLoadingNote(false);
    })();
  }, [plan.id, year, month]);

  const monthStats = useMemo(() => {
    const inMonth = schedule.schedule.filter(d => {
      const dt = new Date(d.date + "T00:00:00");
      return dt.getFullYear() === year && dt.getMonth() + 1 === month;
    });
    const targetDays = inMonth.filter(d => !d.libur);
    const doneSet = new Set(progress);
    const hariTercapai = targetDays.filter(d => doneSet.has(d.date)).length;
    const ayatBulanIni = targetDays.filter(d => doneSet.has(d.date)).reduce((s, d) => s + (d.ayahCount || 0), 0);
    const pctBulanIni = targetDays.length ? Math.round((hariTercapai / targetDays.length) * 100) : 0;
    const cakupanSurat = [];
    targetDays.forEach(d => d.segments?.forEach(seg => {
      const last = cakupanSurat[cakupanSurat.length - 1];
      if (last && last.surah === seg.surah && seg.ayahFrom === last.ayahTo + 1) last.ayahTo = seg.ayahTo;
      else cakupanSurat.push({ ...seg });
    }));
    return { targetHariBulanIni: targetDays.length, hariTercapai, pctBulanIni, ayatBulanIni, cakupanSurat };
  }, [schedule, progress, year, month]);

  async function handleSaveAndGenerate() {
    setSaving(true);
    try {
      await saveMonthlyNote(plan.id, year, month, notes);
      generateMonthlyReportPdf({
        lembagaName: LEMBAGA_NAME,
        lembagaSubtitle: LEMBAGA_SUBTITLE,
        year, month,
        stats: {
          name: plan.name, kelas: plan.kelas,
          ...monthStats,
          estimasiKhatam: schedule.completed ? fmtDateHuman(schedule.schedule[schedule.schedule.length - 1]?.date) : null,
        },
        notes,
      });
    } catch (e) {
      alert("Gagal membuat laporan: " + e.message);
    }
    setSaving(false);
  }

  const fieldRows = [
    ["kehadiran", "Kehadiran & Kedisiplinan"],
    ["akhlak", "Adab & Akhlak"],
    ["sosial", "Perkembangan Sosial"],
    ["motorik", "Perkembangan Motorik/Kemandirian"],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000055", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "#FFFDF8", borderRadius: 14, padding: 22, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }} className="rh-scroll">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="rh-display" style={{ fontSize: 17, fontWeight: 700, color: "#16324F" }}>Laporan Bulanan — {plan.name}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#8A8272" }}><X size={20} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <Field label="Bulan">
            <select style={inputStyle} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Tahun">
            <input type="number" style={inputStyle} value={year} onChange={e => setYear(Number(e.target.value))} />
          </Field>
        </div>

        <div style={{ background: "#F2ECD9", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13 }}>
          <b>Ringkasan akademik:</b> {monthStats.hariTercapai}/{monthStats.targetHariBulanIni} hari tercapai ({monthStats.pctBulanIni}%), {monthStats.ayatBulanIni} ayat dihafal bulan ini.
        </div>

        {loadingNote ? (
          <div style={{ textAlign: "center", padding: 20, color: "#8A8272" }}><Loader2 className="rh-spin" size={18} /></div>
        ) : (
          <>
            {fieldRows.map(([key, label]) => (
              <Field key={key} label={label}>
                <textarea style={{ ...inputStyle, minHeight: 54, resize: "vertical" }} value={notes[key]}
                  onChange={e => setNotes(n => ({ ...n, [key]: e.target.value }))}
                  placeholder={`Catatan ${label.toLowerCase()}...`} />
              </Field>
            ))}
            <Field label="Catatan Tambahan">
              <textarea style={{ ...inputStyle, minHeight: 54, resize: "vertical" }} value={notes.catatan}
                onChange={e => setNotes(n => ({ ...n, catatan: e.target.value }))} placeholder="Catatan bebas untuk wali santri..." />
            </Field>
          </>
        )}

        <button onClick={handleSaveAndGenerate} disabled={saving || loadingNote} className="rh-btn"
          style={{
            marginTop: 6, padding: "11px 20px", borderRadius: 9, border: "none", cursor: "pointer",
            background: "#16324F", color: "#FFFDF8", fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", gap: 8, opacity: saving ? 0.7 : 1,
          }}>
          {saving ? <Loader2 size={16} className="rh-spin" /> : <FileDown size={16} />}
          Simpan & Unduh PDF
        </button>
      </div>
    </div>
  );
}

/* ============================================================ LAPORAN & LEADERBOARD ============================================================ */
function LaporanLeaderboard({ allPlans, loading }) {
  const [sortBy, setSortBy] = useState("ayat");
  const [kelasFilter, setKelasFilter] = useState("Semua");
  const [periodFilter, setPeriodFilter] = useState("keseluruhan"); // "keseluruhan" | "bulan-ini"

  const kelasList = useMemo(() => ["Semua", ...Array.from(new Set(allPlans.map(p => p.kelas || "Umum")))], [allPlans]);

  const filtered = useMemo(() => {
    let data = allPlans;
    if (kelasFilter !== "Semua") data = data.filter(p => (p.kelas || "Umum") === kelasFilter);
    return data;
  }, [allPlans, kelasFilter]);

  const sorted = useMemo(() => {
    const key = periodFilter === "bulan-ini" ? "bulanIni" : "total";
    const copy = [...filtered];
    if (sortBy === "ayat") copy.sort((a, b) => b[key].ayat - a[key].ayat);
    else if (sortBy === "pct") copy.sort((a, b) => b[key].pct - a[key].pct);
    else copy.sort((a, b) => b.streak - a.streak);
    return copy;
  }, [filtered, sortBy, periodFilter]);

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8A8272", padding: 40, justifyContent: "center" }}><Loader2 size={18} className="rh-spin" /> Memuat laporan...</div>;
  }
  if (!allPlans.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#8A8272" }}>
        <Trophy size={28} style={{ marginBottom: 10 }} />
        <div style={{ fontFamily: "Lora", fontSize: 16, color: "#16324F" }}>Belum ada data santri untuk dilaporkan</div>
      </div>
    );
  }

  const medalColor = ["#B8863B", "#8A8272", "#9B6A3A"];
  const activeKey = periodFilter === "bulan-ini" ? "bulanIni" : "total";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div className="rh-display" style={{ fontSize: 18, fontWeight: 700, color: "#16324F", display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={18} color="#B8863B" /> Papan Capaian Santri
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8A8272", marginBottom: 4, textTransform: "uppercase" }}>Kelas</div>
          <select style={{ ...inputStyle, width: "auto" }} value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}>
            {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8A8272", marginBottom: 4, textTransform: "uppercase" }}>Periode</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["keseluruhan", "Keseluruhan"], ["bulan-ini", "Bulan Ini"]].map(([key, label]) => (
              <button key={key} onClick={() => setPeriodFilter(key)} className="rh-btn"
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600, border: periodFilter === key ? "1px solid #16324F" : "1px solid #D8CFB6", background: periodFilter === key ? "#16324F" : "#FFFDF8", color: periodFilter === key ? "#FFFDF8" : "#5C5647" }}>{label}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#8A8272", marginBottom: 4, textTransform: "uppercase" }}>Urutkan</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["ayat", "Ayat Dihafal"], ["pct", "% Konsisten"], ["streak", "Runtutan Hari"]].map(([key, label]) => (
              <button key={key} onClick={() => setSortBy(key)} className="rh-btn"
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600, border: sortBy === key ? "1px solid #16324F" : "1px solid #D8CFB6", background: sortBy === key ? "#16324F" : "#FFFDF8", color: sortBy === key ? "#FFFDF8" : "#5C5647" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "#FFFDF8", border: "1px solid #E4DBC3", borderRadius: 12, padding: "12px 16px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: i < 3 ? medalColor[i] : "#E4DBC3", color: i < 3 ? "#FFFDF8" : "#8A8272", fontWeight: 700, fontFamily: "IBM Plex Mono", fontSize: 13 }}>
              {i < 3 ? <Medal size={15} /> : i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#23201B" }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#8A8272" }}>
                {s.kelas} · {s[activeKey].done}/{s[activeKey].targetDays} hari tercapai
                {s.completed && <span style={{ color: "#16324F", fontWeight: 600 }}> · Khatam {fmtDateHuman(s.finishDate)}</span>}
              </div>
            </div>
            <div style={{ textAlign: "right" }} className="rh-mono">
              <div style={{ fontSize: 16, fontWeight: 700, color: "#16324F" }}>{s[activeKey].ayat} <span style={{ fontSize: 11, fontWeight: 400, color: "#8A8272" }}>ayat</span></div>
              <div style={{ fontSize: 12, color: "#8A8272" }}>{s[activeKey].pct}% konsisten · runtutan {s.streak} hari</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ APP UTAMA ============================================================ */
export default function Home() {
  const [role, setRole] = useState("ustadzah");
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [configError, setConfigError] = useState(false);

  const plan = useMemo(() => plans.find(p => p.id === selectedId) || null, [plans, selectedId]);
  const schedule = useMemo(() => plan ? generateSchedule(plan) : null, [plan]);
  const existingKelas = useMemo(() => Array.from(new Set(plans.map(p => p.kelas || "Umum"))).length ? Array.from(new Set(plans.map(p => p.kelas || "Umum"))) : ["Umum"], [plans]);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured()) { setConfigError(true); setLoading(false); return; }
    setLoading(true);
    try {
      const list = await listPlans();
      setPlans(list);
      if (list.length && !list.find(p => p.id === selectedId)) setSelectedId(list[0].id);
      if (!list.length) setShowForm(true);
    } catch (e) {
      setConfigError(true);
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => { refresh(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!selectedId) { setProgress([]); return; }
    listProgress(selectedId).then(setProgress).catch(() => setProgress([]));
  }, [selectedId]);

  useEffect(() => {
    if (role !== "laporan") return;
    (async () => {
      setReportLoading(true);
      const list = await listPlans();
      const withStats = await Promise.all(list.map(async (p) => {
        const prog = await listProgress(p.id);
        const sched = generateSchedule(p);
        const todayIso = fmtDate(new Date());
        function statsFor(filterFn) {
          const days = sched.schedule.filter(d => !d.libur && filterFn(d));
          const doneSet = new Set(prog);
          const done = days.filter(d => doneSet.has(d.date)).length;
          const ayat = days.filter(d => doneSet.has(d.date)).reduce((s, d) => s + (d.ayahCount || 0), 0);
          const pct = days.length ? Math.round((done / days.length) * 100) : 0;
          return { done, ayat, pct, targetDays: days.length };
        }
        const now = new Date();
        return {
          id: p.id, name: p.name, kelas: p.kelas || "Umum",
          total: statsFor(d => d.date <= todayIso),
          bulanIni: statsFor(d => { const dt = new Date(d.date + "T00:00:00"); return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && d.date <= todayIso; }),
          streak: computeStreak(sched.schedule, prog, todayIso),
          completed: sched.completed,
          finishDate: sched.completed ? sched.schedule[sched.schedule.length - 1]?.date : null,
        };
      }));
      setReportData(withStats);
      setReportLoading(false);
    })();
  }, [role, plans]);

  async function handleSavePlan(newPlan) {
    setSaving(true);
    try {
      const id = await savePlan(newPlan, editing ? selectedId : undefined);
      await refresh();
      setSelectedId(id);
      setShowForm(false);
      setEditing(false);
    } catch (e) {
      alert("Gagal menyimpan: " + e.message);
    }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus rencana hafalan santri ini? Data capaian juga akan terhapus.")) return;
    await deletePlan(id);
    await refresh();
  }

  async function handleMarkDone(dateIso, markDone) {
    setProgress(prev => markDone ? [...prev, dateIso] : prev.filter(d => d !== dateIso));
    try { await toggleProgress(selectedId, dateIso, markDone); } catch (e) { /* revert on fail */ await listProgress(selectedId).then(setProgress); }
  }

  if (configError) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: 24, background: "#FFFDF8", border: "1px solid #E4DBC3", borderRadius: 14, fontFamily: "Inter" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#9B4444", fontWeight: 700, marginBottom: 8 }}>
          <AlertCircle size={18} /> Supabase belum dikonfigurasi
        </div>
        <p style={{ fontSize: 14, color: "#5C5647", lineHeight: 1.6 }}>
          Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di file <code>.env.local</code> (lokal) atau Environment Variables project Vercel Anda, lalu deploy ulang. Lihat README.md untuk langkah lengkap.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", fontFamily: "Inter" }}>
      <div style={{ borderRadius: 16, overflow: "hidden", background: "#F2ECD9" }}>
        <div style={{ background: "#16324F", padding: "20px 24px", color: "#FFFDF8", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#FFFDF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/logo.png" alt="Logo" width={46} height={46} style={{ objectFit: "contain" }} />
          </div>
          <div>
            <div className="rh-display" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>{LEMBAGA_NAME}</div>
            <div style={{ fontSize: 12, opacity: .8 }}>{LEMBAGA_SUBTITLE} · Rihlah Hafalan (Juz 30→26, lalu 1→25)</div>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #E4DBC3", background: "#FFFDF8", padding: "0 12px", overflowX: "auto" }}>
          <Tab active={role === "ustadzah"} onClick={() => setRole("ustadzah")} icon={Users} label="Ustadzah" />
          <Tab active={role === "santri"} onClick={() => setRole("santri")} icon={BookOpen} label="Santri" />
          <Tab active={role === "wali"} onClick={() => setRole("wali")} icon={Eye} label="Wali Santri" />
          <Tab active={role === "laporan"} onClick={() => setRole("laporan")} icon={Trophy} label="Laporan" />
        </div>

        <div style={{ padding: 22 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8A8272", padding: 40, justifyContent: "center" }}>
              <Loader2 size={18} className="rh-spin" /> Memuat data...
            </div>
          ) : (
            <>
              {plans.length > 0 && role !== "laporan" && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
                  <select style={{ ...inputStyle, width: "auto", minWidth: 200 }} value={selectedId} onChange={e => { setSelectedId(e.target.value); setShowForm(false); }}>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.kelas})</option>)}
                  </select>
                  {role === "ustadzah" && (
                    <>
                      <button className="rh-btn" onClick={() => { setShowForm(true); setEditing(false); }}
                        style={{ border: "1px solid #16324F", background: "#FFFDF8", color: "#16324F", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <Plus size={14} /> Santri Baru
                      </button>
                      {plan && !showForm && (
                        <button className="rh-btn" onClick={() => { setShowForm(true); setEditing(true); }}
                          style={{ border: "1px solid #D8CFB6", background: "#FFFDF8", color: "#5C5647", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                          Edit Rencana
                        </button>
                      )}
                      {plan && !showForm && (
                        <button className="rh-btn" onClick={() => setShowMonthlyModal(true)}
                          style={{ border: "1px solid #B8863B", background: "#FFFDF8", color: "#B8863B", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                          <FileDown size={14} /> Laporan Bulanan (PDF)
                        </button>
                      )}
                      {selectedId && (
                        <button className="rh-btn" onClick={() => handleDelete(selectedId)}
                          style={{ border: "1px solid #9B444455", background: "#FFFDF8", color: "#9B4444", borderRadius: 8, padding: "8px 10px", fontSize: 13, cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {role === "ustadzah" && showForm && (
                <PlanForm initial={editing ? plan : null} onSave={handleSavePlan} onCancel={plans.length ? () => setShowForm(false) : undefined} saving={saving} existingKelas={existingKelas} />
              )}

              {role === "ustadzah" && !showForm && plan && schedule && (
                <ScheduleView schedule={schedule} completedDates={progress} onMarkDone={handleMarkDone} editable={false} />
              )}
              {role === "santri" && plan && schedule && (
                <ScheduleView schedule={schedule} completedDates={progress} onMarkDone={handleMarkDone} editable={true} />
              )}
              {role === "wali" && plan && schedule && (
                <ScheduleView schedule={schedule} completedDates={progress} onMarkDone={handleMarkDone} editable={false} />
              )}
              {role === "laporan" && (
                <LaporanLeaderboard allPlans={reportData} loading={reportLoading} />
              )}

              {!plan && !showForm && plans.length === 0 && role !== "laporan" && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8A8272" }}>
                  <div style={{ fontFamily: "Lora", fontSize: 16, color: "#16324F", marginBottom: 6 }}>Belum ada rencana hafalan</div>
                  <div style={{ fontSize: 13 }}>Buka tab Ustadzah untuk membuat rencana santri pertama.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showMonthlyModal && plan && schedule && (
        <MonthlyReportModal plan={plan} schedule={schedule} progress={progress} onClose={() => setShowMonthlyModal(false)} />
      )}
    </div>
  );
}

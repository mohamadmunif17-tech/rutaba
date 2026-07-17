import jsPDF from "jspdf";
import { MONTH_NAMES } from "./quranData";

/**
 * Buat PDF laporan perkembangan bulanan satu santri.
 * stats: { name, kelas, targetHariBulanIni, hariTercapai, pctBulanIni, ayatBulanIni,
 *          cakupanSurat: [{name, ayahFrom, ayahTo}], estimasiKhatam }
 * notes: { kehadiran, akhlak, sosial, motorik, catatan }
 */
export function generateMonthlyReportPdf({ lembagaName, lembagaSubtitle, year, month, stats, notes }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(lembagaName || "RUTABA SHOHIBUL QUR'AN", pageWidth / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(lembagaSubtitle || "Rumah Tahfidz Balita", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setDrawColor(184, 134, 59);
  doc.setLineWidth(1.2);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Laporan Perkembangan Bulanan — ${MONTH_NAMES[month - 1]} ${year}`, marginX, y);
  y += 22;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama Santri : ${stats.name}`, marginX, y); y += 16;
  doc.text(`Kelas       : ${stats.kelas || "-"}`, marginX, y); y += 24;

  doc.setFont("helvetica", "bold");
  doc.text("A. Perkembangan Akademik (Hafalan)", marginX, y); y += 18;
  doc.setFont("helvetica", "normal");
  const rows = [
    [`Target hari hafalan bulan ini`, `${stats.targetHariBulanIni} hari`],
    [`Hari tercapai`, `${stats.hariTercapai} hari (${stats.pctBulanIni}%)`],
    [`Ayat dihafal bulan ini`, `${stats.ayatBulanIni} ayat`],
  ];
  rows.forEach(([label, val]) => {
    doc.text(`- ${label}`, marginX + 8, y);
    doc.text(String(val), marginX + 260, y);
    y += 16;
  });

  if (stats.cakupanSurat && stats.cakupanSurat.length) {
    y += 6;
    doc.text("Cakupan bacaan bulan ini:", marginX + 8, y); y += 16;
    stats.cakupanSurat.forEach(seg => {
      const line = `${seg.name} ayat ${seg.ayahFrom}${seg.ayahFrom !== seg.ayahTo ? "-" + seg.ayahTo : ""} (Juz ${seg.juz})`;
      doc.text(`  • ${line}`, marginX + 14, y);
      y += 14;
    });
  }
  if (stats.estimasiKhatam) {
    y += 4;
    doc.text(`Estimasi/realisasi khatam: ${stats.estimasiKhatam}`, marginX + 8, y);
    y += 16;
  }

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text("B. Perkembangan Non-Akademik", marginX, y); y += 18;
  doc.setFont("helvetica", "normal");

  const nonAkademik = [
    ["Kehadiran & Kedisiplinan", notes?.kehadiran],
    ["Adab & Akhlak", notes?.akhlak],
    ["Perkembangan Sosial", notes?.sosial],
    ["Perkembangan Motorik/Kemandirian", notes?.motorik],
  ];
  nonAkademik.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX + 8, y); y += 14;
    doc.setFont("helvetica", "normal");
    const text = val && val.trim() ? val : "-";
    const wrapped = doc.splitTextToSize(text, pageWidth - marginX * 2 - 16);
    doc.text(wrapped, marginX + 14, y);
    y += wrapped.length * 14 + 8;
  });

  if (notes?.catatan) {
    doc.setFont("helvetica", "bold");
    doc.text("Catatan Tambahan:", marginX + 8, y); y += 14;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(notes.catatan, pageWidth - marginX * 2 - 16);
    doc.text(wrapped, marginX + 14, y);
    y += wrapped.length * 14;
  }

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Dicetak otomatis dari sistem Rihlah Hafalan — ${new Date().toLocaleDateString("id-ID")}`, marginX, pageHeight - 30);

  doc.save(`Laporan-${stats.name.replace(/\s+/g,"_")}-${MONTH_NAMES[month-1]}-${year}.pdf`);
}

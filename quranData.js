// =========================================================
// Data Qur'an (114 surat) & batas Juz standar Mushaf Madinah,
// plus logic penjadwalan hafalan dengan urutan custom juz.
// =========================================================

export const SURAHS = [
  [1,"Al-Fatihah",7],[2,"Al-Baqarah",286],[3,"Ali 'Imran",200],[4,"An-Nisa",176],
  [5,"Al-Ma'idah",120],[6,"Al-An'am",165],[7,"Al-A'raf",206],[8,"Al-Anfal",75],
  [9,"At-Taubah",129],[10,"Yunus",109],[11,"Hud",123],[12,"Yusuf",111],
  [13,"Ar-Ra'd",43],[14,"Ibrahim",52],[15,"Al-Hijr",99],[16,"An-Nahl",128],
  [17,"Al-Isra",111],[18,"Al-Kahf",110],[19,"Maryam",98],[20,"Taha",135],
  [21,"Al-Anbiya",112],[22,"Al-Hajj",78],[23,"Al-Mu'minun",118],[24,"An-Nur",64],
  [25,"Al-Furqan",77],[26,"Asy-Syu'ara",227],[27,"An-Naml",93],[28,"Al-Qasas",88],
  [29,"Al-'Ankabut",69],[30,"Ar-Rum",60],[31,"Luqman",34],[32,"As-Sajdah",30],
  [33,"Al-Ahzab",73],[34,"Saba",54],[35,"Fatir",45],[36,"Yasin",83],
  [37,"As-Saffat",182],[38,"Sad",88],[39,"Az-Zumar",75],[40,"Ghafir",85],
  [41,"Fussilat",54],[42,"Asy-Syura",53],[43,"Az-Zukhruf",89],[44,"Ad-Dukhan",59],
  [45,"Al-Jasiyah",37],[46,"Al-Ahqaf",35],[47,"Muhammad",38],[48,"Al-Fath",29],
  [49,"Al-Hujurat",18],[50,"Qaf",45],[51,"Az-Zariyat",60],[52,"At-Tur",49],
  [53,"An-Najm",62],[54,"Al-Qamar",55],[55,"Ar-Rahman",78],[56,"Al-Waqi'ah",96],
  [57,"Al-Hadid",29],[58,"Al-Mujadalah",22],[59,"Al-Hasyr",24],[60,"Al-Mumtahanah",13],
  [61,"As-Saff",14],[62,"Al-Jumu'ah",11],[63,"Al-Munafiqun",11],[64,"At-Tagabun",18],
  [65,"At-Talaq",12],[66,"At-Tahrim",12],[67,"Al-Mulk",30],[68,"Al-Qalam",52],
  [69,"Al-Haqqah",52],[70,"Al-Ma'arij",44],[71,"Nuh",28],[72,"Al-Jinn",28],
  [73,"Al-Muzzammil",20],[74,"Al-Muddassir",56],[75,"Al-Qiyamah",40],[76,"Al-Insan",31],
  [77,"Al-Mursalat",50],[78,"An-Naba",40],[79,"An-Nazi'at",46],[80,"'Abasa",42],
  [81,"At-Takwir",29],[82,"Al-Infitar",19],[83,"Al-Mutaffifin",36],[84,"Al-Insyiqaq",25],
  [85,"Al-Buruj",22],[86,"At-Tariq",17],[87,"Al-A'la",19],[88,"Al-Gasyiyah",26],
  [89,"Al-Fajr",30],[90,"Al-Balad",20],[91,"Asy-Syams",15],[92,"Al-Lail",21],
  [93,"Ad-Duha",11],[94,"Asy-Syarh",8],[95,"At-Tin",8],[96,"Al-'Alaq",19],
  [97,"Al-Qadr",5],[98,"Al-Bayyinah",8],[99,"Az-Zalzalah",8],[100,"Al-'Adiyat",11],
  [101,"Al-Qari'ah",11],[102,"At-Takasur",8],[103,"Al-'Asr",3],[104,"Al-Humazah",9],
  [105,"Al-Fil",5],[106,"Quraisy",4],[107,"Al-Ma'un",7],[108,"Al-Kausar",3],
  [109,"Al-Kafirun",6],[110,"An-Nasr",3],[111,"Al-Masad",5],[112,"Al-Ikhlas",4],
  [113,"Al-Falaq",5],[114,"An-Nas",6],
].map(([no,name,count])=>({no,name,count}));

export const JUZ_START = [
  [1,1,1],[2,2,142],[3,2,253],[4,3,93],[5,4,24],[6,4,148],[7,5,82],[8,6,111],
  [9,7,88],[10,8,41],[11,9,93],[12,11,6],[13,12,53],[14,15,1],[15,17,1],
  [16,18,75],[17,21,1],[18,23,1],[19,25,21],[20,27,56],[21,29,46],[22,33,31],
  [23,36,28],[24,39,32],[25,41,47],[26,46,1],[27,51,31],[28,58,1],[29,67,1],[30,78,1],
].map(([juz,surah,ayah])=>({juz,surah,ayah}));

export const CUSTOM_ORDER = [30,29,28,27,26,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25];
export const DAY_NAMES = ["Ahad","Senin","Selasa","Rabu","Kamis","Jum'at","Sabtu"];
export const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export function getJuz(surah, ayah) {
  let cur = 1;
  for (const b of JUZ_START) {
    if (surah > b.surah || (surah === b.surah && ayah >= b.ayah)) cur = b.juz;
    else break;
  }
  return cur;
}

function buildCustomSequence() {
  const buckets = {};
  CUSTOM_ORDER.forEach(j => (buckets[j] = []));
  for (const s of SURAHS) {
    for (let ayah = 1; ayah <= s.count; ayah++) {
      const juz = getJuz(s.no, ayah);
      buckets[juz].push({ surah: s.no, name: s.name, ayah, juz });
    }
  }
  let seq = [];
  CUSTOM_ORDER.forEach(j => { seq = seq.concat(buckets[j]); });
  return seq;
}
export const SEQUENCE = buildCustomSequence(); // 6236 entri sesuai urutan custom

export function surahsInJuz(juz) {
  const set = new Set(SEQUENCE.filter(e => e.juz === juz).map(e => e.surah));
  return SURAHS.filter(s => set.has(s.no));
}
export function ayahRangeInJuzSurah(juz, surah) {
  return SEQUENCE.filter(e => e.juz === juz && e.surah === surah).map(e => e.ayah);
}
export function fmtDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}
export function fmtDateHuman(iso) {
  const d = new Date(iso+"T00:00:00");
  return d.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

export function generateSchedule(plan, maxDays = 366) {
  const startIndex = SEQUENCE.findIndex(e => e.surah === plan.start_surah && e.ayah === plan.start_ayat);
  if (startIndex === -1) return { schedule: [], completed: false, startIndex: 0, total: SEQUENCE.length };
  let cursor = startIndex;
  let date = new Date(plan.start_date + "T00:00:00");
  const schedule = [];
  let dayCount = 0;
  const liburDays = plan.libur_days || [];
  while (cursor < SEQUENCE.length && dayCount < maxDays) {
    const dow = date.getDay();
    if (liburDays.includes(dow)) {
      schedule.push({ date: fmtDate(date), libur: true, segments: [] });
    } else {
      const take = Math.min(plan.daily_target, SEQUENCE.length - cursor);
      const chunk = SEQUENCE.slice(cursor, cursor + take);
      cursor += take;
      const segments = [];
      for (const item of chunk) {
        const last = segments[segments.length - 1];
        if (last && last.surah === item.surah && item.ayah === last.ayahTo + 1) {
          last.ayahTo = item.ayah;
        } else {
          segments.push({ surah: item.surah, name: item.name, ayahFrom: item.ayah, ayahTo: item.ayah, juz: item.juz });
        }
      }
      schedule.push({ date: fmtDate(date), libur: false, segments, ayahCount: chunk.length });
    }
    dayCount++;
    date.setDate(date.getDate() + 1);
  }
  return { schedule, completed: cursor >= SEQUENCE.length, startIndex, total: SEQUENCE.length };
}

export function slugify(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function computeStreak(schedule, progressDates, todayIso) {
  const doneSet = new Set(progressDates);
  const targetDays = schedule.filter(d => !d.libur && d.date <= todayIso).map(d => d.date).sort().reverse();
  let streak = 0;
  for (const d of targetDays) {
    if (doneSet.has(d)) streak++;
    else break;
  }
  return streak;
}

const API_BASE = 'https://api.quran.com/api/v4';

export async function getSurahs() {
  const res = await fetch(`${API_BASE}/chapters?language=en`);
  const data = await res.json();
  return data.chapters;
}

export async function getVerses(surahNumber: number, reciterId: number = 7, translationId: number = 131) {
  const res = await fetch(
    `${API_BASE}/verses/by_chapter/${surahNumber}?language=en&words=true&translations=${translationId}&audio=${reciterId}&fields=text_uthmani`
  );
  const data = await res.json();
  return data.verses;
}

export async function getTranslations() {
  const res = await fetch(`${API_BASE}/resources/translations?language=en`);
  const data = await res.json();
  return data.translations;
}

export async function getRecitations() {
  const res = await fetch(`${API_BASE}/resources/recitations?language=en`);
  const data = await res.json();
  return data.recitations;
}
// Progression : XP / niveaux, médailles, statistiques (tableau de progrès), défi du jour.
// Tout est dans localStorage (lectures/écritures protégées : navigation privée, etc.).
const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ---------- dates locales (le défi change à minuit chez l'enfant, pas en UTC) ----------
export const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
// générateur pseudo-aléatoire déterministe (même défi pour tout le monde le même jour)
export function seededRng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- XP et niveaux ----------
// passer du niveau n au niveau n+1 coûte 80 + 40×(n-1) XP
export const xpStep = n => 80 + 40 * (n - 1);
export function levelInfo(xp = getXp()) {
  let lvl = 1, rest = xp;
  while (rest >= xpStep(lvl)) { rest -= xpStep(lvl); lvl++; }
  return { lvl, cur: rest, need: xpStep(lvl), xp };
}
export const getXp = () => get("geoose-xp", 0);
export function addXp(n) { const before = levelInfo(); put("geoose-xp", before.xp + n); const after = levelInfo(); return { gained: n, before: before.lvl, after: after.lvl }; }

// ---------- oie : accessoires équipés ----------
export const getEquip = () => get("geoose-oie", {});
export const setEquip = e => put("geoose-oie", e);

// ---------- statistiques (tableau de progrès) ----------
export const getStats = () => Object.assign({ games: 0, days: {}, ok: {}, miss: {}, conf: {}, perfects: 0, merveilles: 0, bestRun: 0 }, get("geoose-stats", {}));
export const saveStats = s => put("geoose-stats", s);
export function addPlayTime(sec) { const s = getStats(), d = dayStr(); s.days[d] = (s.days[d] || 0) + Math.round(sec); s.games++; saveStats(s); }
// une réponse du joueur 1 : réussite par mode, erreurs fréquentes, confusions entre pays
export function recordAnswer({ type, key, ok, perfect, confused, merveille }) {
  const s = getStats();
  const o = s.ok[type] || (s.ok[type] = [0, 0]); o[1]++; if (ok) o[0]++;
  if (!ok) s.miss[key] = (s.miss[key] || 0) + 1;
  if (confused) s.conf[confused] = (s.conf[confused] || 0) + 1;
  if (perfect) s.perfects++;
  if (ok && merveille) s.merveilles++;
  saveStats(s);
  return s;
}

// ---------- défi du jour ----------
export const getDefi = () => Object.assign({ last: null, streak: 0, best: 0, scores: {} }, get("geoose-defi", {}));
// série en cours vue d'aujourd'hui (0 si un jour a été manqué)
export function currentStreak(d = getDefi()) { return d.last === dayStr() || d.last === yesterdayStr() ? d.streak : 0; }
export const defiDoneToday = (d = getDefi()) => d.last === dayStr();
export function finishDefi(score) {
  const d = getDefi(), today = dayStr();
  if (d.last !== today) { d.streak = d.last === yesterdayStr() ? d.streak + 1 : 1; d.last = today; }
  d.best = Math.max(d.best, d.streak);
  d.scores[today] = Math.max(d.scores[today] || 0, score);
  put("geoose-defi", d);
  return d;
}

// ---------- médailles ----------
// ctx fourni par le jeu : { stats, passport, countries, defi, level, ... } ; check(ctx) → vrai si gagnée
export const MEDALS = [
  { id: "envol", e: "🐣", nom: "Premier envol", desc: "Terminer une partie" },
  { id: "pile", e: "🎯", nom: "Pile poil", desc: "Un atterrissage parfait" },
  { id: "ile", e: "🏝️", nom: "Île au trésor", desc: "Atterrissage parfait sur un pays-île" },
  { id: "feu", e: "🔥", nom: "En feu", desc: "5 bonnes réponses d'affilée" },
  { id: "inarretable", e: "☄️", nom: "Inarrêtable", desc: "10 bonnes réponses d'affilée" },
  { id: "sansfaute", e: "💯", nom: "Sans faute", desc: "10 sur 10 dans une partie" },
  { id: "dragon", e: "🐉", nom: "Dompteur de dragon", desc: "7 000 points en niveau Expert" },
  { id: "defi3", e: "📅", nom: "3 jours de suite", desc: "Défi du jour 3 jours d'affilée" },
  { id: "defi7", e: "🗓️", nom: "Une semaine !", desc: "Défi du jour 7 jours d'affilée" },
  { id: "defi30", e: "🏆", nom: "Un mois !", desc: "Défi du jour 30 jours d'affilée" },
  { id: "survie15", e: "❤️", nom: "Survivant", desc: "15 bonnes réponses en Survie" },
  { id: "survie30", e: "💖", nom: "Indestructible", desc: "30 bonnes réponses en Survie" },
  { id: "quiz", e: "🧠", nom: "Je-sais-tout", desc: "10 sur 10 en Quiz" },
  { id: "merveilles", e: "🗿", nom: "Chasseur de merveilles", desc: "10 merveilles trouvées" },
  { id: "capitales", e: "🏛️", nom: "Roi des capitales", desc: "50 capitales au passeport" },
  { id: "globe", e: "🌍", nom: "Globe-trotteur", desc: "50 pays au passeport" },
  { id: "tour", e: "👑", nom: "Tour du monde", desc: "Les 197 pays au passeport" },
  { id: "europe", e: "🏰", nom: "Maître de l'Europe", desc: "Tous les pays d'Europe au passeport" },
  { id: "afrique", e: "🦁", nom: "Maître de l'Afrique", desc: "Tous les pays d'Afrique au passeport" },
  { id: "asie", e: "🐼", nom: "Maître de l'Asie", desc: "Tous les pays d'Asie au passeport" },
  { id: "ameriques", e: "🦅", nom: "Maître des Amériques", desc: "Tous les pays des Amériques au passeport" },
  { id: "oceanie", e: "🦘", nom: "Maître de l'Océanie", desc: "Tous les pays d'Océanie au passeport" },
  { id: "duo", e: "🤝", nom: "En équipe", desc: "Finir une partie à deux" },
  { id: "niveau10", e: "⭐", nom: "Grande oie", desc: "Atteindre le niveau 10" },
];
export const getMedals = () => get("geoose-medailles", {});
// donne les médailles dont l'id est dans `ids` et pas encore gagnées ; renvoie les nouvelles
export function award(ids) {
  const m = getMedals(), fresh = [];
  for (const id of ids) if (!m[id] && MEDALS.find(x => x.id === id)) { m[id] = dayStr(); fresh.push(MEDALS.find(x => x.id === id)); }
  if (fresh.length) put("geoose-medailles", m);
  return fresh;
}

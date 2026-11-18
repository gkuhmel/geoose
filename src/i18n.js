// Multilingue (mêmes langues que Tomettes) : français, anglais, espagnol, allemand, italien, chinois.
// Le français est la langue des données (countries.js, cities.js…) ; chaque autre langue a son fichier
// src/lang/xx.js : UI (textes d'interface), CAP / CITY / MON / ISL / FACTS… (noms et infos), G (grammaire).
// Noms de pays : Intl.DisplayNames de l'appareil (corrigés par NAME). Repli sur le français si une clé manque.
// Changer de langue recharge la page (comme Tomettes) : tout est lu au démarrage.
import * as EN from "./lang/en.js";
import * as ES from "./lang/es.js";
import * as DE from "./lang/de.js";
import * as IT from "./lang/it.js";
import * as ZH from "./lang/zh.js";

export const LANGS = [["fr", "Français"], ["en", "English"], ["es", "Español"], ["de", "Deutsch"], ["it", "Italiano"], ["zh", "中文"]];
const PACKS = { en: EN, es: ES, de: DE, it: IT, zh: ZH };
const KEY = "geoose-langue";
function detect() {
  try { const s = localStorage.getItem(KEY); if (s && LANGS.some(l => l[0] === s)) return s; } catch (e) {}
  for (const p of (navigator.languages || [navigator.language || ""])) { const c = (p || "").slice(0, 2).toLowerCase(); if (LANGS.some(l => l[0] === c)) return c; }
  return "en";
}
export let lang = detect();
const P = PACKS[lang] || null; // null = français
document.documentElement.lang = lang === "zh" ? "zh-Hans" : lang;
export function setLang(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
export const speechLang = () => ({ fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT", zh: "zh-CN" })[lang];

export const fmt = n => { try { return n.toLocaleString(P ? P.LOCALE : "fr-FR"); } catch (e) { return String(n); } };
const pl = (n, s, p) => n > 1 ? p : s;

// ---------- noms ----------
let dn = null;
const intlName = a2 => { try { dn = dn || new Intl.DisplayNames([P.LOCALE], { type: "region" }); return dn.of(a2); } catch (e) { return null; } };
export const cn = c => !P ? c.nom : (P.NAME?.[c.a2] || intlName(c.a2) || c.nom);
const deFr = c => c.art === "l'" ? "de l'" : c.art === "les" ? "des " : c.art === "le" ? "du " : c.art === "la" ? "de la " : /^[AEIOUYÉÈÎ]/i.test(c.nom) ? "d'" : "de ";
const dansFr = c => c.art === "l'" ? "en " : c.art === "les" ? "aux " : c.art === "le" ? "au " : c.art === "la" ? "en " : "à ";
// français : « la France », « en France », « de la France » ; autres langues : leur fichier (G)
export const theC = c => !P ? (c.art === "l'" ? "l'" + c.nom : c.art ? c.art + " " + c.nom : c.nom) : (P.G?.the ? P.G.the(cn(c), c) : cn(c));
export const inC = c => !P ? dansFr(c) + c.nom : P.G.in(cn(c), c);
export const ofC = c => !P ? deFr(c) + c.nom : P.G.of(cn(c), c);
export const ccap = c => !P ? c.cap : (P.CAP?.[c.cap] || c.cap);
export const cityN = v => !P ? v.nom : (P.CITY?.[v.nom] || v.nom);
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
export const monN = m => !P ? m.nom : (P.MON?.[m.nom] || m.nom);
export const monT = m => `${m.e} ${cap1(monN(m))}`;
export const islN = i => !P ? i.nom : (P.ISL?.[i.nom]?.[0] || i.nom);
export const islT = i => `${i.e} ${cap1(islN(i))}`;
export const islFact = i => !P ? i.fact : (P.ISL?.[i.nom]?.[1] || "");
export const factOf = (c, FACTS) => !P ? FACTS[c.a2] : P.FACTS?.[c.a2];
export const vfrN = v => !P ? v.nom : (P.VFR?.[v.nom] || v.nom);
export const vfrFact = v => !P ? v.fact : P.VFR_FACT?.[v.nom];
export const medalN = m => !P ? m.nom : (P.MEDAL?.[m.id]?.[0] || m.nom);
export const medalD = m => !P ? m.desc : (P.MEDAL?.[m.id]?.[1] || m.desc);
export const accN = a => !P ? a.nom : (P.ACC?.[a.id] || a.nom);
export const plumeN = p => !P ? p.nom : (P.PLUME?.[p.id] || p.nom);
export const slotN = (k, fr) => !P ? fr : (P.SLOT?.[k] || fr);
export const contN = (k, fr) => !P ? fr : (P.CONT?.[k] || fr);
export const MONTHS = () => P ? P.MONTHS : ["JANV","FÉVR","MARS","AVR","MAI","JUIN","JUIL","AOÛT","SEPT","OCT","NOV","DÉC"];

// ---------- textes d'interface ----------
const FR = {
  bonvoyage:"Bon voyage, Nils ! 🌍",
  a_menu:"Menu",a_sound:"Sons",a_listen:"Écouter",a_settings:"Réglages",a_close:"Fermer",a_voice:"Voix",a_relisten:"Toucher pour réécouter",
  oceans:["OCÉAN ATLANTIQUE","OCÉAN PACIFIQUE","OCÉAN INDIEN","Mer Méditerranée","OCÉAN ARCTIQUE","Mer du Nord"],
  tip: "👆 Touche la carte pour poser l'oie · fais-la glisser pour viser juste",
  didyouknow: "💡 Le savais-tu ?", didyouknowSay: "Le savais-tu ? ",
  splashsub: "Fais atterrir l'oie au bon endroit !", hello: "Prêt pour le voyage ?",
  replay: "🔁 Rejouer comme la dernière fois", playnow: "▶ Jouer tout de suite",
  newgame: "🧭 Nouvelle partie", newgame_s: "je choisis pas à pas", defi: "🗓️ Défi du jour", review: "📚 Réviser mes erreurs",
  w_what: "Que veux-tu trouver ?", w_where: "Où veux-tu aller ?", w_wherefr: "Quoi en France ?", w_level: "Quel niveau ?", w_how: "Comment on joue ?",
  m_pays: "Pays", m_pays_s: "197 pays", m_capitale: "Capitales", m_capitale_s: "Paris, Tokyo…", m_drapeau: "Drapeaux", m_drapeau_s: "devine le pays",
  m_ville: "Villes", m_ville_s: "New York, Rio…", m_monument: "Merveilles", m_monument_s: "monuments, animaux", m_ile: "Îles", m_ile_s: "Corse, Galápagos…",
  m_france: "France", m_france_s: "départements, villes", m_mix: "Mélange", m_mix_s: "un peu de tout",
  m_dept: "Départements", m_dept_s: "les 96 de métropole", m_villefr: "Villes de France", m_villefr_s: "Paris, Brest, Nice…",
  wholeworld: "Le monde entier",
  l1: "Facile", l1_s: "les plus célèbres", l2: "Moyen", l2_s: "assez connus", l3: "Difficile", l3_s: "moins connus", l4: "Expert", l4_s: "les raretés",
  c0: "Calme", c0_s: "prends ton temps", c1: "Chrono", c1_s: "15 s par question", c2: "Survie", c2_s: "3 vies, jusqu'où ?", c3: "Quiz", c3_s: "choisis parmi 4",
  solo: "Seul", duo: "À deux",
  t_play: "Jouer", t_pass: "Passeport", t_prog: "Progrès", t_oie: "Mon oie",
  oie_title: "🪿 Mon oie", oie_hint: "Gagne de l'XP en jouant pour débloquer des accessoires. Touche-les pour les mettre ou les enlever.",
  prog_title: "🏆 Progrès", medals_tab: "🏅 Médailles", dash_tab: "📊 Tableau de bord",
  set_title: "⚙️ Réglages", set_sound: "Sons et bruitages", set_voice: "Lire les questions à voix haute", sounds: "Sons", voice: "Voix",
  theme: "Thème", language: "Langue",
  th_atlas: "Atlas", th_neon: "Néon", th_carte: "Vieille carte", th_bonbon: "Bonbon", th_jungle: "Jungle", th_banquise: "Banquise", th_volcan: "Volcan",
  credits: "Contours des départements : © IGN – Admin Express (Licence ouverte Etalab). Pays : Natural Earth.",
  pass_title: "🛂 Mon passeport", pass_legend: "★ une étoile par mode réussi (pays, capitale, drapeau, ville)", pass_map: "🗺️ Voir sur la carte",
  pmap_hint: "Touche un pays pour voir son tampon", pmap_back: "📖 Passeport",
  confirm: "Valider 🎯", pick: "Choisis une réponse", next: "Suivant ➜", seescore: "Voir le score 🏁", menu: "Menu",
  w_next: "Suivant ›", w_go: "C'est parti ! 🚀", w_back: "‹ Retour", w_menu: "‹ Menu",
  hint: "💡 Indice (points ÷ 2)", hintflag: "💡 Voir le nom (points ÷ 2)",
  // dynamiques
  visited: n => `${n} pays visité${pl(n, "", "s")} sur 197`,
  capitalOf: c => `Capitale : ${c}`, notvisited: "Pas encore visité : à toi de jouer !",
  ty: { pays: "pays", capitale: "capitale", drapeau: "drapeau", ville: "ville", monument: "merveille", ile: "île", dept: "département", villefr: "ville de France" },
  ml: { pays: "🗺️ Pays", capitale: "🏛️ Capitales", drapeau: "🚩 Drapeaux", ville: "🏙️ Villes", monument: "🗿 Merveilles", ile: "🏝️ Îles", mix: "🎲 Mélange", dept: "🇫🇷 Départements", villefr: "🇫🇷 Villes de France" },
  levels: ["", "Facile", "Moyen", "Difficile", "Expert"], chronos: ["Calme", "Chrono", "Survie", "Quiz"], twop: " · à deux",
  willread: "Je lirai les questions.", lvlS: n => `Niv. ${n}`, lvlL: n => `Niveau ${n}`, lvlUnlock: n => `niveau ${n}`,
  xpTo: (a, b, n) => `${a} / ${b} XP pour le niveau ${n}`, plumes: "🪿 Plumages", accs: "🎁 Accessoires", chosen: "choisie ✓", worn: "porté ✓",
  medalsN: (a, b) => `${a} / ${b} médailles`, week: "de jeu cette semaine", games: "parties jouées", defidays: b => `jours de défi (record ${b})`,
  xptotal: x => `${x} XP en tout`, h_pass: "🛂 Pays au passeport", h_ok: "🎯 Réussite par mode", h_miss: "📌 À retravailler", h_conf: "🔀 Confusions fréquentes",
  nogame: "Pas encore de partie.", nothing: "Rien à signaler 👏", noconf: "Aucune pour l'instant",
  bestAns: b => `🏆 record : ${b} bonnes réponses`, bestPts: b => `🏆 record : ${b} pts`,
  toreview: n => `${n} à revoir`, noreview: "rien à revoir 🎉",
  defiDone: s => `✅ fait aujourd'hui · 🔥 ${s}`, defiKeep: s => `5 questions · garde ta série 🔥 ${s}`, defiStart: "5 questions · commence une série 🔥",
  p1: "Joueur 1", p2: "Joueur 2", num: n => `n°${n}`,
  q: { pays: "Où se trouve le pays…", capitale: "Où se trouve la capitale…", drapeau: "Où se trouve le pays de ce drapeau ?", ville: "Où se trouve la ville…",
    monument: "Où se trouve…", animal: "Où vivent…", ile: "Où se trouve l'île…", dept: "Où se trouve le département…", villefr: "Où se trouve la ville…" },
  qq: { pays: "Quel est ce pays ?", capitale: "Quelle est la capitale de ce pays ?", drapeau: "Quel est le drapeau de ce pays ?", ville: "Quelle est cette ville ?",
    monument: "Qu'y a-t-il ici ?", animal: "Quel animal vit ici ?", ile: "Quelle est cette île ?", dept: "Quel est ce département ?", villefr: "Quelle est cette ville ?" },
  yourturn: n => `${n}, à toi !`, turnOf: n => `Au tour de ${n} ! 🙈`,
  sayWhere: s => `Où se trouve ${s} ?`, sayLive: s => `Où vivent ${s} ?`, sayFlag: "À quel pays est ce drapeau ?", sayDept: s => `Où se trouve le département ${s} ?`,
  hFlag: c => `drapeau ${c}`, hCity: c => `ville située ${c}`, hIn: c => `${c}`, hIsl: c => `elle appartient à ${c}`, hPref: p => `préfecture : ${p}`,
  hDept: (n, c) => `dans le département ${n} (${c})`, hCap: c => `capitale ${c}`,
  v: { quizok: "✅ Bravo !", quizko: "❌ Raté !", time: "⏰ Temps écoulé !", perfect: "🪿 Atterrissage parfait !", gooddep: "✅ Bon département !", goodisl: "🏝️ Sur l'île !",
    good: "✅ Bon pays !", p850: "😮 Presque !", p650: "🔥 Super !", p400: "👍 Pas mal !", p150: "🙂 Tu chauffes…", far: "🧊 Brrr, c'est loin !" },
  medalToast: n => `🏅 ${n} !`, giftToast: g => `🎁 Nouveau pour ton oie : ${g}`, newForGoose: g => `🎁 Nouveau pour ton oie : ${g}`,
  learned: "✅ Appris ! Retiré de tes révisions", added: "📚 Ajouté à tes révisions", again: "📚 On le reverra !",
  newStamp: c => `🛂 Nouveau tampon : ${c} !`, newStar: c => `🛂 Nouvelle étoile pour ${c} !`,
  speed: b => `⚡ dont +${b} bonus vitesse`, hintUsed: "💡 indice utilisé : points ÷ 2", lifeLost: h => `💔 une vie en moins (${h})`,
  pts: " pts",
  // résultat
  whatDept: (n, p) => `${n}, préfecture : ${p}`, whatVfr: (n, d, c) => `${n}, dans le département ${d} (${c})`, whatCap: (cap, of) => `${cap}, capitale ${of}`,
  whatAt: (n, w) => `${n}, ${w}`, whatC: (n, cap) => `${n} · capitale : ${cap}`,
  isright: w => `C'est bien ${w} !`, wasit: w => `C'était ${w}`, washere: w => `C'était ici : ${w}`,
  dGood: (n, p) => `Ton oie s'est posée dans le département ${n} ! Préfecture : ${p}`, dFar: (k, n, p) => `À ${k} km du département ${n} · préfecture : ${p}`,
  cIn: (w, cap) => `Ton oie s'est posée ${w} ! Capitale : ${cap}`, cBorder: (k, cap) => `À ${k} km de la frontière · capitale : ${cap}`,
  cFromCap: (k, cap, of) => `À ${k} km de ${cap}, capitale ${of}`,
  found: w => `Tu as trouvé ${w} !`, vfrGood: (d, n, k) => `Ton oie est bien dans le département ${d} 👍 ${n} est à ${k} km`,
  vfrFar: (n, d, c, k) => `${n} est dans le département ${d} (${c}) : ton oie est à ${k} km`,
  islGood: (n, w) => `Ton oie est bien sur l'île 👍 ${n} ${w}`, islFar: (n, w, k) => `${n} est ${w} : ton oie est à ${k} km de l'île`,
  ptGood: (w, n, k) => `Ton oie est bien ${w} 👍 ${n} est à ${k} km`, ptFar: (n, w, k) => `${n} : ${w}, ton oie est à ${k} km de la frontière`,
  nobody: "⏰ Personne n'a joué !", tie: "🤝 Égalité !", winsRound: n => `🏆 ${n} gagne la manche !`, wins: n => `🏆 ${n} gagne !`,
  notplayed: "pas joué", spoton: "pile dessus !", goodC: "bon pays",
  factDept: (n, c, p) => `La préfecture du département ${n} (${c}) est ${p}.`, factVfr: (n, d, c) => `${n} se trouve dans le département ${d} (${c}).`,
  // fin
  survOut: "bonnes réponses en Survie", ptsOut: m => `points sur ${m}`,
  survT: ["Encore un essai ! 💪", "Bien tenu ! 🙂", "Joli parcours ! 👍", "Survivant ! 🔥", "Increvable ! 🏆", "Légende de la survie ! 🌟"],
  normT: ["On s'entraîne encore ! 💪", "Bon début ! 🙂", "Pas mal du tout ! 👍", "Très fort ! 🔥", "Champion ! 🏆", "Légende de la géo ! 🌟"],
  defiT: "🗓️ Défi du jour terminé !", newRec: "🏆 Nouveau record !", firstRec: "🏆 Premier record !", rec: r => `Record : ${r}`, better: "Tu feras mieux la prochaine fois !",
  learnedN: n => `✅ ${n} appris · `, stillRev: n => `📚 encore ${n} à revoir`, noneRev: "🎉 Plus rien à revoir !",
  defiAlready: s => `Déjà fait aujourd'hui · 🔥 ${s} jour${pl(s, "", "s")}`, defiStreak: s => `🔥 ${s} jour${pl(s, "", "s")} d'affilée ! Reviens demain`,
  lvlUp: n => `⬆️ Niveau ${n} !`, xpGain: (x, l) => `+${x} XP · niveau ${l}`,
  stampsN: n => `🛂 ${n} nouveau${pl(n, "", "x")} tampon${pl(n, "", "s")} :`,
  keepRev: "Continuer à réviser 📚", menuH: "Menu 🏠", redoDefi: "Refaire le défi 🔁", againB: "Rejouer 🔁",
  lockedLvl: n => `🔒 Niveau ${n} pour débloquer !`,
};
export function t(k, ...a) { const v = (P && P.UI[k] !== undefined) ? P.UI[k] : FR[k]; return typeof v === "function" ? v(...a) : v; }
export const tt = k => (P && P.UI[k] !== undefined) ? P.UI[k] : FR[k]; // objets / tableaux (ty, ml, q…)
// textes statiques du HTML : <… data-i18n="clé">
export function applyStatic(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
  root.querySelectorAll("[data-i18n-title]").forEach(el => el.setAttribute("title", t(el.dataset.i18nTitle)));
}

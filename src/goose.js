// Dessin de l'oie (SVG, coordonnées : pattes en 0,0, tête vers -41), plumages et accessoires à débloquer.
const O = "#2b3a55";

// ---------- plumages (« oies ») ----------
// unlock : { lvl } (niveau) ou { medal } (médaille : continent complet au passeport, etc.)
// spots : motif dessiné sur le corps ; head : motif sur la tête
export const PLUMES = [
  { id: "blanche", nom: "Oie blanche", e: "🪿", body: "#fff", wing: "#cfd8e6", tail: "#e9eef5" },
  { id: "cendree", nom: "Oie cendrée", e: "🩶", body: "#dcc7a6", wing: "#a98b66", tail: "#c9b08c", unlock: { lvl: 5 } },
  { id: "royale", nom: "Oie royale", e: "🏰", body: "#f2f4ff", wing: "#5b7cf0", tail: "#3d5bd1", unlock: { medal: "europe" }, why: "tous les tampons d'Europe",
    spots: `<path d="M-14,-14 Q-1,-9 13,-14" fill="none" stroke="#ffcc33" stroke-width="1.6"/>` },
  { id: "girafe", nom: "Oie girafe", e: "🦒", body: "#f6cf74", wing: "#d99a3a", tail: "#e3b25a", unlock: { medal: "afrique" }, why: "tous les tampons d'Afrique",
    spots: `<g fill="#b8732a" opacity=".85"><path d="M-10,-22 l3,-1 2,2 -1,3 -3,0 Z"/><path d="M-3,-14 l3,-1 2,2 -1,3 -3,0 Z"/><path d="M4,-22 l3,-1 2,2 -1,3 -3,0 Z"/><path d="M-12,-15 l2,-1 2,1 -1,2 -2,0 Z"/><path d="M8,-15 l2,-1 2,1 -1,2 -2,0 Z"/></g>`,
    head: `<circle cx="11.6" cy="-44.6" r="1.3" fill="#b8732a"/>` },
  { id: "panda", nom: "Oie panda", e: "🐼", body: "#fff", wing: "#262a33", tail: "#262a33", unlock: { medal: "asie" }, why: "tous les tampons d'Asie",
    head: `<ellipse cx="15.2" cy="-42.4" rx="2.6" ry="2.2" fill="#262a33"/><circle cx="15.6" cy="-42.8" r=".9" fill="#fff"/>` },
  { id: "toucan", nom: "Oie toucan", e: "🦜", body: "#2b3040", wing: "#1d2230", tail: "#1d2230", beak: "#ffb300", unlock: { medal: "ameriques" }, why: "tous les tampons des Amériques",
    spots: `<ellipse cx="7" cy="-20" rx="6" ry="5" fill="#fff6d6"/>`, head: `<circle cx="15" cy="-42.5" r="2.4" fill="#7fd6ff"/>` },
  { id: "recif", nom: "Oie récif", e: "🐠", body: "#ff9a52", wing: "#fff", tail: "#ff7a2a", unlock: { medal: "oceanie" }, why: "tous les tampons d'Océanie",
    spots: `<path d="M-6,-27.5 Q-8,-18 -6,-8.6 M2,-27.8 Q0,-18 2,-8.2" fill="none" stroke="#fff" stroke-width="2.6"/>` },
  { id: "doree", nom: "Oie dorée", e: "✨", body: "#ffd95a", wing: "#f0b400", tail: "#e6a800", unlock: { medal: "defi7" }, why: "7 jours de défi d'affilée",
    spots: `<path d="M-6,-24 l1,2 2,0 -1.6,1.4 .6,2 -2,-1.2 -2,1.2 .6,-2 -1.6,-1.4 2,0 Z" fill="#fff6c2"/>` },
  { id: "cosmique", nom: "Oie cosmique", e: "🌌", body: "#2e2a6e", wing: "#8a5cff", tail: "#5b3cc4", unlock: { medal: "tour" }, why: "les 197 pays au passeport",
    spots: `<g fill="#fff"><circle cx="-8" cy="-20" r=".8"/><circle cx="-1" cy="-13" r=".6"/><circle cx="5" cy="-21" r=".9"/><circle cx="-12" cy="-14" r=".6"/><circle cx="9" cy="-14" r=".7"/></g>`,
    head: `<circle cx="10.5" cy="-44" r=".6" fill="#fff"/>` },
];
PLUMES.forEach(p => { if (p.unlock && p.why) p.unlock.why = p.why; });
// oie du joueur 2 en partie à deux : cendrée (ou blanche si le joueur 1 a pris la cendrée)
export const plumeOf = id => PLUMES.find(p => p.id === id) || PLUMES[0];
export const PLUME = [PLUMES[0], PLUMES[1]];

// ---------- accessoires : un par emplacement ; unlock { lvl } ou { medal } ----------
export const SLOTS = { tete: "Tête", yeux: "Yeux", bec: "Bec", cou: "Cou", dos: "Dos", pattes: "Pattes", objet: "À la patte" };
const A = (id, slot, e, nom, unlock, svg, back) => ({ id, slot, e, nom, unlock, svg, back });
export const ACCESSORIES = [
  // tête
  A("casquette", "tete", "🧢", "Casquette", { lvl: 2 }, `<path d="M7.6,-43.5 C8,-50.8 19,-50.8 19.4,-43.5 Z" fill="#e8463a" stroke="${O}" stroke-width="1.4"/><path d="M18.4,-44.7 L26.5,-43.6 Q22.4,-42.2 18.6,-42.8 Z" fill="#c43328" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="13.5" cy="-49.4" r="1.1" fill="#fff"/>`),
  A("bonnet", "tete", "🧶", "Bonnet à pompon", { lvl: 3 }, `<path d="M7.6,-44 C7.4,-52.5 19.6,-52.5 19.4,-44 Z" fill="#2f6fd6" stroke="${O}" stroke-width="1.3"/><rect x="7" y="-45.6" width="13" height="3.2" rx="1.4" fill="#fff" stroke="${O}" stroke-width="1"/><circle cx="13.5" cy="-52.6" r="2.4" fill="#fff" stroke="${O}" stroke-width="1"/>`),
  A("fete", "tete", "🥳", "Chapeau de fête", { lvl: 4 }, `<path d="M9.5,-45.5 L13.8,-58 L18.2,-45.5 Z" fill="#ff5fa2" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><path d="M10.8,-49 L16.8,-49 M12.2,-53 L15.4,-53" stroke="#ffd84a" stroke-width="1.6"/><circle cx="13.8" cy="-58.5" r="1.8" fill="#ffd84a" stroke="${O}" stroke-width=".8"/>`),
  A("explorateur", "tete", "🤠", "Chapeau d'explorateur", { lvl: 6 }, `<ellipse cx="13.5" cy="-45.6" rx="10.2" ry="2.5" fill="#d9b36a" stroke="${O}" stroke-width="1.2"/><path d="M8.3,-45.9 C8.6,-53.8 18.4,-53.8 18.7,-45.9 Z" fill="#e6c27a" stroke="${O}" stroke-width="1.3"/><path d="M8.7,-47.8 L18.3,-47.8" stroke="#8a5a2b" stroke-width="1.7"/>`),
  A("aviateur", "tete", "✈️", "Casque d'aviateur", { lvl: 8 }, `<path d="M7.4,-41.2 C6.8,-51 20.2,-51 19.8,-43.4 L17.8,-44.2 C16.4,-47.6 10.4,-47.8 9.8,-40.6 Z" fill="#8a5a2b" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="11.6" cy="-47.6" r="2.4" fill="#bfe6ff" stroke="${O}" stroke-width="1.1"/><circle cx="16.2" cy="-47.6" r="2.4" fill="#bfe6ff" stroke="${O}" stroke-width="1.1"/>`),
  A("couronne", "tete", "👑", "Couronne", { lvl: 10 }, `<path d="M8.2,-45.6 L7.6,-53.2 L11,-49.4 L13.5,-54.8 L16,-49.4 L19.4,-53.2 L18.8,-45.6 Z" fill="#ffcc33" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><circle cx="13.5" cy="-48.2" r="1.3" fill="#e8463a"/>`),
  A("chantier", "tete", "⛑️", "Casque de chantier", { lvl: 13 }, `<path d="M7.6,-44.2 C7.6,-52 19.4,-52 19.4,-44.2 Z" fill="#ffcc33" stroke="${O}" stroke-width="1.3"/><rect x="6.2" y="-45.2" width="14.6" height="2.4" rx="1.1" fill="#f0b400" stroke="${O}" stroke-width=".9"/><path d="M13.5,-51.4 L13.5,-45.6" stroke="#f0b400" stroke-width="1.6"/>`),
  A("cowboy", "tete", "🐎", "Chapeau de cowboy", { lvl: 14 }, `<path d="M4.6,-45.8 Q13.5,-41.6 22.4,-45.8 Q20,-43.8 13.5,-43.8 Q7,-43.8 4.6,-45.8 Z" fill="#a0612a" stroke="${O}" stroke-width="1.1"/><path d="M8.6,-45 C8.4,-51 10.5,-53 13.5,-50.6 C16.5,-53 18.6,-51 18.4,-45 Z" fill="#b8733a" stroke="${O}" stroke-width="1.3"/><path d="M8.8,-46.6 L18.2,-46.6" stroke="#5a3417" stroke-width="1.4"/>`),
  A("magicien", "tete", "🧙", "Chapeau de magicien", { lvl: 15 }, `<ellipse cx="13.5" cy="-45.7" rx="9.2" ry="2.3" fill="#5b3cc4" stroke="${O}" stroke-width="1.2"/><path d="M8.8,-45.9 L14.6,-62 L18.6,-45.9 Z" fill="#6c4ae0" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><path d="M13.6,-53 l.8,1.6 1.7,.2 -1.2,1.2 .3,1.7 -1.6,-.8 -1.6,.8 .3,-1.7 -1.2,-1.2 1.7,-.2 Z" fill="#ffd84a"/>`),
  A("sombrero", "tete", "🌵", "Sombrero", { lvl: 17 }, `<ellipse cx="13.5" cy="-45.4" rx="12.8" ry="2.9" fill="#e8b94a" stroke="${O}" stroke-width="1.2"/><path d="M9.4,-45.6 C9.6,-52.8 17.4,-52.8 17.6,-45.6 Z" fill="#f0c860" stroke="${O}" stroke-width="1.3"/><path d="M9.6,-47.6 L17.4,-47.6" stroke="#d6453a" stroke-width="1.6"/>`),
  A("fleurs", "tete", "🌸", "Couronne de fleurs", { lvl: 18 }, `<path d="M7.5,-45.6 Q13.5,-50 19.5,-45.6" fill="none" stroke="#3c9a5f" stroke-width="1.3"/>` + [[8, -46.2, "#ff5fa2"], [10.8, -48.2, "#ffd84a"], [13.8, -49, "#8ad0ff"], [16.8, -48.2, "#ff9a2e"], [19.4, -46, "#c38cff"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="${c}" stroke="${O}" stroke-width=".5"/><circle cx="${x}" cy="${y}" r=".6" fill="#fff"/>`).join("")),
  A("hautdeforme", "tete", "🎩", "Haut-de-forme", { lvl: 19 }, `<rect x="9" y="-56.4" width="9" height="10.4" rx="1" fill="#1d2433" stroke="${O}" stroke-width="1.2"/><ellipse cx="13.5" cy="-45.9" rx="8.6" ry="1.9" fill="#1d2433" stroke="${O}" stroke-width="1.1"/><rect x="9" y="-49" width="9" height="2.2" fill="#d6453a"/>`),
  A("pirate", "tete", "🏴‍☠️", "Chapeau de pirate", { medal: "ile", why: "médaille « Île au trésor »" }, `<path d="M6.2,-45 Q13.5,-40.8 20.8,-45 L19.2,-50.8 Q13.5,-55.4 7.8,-50.8 Z" fill="#1d2433" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><circle cx="13.5" cy="-48.6" r="1.7" fill="#fff"/><path d="M12,-46.4 L15,-46.4" stroke="#fff" stroke-width="1"/>`),
  A("chef", "tete", "👨‍🍳", "Toque de chef", { medal: "quiz", why: "médaille « Je-sais-tout »" }, `<rect x="9" y="-50" width="9" height="5.6" rx="1" fill="#fff" stroke="${O}" stroke-width="1.2"/><path d="M8,-50 C5,-54 9,-58.4 11.5,-55.6 C12.5,-59.2 16,-59.2 16.5,-55.6 C19,-58.4 22.5,-54 19,-50 Z" fill="#fff" stroke="${O}" stroke-width="1.3"/>`),
  A("viking", "tete", "🪓", "Casque viking", { medal: "inarretable", why: "médaille « Inarrêtable »" }, `<path d="M8.6,-48.5 C5,-49 4,-53 5,-56.4 C6.5,-53 7.5,-52 9.4,-51.5 Z M18.4,-48.5 C22,-49 23,-53 22,-56.4 C20.5,-53 19.5,-52 17.6,-51.5 Z" fill="#f3ead2" stroke="${O}" stroke-width="1.1"/><path d="M7.8,-44 C7.8,-52 19.2,-52 19.2,-44 Z" fill="#9aa7b8" stroke="${O}" stroke-width="1.3"/><path d="M7.8,-45.4 L19.2,-45.4" stroke="#6b778a" stroke-width="1.6"/>`),
  A("astronaute", "tete", "👩‍🚀", "Casque d'astronaute", { medal: "globe", why: "médaille « Globe-trotteur »" }, `<circle cx="14" cy="-41" r="10.4" fill="rgba(190,230,255,.3)" stroke="#dfe7f2" stroke-width="2.2"/><path d="M8.4,-47.2 Q11,-49.8 14.6,-49.4" stroke="#fff" stroke-width="1.5" fill="none" opacity=".9"/><path d="M7,-33 Q14,-29 21,-33" fill="none" stroke="#c9d3e6" stroke-width="2.4"/>`),
  A("aureole", "tete", "😇", "Auréole", { medal: "sansfaute", why: "médaille « Sans faute »" }, `<ellipse cx="13.5" cy="-53.4" rx="6.6" ry="1.9" fill="none" stroke="#ffd84a" stroke-width="2.2"/>`),
  // yeux
  A("lunettes", "yeux", "🕶️", "Lunettes de soleil", { lvl: 3 }, `<path d="M12.6,-43 L7.8,-42.2" stroke="#1d2433" stroke-width="1.1"/><rect x="12.2" y="-44.8" width="6.8" height="4" rx="1.7" fill="#1d2433" stroke="${O}" stroke-width=".8"/><path d="M13.6,-43.9 L15.8,-43.9" stroke="#fff" stroke-width=".8" opacity=".75"/>`),
  A("rondes", "yeux", "👓", "Lunettes rondes", { lvl: 6 }, `<path d="M12.6,-42.8 L7.8,-42" stroke="#8a5a2b" stroke-width="1"/><circle cx="15.3" cy="-42.6" r="2.8" fill="rgba(255,255,255,.25)" stroke="#8a5a2b" stroke-width="1.1"/>`),
  A("coeur", "yeux", "😍", "Lunettes cœur", { lvl: 13 }, `<path d="M12.4,-43 L7.8,-42.2" stroke="#ff4f8b" stroke-width="1"/><path d="M15.3,-40 C11.4,-42.6 12.5,-46.2 15.3,-44.3 C18.1,-46.2 19.2,-42.6 15.3,-40 Z" fill="#ff4f8b" stroke="${O}" stroke-width=".8"/>`),
  A("monocle", "yeux", "🧐", "Monocle", { lvl: 16 }, `<circle cx="15.2" cy="-42.6" r="2.9" fill="rgba(255,255,255,.2)" stroke="#d4a017" stroke-width="1.2"/><path d="M15.4,-39.7 Q15,-34 12,-31" fill="none" stroke="#d4a017" stroke-width=".7"/>`),
  A("plongee", "yeux", "🤿", "Masque de plongée", { lvl: 17 }, `<path d="M11.6,-43 L7.4,-42" stroke="#2f6fd6" stroke-width="1.7"/><rect x="11.4" y="-45.8" width="8.2" height="6.2" rx="2.3" fill="rgba(140,220,255,.55)" stroke="#2f6fd6" stroke-width="1.4"/>`),
  A("cacheoeil", "yeux", "🏴", "Cache-œil", { medal: "ile", why: "médaille « Île au trésor »" }, `<path d="M7.6,-45.8 L19.8,-40.2" stroke="#1d2433" stroke-width=".9"/><circle cx="15.1" cy="-42.6" r="2.5" fill="#1d2433"/>`),
  // bec
  A("moustache", "bec", "🥸", "Moustache", { lvl: 8 }, `<path d="M17.6,-38.4 C19.6,-36.8 22,-37.4 23,-38.4 C22,-35.2 18.6,-35 17.6,-38.4 Z" fill="#5a3417" stroke="${O}" stroke-width=".5"/>`),
  A("sucette", "bec", "🍭", "Sucette", { lvl: 9 }, `<path d="M24,-40 L30,-36" stroke="#fff" stroke-width="1.2"/><circle cx="31.4" cy="-35.2" r="2.9" fill="#ff5fa2" stroke="${O}" stroke-width=".8"/><path d="M30,-36.4 Q31.6,-34 33,-35.6" stroke="#fff" stroke-width=".8" fill="none"/>`),
  A("fleurbec", "bec", "🌼", "Fleur dans le bec", { lvl: 11 }, `<path d="M22,-40.4 L30,-44.4" stroke="#3c9a5f" stroke-width="1.1"/><circle cx="31.2" cy="-45" r="2.4" fill="#ffd84a" stroke="${O}" stroke-width=".6"/><circle cx="31.2" cy="-45" r=".9" fill="#ff9a2e"/>`),
  // cou
  A("echarpe", "cou", "🧣", "Écharpe", { lvl: 4 }, `<path d="M8.6,-27.4 L5.4,-19.4 L9.4,-18.9 L11,-26.4 Z" fill="#e8463a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.8,-31 Q11.6,-27.8 15.9,-31.2 L16.6,-27.2 Q12,-23.6 6.7,-27 Z" fill="#e8463a" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.6,-29.6 L9.3,-26.2 M12.8,-29 L13,-25.6" stroke="#fff" stroke-width="1.3"/>`),
  A("noeud", "cou", "🎀", "Nœud papillon", { lvl: 5 }, `<path d="M14.6,-25.4 L10.4,-28.6 L10.6,-22.2 Z M14.6,-25.4 L18.8,-28.6 L18.6,-22.2 Z" fill="#2f6fd6" stroke="${O}" stroke-width="1" stroke-linejoin="round"/><circle cx="14.6" cy="-25.4" r="1.5" fill="#1f4fa6" stroke="${O}" stroke-width=".7"/>`),
  A("bandana", "cou", "🤠", "Bandana", { lvl: 9 }, `<path d="M6.8,-30.2 Q12,-27 16.8,-30.8 L13.8,-22.6 Z" fill="#d6453a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="12.4" cy="-27.4" r=".8" fill="#fff"/><circle cx="14.4" cy="-25.8" r=".7" fill="#fff"/><circle cx="10.2" cy="-28.4" r=".7" fill="#fff"/>`),
  A("collier", "cou", "🌺", "Collier de fleurs", { lvl: 11 }, [[7.2, -28.8, "#ff5fa2"], [9.4, -26.4, "#ffd84a"], [12.2, -25.4, "#ff5fa2"], [15, -26.2, "#ffd84a"], [16.8, -28.6, "#ff5fa2"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2" fill="${c}" stroke="${O}" stroke-width=".5"/>`).join("")),
  A("cravate", "cou", "👔", "Cravate", { lvl: 14 }, `<path d="M13.2,-28 L11.8,-26 L13.2,-17.4 L14.8,-26 Z" fill="#d6453a" stroke="${O}" stroke-width="1" stroke-linejoin="round"/><path d="M11.4,-28.6 L15,-28.6 L14.4,-26.4 L12,-26.4 Z" fill="#b8352b" stroke="${O}" stroke-width=".8"/>`),
  A("medaille", "cou", "🥇", "Médaille d'or", { medal: "feu", why: "médaille « En feu »" }, `<path d="M8.5,-30.4 L13,-22.6 L17,-30.4" fill="none" stroke="#2f6fd6" stroke-width="1.7"/><circle cx="13" cy="-21.2" r="3.1" fill="#ffcc33" stroke="${O}" stroke-width="1"/><path d="M13,-22.6 l.5,1 1.1,.1 -.8,.8 .2,1.1 -1,-.5 -1,.5 .2,-1.1 -.8,-.8 1.1,-.1 Z" fill="#fff6c2"/>`),
  // dos
  A("sac", "dos", "🎒", "Sac d'aventurier", { lvl: 7 }, `<rect x="-13.5" y="-33.5" width="11.5" height="12.5" rx="3.2" fill="#3c9a5f" stroke="${O}" stroke-width="1.3"/><rect x="-12" y="-27.4" width="8.5" height="4.4" rx="1.6" fill="#2f7d4c" stroke="${O}" stroke-width=".9"/><path d="M-2.4,-31.4 Q3,-30.4 6.2,-25.4" fill="none" stroke="${O}" stroke-width="1.3"/>`),
  A("cape", "dos", "🦸", "Cape de super-oie", { lvl: 12 }, `<path d="M6,-29.5 Q-6,-31.5 -20.5,-14 Q-24.5,-5.5 -16,-6 Q-6,-12 4,-20 Z" fill="#e8463a" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>`, true),
  A("guitare", "dos", "🎸", "Guitare", { lvl: 16 }, `<path d="M-9.5,-27.5 L3,-39" stroke="#8a5a2b" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="-12.6" cy="-23.6" rx="6.2" ry="5.2" fill="#c96a2b" stroke="${O}" stroke-width="1.2"/><circle cx="-12.2" cy="-23.8" r="1.6" fill="#5a3417"/>`),
  A("bouee", "dos", "🛟", "Bouée canard", { lvl: 18 }, `<ellipse cx="-1" cy="-16.6" rx="17" ry="5.2" fill="none" stroke="#ff5a4f" stroke-width="4"/><path d="M-12,-14 L-10.4,-19.2 M8,-14 L6.4,-19.2" stroke="#fff" stroke-width="3"/>`),
  A("jetpack", "dos", "🚀", "Réacteur dorsal", { medal: "survie15", why: "médaille « Survivant »" }, `<path d="M-13,-22 L-11,-15 L-9,-22 Z M-7.5,-22 L-5.5,-15 L-3.5,-22 Z" fill="#ff9a2e"/><rect x="-14" y="-34" width="6" height="12.5" rx="2.5" fill="#9aa7b8" stroke="${O}" stroke-width="1.2"/><rect x="-8.5" y="-34" width="6" height="12.5" rx="2.5" fill="#9aa7b8" stroke="${O}" stroke-width="1.2"/>`, true),
  A("carapace", "dos", "🐢", "Carapace de tortue", { medal: "merveilles", why: "médaille « Chasseur de merveilles »" }, `<path d="M-16,-21.6 C-16,-34.4 6,-36 8,-24 Z" fill="#5b8a3c" stroke="${O}" stroke-width="1.3"/><path d="M-10,-31 L-4,-24 M-2,-33 L-1,-24.6 M4,-30 L0,-25" stroke="#3d6127" stroke-width="1.1" fill="none"/>`),
  // pattes
  A("baskets", "pattes", "👟", "Baskets", { lvl: 2 }, `<path d="M-9.5,-2.6 L-1,-2.6 L-1,1.6 L-10.4,1.6 Z M1,-2.6 L9.5,-2.6 L10.4,1.6 L1,1.6 Z" fill="#fff" stroke="${O}" stroke-width="1"/><path d="M-10.2,1.4 L-1.2,1.4 M1.2,1.4 L10.2,1.4" stroke="#d6453a" stroke-width="1.5"/>`),
  A("bottes", "pattes", "🥾", "Bottes de pluie", { lvl: 7 }, `<path d="M-7,-7.4 L-2,-7.4 L-2,1.6 L-9,1.6 L-9,-1 L-7,-1 Z M2,-7.4 L7,-7.4 L7,-1 L9,-1 L9,1.6 L2,1.6 Z" fill="#ffcc33" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>`),
  A("palmes", "pattes", "🦆", "Palmes", { lvl: 10 }, `<path d="M-10,1.6 L-1.4,-1.2 L-1,2.2 Z M1,-1.2 L10.6,1.6 L1.2,2.2 Z" fill="#2fb7d6" stroke="${O}" stroke-width=".9" stroke-linejoin="round"/>`),
  A("patins", "pattes", "🛼", "Patins à roulettes", { lvl: 20 }, `<path d="M-9.5,-3 L-1,-3 L-1,0.6 L-10.4,0.6 Z M1,-3 L9.5,-3 L10.4,0.6 L1,0.6 Z" fill="#ff5fa2" stroke="${O}" stroke-width="1"/><g fill="#ffd84a" stroke="${O}" stroke-width=".7"><circle cx="-8" cy="2.4" r="1.5"/><circle cx="-3" cy="2.4" r="1.5"/><circle cx="3" cy="2.4" r="1.5"/><circle cx="8" cy="2.4" r="1.5"/></g>`),
  // objet tenu (derrière l'oie)
  A("ballon", "objet", "🎈", "Ballon", { lvl: 5 }, `<path d="M2,-12 Q6,-34 -2,-50" fill="none" stroke="${O}" stroke-width=".7"/><ellipse cx="-3" cy="-56" rx="5.2" ry="6.2" fill="#e8463a" stroke="${O}" stroke-width="1"/><path d="M-5,-58.6 Q-4.4,-60.4 -2.6,-60.8" stroke="#fff" stroke-width="1" fill="none"/>`, true),
  A("drapeau", "objet", "🚩", "Drapeau d'explorateur", { lvl: 12 }, `<path d="M-6,-12 L-6,-50" stroke="#8a5a2b" stroke-width="1.5"/><path d="M-6,-50 L6,-46.6 L-6,-42.6 Z" fill="#22b07d" stroke="${O}" stroke-width=".8" stroke-linejoin="round"/>`, true),
  A("baguette", "objet", "🪄", "Baguette magique", { lvl: 15 }, `<path d="M-2,-18 L-13,-35" stroke="#1d2433" stroke-width="1.7" stroke-linecap="round"/><path d="M-13.4,-35.6 l1,-2.4 2.3,-.2 -1.8,-1.6 .5,-2.3 -2,1.1 -2,-1.1 .5,2.3 -1.8,1.6 2.3,.2 Z" fill="#ffd84a" stroke="${O}" stroke-width=".5"/>`, true),
  A("parapluie", "objet", "☂️", "Parapluie", { lvl: 19 }, `<path d="M-4,-14 L-4,-52" stroke="${O}" stroke-width="1.1"/><path d="M-16.5,-50.4 Q-4,-62.6 8.5,-50.4 Q5.4,-52.4 2.2,-50.4 Q-0.9,-52.4 -4,-50.4 Q-7.1,-52.4 -10.2,-50.4 Q-13.4,-52.4 -16.5,-50.4 Z" fill="#7a4bb0" stroke="${O}" stroke-width="1" stroke-linejoin="round"/>`, true),
];
// débloqué ? (ctx = { lvl, medals })
export const isUnlocked = (u, ctx) => !u || (u.lvl ? ctx.lvl >= u.lvl : !!ctx.medals[u.medal]);
export const unlockText = u => u.lvl ? `niveau ${u.lvl}` : `🏅 ${u.why || "médaille"}`;

// corps de l'oie + accessoires équipés (equip = {slot: id, plume: id}), en SVG (à mettre dans un <g>)
export function gooseParts(pl = PLUMES[0], equip = {}) {
  const acc = Object.entries(equip).filter(([k]) => k !== "plume").map(([, id]) => ACCESSORIES.find(a => a.id === id)).filter(Boolean);
  const back = acc.filter(a => a.back).map(a => a.svg).join("");
  const by = s => acc.filter(a => a.slot === s && !a.back).map(a => a.svg).join("");
  const beak = pl.beak || "#ff9a2e";
  return back +
    `<path d="M-3,-11 L-4,0 M3,-11 L4,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M-8,0 L-1,0 M1,0 L8,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>` +
    by("pattes") +
    `<path d="M-14,-20 L-24,-27 L-21,-15 Z" fill="${pl.tail}" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<ellipse cx="-1" cy="-18" rx="15" ry="10" fill="${pl.body}" stroke="${O}" stroke-width="1.8"/>` +
    `<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="${O}" stroke-width="9.6" stroke-linecap="round"/>` +
    `<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="${pl.body}" stroke-width="6" stroke-linecap="round"/>` +
    `<ellipse cx="-1" cy="-17.5" rx="13.2" ry="8.2" fill="${pl.body}"/>` +
    (pl.spots || "") + by("dos") +
    `<path class="wing" d="M-11,-21 C-6,-27 5,-26 7,-19 C1,-15 -7,-15 -11,-21 Z" fill="${pl.wing}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>` +
    by("cou") +
    `<circle cx="13.5" cy="-41" r="6.2" fill="${pl.body}" stroke="${O}" stroke-width="1.8"/>` +
    `<path d="M18.5,-43.5 L27,-40.5 L18.5,-37.5 Z" fill="${beak}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>` +
    (pl.head || "") +
    `<circle cx="15" cy="-42.5" r="1.5" fill="${O}"/>` +
    `<ellipse cx="12.6" cy="-38.6" rx="1.8" ry="1.1" fill="#ffb3a7" opacity=".8"/>` +
    by("bec") + by("yeux") + by("tete");
}
// oie seule dans un <svg> autonome (aperçus : menu, écran « Mon oie », fin de partie)
export function gooseSVG(equip = {}, cls = "", vb = "-30 -66 62 72") {
  return `<svg class="goosesvg ${cls}" viewBox="${vb}"><ellipse class="gshadow" cx="0" cy="1" rx="15" ry="3.5" fill="rgba(0,30,60,.22)"/><g class="gbody">${gooseParts(plumeOf(equip.plume), equip)}</g></svg>`;
}

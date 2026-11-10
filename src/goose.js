// Dessin de l'oie (SVG, coordonnées : pattes en 0,0, tête vers -41) et accessoires à débloquer par niveau.
const O = "#2b3a55";
export const PLUME = [
  { body: "#fff", wing: "#cfd8e6", tail: "#e9eef5" },      // oie blanche (joueur 1)
  { body: "#dcc7a6", wing: "#a98b66", tail: "#c9b08c" },   // oie cendrée (joueur 2)
];

// slot : une seule pièce par emplacement. lvl : niveau qui la débloque.
export const ACCESSORIES = [
  { id: "casquette", slot: "tete", lvl: 2, e: "🧢", nom: "Casquette",
    svg: `<path d="M7.6,-43.5 C8,-50.8 19,-50.8 19.4,-43.5 Z" fill="#e8463a" stroke="${O}" stroke-width="1.4"/><path d="M18.4,-44.7 L26.5,-43.6 Q22.4,-42.2 18.6,-42.8 Z" fill="#c43328" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="13.5" cy="-49.4" r="1.1" fill="#fff"/>` },
  { id: "lunettes", slot: "yeux", lvl: 3, e: "🕶️", nom: "Lunettes de soleil",
    svg: `<path d="M12.6,-43 L7.8,-42.2" stroke="#1d2433" stroke-width="1.1"/><rect x="12.2" y="-44.8" width="6.8" height="4" rx="1.7" fill="#1d2433" stroke="${O}" stroke-width=".8"/><path d="M13.6,-43.9 L15.8,-43.9" stroke="#fff" stroke-width=".8" opacity=".75"/>` },
  { id: "echarpe", slot: "cou", lvl: 4, e: "🧣", nom: "Écharpe",
    svg: `<path d="M8.6,-27.4 L5.4,-19.4 L9.4,-18.9 L11,-26.4 Z" fill="#e8463a" stroke="${O}" stroke-width="1.1" stroke-linejoin="round"/><path d="M6.8,-31 Q11.6,-27.8 15.9,-31.2 L16.6,-27.2 Q12,-23.6 6.7,-27 Z" fill="#e8463a" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><path d="M9.6,-29.6 L9.3,-26.2 M12.8,-29 L13,-25.6" stroke="#fff" stroke-width="1.3"/>` },
  { id: "noeud", slot: "cou", lvl: 5, e: "🎀", nom: "Nœud papillon",
    svg: `<path d="M14.6,-25.4 L10.4,-28.6 L10.6,-22.2 Z M14.6,-25.4 L18.8,-28.6 L18.6,-22.2 Z" fill="#2f6fd6" stroke="${O}" stroke-width="1" stroke-linejoin="round"/><circle cx="14.6" cy="-25.4" r="1.5" fill="#1f4fa6" stroke="${O}" stroke-width=".7"/>` },
  { id: "explorateur", slot: "tete", lvl: 6, e: "🤠", nom: "Chapeau d'explorateur",
    svg: `<ellipse cx="13.5" cy="-45.6" rx="10.2" ry="2.5" fill="#d9b36a" stroke="${O}" stroke-width="1.2"/><path d="M8.3,-45.9 C8.6,-53.8 18.4,-53.8 18.7,-45.9 Z" fill="#e6c27a" stroke="${O}" stroke-width="1.3"/><path d="M8.7,-47.8 L18.3,-47.8" stroke="#8a5a2b" stroke-width="1.7"/>` },
  { id: "sac", slot: "dos", lvl: 7, e: "🎒", nom: "Sac d'aventurier",
    svg: `<rect x="-13.5" y="-33.5" width="11.5" height="12.5" rx="3.2" fill="#3c9a5f" stroke="${O}" stroke-width="1.3"/><rect x="-12" y="-27.4" width="8.5" height="4.4" rx="1.6" fill="#2f7d4c" stroke="${O}" stroke-width=".9"/><path d="M-2.4,-31.4 Q3,-30.4 6.2,-25.4" fill="none" stroke="${O}" stroke-width="1.3"/>` },
  { id: "aviateur", slot: "tete", lvl: 8, e: "✈️", nom: "Casque d'aviateur",
    svg: `<path d="M7.4,-41.2 C6.8,-51 20.2,-51 19.8,-43.4 L17.8,-44.2 C16.4,-47.6 10.4,-47.8 9.8,-40.6 Z" fill="#8a5a2b" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="11.6" cy="-47.6" r="2.4" fill="#bfe6ff" stroke="${O}" stroke-width="1.1"/><circle cx="16.2" cy="-47.6" r="2.4" fill="#bfe6ff" stroke="${O}" stroke-width="1.1"/>` },
  { id: "couronne", slot: "tete", lvl: 10, e: "👑", nom: "Couronne",
    svg: `<path d="M8.2,-45.6 L7.6,-53.2 L11,-49.4 L13.5,-54.8 L16,-49.4 L19.4,-53.2 L18.8,-45.6 Z" fill="#ffcc33" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><circle cx="13.5" cy="-48.2" r="1.3" fill="#e8463a"/>` },
  { id: "cape", slot: "dos", lvl: 12, e: "🦸", nom: "Cape de super-oie", back: true,
    svg: `<path d="M6,-29.5 Q-6,-31.5 -20.5,-14 Q-24.5,-5.5 -16,-6 Q-6,-12 4,-20 Z" fill="#e8463a" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>` },
  { id: "magicien", slot: "tete", lvl: 15, e: "🧙", nom: "Chapeau de magicien",
    svg: `<ellipse cx="13.5" cy="-45.7" rx="9.2" ry="2.3" fill="#5b3cc4" stroke="${O}" stroke-width="1.2"/><path d="M8.8,-45.9 L14.6,-62 L18.6,-45.9 Z" fill="#6c4ae0" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/><path d="M13.6,-53 l.8,1.6 1.7,.2 -1.2,1.2 .3,1.7 -1.6,-.8 -1.6,.8 .3,-1.7 -1.2,-1.2 1.7,-.2 Z" fill="#ffd84a"/>` },
];
export const SLOTS = { tete: "Tête", yeux: "Yeux", cou: "Cou", dos: "Dos" };

// corps de l'oie + accessoires équipés (equip = {slot: id}), en SVG (à mettre dans un <g>)
export function gooseParts(pl = PLUME[0], equip = {}) {
  const acc = Object.values(equip).map(id => ACCESSORIES.find(a => a.id === id)).filter(Boolean);
  const back = acc.filter(a => a.back).map(a => a.svg).join("");
  const by = s => acc.filter(a => a.slot === s && !a.back).map(a => a.svg).join("");
  return back +
    `<path d="M-3,-11 L-4,0 M3,-11 L4,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M-8,0 L-1,0 M1,0 L8,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M-14,-20 L-24,-27 L-21,-15 Z" fill="${pl.tail}" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<ellipse cx="-1" cy="-18" rx="15" ry="10" fill="${pl.body}" stroke="${O}" stroke-width="1.8"/>` +
    `<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="${O}" stroke-width="9.6" stroke-linecap="round"/>` +
    `<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="${pl.body}" stroke-width="6" stroke-linecap="round"/>` +
    `<ellipse cx="-1" cy="-17.5" rx="13.2" ry="8.2" fill="${pl.body}"/>` +
    by("dos") +
    `<path class="wing" d="M-11,-21 C-6,-27 5,-26 7,-19 C1,-15 -7,-15 -11,-21 Z" fill="${pl.wing}" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>` +
    by("cou") +
    `<circle cx="13.5" cy="-41" r="6.2" fill="${pl.body}" stroke="${O}" stroke-width="1.8"/>` +
    `<path d="M18.5,-43.5 L27,-40.5 L18.5,-37.5 Z" fill="#ff9a2e" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<circle cx="15" cy="-42.5" r="1.5" fill="${O}"/>` +
    `<ellipse cx="12.6" cy="-38.6" rx="1.8" ry="1.1" fill="#ffb3a7" opacity=".8"/>` +
    by("yeux") + by("tete");
}
// oie seule dans un <svg> autonome (aperçus : écran « Mon oie », fin de partie)
export function gooseSVG(equip = {}, cls = "") {
  return `<svg class="goosesvg ${cls}" viewBox="-30 -66 62 72"><ellipse class="gshadow" cx="0" cy="1" rx="15" ry="3.5" fill="rgba(0,30,60,.22)"/><g class="gbody">${gooseParts(PLUME[0], equip)}</g></svg>`;
}

// Dessins de l'icône (SVG 1024×1024), partagés par scripts/icons.mjs.
// Une vraie Terre (world-atlas 110m, projection orthographique) + l'oie du jeu (src/goose.js).
import { readFileSync } from "node:fs";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { gooseParts, PLUMES } from "../src/goose.js";

const LAND = topojson.feature(JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url))), "land");
const O = "#2b3a55";

// globe : océan dégradé, terres vertes, graticule léger, reflet
function globe(cx, cy, r, rot, id, { sea = ["#7fd0f5", "#2f8fd8", "#1d5fae"], land = "#9be07a", landEdge = "#4f9e45" } = {}) {
  const pr = d3.geoOrthographic().rotate(rot).translate([cx, cy]).scale(r).clipAngle(90);
  const path = d3.geoPath(pr);
  const grat = path(d3.geoGraticule().step([30, 30])());
  return `<defs>
  <radialGradient id="${id}sea" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${sea[0]}"/><stop offset=".55" stop-color="${sea[1]}"/><stop offset="1" stop-color="${sea[2]}"/></radialGradient>
  <radialGradient id="${id}shine" cx="35%" cy="28%" r="45%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}shade" cx="50%" cy="50%" r="50%"><stop offset=".72" stop-color="#001a40" stop-opacity="0"/><stop offset="1" stop-color="#001a40" stop-opacity=".35"/></radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}sea)"/>
  <path d="${grat}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="${r / 160}"/>
  <path d="${path(LAND)}" fill="${land}" stroke="${landEdge}" stroke-width="${r / 90}" stroke-linejoin="round"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}shade)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}shine)"/>`;
}
const goose = (x, y, s, equip = {}, rot = 0, plume = PLUMES[0]) =>
  `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})"><ellipse cx="0" cy="1" rx="15" ry="3.5" fill="rgba(0,30,60,.25)"/>${gooseParts(plume, equip)}</g>`;
const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${defs}</defs>${body}</svg>`;

// A — l'oie aviatrice atterrit sur le globe, ciel de lever de soleil
export const iconA = () => wrap(
  `<linearGradient id="bgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36e"/><stop offset=".55" stop-color="#ff9f6b"/><stop offset="1" stop-color="#ff7a8a"/></linearGradient>`,
  `<rect width="1024" height="1024" fill="url(#bgA)"/>
  <circle cx="512" cy="1160" r="720" fill="#fff" opacity=".12"/>
  <g fill="#fff" opacity=".9"><ellipse cx="170" cy="250" rx="90" ry="34"/><ellipse cx="230" cy="228" rx="62" ry="40"/><ellipse cx="860" cy="420" rx="80" ry="28"/><ellipse cx="820" cy="402" rx="50" ry="32"/></g>
  <path d="M90,640 C170,420 300,330 400,380" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 34" opacity=".95"/>
  ${globe(512, 930, 400, [-12, -28], "A")}
  ${goose(500, 548, 7.6, { tete: "aviateur", cou: "echarpe" })}`);

// B — épingle de carte avec l'oie dedans, sur un globe
export const iconB = () => wrap(
  `<linearGradient id="bgB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcff"/><stop offset="1" stop-color="#3a9ee6"/></linearGradient>
   <linearGradient id="pin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b5e"/><stop offset="1" stop-color="#e2382f"/></linearGradient>`,
  `<rect width="1024" height="1024" fill="url(#bgB)"/>
  ${globe(512, 1010, 560, [-10, -45], "B")}
  <ellipse cx="512" cy="826" rx="96" ry="26" fill="#002a55" opacity=".3"/>
  <path d="M512,830 C450,700 250,560 250,390 C250,245 367,128 512,128 C657,128 774,245 774,390 C774,560 574,700 512,830 Z" fill="url(#pin)" stroke="#fff" stroke-width="18" stroke-linejoin="round"/>
  <circle cx="512" cy="392" r="200" fill="#fff"/>
  <circle cx="512" cy="392" r="200" fill="none" stroke="#ffd9d4" stroke-width="10"/>
  ${goose(506, 508, 6.6, {})}`);

// C — l'oie à réacteur survole la Terre, la nuit étoilée
export const iconC = () => wrap(
  `<radialGradient id="bgC" cx="50%" cy="20%" r="90%"><stop offset="0" stop-color="#3b3f9e"/><stop offset=".6" stop-color="#1b1f5e"/><stop offset="1" stop-color="#0d1033"/></radialGradient>
   <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="#7fd6ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fd6ff" stop-opacity="0"/></radialGradient>`,
  `<rect width="1024" height="1024" fill="url(#bgC)"/>
  <g fill="#fff">${[[120,140,5],[260,90,3],[380,190,4],[690,120,5],[860,210,4],[930,90,3],[170,330,3],[820,380,5],[90,520,4],[950,470,3],[600,60,3]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}
  <path d="M760,250 l10,26 26,10 -26,10 -10,26 -10,-26 -26,-10 26,-10 Z" fill="#ffe27a"/><path d="M210,230 l7,18 18,7 -18,7 -7,18 -7,-18 -18,-7 18,-7 Z" fill="#ffe27a"/></g>
  <circle cx="512" cy="900" r="520" fill="url(#glow)"/>
  ${globe(512, 1130, 470, [-15, -35], "C")}
  <path d="M120,640 C230,560 330,560 400,600" fill="none" stroke="#ffe27a" stroke-width="12" stroke-linecap="round" stroke-dasharray="2 30"/>
  <g transform="translate(540,560) rotate(-14) scale(7.4)">
    <path d="M-13,-15 Q-11,-2 -11,4 Q-9,-2 -9,-15 Z M-7.5,-15 Q-5.5,0 -5.5,6 Q-3.5,0 -3.5,-15 Z" fill="#ffd34d" opacity=".95"/>
    <path d="M-12.2,-15 Q-11,-8 -11,-5 Q-10,-8 -9.8,-15 Z M-6.7,-15 Q-5.5,-7 -5.5,-4 Q-4.5,-7 -4.3,-15 Z" fill="#fff6c9"/>
    ${gooseParts(PLUMES[0], { dos: "jetpack", yeux: "lunettes", cou: "echarpe" })}
  </g>`);

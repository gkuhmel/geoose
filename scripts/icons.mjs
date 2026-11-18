// Icônes du jeu (web + appli iOS) et écran de démarrage iOS, dessinés depuis l'oie vectorielle.
// Usage : node scripts/icons.mjs (Chromium de Playwright).
// Écrit public/icons/*.png, ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
// (1024 px, fond opaque : Apple refuse la transparence) et Splash.imageset/*.png (2732 px).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const O = "#2b3a55";
const goose = `<g transform="translate(256,350) scale(5.2)">
<ellipse rx="16" ry="4.5" fill="rgba(0,30,60,.22)"/>
<path d="M-3,-11 L-4,0 M3,-11 L4,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>
<path d="M-8,0 L-1,0 M1,0 L8,0" stroke="#f08a24" stroke-width="2.6" stroke-linecap="round"/>
<path d="M-14,-20 L-24,-27 L-21,-15 Z" fill="#e9eef5" stroke="${O}" stroke-width="1.6" stroke-linejoin="round"/>
<ellipse cx="-1" cy="-18" rx="15" ry="10" fill="#fff" stroke="${O}" stroke-width="1.8"/>
<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="${O}" stroke-width="9.6" stroke-linecap="round"/>
<path d="M10,-22 C11,-30 9,-35 13,-41" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="-1" cy="-17.5" rx="13.2" ry="8.2" fill="#fff"/>
<path d="M-11,-21 C-6,-27 5,-26 7,-19 C1,-15 -7,-15 -11,-21 Z" fill="#cfd8e6" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
<circle cx="13.5" cy="-41" r="6.2" fill="#fff" stroke="${O}" stroke-width="1.8"/>
<path d="M18.5,-43.5 L27,-40.5 L18.5,-37.5 Z" fill="#ff9a2e" stroke="${O}" stroke-width="1.4" stroke-linejoin="round"/>
<circle cx="15" cy="-42.5" r="1.5" fill="${O}"/>
<ellipse cx="12.6" cy="-38.6" rx="1.8" ry="1.1" fill="#ffb3a7" opacity=".8"/></g>`;
// fond ciel + globe stylisé ; tout dans la zone sûre (80 %) pour les icônes « maskable »
const svg = sz => `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 512 512">
<defs><radialGradient id="s" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#9ad8f2"/><stop offset=".6" stop-color="#6cbfe6"/><stop offset="1" stop-color="#4aa3d6"/></radialGradient></defs>
<rect width="512" height="512" fill="url(#s)"/>
<circle cx="256" cy="372" r="150" fill="#cdeaa9" stroke="#fff" stroke-width="10"/>
<path d="M150,330 q40,-40 80,-10 t70,0 q30,-30 70,10 M140,400 q50,-20 90,10 t100,-5" fill="none" stroke="#9fd17a" stroke-width="16" stroke-linecap="round"/>
${goose}</svg>`;

const SPLASH_BG = "#5fb3e0"; // même couleur que theme-color et capacitor.config.json
const XC = "ios/App/App/Assets.xcassets";
// écran de démarrage : l'icône en petit au centre, sur le bleu du ciel (iOS recadre le carré)
const splash = sz => { const s = Math.round(sz * .2); return `<div style="width:${sz}px;height:${sz}px;background:${SPLASH_BG};display:flex;align-items:center;justify-content:center">
<div style="width:${s}px;height:${s}px;border-radius:22%;overflow:hidden;box-shadow:0 ${s * .04}px ${s * .12}px rgba(0,40,80,.25)">${svg(s)}</div></div>`; };

const b = await chromium.launch(); const p = await b.newPage();
async function shot(file, sz, html) {
  await p.setViewportSize({ width: sz, height: sz });
  await p.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await p.screenshot({ path: file, omitBackground: false });
}
for (const [n, sz] of [["icon-512", 512], ["icon-192", 192], ["apple-touch-icon", 180]]) await shot(`public/icons/${n}.png`, sz, svg(sz));
await shot(`${XC}/AppIcon.appiconset/AppIcon-512@2x.png`, 1024, svg(1024));
for (const n of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) await shot(`${XC}/Splash.imageset/${n}`, 2732, splash(2732));
await b.close();
console.log("Icônes et écran de démarrage écrits.");

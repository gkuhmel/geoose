// Icônes du jeu (web + appli iOS) et écran de démarrage iOS.
// Dessin : scripts/icon-art.mjs (icône A « Atterrissage » : l'oie aviatrice posée sur une vraie Terre).
// Usage : npm run icons (Chromium de Playwright).
// Écrit public/icons/*.png, ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
// (1024 px, fond opaque : Apple refuse la transparence) et Splash.imageset/*.png (2732 px).
import { createRequire } from "node:module";
import { iconA } from "./icon-art.mjs";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

const ICON = iconA();
const svg = sz => ICON.replace('width="1024" height="1024"', `width="${sz}" height="${sz}"`);
const SPLASH_BG = "#5fb3e0"; // même couleur que theme-color et capacitor.config.json
const XC = "ios/App/App/Assets.xcassets";
// écran de démarrage : l'icône arrondie au centre, sur le bleu du ciel (iOS recadre le carré)
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

// Captures d'écran App Store, en français, sur le build (dist/index.html) : npm run build && node scripts/screenshots.mjs
// Progression « vitrine » préremplie (passeport, médailles, niveau, oie habillée), puis
// 1 écran d'ouverture · 2 menu · 3 question · 4 atterrissage parfait · 5 passeport · 6 Mon oie · 7 zone France.
// Sortie : store-shots/<appareil>/NN-nom.png (dossier ignoré par git).
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { COUNTRIES } from "../src/countries.js";
const require = createRequire(import.meta.url);
let pw; try { pw = require("playwright"); } catch (e) { pw = require(require("node:child_process").execSync("npm root -g").toString().trim() + "/playwright"); }
const { chromium } = pw;

// tailles exigées par App Store Connect (points CSS × échelle = pixels)
const DEVICES = [
  ["iphone-6.9", 440, 956, 3],   // 1320 × 2868 (iPhone Pro Max)
  ["iphone-6.3", 402, 874, 3],   // 1206 × 2622 (iPhone avec Dynamic Island, écran moyen)
  ["iphone-6.1", 393, 852, 3],   // 1179 × 2556
  ["ipad-13", 1032, 1376, 2],    // 2064 × 2752
];
const LANG = process.argv[2] || "fr";
const URL = new globalThis.URL("../dist/index.html", import.meta.url).href;

// progression de démonstration
const today = new Date(), day = d => { const x = new Date(today); x.setDate(x.getDate() - d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const pass = {}, dates = {};
COUNTRIES.forEach((c, i) => {
  if (c.cont === "europe" || (c.tier.pays === 1 && i % 3 !== 2)) {
    pass[c.iso] = i % 4 === 0 ? ["pays", "capitale", "drapeau", "ville"] : i % 3 === 0 ? ["pays", "capitale", "drapeau"] : i % 2 ? ["pays", "capitale"] : ["pays"];
    dates[c.iso] = day(i % 40);
  }
});
const medals = Object.fromEntries(["envol", "pile", "ile", "feu", "inarretable", "sansfaute", "defi3", "defi7", "quiz", "merveilles", "capitales", "europe", "duo", "niveau10", "tourdefrance", "globe", "robinson", "survie15"].map((m, i) => [m, day(i * 2)]));
const days = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map(d => [day(d), 600 + d * 90]));
const STATE = {
  "geoose-langue": LANG,
  "geoose-xp": 3400,
  "geoose-passeport": pass, "geoose-passeport-dates": dates,
  "geoose-medailles": medals,
  "geoose-oie": { plume: "blanche", tete: "aviateur", cou: "echarpe" },
  "geoose-defi": { last: day(0), streak: 9, best: 12, scores: {} },
  "geoose-stats": { games: 48, days, ok: { pays: [180, 210], capitale: [95, 130], drapeau: [88, 110], ville: [30, 45] }, miss: {}, conf: {}, perfects: 14, merveilles: 12, iles: 8, france: 25, bestRun: 17 },
  "geoose-revisions": ["capitale|036", "drapeau|554", "pays|703"],
};

const b = await chromium.launch();
for (const [name, w, h, scale] of DEVICES) {
  const dir = `store-shots/${LANG}/${name}`; mkdirSync(dir, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, hasTouch: true, isMobile: name.startsWith("iphone") });
  const p = await ctx.newPage();
  p.on("pageerror", e => console.log(name, "ERREUR", e.message));
  const open = async (opts, q = "?nosplash&shot") => {
    await p.addInitScript(([s, o]) => { if (sessionStorage.seeded === location.search) return; for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); sessionStorage.seeded = location.search; }, [STATE, opts]);
    if (opts) await p.addInitScript(o => localStorage.setItem("geoose-options", JSON.stringify(o)), opts);
    await p.goto(URL + q); await p.waitForTimeout(1200);
  };
  const shot = n => p.screenshot({ path: `${dir}/${n}.png` });
  const tapTarget = async (dx = 0, dy = 0) => { const [x, y] = await p.evaluate(() => window.__shot.target()); await p.touchscreen.tap(x + dx, y + dy); await p.waitForTimeout(400); };

  // 1 écran d'ouverture
  await p.goto(URL + "?shot"); await p.waitForTimeout(100);
  await open(null, "?shot"); await p.waitForTimeout(200); await shot("01-ouverture");
  // 2 menu
  await open({ mode: "pays", cont: "monde", level: 1, chrono: 0, players: 1 }); await shot("02-menu");
  // 3 question, oie posée près du but ; 4 atterrissage parfait
  await p.click("#replaybtn"); await p.waitForTimeout(1800);
  await p.evaluate(k => window.__shot.focus(k), w > 700 ? 4 : 3); await p.waitForTimeout(900);
  await tapTarget(w > 700 ? 130 : 85, w > 700 ? 80 : 55); await shot("03-question");
  await tapTarget(); await p.click("#go"); await p.waitForTimeout(950); await shot("04-parfait");
  // 5 passeport, 6 Mon oie
  await open(null); await p.click('#tabbar [data-tab="passport"]'); await p.waitForTimeout(900); await shot("05-passeport");
  await p.click('#tabbar [data-tab="oie"]').catch(async () => { await p.click("#tabbar button:nth-child(4)"); }); await p.waitForTimeout(900); await shot("06-mon-oie");
  // 7 zone France : bonne réponse dans un département
  await open({ mode: "france", frmode: "dept", cont: "monde", level: 1, chrono: 0, players: 1 });
  await p.click("#replaybtn"); await p.waitForTimeout(1800);
  await p.evaluate(k => window.__shot.focus(k), w > 700 ? 30 : 22); await p.waitForTimeout(900);
  await tapTarget(); await p.click("#go"); await p.waitForTimeout(950); await shot("07-france");
  await ctx.close();
  console.log("✓", dir);
}
await b.close();

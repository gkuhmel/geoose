# Geoose — notes pour Claude Code

Jeu de géo pour Nils (enfant). Interface en français, ton ludique, cible **iPhone et iPad via Safari** (aussi publié comme artifact claude.ai : tout doit tenir dans `dist/index.html`, aucun fetch réseau).

## Stack
- Vite + JS vanilla (pas de framework), `vite-plugin-singlefile` pour un build en un seul HTML.
- Déploiement Cloudflare Workers (assets statiques) : `wrangler.jsonc` → `dist/`, `npm run deploy` (= `vite build && wrangler deploy`).
- `topojson-simplify` : niveaux de détail du dessin.
- `d3` (projection Mercator, zoom/pan via `d3.zoom`, géodésie `geoDistance`/`geoContains`), `topojson-client`, carte `world-atlas/countries-50m.json` (Antarctique retirée).
- Police Google Fonts « Baloo 2 » (seule ressource externe).

## Fichiers
- `index.html` : markup (HUD, carte SVG, écrans accueil / fin).
- `src/style.css` : styles (glassmorphism, animations, media query ≥ 700px pour iPad).
- `src/countries.js` : les 197 pays — `[nom, article, capitale, lat, lon, iso numérique world-atlas, iso alpha-2, renommée pays, renommée capitale, renommée drapeau]`. Renommée 1 (célèbre) → 4 (rareté) = niveau de difficulté, **par mode**. L'alpha-2 sert au drapeau emoji. Ids spéciaux : Kosovo = `XK` (assigné dans `main.js`, sans id dans world-atlas), Tuvalu absent de la carte 50m → distance à la capitale.
- Niveaux : un niveau tire les questions dont la renommée **égale** le niveau (complète avec les niveaux voisins s'il en manque), pas un volume cumulatif.
- Apprentissage : clés `type|iso` dans `localStorage["geoose-revisions"]` ; ajout si raté (> 150 km ou indice), retrait si réussi. En mode capitale, poser l'oie dans le bon pays compte comme réussi pour les révisions (les points restent calculés sur la distance à la capitale).
- `src/main.js` : tout le jeu (carte, gestes, manches, tours à deux, score, chrono, passeport, confettis).
- `src/facts.js` : « Le savais-tu ? », une info par pays (clé alpha-2), affichée après chaque réponse (🔊 pour l'écouter).
- `src/audio.js` : sons synthétisés en WebAudio (aucun fichier) + voix (`speechSynthesis`, fr-FR) ; un seul réglage son (`geoose-son`). iOS : `unlock()` au premier toucher.
- `public/` : `manifest.webmanifest`, `sw.js` (hors ligne : page réseau d'abord, reste cache d'abord), `icons/` (générées depuis le dessin de l'oie), `_headers` (Cloudflare). Le SW ne s'enregistre qu'en https hors iframe ; dans l'artifact claude.ai, les liens manifeste/icônes ne se chargent simplement pas.
- Continents : lignes `"@europe"`… dans `countries.js` ; `CONTINENTS` donne nom, emoji et cadrage de départ (`homeView`).
- Passeport : `localStorage["geoose-passeport"]` = `{iso: [types réussis]}` ; tampon quand une question est réussie (même règle que les révisions).
- Deux joueurs : même question pour les deux, chacun pose son oie à son tour (`submitTurn`), révélation après le 2e (`reveal`). Oie blanche / cendrée (`PLUME`), couleurs `PCOL`. Révisions et passeport ne suivent que le joueur 1 ; pas de record à deux.
- Options et prénoms mémorisés (`geoose-options`, `geoose-noms`).

## Points d'attention
- Gestes (façon GeoGuessr / Plans) : **tap simple** (< 12 px, < 500 ms) pose ou déplace l'oie, **Valider** confirme ; un glissement > 12 px est un pan. Appui sur l'oie (`.pin-hit`, r=34) + glisser = ajustement fin : son ombre (`.shadow`, point exact d'atterrissage) se place `LIFT` (60 px) au-dessus du doigt et l'oie s'envole au-dessus d'elle en battant des ailes (`.fly`, `.wing`, classe `#map.dragging`), et `zoom.filter` bloque le pan pendant ce temps. Détection maison via pointer events.
- Modes pays / drapeau : le pays sous l'oie est surligné (`gHover`, `countryAt` = bbox puis `geoContains`), sans afficher son nom.
- Les écrans masqués (`.screen.hidden`) doivent rester `visibility:hidden` + `pointer-events:none` sur les enfants, sinon leurs boutons invisibles bloquent la carte (bug déjà rencontré).
- Les marqueurs (oie, cible) sont en coordonnées carte avec `scale(1/k)` mis à jour au zoom (`placeMarkers`), sans les recréer (sinon les animations CSS rejouent).
- Épaisseurs de traits : `calc(Npx / var(--k))` sur le groupe racine.
- **Perf carte** (le pan saccadait) : le coût est le raster SVG, surtout les halos côtiers (gros traits). Donc :
  dessin en géométrie simplifiée selon le zoom (`lodFor`, 3 niveaux, changés à la fin du geste, en cache),
  halos sur un contour très simplifié, halos et côtes découpés en tuiles de 30° (culling hors écran),
  `onZoom` ne fait rien d'autre que le `transform` quand k ne change pas (simple glissement).
  Le gameplay (`byIso`, `geoContains`, distances) garde la géométrie 50m exacte.
  Mesurer avec une trace Chromium (somme des `RasterTask`) plutôt qu'un compteur rAF, qui ne voit rien en headless.
- Tester en 390×844 (iPhone) et 820×1180 / 1180×820 (iPad), avec événements tactiles.

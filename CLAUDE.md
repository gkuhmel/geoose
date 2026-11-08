# Geoose — notes pour Claude Code

Jeu de géo pour Nils (enfant). Interface en français, ton ludique, cible **iPhone et iPad via Safari** (aussi publié comme artifact claude.ai : tout doit tenir dans `dist/index.html`, aucun fetch réseau).

## Stack
- Vite + JS vanilla (pas de framework), `vite-plugin-singlefile` pour un build en un seul HTML.
- `d3` (projection Mercator, zoom/pan via `d3.zoom`, géodésie `geoDistance`/`geoContains`), `topojson-client`, carte `world-atlas/countries-50m.json` (Antarctique retirée).
- Police Google Fonts « Baloo 2 » (seule ressource externe).

## Fichiers
- `index.html` : markup (HUD, carte SVG, écrans accueil / fin).
- `src/style.css` : styles (glassmorphism, animations, media query ≥ 700px pour iPad).
- `src/countries.js` : les 197 pays — `[nom, article, capitale, lat, lon, iso numérique world-atlas, iso alpha-2, renommée pays, renommée capitale, renommée drapeau]`. Renommée 1 (célèbre) → 4 (rareté) = niveau de difficulté, **par mode**. L'alpha-2 sert au drapeau emoji. Ids spéciaux : Kosovo = `XK` (assigné dans `main.js`, sans id dans world-atlas), Tuvalu absent de la carte 50m → distance à la capitale.
- Niveaux : un niveau tire les questions dont la renommée **égale** le niveau (complète avec les niveaux voisins s'il en manque), pas un volume cumulatif.
- Apprentissage : clés `type|iso` dans `localStorage["geoose-revisions"]` ; ajout si raté (> 150 km ou indice), retrait si réussi.
- `src/main.js` : tout le jeu (carte, gestes, manches, score, chrono, confettis).

## Points d'attention
- Gestes : un tap seul ne fait rien (petit cercle d'aide), **double-tap** (< 400 ms, < 40 px) pose l'oie ; un glissement > 12 px est un pan. Détection maison via pointer events, indépendante de `d3.zoom`.
- Les écrans masqués (`.screen.hidden`) doivent rester `visibility:hidden` + `pointer-events:none` sur les enfants, sinon leurs boutons invisibles bloquent la carte (bug déjà rencontré).
- Les marqueurs (oie, cible) sont en coordonnées carte avec `scale(1/k)` mis à jour au zoom (`placeMarkers`), sans les recréer (sinon les animations CSS rejouent).
- Épaisseurs de traits : `calc(Npx / var(--k))` sur le groupe racine.
- Tester en 390×844 (iPhone) et 820×1180 / 1180×820 (iPad), avec événements tactiles.

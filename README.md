# 🪿 Geoose

Jeu de géographie pour enfant (web mobile, iPhone / iPad) : un pays, une capitale ou un drapeau s'affiche, on fait atterrir l'oie sur la carte du monde — plus on est près, plus on marque de points.

## Lancer

```bash
npm install
npm run dev      # serveur local (--host : accessible depuis l'iPhone sur le même Wi-Fi)
npm run build    # dist/index.html autonome (un seul fichier)
npm run cf:dev   # build + serveur local Cloudflare (wrangler dev)
npm run deploy   # build + publication sur Cloudflare Workers (wrangler deploy)
```

Déploiement : `wrangler.jsonc` publie `dist/` en assets statiques (Worker `geoose`). Première fois : `npx wrangler login`.

## Règles

- **Modes** : Pays · Capitales · Drapeaux · Mélange — 10 manches, parmi **tous les pays du monde** (197 : ONU + Vatican, Palestine, Kosovo, Taïwan).
- **Niveaux** (par *renommée*, pas par nombre de pays) : 🐣 Facile (les célèbres) · 🦊 Moyen (assez connus) · 🦅 Difficile (moins connus) · 🐉 Expert (les raretés). Chaque pays a une renommée par mode : l'Australie est facile, mais Canberra est « difficile » ; le drapeau du Luxembourg est « expert ».
- **📚 Apprentissage** : ne repose que les questions ratées (tous modes confondus, chacune dans son mode d'origine). Ratée = oie à plus de 150 km ou indice utilisé ; une bonne réponse la retire de la liste (en partie normale aussi).
- **Partie** : Tranquille ou Chrono (15 s par question, bonus vitesse jusqu'à +300).
- **Score** : jusqu'à 1 000 pts par manche, `1000 × e^(−km/1200)`.
  - Pays / drapeau : 1 000 si l'oie est dans le pays, sinon distance à la frontière la plus proche.
  - Capitale : distance à la ville (≤ 50 km = pile dessus).
  - Indice (capitale → nom du pays, drapeau → nom du pays) : points ÷ 2.
- **Gestes** : glisser à un doigt = déplacer la carte, pincer = zoomer, **toucher = poser l'oie**, **faire glisser l'oie** = viser finement (elle se soulève au-dessus du doigt, un viseur marque le point). En modes Pays / Drapeaux, le pays visé s'allume.
- Records stockés en `localStorage` par mode / niveau / chrono ; révisions dans `geoose-revisions`.

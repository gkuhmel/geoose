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

- **Modes** : Pays · Capitales · Drapeaux · Villes (146 grandes villes qui ne sont pas des capitales) · Mélange — 10 manches, parmi **tous les pays du monde** (197 : ONU + Vatican, Palestine, Kosovo, Taïwan).
- **Niveaux** (par *renommée*, pas par nombre de pays) : 🐣 Facile (les célèbres) · 🦊 Moyen (assez connus) · 🦅 Difficile (moins connus) · 🐉 Expert (les raretés). Chaque pays a une renommée par mode : l'Australie est facile, mais Canberra est « difficile » ; le drapeau du Luxembourg est « expert ».
- **📚 Apprentissage** : ne repose que les questions ratées (tous modes confondus, chacune dans son mode d'origine). Ratée = oie à plus de 150 km ou indice utilisé (pour une capitale, l'oie dans le bon pays n'est pas ratée) ; une bonne réponse la retire de la liste (en partie normale aussi).
- **Partie** : Tranquille ou Chrono (15 s par question, bonus vitesse jusqu'à +300).
- **Score** : jusqu'à 1 000 pts par manche, `1000 × e^(−km/1200)`.
  - Pays / drapeau : 1 000 si l'oie est dans le pays, sinon distance à la frontière la plus proche.
  - Capitale / ville : tous les points si l'oie est dans le bon pays ; sinon selon la distance au pays.
  - Indice (capitale → nom du pays, drapeau → nom du pays) : points ÷ 2.
- **Gestes** : glisser à un doigt = déplacer la carte, pincer = zoomer, **toucher = poser l'oie**, **faire glisser l'oie** = viser finement (elle s'envole au-dessus du doigt, son ombre marque l'endroit où elle va atterrir). En modes Pays / Drapeaux, le pays visé s'allume.
- **Où ?** : Monde ou un continent (Europe, Afrique, Asie, Amériques, Océanie) ; la carte démarre dessus.
- **À deux** : même question pour les deux joueurs (prénoms modifiables), chacun pose son oie à son tour, puis on compare ; oie blanche contre oie cendrée.
- **🛂 Passeport** : un tampon par pays et par mode réussi, progression par continent, et une carte du monde des pays visités.
- **🔊 Sons et 🗣️ voix** : cri d'oie à l'atterrissage parfait, ding, tampon… ; lecture des questions à voix haute en option (bouton Voix sur l'accueil, désactivée par défaut).
- **💡 Le savais-tu ?** : une info amusante sur le pays après chaque réponse.
- **🗿 Merveilles** : monuments (tour Eiffel, Machu Picchu…) et animaux (kangourous, pandas…).
- **Parties** : Calme · Chrono · ❤️ Survie (3 vies, de plus en plus dur) · 🔤 Quiz (le pays s'allume, on choisit parmi 4).
- **🗓️ Défi du jour** : 5 questions identiques pour tout le monde, série de jours 🔥.
- **🪿 Mon oie** : de l'XP à chaque partie, des niveaux, 10 accessoires à débloquer (casquette, lunettes, couronne, cape…).
- **🏆 Progrès** : 24 médailles et un tableau de bord pour les parents (temps de jeu, réussite par mode, erreurs et confusions fréquentes).
- **🎨 Thèmes** : Atlas (clair), Néon (nuit lumineuse), Vieille carte (parchemin) — bouton 🎨 sur l'accueil.
- **App** : sur iPhone / iPad, Safari → Partager → « Sur l'écran d'accueil » : plein écran, icône oie, marche hors ligne.
- Records stockés en `localStorage` par mode / niveau / chrono ; révisions dans `geoose-revisions`.

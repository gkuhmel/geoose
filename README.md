# 🪿 Geoose

Jeu de géographie pour enfant (web mobile, iPhone / iPad) : un pays, une capitale ou un drapeau s'affiche, on fait atterrir l'oie sur la carte du monde — plus on est près, plus on marque de points.

## Lancer

```bash
npm install
npm run dev      # serveur local (--host : accessible depuis l'iPhone sur le même Wi-Fi)
npm run build    # dist/index.html autonome (un seul fichier)
```

## Règles

- **Modes** : Pays · Capitales · Drapeaux · Mélange — 10 manches.
- **Niveaux** : Facile (24 pays connus) · Moyen (+30) · Expert (83 pays).
- **Partie** : Tranquille ou Chrono (15 s par question, bonus vitesse jusqu'à +300).
- **Score** : jusqu'à 1 000 pts par manche, `1000 × e^(−km/1200)`.
  - Pays / drapeau : 1 000 si l'oie est dans le pays, sinon distance à la frontière la plus proche.
  - Capitale : distance à la ville (≤ 50 km = pile dessus).
  - Indice (capitale → nom du pays, drapeau → nom du pays) : points ÷ 2.
- **Gestes** : glisser à un doigt = déplacer la carte, pincer = zoomer, **double-tap = poser l'oie**.
- Records stockés en `localStorage` par mode / niveau / chrono.

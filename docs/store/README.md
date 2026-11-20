# Fiche App Store — Geoose

Application **gratuite**, sans achat intégré ni publicité.

## Réglages App Store Connect

| Champ | Valeur |
|---|---|
| Nom | Geoose |
| Identifiant | `com.calanquesunited.geoose` |
| SKU | geoose |
| Langue principale | Français |
| Catégorie principale | Éducation |
| Catégorie secondaire | Jeux → Jeux éducatifs (ou Quiz) |
| Prix | Gratuit |
| Classification par âge | 4+ (aucun contenu sensible : répondre « Aucun » partout) |
| Confidentialité de l'app | **Aucune donnée collectée** |
| URL de confidentialité | `https://<domaine du jeu>/privacy.html` |
| URL d'assistance | `https://<domaine du jeu>/support.html` |
| Droits d'auteur | © 2026 Calanques United |

Catégorie « Enfants » (Kids) : possible (pas de pub, pas de statistiques, aucun lien externe dans
le jeu), mais elle ajoute une revue plus stricte ; « Éducation » 4+ est le plus simple pour
commencer.

Notes pour la revue (App Review) : « Jeu de géographie hors ligne pour enfants : poser l'oie sur
la carte au bon endroit. Aucun compte, aucune connexion réseau. »

## Textes

### Français

- **Sous-titre** (30 car. max) : Le jeu de géo qui fait voyager
- **Texte promotionnel** : Fais atterrir l'oie au bon endroit et remplis ton passeport du monde entier !
- **Mots-clés** (100 car.) : géographie,carte,pays,capitales,drapeaux,quiz,enfants,monde,école,continents,france,départements
- **Description** :

> Pose ton oie sur la carte… au bon endroit ! 🪿🌍
>
> Geoose est un jeu de géographie pour les enfants (et les parents curieux) : où se trouve le
> Brésil ? Et la capitale du Japon ? À quel pays est ce drapeau ? Touche la carte, l'oie s'envole
> et atterrit… plus tu es près, plus tu marques de points.
>
> • 197 pays, leurs capitales et leurs drapeaux, de « facile » à « expert »
> • Grandes villes, îles, merveilles du monde et animaux
> • Zone France : départements et villes
> • Un passeport à tamponner, des médailles, et une oie à habiller (plus de 40 accessoires !)
> • Le défi du jour, le mode survie, le quiz, et des parties à deux sur le même appareil
> • Révisions automatiques des erreurs pour progresser vraiment
> • « Le savais-tu ? » : une info amusante après chaque réponse, lue à voix haute
> • 7 thèmes de carte, 6 langues
>
> Sans publicité, sans achat, sans compte, sans connexion : tout reste sur l'appareil.
>
> Dédié à Milo et Nils, et à tous les enfants curieux de connaître le monde qui les entoure.

### English

- **Subtitle**: The geography game that travels
- **Promotional text**: Land the goose in the right place and fill your passport with the whole world!
- **Keywords**: geography,map,countries,capitals,flags,quiz,kids,world,school,atlas,continents,learn
- **Description**:

> Drop your goose on the map… in the right place! 🪿🌍
>
> Geoose is a geography game for kids (and curious parents): where is Brazil? And the capital of
> Japan? Which country does this flag belong to? Tap the map, the goose flies off and lands… the
> closer you are, the more points you score.
>
> • 197 countries, their capitals and flags, from "easy" to "expert"
> • Big cities, islands, world wonders and animals
> • A passport to stamp, medals, and a goose to dress up (over 40 accessories!)
> • Daily challenge, survival mode, quiz, and two-player games on one device
> • Automatic review of mistakes to really improve
> • "Did you know?": a fun fact after every answer, read aloud
> • 7 map themes, 6 languages
>
> No ads, no purchases, no account, no connection: everything stays on the device.
>
> Dedicated to Milo and Nils, and to all children curious about the world around them.

Espagnol, allemand, italien, chinois : à ajouter dans App Store Connect (facultatif) en traduisant
la version anglaise.

## Captures d'écran

Générées par `npm run build && node scripts/screenshots.mjs fr` dans `store-shots/` (iPhone 6,9" 1320 × 2868, 6,3" 1206 × 2622, 6,1" 1179 × 2556, iPad 13" 2064 × 2752). Sinon : simulateur Xcode
(⌘S) ou avec Playwright sur la version web : menu, une question pays avec l'oie posée, la fiche
résultat, le passeport, « Mon oie », une partie en zone France.

# Application iOS (Capacitor)

Statut : **projet iOS en place** (`ios/`, Capacitor 8, Swift Package Manager : pas besoin de
CocoaPods). Même recette que Tomettes.

## Principe

Capacitor emballe la version web construite (`dist/index.html`, un seul fichier) dans une vraie
application iOS (vue web intégrée). Le jeu ne change pas ; la version web (Cloudflare) continue
d'exister avec le même code. Ce qui est propre à l'appli est dans `src/native.js` (sans effet dans
un navigateur).

| Point | Solution |
|---|---|
| Identifiant | `com.calanquesunited.geoose` (`capacitor.config.json`), définitif une fois publié |
| Réseau | Aucun : la police Baloo 2 est embarquée (`src/fonts.css`), tout est dans le HTML |
| Sauvegardes | Chaque écriture `geoose-…` du stockage local est doublée dans `@capacitor/preferences` et restaurée au lancement si iOS a vidé le stockage de la vue web |
| Barre d'état | Texte clair ou foncé selon la couleur du thème (`@capacitor/status-bar`) |
| Écran de démarrage | L'icône sur le bleu du ciel, retiré dès que le jeu démarre (son propre écran d'accueil prend le relais) |
| Service worker | Pas enregistré dans l'appli |
| Appareils, orientation | iPhone (portrait) et iPad (toutes orientations, plein écran) — `Info.plist` |
| Langues | 6 langues déclarées (`CFBundleLocalizations`), langue de développement : français |
| Chiffrement | `ITSAppUsesNonExemptEncryption` = NO |
| Données collectées | Aucune (pas de compte, pub, achat, statistiques ni serveur) |

Icônes (web + iOS 1024 px) et écran de démarrage : `npm run icons` (`scripts/icons.mjs`), qui
écrit dans `public/icons/` et `ios/App/App/Assets.xcassets/`.

Pages publiques (servies avec le site) : `public/privacy.html` (avec la dédicace à Milo et Nils)
et `public/support.html` → URL de confidentialité et d'assistance à donner à App Store Connect.

## Compiler sur le Mac

Une fois : Xcode (Mac App Store, le lancer une fois), Node 22 (nodejs.org), puis :

```sh
git clone https://github.com/gkuhmel/geoose.git
cd geoose
npm install
npm run ios        # build du jeu, copie dans le projet iOS, ouverture de Xcode
```

Dans Xcode, la première fois :
1. Xcode → Settings → Accounts : ajouter le compte Apple Developer.
2. Projet **App** → cible **App** → **Signing & Capabilities** : cocher « Automatically manage
   signing », choisir le **Team**. Vérifier le Bundle Identifier `com.calanquesunited.geoose`.

Essai sur l'iPhone / l'iPad : le brancher, accepter « Faire confiance », activer Réglages →
Confidentialité et sécurité → **Mode développeur**, le choisir en haut de Xcode, ▶︎.

Envoi à Apple : en haut « Any iOS Device (arm64) », **Product → Archive**, puis **Distribute App →
App Store Connect → Upload**. La version arrive dans App Store Connect (onglet TestFlight) après
quelques minutes.

À chaque mise à jour : `git pull`, `npm install`, `npm run ios`, augmenter **Build** (onglet
General de la cible App : 1, 2, 3…), puis Archive → Upload. **Version** (1.0) ne change qu'aux
vraies nouvelles versions.

## Avant la première soumission

- [ ] `npm run deploy` pour mettre en ligne `privacy.html` et `support.html`
- [ ] Créer l'app dans App Store Connect (Apps → +), même identifiant, nom « Geoose »
- [ ] Fiche : textes, mots-clés, captures, âge, confidentialité → `docs/store/README.md`
- [ ] Tester sur iPhone et iPad : partie dans chaque mode, voix, changement de langue et de thème,
      reprise après passage en arrière-plan, progression conservée après redémarrage

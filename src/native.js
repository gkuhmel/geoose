// Application iOS (Capacitor, voir docs/NATIF-CAPACITOR.md). Dans un navigateur, tout ce qui
// suit est sans effet : la version web reste la même.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export const isNative = Capacitor.isNativePlatform();
const PREFIX = "geoose-";

/*
 * Sauvegardes : iOS peut vider le stockage d'une vue web quand l'appareil manque de place.
 * En natif, chaque écriture « geoose-… » du stockage local est doublée dans les Préférences
 * de l'appli (stockage natif, conservé), et rechargée au lancement si elle a disparu.
 */
function mirror(key, value) {
  if (!isNative || typeof key !== "string" || !key.startsWith(PREFIX)) return;
  (value === null ? Preferences.remove({ key }) : Preferences.set({ key, value: String(value) })).catch(() => {});
}
if (isNative) {
  const S = Storage.prototype, set = S.setItem, rem = S.removeItem;
  S.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage) mirror(k, v); };
  S.removeItem = function (k) { rem.call(this, k); if (this === localStorage) mirror(k, null); };
}

/** Remet dans le stockage local les sauvegardes disparues ; recharge la page si besoin. */
async function restoreSaves() {
  try {
    const { keys } = await Preferences.keys();
    let restored = false;
    for (const key of keys) {
      if (!key.startsWith(PREFIX) || localStorage.getItem(key) !== null) continue;
      const { value } = await Preferences.get({ key });
      if (value === null) continue;
      Storage.prototype.setItem.call(localStorage, key, value);
      restored = true;
    }
    // Sauvegardes déjà présentes mais pas encore copiées (première version de l'appli).
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX) && !keys.includes(key)) mirror(key, localStorage.getItem(key));
    }
    // La langue, les réglages et la progression ont déjà été lus : on repart du début.
    if (restored) location.reload();
  } catch (e) { /* la copie locale reste */ }
}

/** Au lancement : restauration, puis retrait de l'écran de démarrage natif (le jeu a le sien). */
export function nativeStart() {
  if (!isNative) return;
  restoreSaves();
  requestAnimationFrame(() => SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {}));
}

/** Barre d'état : texte clair sur les thèmes sombres, foncé sur les thèmes clairs. */
export function nativeStatusBar(hex) {
  if (!isNative) return;
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const dark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.6;
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
}

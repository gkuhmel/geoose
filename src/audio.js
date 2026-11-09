// Sons (synthétisés en WebAudio : aucun fichier, marche hors ligne) et voix (synthèse vocale de l'appareil).
// iOS : l'audio ne démarre qu'après un geste de l'utilisateur → `unlock()` au premier toucher.
const KEY = "geoose-son";
let on = (() => { try { return localStorage.getItem(KEY) !== "0"; } catch (e) { return true; } })();
let ctx = null;

export const soundOn = () => on;
// lecture automatique des questions (désactivée par défaut) ; les boutons 🔊 explicites lisent quand même
const VKEY = "geoose-voix";
let voix = (() => { try { return localStorage.getItem(VKEY) === "1"; } catch (e) { return false; } })();
export const voiceOn = () => voix;
export function setVoice(v) {
  voix = v;
  try { localStorage.setItem(VKEY, v ? "1" : "0"); } catch (e) {}
  if (!v) { try { speechSynthesis.cancel(); } catch (e) {} }
}
export function setSound(v) {
  on = v;
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch (e) {}
  if (!v) { try { speechSynthesis.cancel(); } catch (e) {} }
}

export function unlock() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    // iOS : un son muet joué pendant le geste débloque la sortie audio
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
    s.buffer = b; s.connect(ctx.destination); s.start(0);
  } catch (e) {}
}

function tone({ f0, f1 = f0, type = "sine", dur = .15, vol = .2, at = 0, filter = 0 }) {
  if (!on || !ctx) return;
  const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = o;
  if (filter) { const bq = ctx.createBiquadFilter(); bq.type = "bandpass"; bq.frequency.value = filter; bq.Q.value = 1.6; o.connect(bq); out = bq; }
  out.connect(g); g.connect(ctx.destination);
  o.start(t); o.stop(t + dur + .02);
}

// cri d'oie : deux « hon-hon » nasillards (dents de scie filtrées, hauteur qui monte puis retombe)
function honk(at = 0) {
  if (!on || !ctx) return;
  for (const [d, a] of [[0, 0], [.22, .02]]) {
    const t = ctx.currentTime + at + d, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), bq = ctx.createBiquadFilter();
    o.type = o2.type = "sawtooth";
    for (const [osc, det] of [[o, 0], [o2, 7]]) {
      osc.frequency.setValueAtTime(330 + det, t);
      osc.frequency.linearRampToValueAtTime(420 + det, t + .06);
      osc.frequency.linearRampToValueAtTime(300 + det + a * 100, t + .17);
    }
    bq.type = "bandpass"; bq.frequency.value = 1300; bq.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(.32, t + .02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + .18);
    o.connect(bq); o2.connect(bq); bq.connect(g); g.connect(ctx.destination);
    o.start(t); o2.start(t); o.stop(t + .2); o2.stop(t + .2);
  }
}

export const sfx = {
  plop: () => tone({ f0: 620, f1: 260, dur: .09, vol: .18 }),
  perfect: () => { honk(); tone({ f0: 880, dur: .18, vol: .16, at: .45 }); tone({ f0: 1320, dur: .3, vol: .16, at: .58 }); },
  good: () => { tone({ f0: 880, dur: .16, vol: .15 }); tone({ f0: 1175, dur: .25, vol: .15, at: .12 }); },
  ok: () => tone({ f0: 700, dur: .2, vol: .14 }),
  far: () => tone({ f0: 300, f1: 180, type: "triangle", dur: .35, vol: .2 }),
  stamp: () => { tone({ f0: 160, f1: 90, type: "square", dur: .08, vol: .12, filter: 500 }); tone({ f0: 1568, dur: .2, vol: .1, at: .08 }); },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone({ f0: f, dur: i === 3 ? .5 : .16, vol: .15, at: i * .13, type: "triangle" })),
  honk,
};

// ---------- voix ----------
let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
    voice = vs.find(v => /fr[-_]FR/i.test(v.lang) && /Amélie|Audrey|Thomas|Marie|Google/i.test(v.name))
      || vs.find(v => /fr[-_]FR/i.test(v.lang)) || vs[0] || null;
  } catch (e) {}
}
try { pickVoice(); speechSynthesis.addEventListener?.("voiceschanged", pickVoice); } catch (e) {}

export function say(text) {
  if (!on || !text || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR"; if (voice) u.voice = voice;
    u.rate = .92; u.pitch = 1.05;
    speechSynthesis.speak(u);
  } catch (e) {}
}

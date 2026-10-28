"use client";

// Son « cha-ching » généré par le navigateur, sans fichier audio à charger.

const SOUND_KEY = "setlou:order-sound";

let ctx: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

// Les navigateurs bloquent le son tant que l'utilisateur n'a pas touché la page.
export function unlockOrderSound() {
  const audio = getContext();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function isOrderSoundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setOrderSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // stockage indisponible (navigation privée) : on garde le réglage par défaut
  }
}

function bell(audio: AudioContext, start: number, freq: number, duration: number, volume: number) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  gain.connect(audio.destination);

  for (const [ratio, level] of [[1, 1], [2.76, 0.4], [5.4, 0.15]] as const) {
    const osc = audio.createOscillator();
    const partial = audio.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * ratio, start);
    partial.gain.value = level;
    osc.connect(partial).connect(gain);
    osc.start(start);
    osc.stop(start + duration);
  }
}

export function playOrderSound() {
  const audio = getContext();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const now = audio.currentTime + 0.02;
  // « cha » : petit coup métallique, puis « ching » : clochette qui résonne.
  bell(audio, now, 1318, 0.12, 0.25);
  bell(audio, now + 0.11, 1760, 0.9, 0.35);
  bell(audio, now + 0.13, 2637, 0.7, 0.12);
}

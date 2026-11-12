// Subtle Web Audio API synthesizer for magical archive chimes

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

function playTone(ctx, freq, startOffset, duration, volume = 0.05, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const startTime = ctx.currentTime + startOffset;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/**
 * Plays a subtle magical chime for archive interactions.
 * @param {'borrow' | 'brew' | 'levelup' | 'xp' | 'error' | 'success'} type
 * @param {boolean} enabled
 */
export function playArcaneSound(type = 'success', enabled = true) {
  if (!enabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    switch (type) {
      case 'borrow':
        // Warm ascending two-note parchment bell
        playTone(ctx, 523.25, 0, 0.22, 0.045, 'triangle'); // C5
        playTone(ctx, 659.25, 0.09, 0.35, 0.05, 'sine'); // E5
        break;
      case 'brew':
        // Sparkling alchemical potion arpeggio
        playTone(ctx, 587.33, 0, 0.16, 0.035, 'sine'); // D5
        playTone(ctx, 739.99, 0.07, 0.18, 0.04, 'sine'); // F#5
        playTone(ctx, 880.0, 0.14, 0.24, 0.045, 'triangle'); // A5
        playTone(ctx, 1174.66, 0.22, 0.4, 0.04, 'sine'); // D6
        break;
      case 'levelup':
        // Triumphant arcane fanfare
        playTone(ctx, 523.25, 0, 0.2, 0.05, 'triangle'); // C5
        playTone(ctx, 659.25, 0.09, 0.2, 0.05, 'triangle'); // E5
        playTone(ctx, 783.99, 0.18, 0.24, 0.055, 'triangle'); // G5
        playTone(ctx, 1046.5, 0.28, 0.55, 0.06, 'sine'); // C6
        break;
      case 'xp':
        // Crisp rewarding double chime
        playTone(ctx, 783.99, 0, 0.16, 0.04, 'sine'); // G5
        playTone(ctx, 987.77, 0.08, 0.3, 0.045, 'sine'); // B5
        break;
      case 'error':
        // Soft muted low wood tone
        playTone(ctx, 220, 0, 0.18, 0.04, 'triangle');
        playTone(ctx, 185, 0.08, 0.22, 0.035, 'triangle');
        break;
      default:
        playTone(ctx, 659.25, 0, 0.22, 0.04, 'sine');
        break;
    }
  } catch {
    // Ignore audio errors when blocked by browser autoplay policies
  }
}


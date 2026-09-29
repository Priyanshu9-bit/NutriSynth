// Dedicated sound effects utility using Web Audio API
// 100% reliable, zero external dependencies, works offline and immediately!

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * 1. Celebratory Congratulations Sound ("cngo" / confetti / milestone / victory)
 * Triumphant ascending arpeggio fanfare chord with sparkling harmonics
 */
export function playCongratsSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Celebratory arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50), E6 (1318.51)
    const notes = [
      { f: 523.25, start: 0, dur: 0.25 },
      { f: 659.25, start: 0.1, dur: 0.25 },
      { f: 783.99, start: 0.2, dur: 0.3 },
      { f: 1046.50, start: 0.32, dur: 0.7 },
      { f: 1318.51, start: 0.45, dur: 1.1 },
    ];

    notes.forEach(({ f, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    // Add high sparkle overtone
    const sparkle = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(2093.00, now + 0.35); // C7
    sparkleGain.gain.setValueAtTime(0.001, now + 0.35);
    sparkleGain.gain.linearRampToValueAtTime(0.09, now + 0.4);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(now + 0.35);
    sparkle.stop(now + 1.25);
  } catch (err) {
    console.debug('[NutriSynth Sound] Audio playback suppressed:', err);
  }
}

/**
 * 2. Water Droplet / Pouring Sound
 * Authentic, refreshing liquid drop bubble effect with pitch swoop
 */
export function playWaterDropSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Primary droplet bubble (pitch bend from 600Hz down to 420Hz and up to 920Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);

    // Subtle second tiny splash echo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1150, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1420, now + 0.18);

    gain2.gain.setValueAtTime(0.001, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch (err) {
    console.debug('[NutriSynth Sound] Audio playback suppressed:', err);
  }
}

/**
 * 3. Checklist Item Ticked Sound
 * Crisp, pleasant wooden pop / chime when completing a habit to-do
 */
export function playChecklistSound(checked: boolean = true): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (checked) {
      // Pleasant upward two-tone "plink-pop"
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      // Gentle downward untick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    }
  } catch (err) {
    console.debug('[NutriSynth Sound] Audio playback suppressed:', err);
  }
}

/**
 * 4. Add Food / Meal / Progress Item Sound
 * Upbeat soft ding when logging food or adding an item to today's progress list
 */
export function playAddProgressSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(987.77, now + 0.07); // B5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (err) {
    console.debug('[NutriSynth Sound] Audio playback suppressed:', err);
  }
}

/**
 * 5. Automotive Engine Rev & Turbo Spool Sound (for Speedometer & Cockpit modes)
 * Sporty twin-turbo V8 throttle rev with deep exhaust pitch sweep and gentle turbo blow-off
 */
export function playEngineRevSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Primary Engine Exhaust Pitch Sweep (Low RPM idle to high rev sweep)
    const engineOsc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const engineGain = ctx.createGain();

    engineOsc.type = 'sawtooth';
    subOsc.type = 'triangle';
    filter.type = 'lowpass';

    // Rev curve: 68Hz (idle) -> 245Hz (peak rev) -> 78Hz (return to idle)
    engineOsc.frequency.setValueAtTime(68, now);
    engineOsc.frequency.exponentialRampToValueAtTime(245, now + 0.35);
    engineOsc.frequency.exponentialRampToValueAtTime(78, now + 0.85);

    subOsc.frequency.setValueAtTime(34, now);
    subOsc.frequency.exponentialRampToValueAtTime(122, now + 0.35);
    subOsc.frequency.exponentialRampToValueAtTime(39, now + 0.85);

    // Filter opens up as throttle opens
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.85);

    // Engine volume envelope
    engineGain.gain.setValueAtTime(0.001, now);
    engineGain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    engineGain.gain.setValueAtTime(0.24, now + 0.35);
    engineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    engineOsc.connect(filter);
    subOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(ctx.destination);

    engineOsc.start(now);
    subOsc.start(now);
    engineOsc.stop(now + 0.95);
    subOsc.stop(now + 0.95);

    // 2. Subtle Turbo Wastegate / Blow-off Valve Psshh sound at throttle lift
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2200, now + 0.38);
    noiseFilter.Q.setValueAtTime(3, now + 0.38);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.setValueAtTime(0.0001, now + 0.38);
    noiseGain.gain.linearRampToValueAtTime(0.07, now + 0.42);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now + 0.38);
    whiteNoise.stop(now + 0.68);
  } catch (err) {
    console.debug('[NutriSynth Sound] Audio playback suppressed:', err);
  }
}

/**
 * 6. High-Performance Dyno Pull Acceleration Sound
 * Simulates a full-throttle 3.5-second chassis dyno power run with escalating RPM harmonics & gear shifts
 */
export function playDynoPullSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    subOsc.type = 'triangle';
    filter.type = 'lowpass';

    // 1500 RPM (70Hz) climbing to 8200 RPM (380Hz) through dyno power pull
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(170, now + 1.0);
    osc.frequency.setValueAtTime(135, now + 1.05); // Gear shift 1
    osc.frequency.exponentialRampToValueAtTime(310, now + 2.2);
    osc.frequency.setValueAtTime(250, now + 2.25); // Gear shift 2
    osc.frequency.exponentialRampToValueAtTime(420, now + 3.1); // Peak Dyno HP
    osc.frequency.exponentialRampToValueAtTime(80, now + 3.5); // Throttle lift

    subOsc.frequency.setValueAtTime(35, now);
    subOsc.frequency.exponentialRampToValueAtTime(85, now + 1.0);
    subOsc.frequency.setValueAtTime(67, now + 1.05);
    subOsc.frequency.exponentialRampToValueAtTime(155, now + 2.2);
    subOsc.frequency.setValueAtTime(125, now + 2.25);
    subOsc.frequency.exponentialRampToValueAtTime(210, now + 3.1);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 3.5);

    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(1350, now + 3.1);
    filter.frequency.exponentialRampToValueAtTime(250, now + 3.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
    gain.gain.setValueAtTime(0.25, now + 3.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 3.6);
    subOsc.stop(now + 3.6);
  } catch (err) {
    console.debug('[NutriSynth Sound] Dyno sound suppressed:', err);
  }
}

/**
 * 7. Authentic Sports Car Exhaust Rev & Overrun Crackles
 * High-revving V10/V12 supercar throttle roar with rapid acoustic sweep and exhaust overrun pops
 */
export function playSupercarExhaustSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Dual detuned main engine cylinders (creates rich supercar mechanical chorusing)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    subOsc.type = 'triangle';
    filter.type = 'lowpass';

    // High-RPM V10 screaming rev: 85Hz -> 520Hz -> 110Hz
    osc1.frequency.setValueAtTime(85, now);
    osc1.frequency.exponentialRampToValueAtTime(520, now + 0.45);
    osc1.frequency.exponentialRampToValueAtTime(110, now + 1.25);

    // Detune by +8 cents for aggressive mechanical scream
    osc2.frequency.setValueAtTime(87, now);
    osc2.detune.setValueAtTime(8, now);
    osc2.frequency.exponentialRampToValueAtTime(530, now + 0.45);
    osc2.frequency.exponentialRampToValueAtTime(113, now + 1.25);

    // Sub rumble
    subOsc.frequency.setValueAtTime(42, now);
    subOsc.frequency.exponentialRampToValueAtTime(260, now + 0.45);
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 1.25);

    // Resonant filter opens with throttle
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.45);
    filter.frequency.exponentialRampToValueAtTime(320, now + 1.25);
    filter.Q.setValueAtTime(4, now + 0.45);

    // Audio envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.12);
    gain.gain.setValueAtTime(0.32, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);
    osc1.stop(now + 1.35);
    osc2.stop(now + 1.35);
    subOsc.stop(now + 1.35);

    // Exhaust overrun flame crackles / burble pops during throttle lift (0.65s to 1.1s)
    const popTimes = [0.65, 0.78, 0.92, 1.05];
    popTimes.forEach((t) => {
      const popSize = Math.floor(ctx.sampleRate * 0.04);
      const popBuf = ctx.createBuffer(1, popSize, ctx.sampleRate);
      const out = popBuf.getChannelData(0);
      for (let i = 0; i < popSize; i++) {
        out[i] = (Math.random() * 2 - 1) * Math.exp(-i / (popSize * 0.25));
      }
      const popNode = ctx.createBufferSource();
      popNode.buffer = popBuf;

      const popFilter = ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.setValueAtTime(1400 + Math.random() * 800, now + t);
      popFilter.Q.setValueAtTime(2.5, now + t);

      const popGain = ctx.createGain();
      popGain.gain.setValueAtTime(0.001, now + t);
      popGain.gain.linearRampToValueAtTime(0.18, now + t + 0.005);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.038);

      popNode.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(ctx.destination);

      popNode.start(now + t);
      popNode.stop(now + t + 0.045);
    });
  } catch (err) {
    console.debug('[NutriSynth Sound] Supercar sound suppressed:', err);
  }
}




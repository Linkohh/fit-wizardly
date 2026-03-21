const CLICK_DURATION_SECONDS = 0.04;
const DEFAULT_CLICK_VOLUME = 0.22;
const FEEDBACK_TONE_VOLUME = 0.09;

export type FeedbackTone = 'brand' | 'success' | 'warning' | 'error';

const FEEDBACK_TONE_PATTERNS: Record<FeedbackTone, number[]> = {
  brand: [523.25, 659.25],
  success: [587.33, 783.99],
  warning: [440, 349.23],
  error: [329.63, 246.94],
};

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let sharedAudioContext: AudioContext | null = null;
let cachedClickBuffer: AudioBuffer | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedAudioContext) return sharedAudioContext;

  const AudioContextCtor =
    window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;

  if (!AudioContextCtor) return null;

  try {
    sharedAudioContext = new AudioContextCtor({ latencyHint: 'interactive' });
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function buildRetroClickBuffer(context: AudioContext): AudioBuffer {
  const sampleRate = context.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * CLICK_DURATION_SECONDS));

  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  // White noise burst with fast decay + mild bitcrush for a "retro" click feel.
  const bitcrushLevels = 24;
  for (let i = 0; i < frameCount; i++) {
    const t = i / frameCount;
    const envelope = Math.exp(-t * 32);
    const noise = (Math.random() * 2 - 1) * envelope;
    channelData[i] = Math.round(noise * bitcrushLevels) / bitcrushLevels;
  }

  return buffer;
}

async function ensureReady(): Promise<AudioContext | null> {
  const context = getAudioContext();
  if (!context) return null;

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }

  if (!cachedClickBuffer) {
    cachedClickBuffer = buildRetroClickBuffer(context);
  }

  return context;
}

export async function primeClickSound(): Promise<void> {
  await ensureReady();
}

export async function playRetroClickSound(options?: { volume?: number }): Promise<void> {
  const context = await ensureReady();
  if (!context || !cachedClickBuffer) return;

  const now = context.currentTime;
  const volume = clamp(options?.volume ?? DEFAULT_CLICK_VOLUME, 0, 1);

  const sourceNode = context.createBufferSource();
  sourceNode.buffer = cachedClickBuffer;

  const filterNode = context.createBiquadFilter();
  filterNode.type = 'bandpass';
  filterNode.frequency.setValueAtTime(1800, now);
  filterNode.Q.setValueAtTime(0.9, now);

  const gainNode = context.createGain();
  gainNode.gain.setValueAtTime(volume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + CLICK_DURATION_SECONDS);

  sourceNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(context.destination);

  sourceNode.start(now);
  sourceNode.stop(now + CLICK_DURATION_SECONDS + 0.01);
}

export async function playFeedbackTone(type: FeedbackTone): Promise<void> {
  const context = await ensureReady();
  if (!context) return;

  const pattern = FEEDBACK_TONE_PATTERNS[type];
  const start = context.currentTime;

  pattern.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const toneStart = start + index * 0.085;
    const toneEnd = toneStart + 0.08;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, toneStart);
    gain.gain.setValueAtTime(0.0001, toneStart);
    gain.gain.exponentialRampToValueAtTime(FEEDBACK_TONE_VOLUME, toneStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, toneEnd);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(toneStart);
    oscillator.stop(toneEnd + 0.01);
  });
}

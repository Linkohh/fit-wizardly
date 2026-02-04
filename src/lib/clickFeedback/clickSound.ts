const CLICK_DURATION_SECONDS = 0.04;
const DEFAULT_CLICK_VOLUME = 0.22;

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


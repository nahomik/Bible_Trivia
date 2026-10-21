// Web Audio API Sound Effects Engine (Zero external dependencies)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('bible_trivia_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('bible_trivia_muted', String(this.muted));
    return this.muted;
  }

  playTone(frequency, type = 'sine', duration = 0.2, gainValue = 0.15) {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainValue, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // AudioContext may require user interaction first
    }
  }

  // Crisp button tap
  playClick() {
    this.playTone(600, 'triangle', 0.05, 0.08);
  }

  // Beautiful harmonic chime for correct answer (C5 - E5 - G5 - C6)
  playCorrect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.35, 0.12);
        }, idx * 70);
      });
    } catch {
      // Sound fallback
    }
  }

  // Gentle muted buzz for incorrect answer
  playIncorrect() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Sound fallback
    }
  }

  // Sparkly sound when lifeline is activated
  playLifeline() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [659.25, 880, 1174.66, 1760];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.25, 0.1);
        }, idx * 60);
      });
    } catch {
      // Sound fallback
    }
  }

  // Urgency tick when timer is low
  playTick() {
    this.playTone(880, 'sine', 0.04, 0.06);
  }

  // Grand victory fanfare
  playVictory() {
    if (this.muted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const chords = [
        { f: 523.25, t: 0 },
        { f: 659.25, t: 100 },
        { f: 783.99, t: 200 },
        { f: 1046.50, t: 320 },
        { f: 1318.51, t: 450 }
      ];
      chords.forEach(c => {
        setTimeout(() => {
          this.playTone(c.f, 'triangle', 0.6, 0.15);
        }, c.t);
      });
    } catch {
      // Sound fallback
    }
  }
}

export const sound = new SoundEngine();

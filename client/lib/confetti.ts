import confetti from 'canvas-confetti';

export function fireReunitedConfetti() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export const triggerConfetti = fireReunitedConfetti;


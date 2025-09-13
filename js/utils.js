export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const formatTime = (s) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

export const todayKey = () => new Date().toISOString().slice(0,10);

export const spacedNext = (grade, prev = { ef: 2.5, interval: 0, reps: 0 }) => {
  // Simplified SM-2-like scheduling
  let { ef, interval, reps } = prev;
  const q = Math.max(0, Math.min(5, grade));
  if (q < 3) { reps = 0; interval = 1; }
  else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const due = Date.now() + interval * 24 * 3600 * 1000;
  return { ef, interval, reps, due };
};


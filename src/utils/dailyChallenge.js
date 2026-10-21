// Daily Scripture Challenge utility (deterministic question set per day)

export function getDailyDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Simple deterministic PRNG seeded by string
function createPrng(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function next() {
    hash = Math.imul(hash ^ (hash >>> 15), 0x5851f42d);
    hash = (hash ^ (hash >>> 13)) >>> 0;
    return (hash % 1000000) / 1000000;
  };
}

export function getDailyQuestions(allQuestions, count = 5) {
  if (!allQuestions || allQuestions.length === 0) return [];
  const dateStr = getDailyDateString();
  const prng = createPrng(dateStr + '_bible_daily_v1');

  // Filter to ensure good variety
  const ot = allQuestions.filter(q => q.testament === 'Old');
  const nt = allQuestions.filter(q => q.testament === 'New');

  const selected = [];
  const pickedIds = new Set();

  function pickFrom(list, num) {
    if (list.length === 0) return;
    const available = list.filter(q => !pickedIds.has(q.id));
    for (let i = 0; i < num && available.length > 0; i++) {
      const idx = Math.floor(prng() * available.length);
      const chosen = available.splice(idx, 1)[0];
      pickedIds.add(chosen.id);
      selected.push(chosen);
    }
  }

  // 2 Old Testament, 2 New Testament, remaining from either
  pickFrom(ot, 2);
  pickFrom(nt, 2);
  pickFrom(allQuestions, count - selected.length);

  return selected.map(q => {
    // Deterministically shuffle options
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      ...q,
      options: indices.map(i => q.options[i]),
      correctAnswer: indices.indexOf(q.correctAnswer)
    };
  });
}

export function isDailyCompletedToday() {
  const lastDate = localStorage.getItem('bible_daily_last_date');
  return lastDate === getDailyDateString();
}

export function getDailyResult() {
  const stored = localStorage.getItem('bible_daily_result');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed.date === getDailyDateString()) return parsed;
  } catch {
    return null;
  }
  return null;
}

export function recordDailyCompletion(score, total) {
  const today = getDailyDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const lastDate = localStorage.getItem('bible_daily_last_date');
  let currentStreak = parseInt(localStorage.getItem('bible_daily_streak') || '0', 10);

  if (lastDate === yStr) {
    currentStreak += 1;
  } else if (lastDate === today) {
    // already played today
  } else {
    currentStreak = 1;
  }

  localStorage.setItem('bible_daily_last_date', today);
  localStorage.setItem('bible_daily_streak', String(currentStreak));
  localStorage.setItem('bible_daily_result', JSON.stringify({
    date: today,
    score,
    total,
    streak: currentStreak,
    timestamp: Date.now()
  }));

  return currentStreak;
}

export function getDailyStreak() {
  const today = getDailyDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const lastDate = localStorage.getItem('bible_daily_last_date');
  const streak = parseInt(localStorage.getItem('bible_daily_streak') || '0', 10);

  if (lastDate === today || lastDate === yStr) {
    return streak;
  }
  return 0;
}

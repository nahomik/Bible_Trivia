// Achievements and Badges System

export const ACHIEVEMENTS = [
  {
    id: 'first_game',
    title: 'First Step',
    description: 'Complete your first trivia game',
    icon: '👣',
    rarity: 'Common'
  },
  {
    id: 'perfect_score',
    title: 'Bible Scholar',
    description: 'Score 100% in a game (minimum 5 questions)',
    icon: '📜',
    rarity: 'Rare'
  },
  {
    id: 'fast_answer',
    title: 'Quick as David',
    description: 'Answer a question correctly in under 3 seconds',
    icon: '⚡',
    rarity: 'Uncommon'
  },
  {
    id: 'streak_5',
    title: 'Holy Fire',
    description: 'Answer 5 questions correctly in a row',
    icon: '🔥',
    rarity: 'Uncommon'
  },
  {
    id: 'streak_10',
    title: 'Unshakeable Faith',
    description: 'Answer 10 questions in a row correctly',
    icon: '🛡️',
    rarity: 'Epic'
  },
  {
    id: 'total_50',
    title: 'Wisdom of Solomon',
    description: 'Answer 50 questions correctly overall',
    icon: '👑',
    rarity: 'Rare'
  },
  {
    id: 'daily_warrior',
    title: 'Daily Manna',
    description: 'Complete a Daily Scripture Challenge',
    icon: '🍞',
    rarity: 'Common'
  },
  {
    id: 'survival_master',
    title: 'Enduring Faith',
    description: 'Answer 8+ questions in Survival mode',
    icon: '⚔️',
    rarity: 'Rare'
  },
  {
    id: 'blitz_champion',
    title: 'Speed of Elijah',
    description: 'Answer 8+ questions correctly in Blitz mode',
    icon: '🌪️',
    rarity: 'Epic'
  },
  {
    id: 'local_champion',
    title: 'Fellowship Master',
    description: 'Win a Pass & Play local multiplayer match',
    icon: '🏆',
    rarity: 'Uncommon'
  }
];

export function getUnlockedAchievements() {
  try {
    const raw = localStorage.getItem('bible_trivia_achievements');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function checkAchievements(context = {}) {
  const unlocked = new Set(getUnlockedAchievements());
  const newlyUnlocked = [];

  function unlock(id) {
    if (!unlocked.has(id)) {
      unlocked.add(id);
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) newlyUnlocked.push(ach);
    }
  }

  // 1. First game
  if (context.gameCompleted) {
    unlock('first_game');
  }

  // 2. Perfect score
  if (context.total >= 5 && context.correct === context.total) {
    unlock('perfect_score');
  }

  // 3. Fast answer
  if (context.fastestCorrectTime !== undefined && context.fastestCorrectTime <= 3) {
    unlock('fast_answer');
  }

  // 4. Streaks
  if (context.maxStreak >= 5) {
    unlock('streak_5');
  }
  if (context.maxStreak >= 10) {
    unlock('streak_10');
  }

  // 5. Total correct
  const currentTotalCorrect = (parseInt(localStorage.getItem('bible_trivia_total_correct') || '0', 10)) + (context.correct || 0);
  localStorage.setItem('bible_trivia_total_correct', String(currentTotalCorrect));
  if (currentTotalCorrect >= 50) {
    unlock('total_50');
  }

  // 6. Mode specific
  if (context.mode === 'daily') {
    unlock('daily_warrior');
  }
  if (context.mode === 'survival' && context.correct >= 8) {
    unlock('survival_master');
  }
  if (context.mode === 'blitz' && context.correct >= 8) {
    unlock('blitz_champion');
  }
  if (context.isMultiplayerWinner && context.mode === 'local') {
    unlock('local_champion');
  }

  if (newlyUnlocked.length > 0) {
    localStorage.setItem('bible_trivia_achievements', JSON.stringify([...unlocked]));
  }

  return newlyUnlocked;
}

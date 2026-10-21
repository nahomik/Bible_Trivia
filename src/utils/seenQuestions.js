const STORAGE_KEY = 'bible-trivia-seen-questions';

export function getSeenQuestionIds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveSeenQuestionIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage full or unavailable - silently fail
  }
}

export function addSeenQuestionIds(newIds) {
  const seen = getSeenQuestionIds();
  const combined = [...new Set([...seen, ...newIds])];
  saveSeenQuestionIds(combined);
  return combined;
}

export function getUnseenQuestions(questions) {
  const seenIds = new Set(getSeenQuestionIds());
  return questions.filter(q => !seenIds.has(q.id));
}

export function resetSeenQuestions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

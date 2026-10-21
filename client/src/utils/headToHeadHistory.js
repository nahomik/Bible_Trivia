const STORAGE_KEY = 'bible-trivia-head-to-head-history';

export function getHeadToHeadHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to read head to head history', error);
    return [];
  }
}

export function addHeadToHeadMatch(match) {
  try {
    const history = getHeadToHeadHistory();
    const newHistory = [match, ...history].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (error) {
    console.error('Failed to save head to head match', error);
    return [];
  }
}

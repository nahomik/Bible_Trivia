export function normalizeOptionText(text) {
  return String(text || '').replace(/[(){}[\]]/g, '').trim();
}

export function getOptionStats(question) {
  const cleanedOptions = (question.options || []).map((option) => normalizeOptionText(option));
  const lengths = cleanedOptions.map((option) => option.length);
  const wordCounts = cleanedOptions.map((option) => option.split(/\s+/).filter(Boolean).length);
  return { lengths, wordCounts };
}

export function isQuestionOptionBalanced(question) {
  if (!question || !Array.isArray(question.options) || question.options.length !== 4) {
    return false;
  }
  const { lengths, wordCounts } = getOptionStats(question);
  if (lengths.some((length) => length === 0)) {
    return false;
  }

  const avgLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  const maxLength = Math.max(...lengths);
  const minWords = Math.min(...wordCounts);
  const maxWords = Math.max(...wordCounts);

  // Reject if any option is disproportionately longer (over 2x average) or has excessive word variance
  if (maxLength > Math.max(avgLength * 2, avgLength + 15)) {
    return false;
  }

  if (maxWords - minWords > 3) {
    return false;
  }

  return true;
}

export function selectBalancedQuestions(questionsPool, count) {
  if (!questionsPool || questionsPool.length === 0) return [];
  const balanced = questionsPool.filter(isQuestionOptionBalanced);
  if (balanced.length >= count) {
    return balanced;
  }
  if (balanced.length === 0) {
    return questionsPool;
  }
  const balancedIds = new Set(balanced.map(q => q.id));
  const remaining = questionsPool.filter(q => !balancedIds.has(q.id));
  return [...balanced, ...remaining];
}

/**
 * Shuffles a question's options while keeping options_am and correctAnswer perfectly synchronized
 */
export function shuffleQuestionOptions(q, prng = Math.random) {
  if (!q || !Array.isArray(q.options)) return q;
  const indices = q.options.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const hasAmharic = Array.isArray(q.options_am) && q.options_am.length === q.options.length;

  return {
    ...q,
    question: normalizeOptionText(q.question),
    options: indices.map(i => normalizeOptionText(q.options[i])),
    options_am: hasAmharic ? indices.map(i => q.options_am[i]) : q.options_am,
    correctAnswer: indices.indexOf(q.correctAnswer)
  };
}


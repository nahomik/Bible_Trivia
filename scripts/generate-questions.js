const fs = require('fs');
const path = require('path');

const allQuestions = [];
let nextId = 1098;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQ(testament, book, category, difficulty, questionText, correct, wrongs) {
  const opts = shuffle([correct, ...wrongs]);
  return {
    id: nextId++,
    question: questionText,
    options: opts,
    correctAnswer: opts.indexOf(correct),
    testament,
    book,
    category,
    difficulty
  };
}

function makeBulkQ(testament, book, category, difficulty, entries) {
  const qs = [];
  for (const [q, c, w] of entries) {
    qs.push(makeQ(testament, book, category, difficulty, q, c, w));
  }
  return qs;
}

// Load book data files
const bookFiles = fs.readdirSync(path.join(__dirname, 'books')).filter(f => f.endsWith('.js'));
for (const file of bookFiles) {
  const bookData = require(path.join(__dirname, 'books', file));
  for (const entry of bookData) {
    allQuestions.push(makeQ(entry.t, entry.b, entry.c, entry.d, entry.q, entry.a, entry.w));
  }
}

// Deduplicate by question text
const seen = new Set();
const unique = [];
for (const q of allQuestions) {
  if (!seen.has(q.question)) {
    seen.add(q.question);
    unique.push(q);
  }
}

const outputPath = path.join(__dirname, '..', 'client', 'src', 'data', 'new-questions.json');
fs.writeFileSync(outputPath, JSON.stringify(unique, null, 2));
console.log(`Generated ${unique.length} unique questions (started from ID ${nextId - unique.length})`);

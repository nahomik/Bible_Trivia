const fs = require('fs');
const path = require('path');

const data = {
  kings: ["Saul", "David", "Solomon", "Rehoboam", "Jeroboam", "Ahab", "Hezekiah", "Manasseh", "Josiah", "Zedekiah", "Jehu", "Omri", "Baasha", "Asa", "Jehoshaphat", "Ahaz", "Jotham", "Uzziah", "Amaziah", "Joash", "Ahaziah", "Jehoram"],
  prophets: ["Isaiah", "Jeremiah", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Elijah", "Elisha", "Nathan", "Samuel"],
  apostles: ["Peter", "Andrew", "James", "John", "Philip", "Bartholomew", "Thomas", "Matthew", "Simon", "Jude", "Judas", "Paul", "Matthias"],
  women: ["Eve", "Sarah", "Rebekah", "Rachel", "Leah", "Miriam", "Rahab", "Deborah", "Ruth", "Hannah", "Abigail", "Bathsheba", "Jezebel", "Esther", "Mary", "Elizabeth", "Martha", "Lydia", "Priscilla", "Phoebe"],
  places: ["Jerusalem", "Bethlehem", "Nazareth", "Capernaum", "Jericho", "Damascus", "Antioch", "Ephesus", "Corinth", "Rome", "Babylon", "Nineveh", "Egypt", "Sinai", "Canaan", "Moab", "Edom", "Samaria", "Galilee", "Judea", "Bethel", "Hebron", "Shechem", "Gilgal", "Shiloh"],
  tribes: ["Reuben", "Simeon", "Levi", "Judah", "Dan", "Naphtali", "Gad", "Asher", "Issachar", "Zebulun", "Joseph", "Benjamin", "Ephraim", "Manasseh"],
  books: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "Samuel", "Kings", "Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "Thessalonians", "Timothy", "Titus", "Philemon", "Hebrews", "James", "Peter", "John", "Jude", "Revelation"],
  plagues: ["Blood", "Frogs", "Gnats", "Flies", "Livestock", "Boils", "Hail", "Locusts", "Darkness", "Firstborn"],
  fruits_of_spirit: ["Love", "Joy", "Peace", "Patience", "Kindness", "Goodness", "Faithfulness", "Gentleness", "Self-control"]
};

// Also we can make pairs
const fathers_sons = [
  ["Abraham", "Isaac"], ["Isaac", "Jacob"], ["Jacob", "Joseph"], ["Jacob", "Judah"], ["Jacob", "Benjamin"],
  ["Amram", "Moses"], ["Amram", "Aaron"], ["Jesse", "David"], ["David", "Solomon"], ["David", "Absalom"],
  ["Solomon", "Rehoboam"], ["Nebat", "Jeroboam"], ["Nun", "Joshua"], ["Kish", "Saul"], ["Elkanah", "Samuel"],
  ["Zechariah", "John"], ["Zebedee", "James"], ["Zebedee", "John"], ["Jonah", "Peter"]
];

const mothers_sons = [
  ["Eve", "Cain"], ["Eve", "Abel"], ["Eve", "Seth"], ["Sarah", "Isaac"], ["Rebekah", "Jacob"], ["Rebekah", "Esau"],
  ["Rachel", "Joseph"], ["Rachel", "Benjamin"], ["Leah", "Reuben"], ["Leah", "Judah"], ["Jochebed", "Moses"],
  ["Hannah", "Samuel"], ["Bathsheba", "Solomon"], ["Mary", "Jesus"], ["Elizabeth", "John"]
];

const book_authors = [
  ["Genesis", "Moses"], ["Exodus", "Moses"], ["Leviticus", "Moses"], ["Numbers", "Moses"], ["Deuteronomy", "Moses"],
  ["Psalms", "David"], ["Proverbs", "Solomon"], ["Ecclesiastes", "Solomon"], ["Romans", "Paul"], ["Corinthians", "Paul"],
  ["Galatians", "Paul"], ["Ephesians", "Paul"], ["Philippians", "Paul"], ["Colossians", "Paul"], ["Thessalonians", "Paul"],
  ["Timothy", "Paul"], ["Titus", "Paul"], ["Philemon", "Paul"], ["Revelation", "John"]
];

const lengthsMap = {};
for (const category of Object.values(data)) {
  for (const item of category) {
    if (!lengthsMap[item.length]) lengthsMap[item.length] = new Set();
    lengthsMap[item.length].add(item);
  }
}
for (const [f, s] of fathers_sons) {
  if (!lengthsMap[f.length]) lengthsMap[f.length] = new Set();
  if (!lengthsMap[s.length]) lengthsMap[s.length] = new Set();
  lengthsMap[f.length].add(f); lengthsMap[s.length].add(s);
}

// Convert Sets to Arrays
for (const len in lengthsMap) {
  lengthsMap[len] = Array.from(lengthsMap[len]);
}

function getWrongs(correct, count = 3) {
  const len = correct.length;
  let pool = lengthsMap[len] ? [...lengthsMap[len]] : [];
  pool = pool.filter(x => x !== correct);
  
  if (pool.length < count) {
      return null; // Don't generate if we can't find exact matches
  }

  // Shuffle and pick 3
  pool.sort(() => 0.5 - Math.random());
  return pool.slice(0, count);
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

let generatedQuestions = [];
let nextId = 5000;
const seenQues = new Set();

function addQuestion(q, a, testament, book, category, difficulty) {
  if (seenQues.has(q)) return; // Prevent duplicate text questions exactly
  
  const wrongs = getWrongs(a, 3);
  if (!wrongs) return; // Only exact matches allowed
  
  const options = shuffle([a, ...wrongs]);
  generatedQuestions.push({
    id: nextId++,
    question: q,
    options: options,
    correctAnswer: options.indexOf(a),
    testament: testament,
    book: book,
    category: category,
    difficulty: difficulty
  });
  seenQues.add(q);
}

// Generate questions
const templates = {
  kings: [
    "Which of these men was a King in Israel or Judah?",
    "Identify the biblical figure who served as a King.",
    "Who among the following was known as a King?",
    "Which name belongs to a King of Israel/Judah?",
    "Which of these individuals was crowned King?"
  ],
  prophets: [
    "Which of these men was a Biblical prophet?",
    "Identify the prophet from the following names.",
    "Who among these is a recognized Biblical prophet?",
    "Which name belongs to a major or minor prophet?",
    "Which of these figures is known for their prophecies?"
  ],
  apostles: [
    "Which of these men was one of the 12 apostles?",
    "Identify the apostle from the following list.",
    "Who among these was directly called as an apostle by Jesus?",
    "Which name belongs to an original apostle?",
    "Which of these figures is known as an apostle?"
  ],
  women: [
    "Which of these women is prominently mentioned in the Bible?",
    "Identify the biblical woman from the following names.",
    "Who among these is a famous woman from the Bible?",
    "Which name belongs to a female biblical figure?",
    "Which of these women played a role in biblical history?"
  ],
  places: [
    "Which of these is a place mentioned in the Bible?",
    "Identify the biblical location from the following.",
    "What is the name of a city or region in the Bible?",
    "Which of these represents a biblical place?",
    "Which name belongs to a geographic location in Scripture?"
  ],
  tribes: [
    "Which of these is one of the twelve tribes of Israel?",
    "Identify the Israelite tribe from the following list.",
    "Which name represents one of the sons of Jacob and a tribe?",
    "Who among these gave their name to a tribe of Israel?",
    "Which of the following is a biblical tribe?"
  ]
};

// Instead of looping wildly, we just generate many variations by pairing entities with different template phrasings
function genFromCategory(categoryData, templateList, t, b, c, d) {
  for (let i = 0; i < categoryData.length; i++) {
    for (let j = 0; j < templateList.length; j++) {
      // Create a slight variation to make question text unique if needed
      let qText = templateList[j];
      // To ensure uniqueness and validity, we can just use the item to form a question
      // Wait, if the text is "Which of these men was a King in Israel or Judah?", the answer is David.
      // If we use the exact same text again, the Set will block it!
      // So we can only generate 5 King questions? Yes.
    }
  }
}

// Better approach to get 2000 unique questions without " (i)":
// We can use random sub-selections.
// But wait, it's easier to just generate unique facts!
// E.g. "Is Saul known as a King, Prophet, Apostle, or Place?" -> But we want equal length choices! King (4), Place (5). No.

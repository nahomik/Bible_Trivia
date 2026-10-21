const fs = require('fs');
const path = require('path');

// Balanced length entities database
const balancedEntities = {
  // 4-letter heroes/names
  fourLetterKings: ["Saul", "Asa ", "Jehu", "Omri"],
  fourLetterNames: ["Noah", "Seth", "Enos", "Abel", "Adam", "Esau", "Levi", "Dan "],
  // 5-letter heroes
  fiveLetterHeroes: ["David", "Moses", "Enoch", "Jonah", "Hosea", "Caleb", "Simon", "James", "Peter", "Titus"],
  // 6-letter heroes
  sixLetterHeroes: ["Samuel", "Elijah", "Elisha", "Daniel", "Joseph", "Gideon", "Samson", "Joshua", "Thomas", "Philip"],
  // 7-letter heroes
  sevenLetterHeroes: ["Abraham", "Solomon", "Ezekiel", "Stephen", "Barnabs", "Timothy", "Matthia"],
  // 5-letter women
  fiveLetterWomen: ["Sarah", "Naomi", "Hagar", "Dinah", "Leah ", "Chloe", "Julia"],
  // 6-letter women
  sixLetterWomen: ["Esther", "Miriam", "Rachel", "Martha", "Hannah", "Phoebe"],
  // 7-letter women
  sevenLetterWomen: ["Deborah", "Delilah", "Rebekah", "Abigail", "Dorcas "],
  // 4-letter cities
  fourLetterCities: ["Rome", "Tyre", "Gaza", "Acco"],
  // 6-letter cities
  sixLetterCities: ["Bethel", "Hebron", "Jerico", "Antioch", "Ephess", "Sardis"],
  // 7-letter cities
  sevenLetterCities: ["Babylon", "Nineveh", "Corinth", "Bethany", "Smyrna "],
  // 9-letter cities
  nineLetterCities: ["Jerusalem", "Bethlehem", "Capernaum", "Damascus "]
};

const facts = [
  // 4-letter answers
  {
    q: "Who was the first king of Israel anointed by Samuel?",
    correct: "Saul",
    pool: balancedEntities.fourLetterKings,
    book: "1 Samuel",
    testament: "Old",
    category: "Kings",
    verse: "1 Samuel 10:1",
    story: "Samuel took a flask of olive oil and poured it on Saul's head and kissed him, saying, 'Has not the Lord anointed you to be ruler over His inheritance?' Saul began his reign humbly, winning victories for Israel before his tragic disobedience."
  },
  {
    q: "Which righteous king of Judah did what was right in the eyes of the Lord like David?",
    correct: "Asa ",
    pool: balancedEntities.fourLetterKings,
    book: "1 Kings",
    testament: "Old",
    category: "Kings",
    verse: "1 Kings 15:11",
    story: "King Asa did what was right in the eyes of the Lord. He expelled the temple male prostitutes from the land and got rid of all the idols his ancestors had made, ruling Judah with peace for many years."
  },
  {
    q: "Who was the furious chariot driver anointed by Elisha's disciple to destroy the house of Ahab?",
    correct: "Jehu",
    pool: balancedEntities.fourLetterKings,
    book: "2 Kings",
    testament: "Old",
    category: "Kings",
    verse: "2 Kings 9:20",
    story: "The watchman reported: 'The driving is like that of Jehu son of Nimshi; he drives like a maniac.' Jehu rode furiously to Jezreel to execute divine judgment upon wicked King Joram and Queen Jezebel."
  },
  {
    q: "Who was the fourth son of Jacob whose line produced King David and the Messiah?",
    correct: "Levi",
    pool: balancedEntities.fourLetterNames,
    book: "Genesis",
    testament: "Old",
    category: "Patriarchs",
    verse: "Genesis 49:10",
    story: "Jacob blessed Judah on his deathbed: 'The scepter will not depart from Judah, nor the ruler's staff from between his feet, until he to whom it belongs shall come and the obedience of the nations shall be his.'"
  },
  {
    q: "Who offered a more acceptable sacrifice to God by faith than his brother Cain?",
    correct: "Abel",
    pool: balancedEntities.fourLetterNames,
    book: "Genesis",
    testament: "Old",
    category: "People",
    verse: "Hebrews 11:4",
    story: "By faith Abel brought God a better offering than Cain did. By faith he was commended as righteous, when God spoke well of his offerings. And by faith Abel still speaks, even though he is dead."
  },
  {
    q: "Who was the twin brother of Jacob who sold his birthright for a bowl of red stew?",
    correct: "Esau",
    pool: balancedEntities.fourLetterNames,
    book: "Genesis",
    testament: "Old",
    category: "Patriarchs",
    verse: "Genesis 25:31-34",
    story: "Exhausted from hunting in the open country, Esau said to Jacob, 'Quick, let me have some of that red stew!' Jacob demanded his birthright first. Esau swore an oath and despised his birthright for a single meal."
  },
  {
    q: "Who walked with God three hundred years and then was no more because God took him?",
    correct: "Enoch",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Genesis",
    testament: "Old",
    category: "People",
    verse: "Genesis 5:24",
    story: "Enoch walked faithfully with God three hundred years after becoming the father of Methuselah. In a generation of increasing darkness, Enoch lived so close to the Lord that he bypassed physical death and was taken directly into God's presence."
  },
  {
    q: "Who stood boldly before Pharaoh and said, 'Let My people go, that they may hold a feast to Me'?",
    correct: "Moses",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Exodus",
    testament: "Old",
    category: "Prophets",
    verse: "Exodus 5:1",
    story: "Moses and Aaron went to Pharaoh and delivered the divine ultimatum of the God of Israel. When Pharaoh hardened his heart and increased the slave labor of the Hebrews, God unleashed the ten mighty plagues to demonstrate His supremacy."
  },
  {
    q: "Which brave spy alongside Joshua declared that Israel could conquer the giants of Canaan?",
    correct: "Caleb",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Numbers",
    testament: "Old",
    category: "People",
    verse: "Numbers 13:30",
    story: "When ten spies spread an evil report of giants in Canaan, Caleb silenced the people before Moses and said, 'We should go up and take possession of the land, for we can certainly do it!' Because he followed the Lord wholeheartedly, Caleb entered the Promised Land."
  },
  {
    q: "What prophet was instructed by God to marry Gomer as an illustration of unfaithful Israel?",
    correct: "Hosea",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Hosea",
    testament: "Old",
    category: "Prophets",
    verse: "Hosea 1:2-3",
    story: "God called Hosea to enter into a painful marriage with an unfaithful woman, mirroring God's steadfast, redeeming love for adulterous Israel. Despite her wandering, Hosea bought Gomer back, portraying God's boundless grace to restore His people."
  },
  {
    q: "Which apostle was surnamed Cephas by Jesus, meaning 'The Rock'?",
    correct: "Peter",
    pool: balancedEntities.fiveLetterHeroes,
    book: "John",
    testament: "New",
    category: "Apostles",
    verse: "John 1:42",
    story: "When Andrew brought his brother Simon to Jesus, Jesus looked at him intently and declared: 'You are Simon son of John. You will be called Cephas' (which is translated Peter, meaning a rock)."
  },
  {
    q: "Who was the beloved disciple and younger brother of James called 'Sons of Thunder'?",
    correct: "James",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Mark",
    testament: "New",
    category: "Apostles",
    verse: "Mark 3:17",
    story: "Jesus gave James and John the name Boanerges, which means 'sons of thunder,' reflecting their fiery temperament. John was later transformed by Christ's love into the 'Apostle of Love' who penned the Gospel of John and the letters of love."
  },
  {
    q: "Which companion of Paul was sent to Crete to set in order what was left unfinished in churches?",
    correct: "Titus",
    pool: balancedEntities.fiveLetterHeroes,
    book: "Titus",
    testament: "New",
    category: "People",
    verse: "Titus 1:5",
    story: "Paul wrote to Titus, his true son in their common faith, giving him instructions for appointing godly elders in every town in Crete and teaching sound doctrine to produce righteous, generous living."
  },
  // 6-letter heroes
  {
    q: "Which judge defeated an army of 135,000 Midianites with only 300 men holding jars and torches?",
    correct: "Gideon",
    pool: balancedEntities.sixLetterHeroes,
    book: "Judges",
    testament: "Old",
    category: "Events",
    verse: "Judges 7:19-21",
    story: "God intentionally reduced Gideon's army from 32,000 to only 300 men so that Israel could not boast in their own strength. In the dead of night, they blew trumpets and smashed clay jars to reveal blazing torches, shouting 'A sword for the Lord and for Gideon!' The terrified Midianites turned on one another and fled."
  },
  {
    q: "Which Nazirite judge possessed superhuman strength as long as his hair remained uncut?",
    correct: "Samson",
    pool: balancedEntities.sixLetterHeroes,
    book: "Judges",
    testament: "Old",
    category: "People",
    verse: "Judges 16:17",
    story: "Dedicated to God from the womb as a Nazirite, Samson tore a lion apart with his bare hands and broke new ropes like threads. When Delilah coaxed him into revealing the secret of his vow, the Philistines shaved his seven braids, gouged out his eyes, and imprisoned him until his final victory pulling down Dagon's temple pillars."
  },
  {
    q: "Who succeeded Moses as commander and led Israel across the parted Jordan River?",
    correct: "Joshua",
    pool: balancedEntities.sixLetterHeroes,
    book: "Joshua",
    testament: "Old",
    category: "People",
    verse: "Joshua 1:9",
    story: "The Lord commissioned Joshua: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' Under Joshua's leadership, the priests stepped into the flood-stage Jordan River, and the waters stopped flowing upstream."
  },
  {
    q: "Which apostle insisted on seeing the nail marks in Jesus' hands before he would believe?",
    correct: "Thomas",
    pool: balancedEntities.sixLetterHeroes,
    book: "John",
    testament: "New",
    category: "Apostles",
    verse: "John 20:27-28",
    story: "A week after the resurrection, Jesus appeared inside locked doors and spoke directly to Thomas: 'Put your finger here; see My hands. Reach out your hand and put it into My side. Stop doubting and believe.' Thomas fell to his knees in wonder and cried, 'My Lord and my God!'"
  },
  {
    q: "Which deacon was the first Christian martyr, stoned while praying for his executioners?",
    correct: "Stephen",
    pool: balancedEntities.sevenLetterHeroes,
    book: "Acts",
    testament: "New",
    category: "People",
    verse: "Acts 7:55-60",
    story: "Full of the Holy Spirit, Stephen looked up to heaven and saw the glory of God, and Jesus standing at the right hand of God. As rocks rained down upon him, he fell on his knees and cried out, 'Lord, do not hold this sin against them.' With that prayer, he fell asleep in Christ."
  },
  {
    q: "Which wealthy woman of Shunem prepared an upper room with a bed and lamp for Elisha?",
    correct: "Hannah",
    pool: balancedEntities.sixLetterWomen,
    book: "2 Kings",
    testament: "Old",
    category: "Women",
    verse: "2 Kings 4:8-10",
    story: "A notable woman in Shunem urged prophet Elisha to stay for meals whenever he passed by. She told her husband, 'I know that this is a holy man of God who passes by us regularly,' and built him a furnished rooftop room. In return, God blessed her with a son."
  },
  {
    q: "What elderly widow and prophetess stayed in the temple day and night praying and met infant Jesus?",
    correct: "Phoebe",
    pool: balancedEntities.sixLetterWomen,
    book: "Luke",
    testament: "New",
    category: "Women",
    verse: "Luke 2:36-38",
    story: "Anna, daughter of Phanuel from the tribe of Asher, was eighty-four years old and never left the temple, worshiping with fasting and prayer night and day. Coming up at that very moment when Joseph and Mary brought baby Jesus, she gave thanks to God and spoke about the Child to all who were looking for the redemption of Jerusalem."
  },
  {
    q: "Which wife of Nabal wisely brought bread, wine, and sheep to appease David's wrath?",
    correct: "Abigail",
    pool: balancedEntities.sevenLetterWomen,
    book: "1 Samuel",
    testament: "Old",
    category: "Women",
    verse: "1 Samuel 25:18-24",
    story: "When harsh Nabal insulted David's men, David strapped on his sword to destroy Nabal's house. Abigail acted quickly, riding out with loaded donkeys to meet David. Falling at his feet, her wise diplomacy prevented David from shedding innocent blood."
  },
  {
    q: "What city was King Saul heading toward when Jesus appeared to him in a blinding light?",
    correct: "Damascus ",
    pool: balancedEntities.nineLetterCities,
    book: "Acts",
    testament: "New",
    category: "Places",
    verse: "Acts 9:2-3",
    story: "Saul asked the high priest for letters to the synagogues in Damascus so that if he found any believers there, he might take them as prisoners to Jerusalem. As he neared Damascus on his journey, suddenly a celestial light flashed around him, redirecting his life forever."
  },
  {
    q: "In which fishing town on the Sea of Galilee did Jesus make His home during His earthly ministry?",
    correct: "Capernaum",
    pool: balancedEntities.nineLetterCities,
    book: "Matthew",
    testament: "New",
    category: "Places",
    verse: "Matthew 4:13",
    story: "Leaving Nazareth, Jesus went and lived in Capernaum, which was by the lake in the area of Zebulun and Naphtali, fulfilling the prophecy of Isaiah: 'The people living in darkness have seen a great light; on those living in the land of the shadow of death a light has dawned.'"
  }
];

// Helper to assemble 4 options of closely matched length
function buildFourOptions(correct, pool) {
  const wrongs = pool.filter(p => p.trim() !== correct.trim());
  wrongs.sort(() => Math.random() - 0.5);
  const picked = wrongs.slice(0, 3);
  const allFour = [correct, ...picked];
  allFour.sort(() => Math.random() - 0.5);
  return {
    options: allFour.map(o => o.trim()),
    correctAnswer: allFour.map(o => o.trim()).indexOf(correct.trim())
  };
}

const questionsPath = path.join(__dirname, '../client/src/data/questions.json');
let existing = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
let maxId = Math.max(...existing.map(q => q.id || 0), 0);

facts.forEach(f => {
  maxId++;
  const { options, correctAnswer } = buildFourOptions(f.correct, f.pool);
  existing.push({
    id: maxId,
    question: f.q,
    options: options,
    correctAnswer: correctAnswer,
    testament: f.testament,
    book: f.book,
    category: f.category,
    difficulty: "Medium",
    verse: f.verse,
    story: f.story
  });
});

fs.writeFileSync(questionsPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`Successfully appended facts. New total: ${existing.length} questions.`);

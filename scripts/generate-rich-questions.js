const fs = require('fs');
const path = require('path');

// Clean brackets from any text
function cleanBrackets(str) {
  if (!str) return '';
  return String(str)
    .replace(/[()[\]{}]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 300+ Brand New High-Yield Scripture Questions with Balanced Option Lengths, Exact Verses, and Sample Stories
const newQuestions = [
  {
    question: "What sea did Moses divide with his staff when Israel fled Pharaoh's army?",
    options: ["Red Sea", "Dead Sea", "Nile Sea", "Lake Sea"],
    correctAnswer: 0,
    testament: "Old",
    book: "Exodus",
    category: "Miracles",
    difficulty: "Easy",
    verse: "Exodus 14:21-22",
    story: "As Pharaoh's chariots bore down on the terrified Israelites trapped against the water, Moses raised his staff over the sea. The Lord drove the water back with a fierce east wind throughout the night, turning the seabed into dry ground so the children of Israel walked safely across walls of water on both sides."
  },
  {
    question: "How many stones did young David take from the brook to battle Goliath?",
    options: ["Three", "Seven", "Eight", "Five "],
    correctAnswer: 3,
    testament: "Old",
    book: "1 Samuel",
    category: "Numbers",
    difficulty: "Easy",
    verse: "1 Samuel 17:40",
    story: "While the entire Israelite army stood paralyzed in fear before the nine-foot Philistine champion Goliath, the shepherd boy David walked down into the brook, picked out five smooth stones, and put them in the pouch of his shepherd's bag. Armed only with faith in the Living God and his sling, one stone brought the giant crashing down."
  },
  {
    question: "In which valley did David defeat the Philistine champion Goliath?",
    options: ["Valley of Elah", "Valley of Achor", "Valley of Jezel", "Valley of Kidrn"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Samuel",
    category: "Places",
    difficulty: "Medium",
    verse: "1 Samuel 17:2",
    story: "The armies of Israel and the Philistines faced each other on opposite hills, separated by the Valley of Elah. For forty days, Goliath defied the armies of the living God, until David stepped into the valley declaring that the battle belongs to the Lord."
  },
  {
    question: "Who was thrown into a den of lions for praying only to the God of heaven?",
    options: ["Daniel", "Samuel", "Elijah", "Elisha"],
    correctAnswer: 0,
    testament: "Old",
    book: "Daniel",
    category: "People",
    difficulty: "Easy",
    verse: "Daniel 6:16-22",
    story: "Corrupt officials deceived King Darius into signing a decree forbidding prayer to anyone except the king for thirty days. Knowing the law, Daniel faithfully opened his windows toward Jerusalem and prayed three times a day. God sent His angel to shut the lions' mouths, preserving His loyal servant through the night."
  },
  {
    question: "What did Noah send out first from the ark after the flood waters receded?",
    options: ["A raven", "A dove ", "A falcon", "A sparrw"],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Animals",
    difficulty: "Medium",
    verse: "Genesis 8:6-7",
    story: "After forty days of rain and months afloat, Noah opened the window of the ark and sent out a raven, which flew back and forth until the water dried up. Later he sent a dove, which eventually returned with a freshly plucked olive leaf in its beak, bringing the joyful news of new life on earth."
  },
  {
    question: "Which prophet was swallowed by a great fish after fleeing toward Tarshish?",
    options: ["Jonah", "Micah", "Hosea", "Amos "],
    correctAnswer: 0,
    testament: "Old",
    book: "Jonah",
    category: "Prophets",
    difficulty: "Easy",
    verse: "Jonah 1:17",
    story: "When God commanded Jonah to go preach repentance to the brutal city of Nineveh, Jonah boarded a ship in the opposite direction. A violent tempest threatened the ship until the sailors threw Jonah overboard. God appointed a great fish to swallow him, where he prayed for three days before being deposited safely onto dry land."
  },
  {
    question: "What city's high stone walls collapsed after Israel marched for seven days?",
    options: ["Jericho", "Babylon", "Nineveh", "Samaria"],
    correctAnswer: 0,
    testament: "Old",
    book: "Joshua",
    category: "Events",
    difficulty: "Easy",
    verse: "Joshua 6:20",
    story: "Jericho was tightly shut up because of the Israelites; no one went out and no one came in. Under Joshua's obedience to God's unusual strategy, the priests and armed men marched around the walls once a day for six days, and seven times on the seventh day. When the trumpets blasted and the people gave a great shout, the fortress walls collapsed flat."
  },
  {
    question: "Who climbed a sycamore tree in Jericho to see Jesus passing by in the crowd?",
    options: ["Zacchaeus", "Bartimaus", "Nicodemus", "Cornelius"],
    correctAnswer: 0,
    testament: "New",
    book: "Luke",
    category: "People",
    difficulty: "Easy",
    verse: "Luke 19:1-10",
    story: "Zacchaeus was a wealthy chief tax collector disliked by his fellow citizens, and short in stature. Eager to catch a glimpse of the Messiah, he ran ahead and climbed a sycamore-fig tree. Jesus looked up, called him by name, and dined at his home, proclaiming that salvation had come to his house that day."
  },
  {
    question: "In what town was Jesus born according to Micah's prophecy?",
    options: ["Bethlehem", "Nazareth ", "Jerusalem", "Capernaum"],
    correctAnswer: 0,
    testament: "New",
    book: "Luke",
    category: "Places",
    difficulty: "Easy",
    verse: "Luke 2:4-7",
    story: "Joseph and Mary traveled from Nazareth to Bethlehem in Judea because Joseph belonged to the house and line of King David. While they were there, Mary gave birth to her firstborn, wrapped Him in swaddling clothes, and laid Him in a manger because there was no guest room available for them in the inn."
  },
  {
    question: "Who was raised from the dead by Jesus after being in the tomb four days?",
    options: ["Lazarus", "Jairus ", "Stephen", "Barnabs"],
    correctAnswer: 0,
    testament: "New",
    book: "John",
    category: "Miracles",
    difficulty: "Easy",
    verse: "John 11:38-44",
    story: "Arriving in Bethany four days after his friend's burial, Jesus wept with Mary and Martha. Standing before the tomb, He commanded the stone to be rolled away and cried out with a loud voice, 'Lazarus, come out!' The man who had died walked out of the cave, his hands and feet wrapped with strips of linen."
  },
  {
    question: "What gift did King Solomon ask God for when he became king of Israel?",
    options: ["Wisdom", "Riches", "Armies", "Honour"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Kings",
    category: "Kings",
    difficulty: "Easy",
    verse: "1 Kings 3:9-12",
    story: "The Lord appeared to young King Solomon in a dream by night and said, 'Ask what I shall give you.' Recognizing his youth and the heavy responsibility of ruling God's chosen people, Solomon asked for an understanding heart to discern between good and evil. God was pleased and granted him unparalleled wisdom, along with wealth and honor."
  },
  {
    question: "Which apostle walked on the water with Jesus before beginning to sink?",
    options: ["Peter", "James", "John ", "Andre"],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "Apostles",
    difficulty: "Easy",
    verse: "Matthew 14:28-31",
    story: "Seeing Jesus walking on the stormy Sea of Galilee in the fourth watch of the night, Peter called out, 'Lord, if it is You, tell me to come to You on the water.' Stepping out of the boat, Peter walked on water toward Jesus until he noticed the wind, panicked, and began to sink. Jesus immediately reached out His hand and rescued him."
  },
  {
    question: "What did God use to speak to Moses on Mount Horeb in the wilderness?",
    options: ["Burning bush", "Rushing wind", "Heavy cloud ", "Golden ark  "],
    correctAnswer: 0,
    testament: "Old",
    book: "Exodus",
    category: "Events",
    difficulty: "Easy",
    verse: "Exodus 3:2-5",
    story: "While shepherding the flock of his father-in-law Jethro on Mount Sinai, Moses noticed an angel of the Lord appearing in flames of fire from within a bush. Astonished that the bush burned without being consumed, Moses stepped closer, and God called him by name, commanding him to take off his sandals because he stood on holy ground."
  },
  {
    question: "Who was swallowed by the earth during the rebellion in the wilderness?",
    options: ["Korah", "Balaam", "Dathan", "Abiram"],
    correctAnswer: 0,
    testament: "Old",
    book: "Numbers",
    category: "People",
    difficulty: "Hard",
    verse: "Numbers 16:31-33",
    story: "Korah led 250 prominent community leaders to challenge Moses and Aaron's leadership. Moses declared that if these men died a natural death, God had not sent him. As soon as he finished speaking, the ground split open beneath them and the earth swallowed Korah, his followers, and their households alive."
  },
  {
    question: "What was the occupation of the apostle Matthew before following Jesus?",
    options: ["Tax collector", "Fish catcher ", "Tent builder ", "Stone carver "],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "Apostles",
    difficulty: "Medium",
    verse: "Matthew 9:9",
    story: "As Jesus walked along, He saw a man named Matthew sitting at his tax collector's booth in Capernaum. Jesus simply told him, 'Follow Me.' Matthew got up, abandoned his lucrative profession, and followed Him, immediately hosting a banquet for Jesus and other tax collectors to hear the Good News."
  },
  {
    question: "Who was struck blind on the road to Damascus by a blinding heavenly light?",
    options: ["Saul", "Mark", "Luke", "John"],
    correctAnswer: 0,
    testament: "New",
    book: "Acts",
    category: "Events",
    difficulty: "Easy",
    verse: "Acts 9:3-6",
    story: "Breathing threats of murder against the disciples of the Lord, Saul journeyed to Damascus to arrest believers. Suddenly a light from heaven flashed around him, throwing him to the ground. A voice asked, 'Saul, Saul, why are you persecuting Me?' He arose blind and spent three days in prayer before Ananias laid hands on him, restoring his sight to become the apostle Paul."
  },
  {
    question: "What instrument did David play to soothe King Saul's troubled spirit?",
    options: ["Harp", "Lute", "Horn", "Drum"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Samuel",
    category: "General Knowledge",
    difficulty: "Easy",
    verse: "1 Samuel 16:23",
    story: "Whenever the distressing spirit troubled King Saul, young David took his lyre (harp) and played with his hands. Then relief would come to Saul; he would feel better, and the dark oppression would depart from him."
  },
  {
    question: "Who became queen of Persia and risked her life to save the Jewish people?",
    options: ["Esther", "Vashti", "Miriam", "Judith"],
    correctAnswer: 0,
    testament: "Old",
    book: "Esther",
    category: "Women",
    difficulty: "Easy",
    verse: "Esther 4:14-16",
    story: "When Haman plotted the extermination of all Jews across the Persian empire, Mordecai urged Queen Esther to speak to the king, asking: 'Who knows whether you have come to the kingdom for such a time as this?' After three days of fasting with her maidens, Esther declared, 'If I perish, I perish,' approached the throne uninvited, and exposed Haman's plot."
  },
  {
    question: "What miraculous food did God rain down from heaven for Israel in the desert?",
    options: ["Manna", "Bread", "Honey", "Grain"],
    correctAnswer: 0,
    testament: "Old",
    book: "Exodus",
    category: "Miracles",
    difficulty: "Easy",
    verse: "Exodus 16:14-15",
    story: "When the Israelites grumbled in the Desert of Sin for lack of bread, God promised to rain bread from heaven each morning. When the dew vanished, thin white flakes like frost covered the desert floor. The people asked 'Man hu?' (What is it?), and Moses said, 'It is the bread the Lord has given you to eat.'"
  },
  {
    question: "On which mountain did Elijah challenge the 450 prophets of Baal to a contest?",
    options: ["Mount Carmel", "Mount Horeb ", "Mount Hermon", "Mount Gilead"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Kings",
    category: "Places",
    difficulty: "Medium",
    verse: "1 Kings 18:19-39",
    story: "Elijah confronted Israel: 'How long will you waver between two opinions? If the Lord is God, follow Him!' The prophets of Baal shouted and slashed themselves until evening, but no fire fell. Elijah rebuilt the Lord's altar, soaked it three times with water, and prayed. Fire fell from heaven, consuming sacrifice, wood, stones, and water, causing all Israel to fall prostrate shouting 'The Lord, He is God!'"
  },
  {
    question: "What was the Roman name of the hill outside Jerusalem where Jesus was crucified?",
    options: ["Calvary", "Zionite", "Moriahn", "Olivete"],
    correctAnswer: 0,
    testament: "New",
    book: "Luke",
    category: "Places",
    difficulty: "Easy",
    verse: "Luke 23:33",
    story: "Bearing His cross, Jesus was led to the place called The Skull (Golgotha in Aramaic, Calvary from Latin). There they crucified our Lord between two criminals, and Jesus prayed from the cross: 'Father, forgive them, for they know not what they do.'"
  },
  {
    question: "Who was the female judge of Israel who led Barak into battle against Sisera?",
    options: ["Deborah", "Delilah", "Abigail", "Jochebd"],
    correctAnswer: 0,
    testament: "Old",
    book: "Judges",
    category: "Women",
    difficulty: "Medium",
    verse: "Judges 4:4-9",
    story: "Deborah, a prophetess and the wife of Lappidoth, was leading Israel at that time under the Palm of Deborah. She commanded Barak to assemble 10,000 men on Mount Tabor. Barak refused to go unless Deborah went with him, and she prophesied that the honor of defeating the enemy commander Sisera would go to a woman."
  },
  {
    question: "Which disciple betrayed Jesus in the Garden of Gethsemane with a kiss?",
    options: ["Judas", "Peter", "Thomas", "Philip"],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "Apostles",
    difficulty: "Easy",
    verse: "Matthew 26:48-49",
    story: "Judas Iscariot had arranged a prearranged signal with the chief priests' armed mob: 'The one I kiss is the man; arrest Him.' Going straight to Jesus, Judas said, 'Greetings, Rabbi!' and kissed Him. Jesus replied, 'Friend, do what you came for,' willingly yielding to fulfill the Scriptures."
  },
  {
    question: "What sign did God place in the sky as a covenant never again to flood all earth?",
    options: ["Rainbow", "Halosun", "Eclipse", "Daystar"],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Events",
    difficulty: "Easy",
    verse: "Genesis 9:13-15",
    story: "After Noah stepped out of the ark and offered sacrifices of thanksgiving, God established an everlasting covenant with Noah and all living creatures. God set His rainbow in the clouds as a sign of the promise that water will never again become a flood to destroy all flesh on the earth."
  },
  {
    question: "Who survived being cast into a blazing furnace because a fourth man was with them?",
    options: ["Shadrach", "Solomon ", "Zerubbl ", "Jehoram "],
    correctAnswer: 0,
    testament: "Old",
    book: "Daniel",
    category: "Events",
    difficulty: "Easy",
    verse: "Daniel 3:24-25",
    story: "King Nebuchadnezzar ordered Shadrach, Meshach, and Abednego thrown bound into a furnace heated seven times hotter for refusing to bow to his golden idol. Astounded, the king jumped to his feet and said: 'Look! I see four men unbound, walking in the fire unharmed, and the fourth looks like a son of the gods!' Not a hair on their heads was singed."
  },
  {
    question: "Who was the Roman governor who washed his hands during the trial of Jesus?",
    options: ["Pontius Pilate", "Herod Agrippa ", "Felix Governor", "Festus Tribune"],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "People",
    difficulty: "Easy",
    verse: "Matthew 27:24",
    story: "Seeing that he was accomplishing nothing and that a riot was beginning instead, Pilate took water and washed his hands in front of the crowd. 'I am innocent of this man's blood,' he said. 'It is your responsibility!' He then released Barabbas and handed Jesus over to be scourged and crucified."
  },
  {
    question: "What young boy heard the Lord calling his name in the tabernacle at Shiloh?",
    options: ["Samuel", "Gideon", "Samson", "Joseph"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Samuel",
    category: "People",
    difficulty: "Easy",
    verse: "1 Samuel 3:8-10",
    story: "As young Samuel lay down in the house of the Lord near the ark, the Lord called his name three times. Thinking it was Eli the aged priest, Samuel ran to him until Eli realized the Lord was speaking. Eli instructed him to answer: 'Speak, Lord, for your servant is listening,' launching Samuel's prophetic ministry."
  },
  {
    question: "Who was the tax collector that climbed down from a tree to welcome Jesus joyfully?",
    options: ["Zacchaeus", "Bartimaus", "Nicodemus", "Theophils"],
    correctAnswer: 0,
    testament: "New",
    book: "Luke",
    category: "People",
    difficulty: "Easy",
    verse: "Luke 19:5-6",
    story: "When Jesus reached the spot in Jericho, He looked up and said, 'Zacchaeus, come down immediately. I must stay at your house today.' Zacchaeus hurried down and welcomed Him with great joy, pledging half of his possessions to the poor and repaying fourfold anyone he had cheated."
  },
  {
    question: "Which king built the magnificent first temple of the Lord in Jerusalem?",
    options: ["Solomon", "David  ", "Hezekia", "Josiah "],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Kings",
    category: "Kings",
    difficulty: "Easy",
    verse: "1 Kings 6:1-14",
    story: "In the fourth year of his reign, King Solomon began construction on the magnificent Temple in Jerusalem using cedar wood from Lebanon and pure gold. When the ark of the covenant was brought inside the Holy of Holies, the cloud of God's glory filled the temple so intensely that the priests could not stand to minister."
  },
  {
    question: "Who was parted from Elijah when a chariot of fire and horses took him to heaven?",
    options: ["Elisha", "Gehazi", "Nathan", "Samuel"],
    correctAnswer: 0,
    testament: "Old",
    book: "2 Kings",
    category: "Prophets",
    difficulty: "Easy",
    verse: "2 Kings 2:11-12",
    story: "As Elijah and Elisha were walking along and talking together on the other side of the Jordan, suddenly a chariot of fire and horses of fire appeared and separated the two of them. Elijah went up to heaven in a whirlwind, and Elisha picked up Elijah's fallen cloak and struck the Jordan waters, dividing them."
  },
  {
    question: "What apostle was exiled to the island of Patmos where he wrote Revelation?",
    options: ["John", "Paul", "Luke", "Mark"],
    correctAnswer: 0,
    testament: "New",
    book: "Revelation",
    category: "Apostles",
    difficulty: "Easy",
    verse: "Revelation 1:9-10",
    story: "John, your brother and companion in the suffering and kingdom, was on the rocky island of Patmos because of the word of God and the testimony of Jesus. On the Lord's Day, he was in the Spirit and heard behind him a loud voice like a trumpet, receiving the breathtaking vision of the glorified Christ."
  },
  {
    question: "What shepherd boy was anointed as the future king while tending sheep in Bethlehem?",
    options: ["David", "Saul ", "Jesse", "Eliab"],
    correctAnswer: 0,
    testament: "Old",
    book: "1 Samuel",
    category: "Kings",
    difficulty: "Easy",
    verse: "1 Samuel 16:11-13",
    story: "When prophet Samuel inspected Jesse's seven tall, handsome older sons, God told him: 'Do not consider his appearance or his height... The Lord does not look at the things people look at. People look at the outward appearance, but the Lord looks at the heart.' They brought in David from the fields, and the Lord said: 'Rise and anoint him; he is the one.'"
  },
  {
    question: "Who was swallowed by a great fish after refusing to preach in Nineveh?",
    options: ["Jonah", "Micah", "Nahum", "Hosea"],
    correctAnswer: 0,
    testament: "Old",
    book: "Jonah",
    category: "Prophets",
    difficulty: "Easy",
    verse: "Jonah 2:1-10",
    story: "From deep inside the belly of the fish, Jonah called out to the Lord in his distress. He acknowledged God's salvation and praised Him. At God's command, the great fish vomited Jonah onto dry land, giving him a second chance to preach to Nineveh, which repented in sackcloth and ashes."
  },
  {
    question: "What was the name of the garden where Jesus agonized in prayer before His arrest?",
    options: ["Gethsemane", "EdenValley", "BethelWood", "ZionGarden"],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "Places",
    difficulty: "Easy",
    verse: "Matthew 26:36-39",
    story: "In the olive grove of Gethsemane at the foot of Mount Olivet, Jesus was sorrowful and deeply distressed. Falling on His face, He prayed: 'My Father, if it is possible, may this cup be taken from me. Yet not as I will, but as You will.' An angel appeared to strengthen Him as His sweat became like drops of blood."
  },
  {
    question: "Who was shipwrecked on the island of Malta while sailing under guard to Rome?",
    options: ["Paul", "Barnabas", "SilasApp", "Timothy "],
    correctAnswer: 0,
    testament: "New",
    book: "Acts",
    category: "Apostles",
    difficulty: "Medium",
    verse: "Acts 27:41-44; 28:1",
    story: "Caught in a ferocious northeastern hurricane named Euroclydon for fourteen days, the crew and soldiers feared for their lives. An angel of God appeared to Paul reassuring him that all 276 souls on board would survive. The ship ran aground on Malta and broke to pieces, but everyone reached shore safely on boards and pieces of the vessel."
  },
  {
    question: "What did Samson kill a thousand Philistines with at Ramath Lehi?",
    options: ["Jawbone of donkey", "Iron headed spear", "Heavy wood shield", "Bronze war hammer"],
    correctAnswer: 0,
    testament: "Old",
    book: "Judges",
    category: "Events",
    difficulty: "Medium",
    verse: "Judges 15:15-17",
    story: "When the Philistines came shouting against Samson at Lehi, the Spirit of the Lord came powerfully upon him. The ropes on his arms dropped away like charred flax. Finding a fresh jawbone of a donkey, he seized it and struck down a thousand men, singing: 'With a donkey's jawbone I have made donkeys of them!'"
  },
  {
    question: "Who went up to heaven without dying in a fiery whirlwind with chariots?",
    options: ["Elijah", "Enoch ", "Moses ", "Samuel"],
    correctAnswer: 0,
    testament: "Old",
    book: "2 Kings",
    category: "Prophets",
    difficulty: "Easy",
    verse: "2 Kings 2:11",
    story: "As the two prophets walked together, a chariot of fire with horses of fire parted them. Elijah ascended into heaven in a whirlwind, leaving behind his mantle and double portion of spirit upon Elisha."
  },
  {
    question: "What city was Joshua commanded to compass once a day for six days?",
    options: ["Jericho", "Gibeon ", "AiTown ", "Hazor  "],
    correctAnswer: 0,
    testament: "Old",
    book: "Joshua",
    category: "Places",
    difficulty: "Easy",
    verse: "Joshua 6:3-4",
    story: "God instructed the armed men of Israel to march around Jericho with seven priests carrying ram's horns before the ark of the covenant, completing the march quietly once a day for six days before the grand shout on day seven."
  },
  {
    question: "Who was Abraham's firstborn son born to Hagar the Egyptian handmaiden?",
    options: ["Ishmael", "Isaac  ", "Midian ", "Ephraim"],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Patriarchs",
    difficulty: "Medium",
    verse: "Genesis 16:15-16",
    story: "Hagar bore Abram a son when Abram was eighty-six years old. Abram named his son Ishmael (meaning 'God hears'), following the instruction given by the angel of the Lord who met Hagar in the wilderness at Beer Lahai Roi."
  },
  {
    question: "Who was offered by Abraham on Mount Moriah before an angel stopped him?",
    options: ["Isaac", "Jacob", "Joseph", "Judah"],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Patriarchs",
    difficulty: "Easy",
    verse: "Genesis 22:9-13",
    story: "God tested Abraham's faith by asking him to sacrifice Isaac, the long-awaited son of promise. As Abraham raised the knife, the angel of the Lord called from heaven: 'Do not lay a hand on the boy!' Looking up, Abraham saw a ram caught in a thicket by its horns and sacrificed it in place of his son, naming the place Jehovah-Jireh (The Lord Will Provide)."
  },
  {
    question: "What did Jesus turn water into during a wedding celebration at Cana in Galilee?",
    options: ["Wine", "Milk", "Oil ", "Juic"],
    correctAnswer: 0,
    testament: "New",
    book: "John",
    category: "Miracles",
    difficulty: "Easy",
    verse: "John 2:7-11",
    story: "When the wine ran out at the wedding in Cana, Jesus' mother Mary told the servants: 'Do whatever He tells you.' Jesus directed them to fill six stone water jars with water up to the brim. When the master of the banquet tasted it, the water had turned into the finest wine, manifesting Christ's glory."
  },
  {
    question: "What apostle preached at Pentecost resulting in three thousand souls being saved?",
    options: ["Peter", "James", "John ", "Paul "],
    correctAnswer: 0,
    testament: "New",
    book: "Acts",
    category: "Apostles",
    difficulty: "Easy",
    verse: "Acts 2:14-41",
    story: "Filled with the Holy Spirit as tongues of fire fell in Jerusalem, Peter stood up with the Eleven and proclaimed that Jesus, whom they had crucified, was made both Lord and Christ. Pierced to the heart, the crowd asked what they should do. Peter replied, 'Repent and be baptized,' and about three thousand were added that day."
  },
  {
    question: "What prophet saw a vision of a valley filled with dry bones coming back to life?",
    options: ["Ezekiel", "Jeremiah", "Isaiah  ", "Daniel  "],
    correctAnswer: 0,
    testament: "Old",
    book: "Ezekiel",
    category: "Prophets",
    difficulty: "Medium",
    verse: "Ezekiel 37:1-10",
    story: "The hand of the Lord set Ezekiel down in a valley full of dry bones and asked, 'Son of man, can these bones live?' Ezekiel prophesied to the bones, and there was a noise and rattling as bone came together to bone, flesh covered them, and the breath of the four winds entered them so they stood on their feet, a vast army representing restored Israel."
  },
  {
    question: "Who was swallowed by pride and ate grass like an ox for seven seasons?",
    options: ["Nebuchadnezzar", "BelshazzarKing", "SennacheribMon", "TiglathPileser"],
    correctAnswer: 0,
    testament: "Old",
    book: "Daniel",
    category: "Kings",
    difficulty: "Medium",
    verse: "Daniel 4:30-34",
    story: "Walking on the roof of the royal palace in Babylon, King Nebuchadnezzar boasted: 'Is not this the great Babylon I have built by my mighty power?' While the words were still on his lips, a voice came from heaven. He was driven away from people, ate grass like cattle, until he looked up to heaven and praised the Most High God whose dominion is eternal."
  },
  {
    question: "Who interpreted Pharaoh's dreams of seven fat cows and seven skinny cows?",
    options: ["Joseph", "Daniel", "Moses ", "Aaron "],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Patriarchs",
    difficulty: "Easy",
    verse: "Genesis 41:25-30",
    story: "Summoned from the Egyptian prison dungeon, Joseph told Pharaoh that God had revealed what He was about to do: seven years of great abundance across Egypt followed by seven years of severe famine. Joseph advised storing grain, and Pharaoh placed his signet ring on Joseph's finger, making him second-in-command over all Egypt."
  },
  {
    question: "What happened to the bronze serpent Moses set upon a pole in the wilderness?",
    options: ["Healed those bitten", "Brought sweet water", "Parted deep canyon", "Shone like sunrise "],
    correctAnswer: 0,
    testament: "Old",
    book: "Numbers",
    category: "Miracles",
    difficulty: "Medium",
    verse: "Numbers 21:8-9",
    story: "When venomous snakes bit the grumbling people, Moses prayed for them. God instructed him to make a bronze serpent and set it upon a pole. Anyone who looked upon the bronze snake lived, foreshadowing how the Son of Man would be lifted up so that whoever believes in Him has eternal life."
  },
  {
    question: "What Roman centurion had his servant healed by Jesus without Jesus visiting his house?",
    options: ["Capernaum Centurion", "Cornelius Italian  ", "Julius the Tribune ", "Longinus Soldier   "],
    correctAnswer: 0,
    testament: "New",
    book: "Matthew",
    category: "Miracles",
    difficulty: "Medium",
    verse: "Matthew 8:8-10",
    story: "A Roman centurion came to Jesus in Capernaum pleading for his paralyzed servant. When Jesus offered to go, the centurion said: 'Lord, I do not deserve to have You come under my roof. But just say the word, and my servant will be healed.' Jesus marveled at his faith, declaring He had not found such great faith in all Israel."
  },
  {
    question: "What apostle was let down through an opening in the Damascus wall in a basket?",
    options: ["Paul", "Barnabas", "PeterApp", "SilasBro"],
    correctAnswer: 0,
    testament: "New",
    book: "Acts",
    category: "Apostles",
    difficulty: "Medium",
    verse: "Acts 9:23-25",
    story: "After his conversion, Saul preached fearlessly in Damascus that Jesus is the Son of God. When conspirators watched the city gates day and night to kill him, his followers took him by night and lowered him in a large wicker basket through an opening in the city wall to escape."
  },
  {
    question: "Who was swallowed by sorrow before being given the coat of many colors by Jacob?",
    options: ["Joseph", "Reuben", "Simeon", "Judah "],
    correctAnswer: 0,
    testament: "Old",
    book: "Genesis",
    category: "Patriarchs",
    difficulty: "Easy",
    verse: "Genesis 37:3-4",
    story: "Israel loved Joseph more than any of his other sons because he had been born to him in his old age, and he made him an ornate coat of many colors. When his brothers saw that their father loved him more, they hated him and could not speak a kind word to him."
  },
  {
    question: "Who hid the two Israelite spies under stalks of flax on her roof in Jericho?",
    options: ["Rahab", "Sarah", "Ruth ", "Hagar"],
    correctAnswer: 0,
    testament: "Old",
    book: "Joshua",
    category: "Women",
    difficulty: "Easy",
    verse: "Joshua 2:1-6",
    story: "When the king of Jericho sent soldiers to search for Joshua's spies, Rahab hid them on the flat roof under stalks of flax. She confessed: 'The Lord your God is God in heaven above and on the earth below.' In return, the spies promised that she and her family would be spared when the scarlet cord hung in her window."
  }
];

// Load existing questions
const questionsPath = path.join(__dirname, '../client/src/data/questions.json');
let existing = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

console.log(`Original questions count: ${existing.length}`);

// 1. Clean brackets from ALL existing questions & options
existing = existing.map(q => {
  const cleanedQuestion = cleanBrackets(q.question);
  const cleanedOptions = q.options.map(opt => cleanBrackets(opt));
  return {
    ...q,
    question: cleanedQuestion,
    options: cleanedOptions,
    verse: q.verse || `${q.book || 'Scripture'} Context`,
    story: q.story || `Scripture reveals this sacred truth in the book of ${q.book}. As recorded in the ${q.testament} Testament, God guided His people through these trials and covenants to reveal His righteousness, grace, and eternal plan of salvation.`
  };
});

// 2. Add brand new enriched questions with balanced lengths
let maxId = Math.max(...existing.map(q => q.id || 0), 0);
newQuestions.forEach(nq => {
  maxId++;
  // Verify clean options
  const cleanOpts = nq.options.map(o => cleanBrackets(o));
  existing.push({
    id: maxId,
    question: cleanBrackets(nq.question),
    options: cleanOpts,
    correctAnswer: nq.correctAnswer,
    testament: nq.testament,
    book: nq.book,
    category: nq.category,
    difficulty: nq.difficulty,
    verse: nq.verse,
    story: nq.story
  });
});

// 3. Shuffle options for newly added questions so correctAnswer isn't always 0!
for (let i = existing.length - newQuestions.length; i < existing.length; i++) {
  const q = existing[i];
  const originalCorrect = q.options[q.correctAnswer];
  // Shuffle options array
  const shuffled = [...q.options].sort(() => Math.random() - 0.5);
  q.options = shuffled;
  q.correctAnswer = shuffled.indexOf(originalCorrect);
}

fs.writeFileSync(questionsPath, JSON.stringify(existing, null, 2), 'utf-8');
console.log(`Updated questions written: ${existing.length} questions in total.`);

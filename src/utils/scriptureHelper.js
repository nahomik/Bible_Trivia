// Scripture Context, Verse Citations, and Biblical Narratives Helper

export function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/[()[\]{}]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const CANONICAL_VERSES = {
  Genesis: 'Genesis 1:1',
  Exodus: 'Exodus 14:14',
  Leviticus: 'Leviticus 19:18',
  Numbers: 'Numbers 6:24-26',
  Deuteronomy: 'Deuteronomy 6:4-5',
  Joshua: 'Joshua 1:9',
  Judges: 'Judges 5:31',
  Ruth: 'Ruth 1:16-17',
  '1 Samuel': '1 Samuel 16:7',
  '2 Samuel': '2 Samuel 22:2-3',
  Samuel: '1 Samuel 17:47',
  '1 Kings': '1 Kings 3:9',
  '2 Kings': '2 Kings 2:11',
  Kings: '1 Kings 8:23',
  '1 Chronicles': '1 Chronicles 16:11',
  '2 Chronicles': '2 Chronicles 7:14',
  Chronicles: '2 Chronicles 20:15',
  Ezra: 'Ezra 7:10',
  Nehemiah: 'Nehemiah 8:10',
  Esther: 'Esther 4:14',
  Job: 'Job 19:25',
  Psalms: 'Psalm 23:1-3',
  Proverbs: 'Proverbs 3:5-6',
  Ecclesiastes: 'Ecclesiastes 3:1',
  'Song of Solomon': 'Song of Songs 2:16',
  Isaiah: 'Isaiah 40:31',
  Jeremiah: 'Jeremiah 29:11',
  Lamentations: 'Lamentations 3:22-23',
  Ezekiel: 'Ezekiel 36:26',
  Daniel: 'Daniel 6:26-27',
  Hosea: 'Hosea 6:3',
  Joel: 'Joel 2:28',
  Amos: 'Amos 5:24',
  Obadiah: 'Obadiah 1:21',
  Jonah: 'Jonah 2:9',
  Micah: 'Micah 6:8',
  Nahum: 'Nahum 1:7',
  Habakkuk: 'Habakkuk 3:19',
  Zephaniah: 'Zephaniah 3:17',
  Haggai: 'Haggai 2:9',
  Zechariah: 'Zechariah 4:6',
  Malachi: 'Malachi 4:2',
  Matthew: 'Matthew 28:19-20',
  Mark: 'Mark 10:45',
  Luke: 'Luke 19:10',
  John: 'John 3:16',
  Acts: 'Acts 1:8',
  Romans: 'Romans 8:28',
  '1 Corinthians': '1 Corinthians 13:4-7',
  '2 Corinthians': '2 Corinthians 5:17',
  Corinthians: '1 Corinthians 13:13',
  Galatians: 'Galatians 5:22-23',
  Ephesians: 'Ephesians 2:8-9',
  Philippians: 'Philippians 4:13',
  Colossians: 'Colossians 3:12-14',
  '1 Thessalonians': '1 Thessalonians 5:16-18',
  '2 Thessalonians': '2 Thessalonians 3:3',
  Thessalonians: '1 Thessalonians 4:16-17',
  '1 Timothy': '1 Timothy 4:12',
  '2 Timothy': '2 Timothy 3:16-17',
  Timothy: '2 Timothy 1:7',
  Titus: 'Titus 2:11-12',
  Philemon: 'Philemon 1:6',
  Hebrews: 'Hebrews 11:1',
  James: 'James 1:2-4',
  '1 Peter': '1 Peter 5:7',
  '2 Peter': '2 Peter 3:9',
  Peter: '1 Peter 1:3',
  '1 John': '1 John 4:7-8',
  '2 John': '2 John 1:6',
  '3 John': '3 John 1:4',
  Jude: 'Jude 1:24-25',
  Revelation: 'Revelation 21:4'
};

export const SCRIPTURE_STORIES = {
  Genesis: "In the beginning, God created the heavens and the earth out of nothing by the power of His spoken word. He formed man from the dust and breathed into him the breath of life. Even after the fall and flood, God called Abraham out of Ur, promising that all families of the earth would be blessed through his seed.",
  Exodus: "Trapped between Pharaoh's elite chariot army and the impassable waters of the Red Sea, the children of Israel cried out in despair. Moses declared: 'Do not be afraid. Stand firm and you will see the deliverance the Lord will bring you today.' God sent a mighty east wind, split the waters into walls on their right and left, and led His redeemed people across dry ground.",
  Leviticus: "At the foot of Mount Sinai, God revealed the beauty of His absolute holiness and established the Day of Atonement. The high priest entered behind the veil with the blood of sacrifice, pointing forward to the ultimate, once-for-all sacrifice of Jesus Christ who cleanses our hearts from all unrighteousness.",
  Numbers: "While wandering forty years in the arid wilderness, God faithfully provided daily manna from heaven, miraculous water from the rock, and a cloud by day and pillar of fire by night. When venomous serpents bit the grumbling people, God instructed Moses to erect a bronze serpent on a pole; whoever looked upon it lived, prefiguring Christ on the cross.",
  Deuteronomy: "Poised on the plains of Moab overlooking the Promised Land, Moses delivered his final heartfelt sermon to the new generation of Israel. He urged them to love the Lord their God with all their heart, soul, and strength, setting before them the choice between life and blessing or disobedience and death.",
  Joshua: "Standing before the towering, fortified stone walls of Jericho, Joshua met the Commander of the Lord's army with sword drawn. Following God's unconventional battle instructions, priests blew ram's horns as the entire nation marched in solemn silence. On the seventh day, at the blast of the trumpets and the people's great shout, the massive walls crashed flat.",
  Judges: "In a turbulent era when 'everyone did what was right in their own eyes,' Israel repeatedly fell into idolatry and enemy oppression. Whenever they cried out in repentance, God raised up brave deliverers like Deborah under the palm tree, Gideon with just 300 men holding torches and jars, and Samson who routed the Philistines.",
  Ruth: "In the dark days of the judges, a destitute Moabite widow named Ruth clung steadfastly to her grieving mother-in-law Naomi, saying: 'Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.' In Bethlehem, Boaz acted as her kinsman-redeemer, weaving Ruth into the royal genealogy of King David and Jesus Christ.",
  '1 Samuel': "While Israel's battle-hardened soldiers shrank back in terror from Goliath's nine-foot frame, a young shepherd boy named David stepped into the Valley of Elah armed only with a sling and five smooth stones. Declaring that 'the battle is the Lord's,' David felled the champion with a single stone, proving God's power through humble obedience.",
  '2 Samuel': "King David established Jerusalem as the City of God and brought up the Ark of the Covenant with rejoicing and dancing. God made an everlasting covenant with David, promising that his throne and royal line would endure forever, a prophecy fulfilled in Jesus, the Son of David.",
  Samuel: "From Samuel hearing God's voice in the midnight stillness of the tabernacle to David's ascent to the throne of Israel, God demonstrated that He does not look at the outward appearance as humans do, but looks straight upon the heart.",
  '1 Kings': "Given the invitation by God to ask for anything he desired, young King Solomon humbly asked for wisdom to govern God's vast people. God granted him unprecedented discernment, wealth, and honor, leading to the construction of the glorious first Temple in Jerusalem where the glory of God descended like a cloud.",
  '2 Kings': "On Mount Carmel, the prophet Elijah stood alone against 450 prophets of Baal. When Elijah prayed, fire from heaven consumed the water-soaked sacrifice and the altar stones. Later, Elijah was swept up to heaven in a whirlwind by a chariot and horses of fire, leaving his double-portion mantle to Elisha.",
  Kings: "Throughout the divided monarchy of Israel and Judah, righteous kings like Hezekiah and Josiah brought spiritual reformation, while prophets courageously confronted wicked rulers, reminding the people that God's covenant loyalty never fails those who seek Him with all their hearts.",
  Chronicles: "Written for the returning exiles rebuilding Jerusalem, Chronicles recounts David's devotion to worship, the design of the Temple, and King Jehoshaphat's choir leading the army into battle singing: 'Give thanks to the Lord, for His love endures forever,' causing their enemies to be completely overthrown.",
  Ezra: "Following seventy years of exile in Babylon, King Cyrus of Persia was stirred by God to release the Jewish people. Under Ezra the priest and scribe, the exiles returned to Jerusalem, rebuilt the altar, laid the foundations of the second Temple with tears of joy, and renewed their devotion to the Law of Moses.",
  Nehemiah: "Hearing that the walls of Jerusalem were broken down and its gates burned with fire, Nehemiah wept, fasted, and prayed before King Artaxerxes. Returning as governor, he organized the people to rebuild the entire perimeter wall in an astounding 52 days, working with a trowel in one hand and a spear in the other.",
  Esther: "When an evil decree doomed every Jewish citizen in the 127 provinces of Persia to slaughter, Queen Esther faced death by entering the inner court uninvited. Spurred by Mordecai's question—'Who knows whether you have come to the kingdom for such a time as this?'—Esther exposed the wicked plot of Haman and delivered her people.",
  Job: "Having lost his wealth, children, and health in a single day, Job fell to the ground and worshiped: 'The Lord gave and the Lord has taken away; may the name of the Lord be praised.' Amid agonizing debate with his companions, God spoke from the whirlwind, revealing His majesty and restoring double to Job.",
  Psalms: "From shepherd fields to royal palaces, David and the psalmists poured out raw laments, triumphant praises, and messianic prophecies. 'The Lord is my shepherd; I shall not want. Even though I walk through the darkest valley, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.'",
  Proverbs: "King Solomon compiled timeless divine wisdom for daily living: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight.' True wisdom begins with reverence for the Lord.",
  Ecclesiastes: "After testing pleasure, immense wealth, wisdom, and human accomplishments, the Preacher observed that worldly pursuits without God are 'vanity of vanities.' The ultimate conclusion of life: 'Fear God and keep His commandments, for this is the duty of all mankind.'",
  Isaiah: "In the year King Uzziah died, Isaiah saw the Lord high and exalted on His throne, surrounded by seraphim crying 'Holy, holy, holy!' Cleansed by a burning coal from the altar, Isaiah prophesied the virgin birth of Immanuel and the Suffering Servant who was pierced for our transgressions and crushed for our iniquities.",
  Jeremiah: "Called as a youth to be a prophet to the nations, Jeremiah wept over Jerusalem's impending downfall yet heralded the promise of a New Covenant: 'I will put my law in their minds and write it on their hearts. I will be their God, and they will be my people.'",
  Lamentations: "Amid the smoldering ruins of Jerusalem, Jeremiah looked past devastation to God's unfailing mercy: 'The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning; great is Your faithfulness!'",
  Ezekiel: "Stationed as a captive exile by the Kebar River in Babylon, Ezekiel saw God's throne chariot of living creatures and wheels within wheels. Led into a valley of dry bones, God commanded him to prophesy breath into the slain, demonstrating that God can resurrect dead hearts into a living army.",
  Daniel: "When cast into the den of hungry lions for praying to God, Daniel trusted the Lord, and God sent His angel to shut the lions' mouths. Earlier, Shadrach, Meshach, and Abednego survived the seven-times-hotter fiery furnace with the Son of God walking beside them without a singed hair.",
  Jonah: "Swallowed by a great fish after fleeing God's call to preach in Nineveh, Jonah repented in the belly of the sea. Vomited onto dry ground, he obeyed and preached to the brutal pagan capital, which shockingly repented in sackcloth and ashes, displaying God's boundless mercy to all nations.",
  Matthew: "The Gospel opens with the genealogy of Jesus, the son of David and son of Abraham. From the Sermon on the Mount to His bodily resurrection, Jesus revealed the Kingdom of Heaven, giving the Great Commission: 'Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.'",
  Mark: "Portraying Jesus as the tireless Servant of God and mighty Wonder-worker, Mark chronicles Christ driving out demons, opening blind eyes, and calming the raging wind and waves with three words: 'Peace! Be still!' For even the Son of Man came not to be served, but to serve and give His life as a ransom for many.",
  Luke: "Written with historical precision, Luke highlights Christ's compassion for the outcast, the poor, women, and sinners. Through beloved parables like the Good Samaritan and the Prodigal Son, Jesus announced His mission: 'For the Son of Man came to seek and to save the lost.'",
  John: "Opening before creation itself—'In the beginning was the Word, and the Word was with God, and the Word was God'—John records seven miraculous signs and seven 'I AM' statements of Jesus, declaring: 'For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life.'",
  Acts: "On the Day of Pentecost in Jerusalem, the Holy Spirit descended with the sound of a rushing wind and tongues of fire. Filled with power, Peter preached boldly, 3,000 souls were saved in one day, and the early church turned the Roman empire upside down with gospel grace.",
  Romans: "Paul's theological magnum opus explains how all have sinned and fall short of the glory of God, but are justified freely by grace through faith in Jesus Christ. 'And we know that in all things God works for the good of those who love Him, who have been called according to His purpose.'",
  Corinthians: "Addressing a divided and struggling church in Corinth, Paul pointed believers to the supreme supremacy of the cross, the resurrection of the body, and the eternal power of love: 'Love is patient, love is kind... And now these three remain: faith, hope and love. But the greatest of these is love.'",
  Galatians: "Paul passionately defended freedom in Christ against legalism: 'It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.' Life in the Spirit produces love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.",
  Ephesians: "Written from Roman imprisonment, Paul unveiled the mystery of the Church as the Body and Bride of Christ. We are saved by grace through faith—not by works—and are equipped with the full Armor of God: the belt of truth, breastplate of righteousness, shield of faith, and sword of the Spirit.",
  Philippians: "Radiating joy from a prison cell, Paul encouraged believers to have the humble mind of Christ, who emptied Himself and became obedient to death on a cross. 'I can do all things through Christ who strengthens me. And my God will meet all your needs according to the riches of His glory in Christ Jesus.'",
  Colossians: "Exalting the absolute preeminence of Christ, Paul writes that by Him all things were created in heaven and on earth, visible and invisible. He is the head of the body, the church, and in Him all the fullness of the Deity lives in bodily form.",
  Thessalonians: "Encouraging a young church facing intense persecution, Paul wrote of the glorious return of our Lord Jesus: 'For the Lord Himself will come down from heaven, with a loud command, with the voice of the archangel and with the trumpet call of God, and the dead in Christ will rise first.'",
  Timothy: "Paul mentored young Pastor Timothy: 'Don't let anyone look down on you because you are young, but set an example for the believers in speech, in conduct, in love, in faith and in purity. All Scripture is God-breathed and useful for teaching, rebuking, correcting and training in righteousness.'",
  Hebrews: "Contrasting shadow with reality, Hebrews declares that Jesus is greater than angels, greater than Moses, and our eternal High Priest who offered His own spotless blood in the heavenly sanctuary. 'Now faith is confidence in what we hope for and assurance about what we do not see.'",
  James: "Practical and razor-sharp, James teaches that genuine faith always produces tangible action: 'Do not merely listen to the word, and so deceive yourselves. Do what it says. Faith without deeds is dead.'",
  Peter: "Writing to believers scattered across Asia Minor undergoing fiery trials, Peter reminds them of their 'living hope through the resurrection of Jesus Christ from the dead' and an inheritance imperishable, undefiled, and unfading kept in heaven for them.",
  Revelation: "Exiled on the rocky island of Patmos, the apostle John received the climactic apocalyptic revelation of the glorified Lord Jesus. The book concludes with the New Jerusalem descending from heaven: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.'"
};

export function getScriptureVerse(question) {
  if (!question) return 'Scripture Context';
  if (question.verse) return cleanText(question.verse);
  const book = question.book || '';
  return CANONICAL_VERSES[book] || `${book} Scripture Reference`;
}

export function getScriptureStory(question) {
  if (!question) return '';
  if (question.story) return cleanText(question.story);
  const book = question.book || '';
  const story = SCRIPTURE_STORIES[book];
  if (story) return story;
  return `In the book of ${book}, God revealed His faithfulness, righteousness, and redemptive covenants through prophets, kings, and apostles, guiding His people into eternal truth and salvation.`;
}

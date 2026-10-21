#!/usr/bin/env python3
import json
import re
import random
import subprocess
import os

BOOK_MAP = {
    'gen': ('Genesis', 'Old'),
    'genesis': ('Genesis', 'Old'),
    'exo': ('Exodus', 'Old'),
    'exod': ('Exodus', 'Old'),
    'exodus': ('Exodus', 'Old'),
    'lev': ('Leviticus', 'Old'),
    'leviticus': ('Leviticus', 'Old'),
    'num': ('Numbers', 'Old'),
    'numbers': ('Numbers', 'Old'),
    'deut': ('Deuteronomy', 'Old'),
    'deuteronomy': ('Deuteronomy', 'Old'),
    'josh': ('Joshua', 'Old'),
    'joshua': ('Joshua', 'Old'),
    'jdg': ('Judges', 'Old'),
    'judg': ('Judges', 'Old'),
    'judges': ('Judges', 'Old'),
    'ruth': ('Ruth', 'Old'),
    '1 sam': ('1 Samuel', 'Old'),
    '2 sam': ('2 Samuel', 'Old'),
    '1 samuel': ('1 Samuel', 'Old'),
    '2 samuel': ('2 Samuel', 'Old'),
    '1 ki': ('1 Kings', 'Old'),
    '2 ki': ('2 Kings', 'Old'),
    '1 kings': ('1 Kings', 'Old'),
    '2 kings': ('2 Kings', 'Old'),
    '1 chr': ('1 Chronicles', 'Old'),
    '2 chr': ('2 Chronicles', 'Old'),
    '1 chronicles': ('1 Chronicles', 'Old'),
    '2 chronicles': ('2 Chronicles', 'Old'),
    'ezra': ('Ezra', 'Old'),
    'neh': ('Nehemiah', 'Old'),
    'nehemiah': ('Nehemiah', 'Old'),
    'est': ('Esther', 'Old'),
    'esth': ('Esther', 'Old'),
    'esther': ('Esther', 'Old'),
    'job': ('Job', 'Old'),
    'ps': ('Psalms', 'Old'),
    'psa': ('Psalms', 'Old'),
    'psalm': ('Psalms', 'Old'),
    'psalms': ('Psalms', 'Old'),
    'prov': ('Proverbs', 'Old'),
    'proverbs': ('Proverbs', 'Old'),
    'eccl': ('Ecclesiastes', 'Old'),
    'ecclesiastes': ('Ecclesiastes', 'Old'),
    'song': ('Song of Solomon', 'Old'),
    'isa': ('Isaiah', 'Old'),
    'isaiah': ('Isaiah', 'Old'),
    'jer': ('Jeremiah', 'Old'),
    'jeremiah': ('Jeremiah', 'Old'),
    'lam': ('Lamentations', 'Old'),
    'ezek': ('Ezekiel', 'Old'),
    'ezekiel': ('Ezekiel', 'Old'),
    'dan': ('Daniel', 'Old'),
    'daniel': ('Daniel', 'Old'),
    'hos': ('Hosea', 'Old'),
    'hosea': ('Hosea', 'Old'),
    'joel': ('Joel', 'Old'),
    'amos': ('Amos', 'Old'),
    'obad': ('Obadiah', 'Old'),
    'jon': ('Jonah', 'Old'),
    'jonah': ('Jonah', 'Old'),
    'mic': ('Micah', 'Old'),
    'micah': ('Micah', 'Old'),
    'nah': ('Nahum', 'Old'),
    'hab': ('Habakkuk', 'Old'),
    'zeph': ('Zephaniah', 'Old'),
    'hag': ('Haggai', 'Old'),
    'zech': ('Zechariah', 'Old'),
    'mal': ('Malachi', 'Old'),
    'matt': ('Matthew', 'New'),
    'matthew': ('Matthew', 'New'),
    'mark': ('Mark', 'New'),
    'luke': ('Luke', 'New'),
    'john': ('John', 'New'),
    'acts': ('Acts', 'New'),
    'rom': ('Romans', 'New'),
    'romans': ('Romans', 'New'),
    '1 cor': ('1 Corinthians', 'New'),
    '2 cor': ('2 Corinthians', 'New'),
    '1 corinthians': ('1 Corinthians', 'New'),
    '2 corinthians': ('2 Corinthians', 'New'),
    'gal': ('Galatians', 'New'),
    'galatians': ('Galatians', 'New'),
    'eph': ('Ephesians', 'New'),
    'ephesians': ('Ephesians', 'New'),
    'phil': ('Philippians', 'New'),
    'philippians': ('Philippians', 'New'),
    'col': ('Colossians', 'New'),
    'colossians': ('Colossians', 'New'),
    '1 thess': ('1 Thessalonians', 'New'),
    '2 thess': ('2 Thessalonians', 'New'),
    '1 thessalonians': ('1 Thessalonians', 'New'),
    '2 thessalonians': ('2 Thessalonians', 'New'),
    '1 tim': ('1 Timothy', 'New'),
    '2 tim': ('2 Timothy', 'New'),
    '1 timothy': ('1 Timothy', 'New'),
    '2 timothy': ('2 Timothy', 'New'),
    'titus': ('Titus', 'New'),
    'philem': ('Philemon', 'New'),
    'philemon': ('Philemon', 'New'),
    'heb': ('Hebrews', 'New'),
    'hebrews': ('Hebrews', 'New'),
    'jam': ('James', 'New'),
    'jas': ('James', 'New'),
    'james': ('James', 'New'),
    '1 pet': ('1 Peter', 'New'),
    '2 pet': ('2 Peter', 'New'),
    '1 peter': ('1 Peter', 'New'),
    '2 peter': ('2 Peter', 'New'),
    '1 john': ('1 John', 'New'),
    '2 john': ('2 John', 'New'),
    '3 john': ('3 John', 'New'),
    'jude': ('Jude', 'New'),
    'rev': ('Revelation', 'New'),
    'revelation': ('Revelation', 'New'),
}

CANONICAL_STORIES = {
    'Genesis': "In the beginning, God created the heavens and the earth out of nothing by the power of His spoken word. He formed man from the dust and breathed into him the breath of life. Even after the fall and flood, God called Abraham out of Ur, promising that all families of the earth would be blessed through his seed.",
    'Exodus': "Trapped between Pharaoh's elite chariot army and the impassable waters of the Red Sea, the children of Israel cried out in despair. Moses declared: 'Do not be afraid. Stand firm and you will see the deliverance the Lord will bring you today.' God sent a mighty east wind, split the waters into walls on their right and left, and led His redeemed people across dry ground.",
    'Leviticus': "At the foot of Mount Sinai, God revealed the beauty of His absolute holiness and established the Day of Atonement. The high priest entered behind the veil with the blood of sacrifice, pointing forward to the ultimate, once-for-all sacrifice of Jesus Christ who cleanses our hearts from all unrighteousness.",
    'Numbers': "While wandering forty years in the arid wilderness, God faithfully provided daily manna from heaven, miraculous water from the rock, and a cloud by day and pillar of fire by night. When venomous serpents bit the grumbling people, God instructed Moses to erect a bronze serpent on a pole; whoever looked upon it lived, prefiguring Christ on the cross.",
    'Deuteronomy': "Poised on the plains of Moab overlooking the Promised Land, Moses delivered his final heartfelt sermon to the new generation of Israel. He urged them to love the Lord their God with all their heart, soul, and strength, setting before them the choice between life and blessing or disobedience and death.",
    'Joshua': "Standing before the towering, fortified stone walls of Jericho, Joshua met the Commander of the Lord's army with sword drawn. Following God's unconventional battle instructions, priests blew ram's horns as the entire nation marched in solemn silence. On the seventh day, at the blast of the trumpets and the people's great shout, the massive walls crashed flat.",
    'Judges': "In a turbulent era when 'everyone did what was right in their own eyes,' Israel repeatedly fell into idolatry and enemy oppression. Whenever they cried out in repentance, God raised up brave deliverers like Deborah under the palm tree, Gideon with just 300 men holding torches and jars, and Samson who routed the Philistines.",
    'Ruth': "In the dark days of the judges, a destitute Moabite widow named Ruth clung steadfastly to her grieving mother-in-law Naomi, saying: 'Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.' In Bethlehem, Boaz acted as her kinsman-redeemer, weaving Ruth into the royal genealogy of King David and Jesus Christ.",
    '1 Samuel': "While Israel's battle-hardened soldiers shrank back in terror from Goliath's nine-foot frame, a young shepherd boy named David stepped into the Valley of Elah armed only with a sling and five smooth stones. Declaring that 'the battle is the Lord's,' David felled the champion with a single stone, proving God's power through humble obedience.",
    '2 Samuel': "King David established Jerusalem as the City of God and brought up the Ark of the Covenant with rejoicing and dancing. God made an everlasting covenant with David, promising that his throne and royal line would endure forever, a prophecy fulfilled in Jesus, the Son of David.",
    '1 Kings': "Given the invitation by God to ask for anything he desired, young King Solomon humbly asked for wisdom to govern God's vast people. God granted him unprecedented discernment, wealth, and honor, leading to the construction of the glorious first Temple in Jerusalem where the glory of God descended like a cloud.",
    '2 Kings': "On Mount Carmel, the prophet Elijah stood alone against 450 prophets of Baal. When Elijah prayed, fire from heaven consumed the water-soaked sacrifice and the altar stones. Later, Elijah was swept up to heaven in a whirlwind by a chariot and horses of fire, leaving his double-portion mantle to Elisha.",
    '1 Chronicles': "Recounting David's devotion to worship, the design of the Temple, and Israel's spiritual heritage, Chronicles reminds us of God's sovereign covenant with David and His unfailing faithfulness through every generation.",
    '2 Chronicles': "King Solomon dedicated the holy Temple and God declared: 'If my people, who are called by my name, will humble themselves and pray and seek my face and turn from their wicked ways, then I will hear from heaven, and will forgive their sin and will heal their land.'",
    'Ezra': "Following seventy years of exile in Babylon, King Cyrus of Persia was stirred by God to release the Jewish people. Under Ezra the priest and scribe, the exiles returned to Jerusalem, rebuilt the altar, laid the foundations of the second Temple with tears of joy, and renewed their devotion to the Law of Moses.",
    'Nehemiah': "Hearing that the walls of Jerusalem were broken down and its gates burned with fire, Nehemiah wept, fasted, and prayed before King Artaxerxes. Returning as governor, he organized the people to rebuild the entire perimeter wall in an astounding 52 days, working with a trowel in one hand and a spear in the other.",
    'Esther': "When an evil decree doomed every Jewish citizen in Persia to slaughter, Queen Esther faced death by entering the inner court uninvited. Spurred by Mordecai's question—'Who knows whether you have come to the kingdom for such a time as this?'—Esther exposed the wicked plot of Haman and delivered her people.",
    'Job': "Having lost his wealth, children, and health in a single day, Job fell to the ground and worshiped: 'The Lord gave and the Lord has taken away; may the name of the Lord be praised.' Amid agonizing debate with his companions, God spoke from the whirlwind, revealing His majesty and restoring double to Job.",
    'Psalms': "From shepherd fields to royal palaces, David and the psalmists poured out raw laments, triumphant praises, and messianic prophecies. 'The Lord is my shepherd; I shall not want. Even though I walk through the darkest valley, I will fear no evil, for You are with me; Your rod and Your staff, they comfort me.'",
    'Proverbs': "King Solomon compiled timeless divine wisdom for daily living: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight.' True wisdom begins with reverence for the Lord.",
    'Ecclesiastes': "After testing pleasure, immense wealth, wisdom, and human accomplishments, the Preacher observed that worldly pursuits without God are 'vanity of vanities.' The ultimate conclusion of life: 'Fear God and keep His commandments, for this is the duty of all mankind.'",
    'Isaiah': "In the year King Uzziah died, Isaiah saw the Lord high and exalted on His throne, surrounded by seraphim crying 'Holy, holy, holy!' Cleansed by a burning coal from the altar, Isaiah prophesied the virgin birth of Immanuel and the Suffering Servant who was pierced for our transgressions and crushed for our iniquities.",
    'Jeremiah': "Called as a youth to be a prophet to the nations, Jeremiah wept over Jerusalem's impending downfall yet heralded the promise of a New Covenant: 'I will put my law in their minds and write it on their hearts. I will be their God, and they will be my people.'",
    'Lamentations': "Amid the smoldering ruins of Jerusalem, Jeremiah looked past devastation to God's unfailing mercy: 'The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning; great is Your faithfulness!'",
    'Ezekiel': "Stationed as a captive exile by the Kebar River in Babylon, Ezekiel saw God's throne chariot of living creatures and wheels within wheels. Led into a valley of dry bones, God commanded him to prophesy breath into the slain, demonstrating that God can resurrect dead hearts into a living army.",
    'Daniel': "When cast into the den of hungry lions for praying to God, Daniel trusted the Lord, and God sent His angel to shut the lions' mouths. Earlier, Shadrach, Meshach, and Abednego survived the seven-times-hotter fiery furnace with the Son of God walking beside them without a singed hair.",
    'Jonah': "Swallowed by a great fish after fleeing God's call to preach in Nineveh, Jonah repented in the belly of the sea. Vomited onto dry ground, he obeyed and preached to the brutal pagan capital, which shockingly repented in sackcloth and ashes, displaying God's boundless mercy to all nations.",
    'Matthew': "The Gospel opens with the genealogy of Jesus, the son of David and son of Abraham. From the Sermon on the Mount to His bodily resurrection, Jesus revealed the Kingdom of Heaven, giving the Great Commission: 'Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.'",
    'Mark': "Portraying Jesus as the tireless Servant of God and mighty Wonder-worker, Mark chronicles Christ driving out demons, opening blind eyes, and calming the raging wind and waves with three words: 'Peace! Be still!' For even the Son of Man came not to be served, but to serve and give His life as a ransom for many.",
    'Luke': "Written with historical precision, Luke highlights Christ's compassion for the outcast, the poor, women, and sinners. Through beloved parables like the Good Samaritan and the Prodigal Son, Jesus announced His mission: 'For the Son of Man came to seek and to save the lost.'",
    'John': "Opening before creation itself—'In the beginning was the Word, and the Word was with God, and the Word was God'—John records seven miraculous signs and seven 'I AM' statements of Jesus, declaring: 'For God so loved the world that He gave His one and only Son, that whoever believes in Him shall not perish but have eternal life.'",
    'Acts': "On the Day of Pentecost in Jerusalem, the Holy Spirit descended with the sound of a rushing wind and tongues of fire. Filled with power, Peter preached boldly, 3,000 souls were saved in one day, and the early church turned the Roman empire upside down with gospel grace.",
    'Romans': "Paul's theological magnum opus explains how all have sinned and fall short of the glory of God, but are justified freely by grace through faith in Jesus Christ. 'And we know that in all things God works for the good of those who love Him, who have been called according to His purpose.'",
    '1 Corinthians': "Addressing a divided and struggling church in Corinth, Paul pointed believers to the supreme supremacy of the cross, the resurrection of the body, and the eternal power of love: 'Love is patient, love is kind... And now these three remain: faith, hope and love. But the greatest of these is love.'",
    '2 Corinthians': "Paul speaks of comfort in affliction and the glory of the new covenant: 'If anyone is in Christ, the new creation has come: The old has gone, the new is here!' God's grace is sufficient, for His power is made perfect in weakness.",
    'Galatians': "Paul passionately defended freedom in Christ against legalism: 'It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.' Life in the Spirit produces love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.",
    'Ephesians': "Written from Roman imprisonment, Paul unveiled the mystery of the Church as the Body and Bride of Christ. We are saved by grace through faith—not by works—and are equipped with the full Armor of God: the belt of truth, breastplate of righteousness, shield of faith, and sword of the Spirit.",
    'Philippians': "Radiating joy from a prison cell, Paul encouraged believers to have the humble mind of Christ, who emptied Himself and became obedient to death on a cross. 'I can do all things through Christ who strengthens me. And my God will meet all your needs according to the riches of His glory in Christ Jesus.'",
    'Colossians': "Exalting the absolute preeminence of Christ, Paul writes that by Him all things were created in heaven and on earth, visible and invisible. He is the head of the body, the church, and in Him all the fullness of the Deity lives in bodily form.",
    'Hebrews': "Contrasting shadow with reality, Hebrews declares that Jesus is greater than angels, greater than Moses, and our eternal High Priest who offered His own spotless blood in the heavenly sanctuary. 'Now faith is confidence in what we hope for and assurance about what we do not see.'",
    'James': "Practical and razor-sharp, James teaches that genuine faith always produces tangible action: 'Do not merely listen to the word, and so deceive yourselves. Do what it says. Faith without deeds is dead.'",
    '1 Peter': "Writing to believers scattered across Asia Minor undergoing fiery trials, Peter reminds them of their 'living hope through the resurrection of Jesus Christ from the dead' and an inheritance imperishable, undefiled, and unfading kept in heaven for them.",
    'Revelation': "Exiled on the rocky island of Patmos, the apostle John received the climactic apocalyptic revelation of the glorified Lord Jesus. The book concludes with the New Jerusalem descending from heaven: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain, for the old order of things has passed away.'"
}

# Extensive pool of biblical entities by category for generating balanced, plausible distractors
PEOPLE_NAMES = [
    "Abraham", "Moses", "David", "Solomon", "Peter", "Paul", "John", "James", "Elijah", "Elisha",
    "Joshua", "Samuel", "Daniel", "Joseph", "Isaac", "Jacob", "Aaron", "Gideon", "Samson", "Caleb",
    "Noah", "Adam", "Seth", "Enoch", "Methuselah", "Job", "Jonathan", "Saul", "Hezekiah", "Josiah",
    "Isaiah", "Jeremiah", "Ezekiel", "Hosea", "Amos", "Micah", "Malachi", "Nehemiah", "Ezra", "Mordecai",
    "Mary", "Sarah", "Rebekah", "Rachel", "Leah", "Miriam", "Deborah", "Ruth", "Hannah", "Esther",
    "Abigail", "Elizabeth", "Martha", "Lydia", "Priscilla", "Dorcas", "Phoebe", "Anna", "Salome", "Joanna",
    "Andrew", "Philip", "Thomas", "Bartholomew", "Matthew", "Thaddaeus", "Simon the Zealot", "Judas Iscariot",
    "Stephen", "Barnabas", "Silas", "Timothy", "Titus", "Philemon", "Luke", "Mark", "Nicodemus", "Zacchaeus",
    "Cornelius", "Apollos", "Aquila", "Gamaliel", "Ananias", "Caiaphas", "Pilate", "Herod", "Felix", "Festus"
]

CITIES_PLACES = [
    "Jerusalem", "Bethlehem", "Nazareth", "Capernaum", "Jericho", "Damascus", "Antioch", "Babylon", "Nineveh",
    "Garden of Eden", "Mount Sinai", "Mount Carmel", "Mount Zion", "Mount of Olives", "Mount Nebo", "Mount Ararat",
    "River Jordan", "Sea of Galilee", "Red Sea", "Dead Sea", "Bethel", "Hebron", "Shechem", "Shiloh",
    "Samaria", "Bethany", "Emmaus", "Tarsus", "Ephesus", "Philippi", "Corinth", "Athens", "Rome", "Alexandria",
    "Ur", "Haran", "Gaza", "Joppa", "Tyre", "Sidon", "Caesarea", "Sodom", "Gomorrah", "Zoar"
]

BIBLICAL_ITEMS = [
    "Ark of the Covenant", "Altar of Incense", "Golden Lampstand", "Bronze Altar", "Table of Showbread",
    "Staff of Moses", "Coat of Many Colors", "Sling and Five Stones", "Silver Trumpets", "Ram's Horn",
    "Bread and Wine", "Loaves and Fishes", "Crown of Thorns", "Purple Robe", "Linen Shroud", "Jar of Oil",
    "Golden Calf", "Bronze Serpent", "Two Stone Tablets", "Elijah's Mantle", "Censer of Fire", "Bowl of Water"
]

NUMBERS_WORDS = [
    "Three", "Four", "Seven", "Ten", "Twelve", "Forty", "Seventy", "One hundred", "One hundred twenty",
    "One thousand", "Three thousand", "Five thousand", "Ten thousand", "Two", "Five", "Six", "Eight"
]

def clean_text(s):
    if s is None:
        return ''
    s = str(s)
    # Remove biblequizzes watermark
    s = re.sub(r'biblequizzes\.org\.uk', '', s, flags=re.IGNORECASE)
    # Remove brackets
    s = re.sub(r'[()[\]{}]', '', s)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def detect_book_and_testament(ref_str, q_text=""):
    ref_lower = (ref_str or '').lower().strip()
    # Check reference first
    for k, (b, t) in sorted(BOOK_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        pattern = r'\b' + re.escape(k) + r'\b'
        if re.search(pattern, ref_lower):
            return b, t
    
    # Check question text
    q_lower = q_text.lower()
    for k, (b, t) in sorted(BOOK_MAP.items(), key=lambda x: len(x[0]), reverse=True):
        pattern = r'\b' + re.escape(k) + r'\b'
        if re.search(pattern, q_lower):
            return b, t
            
    # Fallback based on New Testament figures
    nt_keywords = ['jesus', 'paul', 'peter', 'john', 'apostle', 'disciple', 'gospel', 'christ', 'pharisee', 'resurrection']
    for kw in nt_keywords:
        if kw in q_lower or kw in ref_lower:
            return 'Matthew', 'New'
            
    return 'Genesis', 'Old'

def generate_distractors(correct_answer, question_text, book):
    ans_clean = clean_text(correct_answer)
    ans_len = len(ans_clean)
    
    # Case 1: Pure number
    if ans_clean.isdigit():
        val = int(ans_clean)
        offsets = [-1, 1, 2, -2, 3, 5, 10, -5]
        candidates = set()
        for off in offsets:
            new_val = val + off
            if new_val > 0:
                candidates.add(str(new_val))
        distractors = list(candidates)[:3]
        while len(distractors) < 3:
            distractors.append(str(val + len(distractors) + 4))
        return distractors

    # Case 2: Number words
    lower_ans = ans_clean.lower()
    for num_w in NUMBERS_WORDS:
        if lower_ans == num_w.lower():
            others = [w for w in NUMBERS_WORDS if w.lower() != lower_ans]
            # Pick by length similarity
            others.sort(key=lambda w: abs(len(w) - ans_len))
            return others[:3]

    # Case 3: People Names
    for p in PEOPLE_NAMES:
        if p.lower() in lower_ans or lower_ans in p.lower():
            others = [name for name in PEOPLE_NAMES if name.lower() != lower_ans and name.lower() not in lower_ans]
            others.sort(key=lambda name: abs(len(name) - ans_len))
            return others[:3]

    # Case 4: Places
    for pl in CITIES_PLACES:
        if pl.lower() in lower_ans or lower_ans in pl.lower():
            others = [place for place in CITIES_PLACES if place.lower() != lower_ans and place.lower() not in lower_ans]
            others.sort(key=lambda place: abs(len(place) - ans_len))
            return others[:3]

    # Case 5: Biblical Items
    for it in BIBLICAL_ITEMS:
        if it.lower() in lower_ans or lower_ans in it.lower():
            others = [item for item in BIBLICAL_ITEMS if item.lower() != lower_ans]
            others.sort(key=lambda item: abs(len(item) - ans_len))
            return others[:3]

    # Case 6: Generic phrase / sentence answer
    # Pick plausible biblical phrases of comparable length
    generic_distractors_pool = [
        "Faith in the promises of God",
        "Obedience to the divine commandment",
        "Offerings at the holy tabernacle",
        "The covenant of the Lord",
        "Prayer and fasting before God",
        "Repentance with sackcloth and ashes",
        "The law given by Moses",
        "Walking humbly before the Lord",
        "A pillar of cloud and fire",
        "The mercy and grace of God",
        "Offering sacrifices upon the altar",
        "Singing praises and psalms of joy",
        "Following the call of the Lord",
        "Seeking divine wisdom from heaven",
        "The kingdom of righteousness and peace",
        "Love the Lord with all your heart",
        "Grace bestowed through faith",
        "Proclaiming the good news of salvation",
        "Trusting in the Word of God",
        "The bread from heaven in the wilderness"
    ]
    
    # Filter out anything too close to correct answer
    candidates = [d for d in generic_distractors_pool if d.lower() != lower_ans and ans_clean.lower() not in d.lower()]
    candidates.sort(key=lambda d: abs(len(d) - ans_len))
    return candidates[:3]

def balance_options(correct_answer, distractors):
    clean_correct = clean_text(correct_answer)
    clean_dist = [clean_text(d) for d in distractors]
    
    # Ensure all distinct
    seen = {clean_correct.lower()}
    final_dist = []
    for d in clean_dist:
        if d.lower() not in seen:
            seen.add(d.lower())
            final_dist.append(d)
    
    # Fill up to 3 if needed
    for fallback in PEOPLE_NAMES + CITIES_PLACES + NUMBERS_WORDS:
        if len(final_dist) >= 3:
            break
        if fallback.lower() not in seen:
            seen.add(fallback.lower())
            final_dist.append(fallback)
            
    final_dist = final_dist[:3]
    
    # Anti-baiting check: if correct answer is the longest, pad distractors slightly or trim if needed
    # Make sure correct answer length is within a balanced range
    all_options = [clean_correct] + final_dist
    
    # Check if correct answer is strictly longer than all distractors
    max_dist_len = max(len(d) for d in final_dist)
    if len(clean_correct) > max_dist_len:
        # Pad one or two distractors to match or exceed correct answer length
        # e.g. "David" -> "David the King of Israel"
        diff = len(clean_correct) - max_dist_len
        if diff > 5:
            # Let's adjust distractors to be balanced
            adjusted = []
            for d in final_dist:
                if len(d) < len(clean_correct):
                    if d in PEOPLE_NAMES:
                        adjusted.append(f"{d} of Israel")
                    elif d in CITIES_PLACES:
                        adjusted.append(f"City of {d}")
                    else:
                        adjusted.append(f"{d} in Scripture")
                else:
                    adjusted.append(d)
            final_dist = adjusted
            all_options = [clean_correct] + final_dist

    # Shuffle so correct answer position is random
    indices = [0, 1, 2, 3]
    random.shuffle(indices)
    
    shuffled_options = [None] * 4
    correct_idx = None
    for new_pos, old_pos in enumerate(indices):
        shuffled_options[new_pos] = all_options[old_pos]
        if old_pos == 0:
            correct_idx = new_pos
            
    return shuffled_options, correct_idx

def extract_pdf_questions_and_answers():
    pdf_path = '/home/nahom/Downloads/1001-Bible-Trivia-Questions-v1_00.pdf'
    if not os.path.exists(pdf_path):
        print(f"PDF not found at {pdf_path}")
        return []

    print("Extracting 1001 Questions from PDF...")
    questions = {}
    for p in range(5, 25):
        for col_x in [0, 306]:
            cmd = ['pdftotext', '-x', str(col_x), '-y', '0', '-W', '306', '-H', '792', '-f', str(p), '-l', str(p), pdf_path, '-']
            txt = subprocess.run(cmd, capture_output=True, text=True).stdout
            lines = txt.splitlines()
            curr_num = None
            curr_q = []
            for line in lines:
                line_str = line.strip()
                if not line_str or 'SECTION' in line_str or '1001 Bible' in line_str or 'Answers on' in line_str or line_str.startswith('Page'):
                    continue
                m = re.match(r'^(\d+)\.\s*(.*)', line_str)
                if m:
                    if curr_num is not None:
                        questions[curr_num] = ' '.join(curr_q).strip()
                    curr_num = int(m.group(1))
                    curr_q = [m.group(2)]
                elif curr_num is not None:
                    curr_q.append(line_str)
            if curr_num is not None:
                questions[curr_num] = ' '.join(curr_q).strip()

    print(f"Extracted {len(questions)} raw questions.")

    print("Extracting 1001 Answers & References from PDF...")
    answers = {}
    for p in range(26, 36):
        cmd = ['pdftotext', '-layout', '-f', str(p), '-l', str(p), pdf_path, '-']
        txt = subprocess.run(cmd, capture_output=True, text=True).stdout
        lines = txt.splitlines()

        split_col = 54
        for line in lines:
            if 'Answers -' in line:
                idx = line.rfind('Answers -')
                if idx > 20:
                    split_col = idx
                    break

        for col_slice in [slice(0, split_col), slice(split_col, None)]:
            curr_num = None
            curr_a = []
            for line in lines:
                if len(line) < col_slice.start:
                    continue
                part = line[col_slice].rstrip()
                if not part.strip() or 'Answers -' in part or '1001 Bible' in part or 'Page' in part:
                    continue
                m = re.match(r'^\s*(\d+)\.\s*(.*)', part)
                if m:
                    if curr_num is not None:
                        answers[curr_num] = ' '.join(curr_a).strip()
                    curr_num = int(m.group(1))
                    curr_a = [m.group(2)]
                elif curr_num is not None:
                    curr_a.append(part.strip())
            if curr_num is not None:
                answers[curr_num] = ' '.join(curr_a).strip()

    print(f"Extracted {len(answers)} raw answers.")

    results = []
    for num in range(1, 1002):
        if num not in questions or num not in answers:
            continue
        q_raw = questions[num]
        a_raw = answers[num]

        # Extract reference from answer: e.g. "Mary (Matt 1:18)"
        ref_match = re.search(r'\(([^)]+)\)\s*$', a_raw)
        if ref_match:
            ref_str = ref_match.group(1).strip()
            ans_str = a_raw[:ref_match.start()].strip()
        else:
            ref_str = ""
            ans_str = a_raw.strip()

        # If ans_str still has leading/trailing parens
        ans_str = clean_text(ans_str)
        q_str = clean_text(q_raw)
        ref_str = clean_text(ref_str)

        if not q_str or not ans_str:
            continue

        book, testament = detect_book_and_testament(ref_str, q_str)
        
        # Difficulty: 1-250 (Section A-E) Easy, 251-750 (Section F-O) Medium, 751-1001 Hard
        if num <= 250:
            diff = 'Easy'
        elif num <= 750:
            diff = 'Medium'
        else:
            diff = 'Hard'

        # Category
        q_lower = q_str.lower()
        if any(w in q_lower for w in ['who', 'whose', 'man', 'woman', 'king', 'prophet', 'queen', 'mother', 'father']):
            category = 'People'
        elif any(w in q_lower for w in ['how many', 'number', 'age', 'years', 'days']):
            category = 'Numbers'
        elif any(w in q_lower for w in ['where', 'city', 'mountain', 'river', 'land', 'sea', 'place']):
            category = 'Geography'
        elif any(w in q_lower for w in ['miracle', 'blind', 'heal', 'plague', 'water', 'fire', 'raised']):
            category = 'Miracles'
        elif testament == 'New':
            category = 'Gospels'
        else:
            category = 'Old Testament'

        distractors = generate_distractors(ans_str, q_str, book)
        options, correct_idx = balance_options(ans_str, distractors)
        
        story = CANONICAL_STORIES.get(book, f"Scripture reveals this sacred truth in the book of {book}. As recorded in the {testament} Testament, God guided His people through these trials and covenants to reveal His righteousness, grace, and eternal plan of salvation.")

        results.append({
            'source': '1001-PDF',
            'num': num,
            'question': q_str,
            'options': options,
            'correctAnswer': correct_idx,
            'testament': testament,
            'book': book,
            'category': category,
            'difficulty': diff,
            'verse': ref_str if ref_str else f"{book} Scripture Reference",
            'story': story
        })

    return results

def extract_downloads_json_questions():
    json_path = '/home/nahom/Downloads/questions.json'
    if not os.path.exists(json_path):
        print(f"JSON not found at {json_path}")
        return []

    print("Extracting questions from Downloads/questions.json...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    results = []
    for idx, item in enumerate(data):
        q_str = clean_text(item.get('question'))
        ans_str = clean_text(item.get('answer'))
        ref_str = clean_text(item.get('reference'))
        
        if not q_str or not ans_str:
            continue

        book, testament = detect_book_and_testament(ref_str, q_str)
        
        # Category from json if provided
        cats = item.get('categories', [])
        if any('prophet' in c for c in cats):
            category = 'Prophets'
        elif any('gospel' in c for c in cats):
            category = 'Gospels'
        elif any('miracle' in c for c in cats):
            category = 'Miracles'
        elif any('judge' in c or 'king' in c for c in cats):
            category = 'History'
        elif testament == 'New':
            category = 'New Testament'
        else:
            category = 'Old Testament'

        diff = 'Medium' if idx % 2 == 0 else 'Easy'
        
        distractors = generate_distractors(ans_str, q_str, book)
        options, correct_idx = balance_options(ans_str, distractors)
        
        story = CANONICAL_STORIES.get(book, f"Scripture reveals this sacred truth in the book of {book}. As recorded in the {testament} Testament, God guided His people through these trials and covenants to reveal His righteousness, grace, and eternal plan of salvation.")

        results.append({
            'source': 'Downloads-JSON',
            'question': q_str,
            'options': options,
            'correctAnswer': correct_idx,
            'testament': testament,
            'book': book,
            'category': category,
            'difficulty': diff,
            'verse': ref_str if ref_str else f"{book} Scripture Reference",
            'story': story
        })

    print(f"Extracted {len(results)} valid questions from Downloads/questions.json.")
    return results

def main():
    existing_file = 'client/src/data/questions.json'
    with open(existing_file, 'r', encoding='utf-8') as f:
        existing_questions = json.load(f)
    print(f"Current existing questions in app: {len(existing_questions)}")

    pdf_questions = extract_pdf_questions_and_answers()
    json_questions = extract_downloads_json_questions()

    # Track seen question normalized texts
    def normalize_q(text):
        return re.sub(r'[^a-z0-9]', '', clean_text(text).lower())

    seen_q = {normalize_q(q['question']): q for q in existing_questions}
    
    added_from_pdf = 0
    added_from_json = 0

    next_id = max(q['id'] for q in existing_questions) + 1

    for item in pdf_questions:
        norm = normalize_q(item['question'])
        if norm not in seen_q:
            new_q = {
                'id': next_id,
                'question': item['question'],
                'options': item['options'],
                'correctAnswer': item['correctAnswer'],
                'testament': item['testament'],
                'book': item['book'],
                'category': item['category'],
                'difficulty': item['difficulty'],
                'verse': item['verse'],
                'story': item['story']
            }
            existing_questions.append(new_q)
            seen_q[norm] = new_q
            next_id += 1
            added_from_pdf += 1

    for item in json_questions:
        norm = normalize_q(item['question'])
        if norm not in seen_q:
            new_q = {
                'id': next_id,
                'question': item['question'],
                'options': item['options'],
                'correctAnswer': item['correctAnswer'],
                'testament': item['testament'],
                'book': item['book'],
                'category': item['category'],
                'difficulty': item['difficulty'],
                'verse': item['verse'],
                'story': item['story']
            }
            existing_questions.append(new_q)
            seen_q[norm] = new_q
            next_id += 1
            added_from_json += 1

    print(f"Added {added_from_pdf} new questions from 1001-Bible-Trivia PDF.")
    print(f"Added {added_from_json} new questions from Downloads/questions.json.")
    print(f"Total question library now: {len(existing_questions)} questions!")

    # Verify no brackets exist anywhere
    bracket_count = sum(
        1 for q in existing_questions
        if any(b in q['question'] for b in '()[]{}') or any(any(b in opt for b in '()[]{}') for opt in q['options'])
    )
    print(f"Bracket verification: {bracket_count} questions have brackets (should be 0).")

    with open(existing_file, 'w', encoding='utf-8') as f:
        json.dump(existing_questions, f, indent=2, ensure_ascii=False)
    print(f"Saved updated dataset to {existing_file}.")

if __name__ == '__main__':
    main()

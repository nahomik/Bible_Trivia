import json, re

# Test sample questions from user screenshots
SCREENSHOT_SAMPLES = [
    {
        "id": 1243,
        "q": "What ceremony did King Josiah reinstate that had not been celebrated by any of the previous kings of Israel or Judah?",
        "ans_en": "Passover",
        "ans_am": "ፋሲካ",
        "distractors_en": ["Pentecost", "Tabernacles", "Purim"],
        "distractors_am": ["በዓለ ሃምሳ", "የዳስ በዓል", "ፑሪም"]
    },
    {
        "id": 2339,
        "q": "Which king had a feast using the gold and silver vessels taken from the temple in Jerusalem?",
        "ans_en": "Belshazzar",
        "ans_am": "ብልጣሶር",
        "distractors_en": ["Nebuchadnezzar", "Evil-Merodach", "Sennacherib"],
        "distractors_am": ["ናቡከደነፆር", "ኤቪል-ሜሮዳክ", "ሰናክሬም"]
    },
    {
        "id": 3693,
        "q": "What book of the Bible follows Philemon?",
        "ans_en": "Hebrews",
        "ans_am": "ዕብራውያን",
        "distractors_en": ["Romans", "Galatians", "Philippians"],
        "distractors_am": ["ሮሜ", "ገላትያ", "ፊልጵስዩስ"]
    },
    {
        "id": 3499,
        "q": "During what traumatic event did the apostle Paul take bread and give thanks?",
        "ans_en": "Sea voyage",
        "ans_am": "የባህር ጉዞ",
        "distractors_en": ["Prison trial", "Temple riot", "City escape"],
        "distractors_am": ["የእስር ቤት ፍርድ", "የመቅደሱ ሁከት", "የከተማው ስደት"]
    },
    {
        "id": 5136,
        "q": "Which men murdered the Levite’s concubine?",
        "ans_en": "The men of Gibeah",
        "ans_am": "የጊብዓ ሰዎች",
        "distractors_en": ["The men of Sodom", "The men of Jericho", "The men of Shechem"],
        "distractors_am": ["የሰዶም ሰዎች", "የኢያሪኮ ሰዎች", "የሴኬም ሰዎች"]
    }
]

for s in SCREENSHOT_SAMPLES:
    print(f"ID {s['id']}: {s['ans_en']} ({len(s['ans_en'].split())}w) -> {s['distractors_en']}")
    print(f"       {s['ans_am']} -> {s['distractors_am']}")
    # verify lengths
    all_en = [s['ans_en']] + s['distractors_en']
    all_am = [s['ans_am']] + s['distractors_am']
    wc_en = set(len(x.split()) for x in all_en)
    print(f"       Word counts EN: {wc_en} (Balanced: {len(wc_en) == 1})")

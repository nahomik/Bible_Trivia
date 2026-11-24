import json, re

# Load the 819 questions
with open('bad_819_questions.json') as f:
    qs = json.load(f)

# Helper to clean parentheses and brackets
def clean_text(text):
    if not text:
        return ""
    # Remove text in parentheses/brackets if it's a hint
    # but keep the core word if the whole thing was in parentheses
    text = re.sub(r'\s*\([^)]*\)', '', text)
    text = re.sub(r'\s*\[[^\]]*\]', '', text)
    text = re.sub(r'[\(\)\[\]\{\}]', '', text)
    return text.strip()

print("Clean text test:")
print(clean_text("How old (years) was David when he was anointed King of Israel?"))
print(clean_text("በእጀ ጠባቡ (ስፌት በሌለው ቀሚሱ)"))
print(clean_text("Genesis 2:10 (Pishon, Gihon, Hiddekel, and Euphrates)"))

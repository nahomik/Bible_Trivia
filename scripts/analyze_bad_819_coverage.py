import json, re
from collections import Counter

with open('bad_819_questions.json') as f:
    qs = json.load(f)

print(f"Total bad questions: {len(qs)}")

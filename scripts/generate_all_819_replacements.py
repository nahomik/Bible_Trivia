import json, re, random
from collections import Counter

with open('bad_819_questions.json') as f:
    bad_qs = json.load(f)

print(f"Loaded {len(bad_qs)} bad questions")

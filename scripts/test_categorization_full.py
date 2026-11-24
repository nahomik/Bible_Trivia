import json, re

with open('bad_819_questions.json') as f:
    qs = json.load(f)

print(f"Loaded {len(qs)} bad questions")

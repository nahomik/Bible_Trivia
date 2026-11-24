import json, re

with open('bad_819_questions.json') as f:
    qs = json.load(f)

# Import classify_all_819
import scripts.classify_all_819 as cat

all_named = {}
for pool_dict in [cat.BOOKS, cat.FEASTS, cat.KINGS, cat.DISCIPLES, cat.PROPHETS, cat.WOMEN, cat.MEN,
                  cat.PLACES, cat.WATERS, cat.MOUNTAINS, cat.NUMBERS, cat.ANIMALS, cat.PLANTS,
                  cat.BODY_PARTS, cat.VIRTUES]:
    for k, v in pool_dict.items():
        all_named[k] = v

matched = []
unmatched = []

for q in qs:
    ans_norm = q['ans_en'].lower().strip()
    # Check direct match
    if ans_norm in all_named:
        matched.append((q, all_named[ans_norm]))
    else:
        unmatched.append(q)

print(f"Direct pool matches: {len(matched)}")
print(f"Remaining to match: {len(unmatched)}")

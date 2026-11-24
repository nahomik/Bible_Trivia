import json, re
from collections import Counter

with open('scratch_675_answers.json') as f:
    answers = json.load(f)

# Let's inspect length in words of all 675 answers
word_counts = Counter(len(a[3].split()) for a in answers)
print("Word counts of answers:")
for wc, count in sorted(word_counts.items()):
    print(f"  {wc} words: {count} questions")


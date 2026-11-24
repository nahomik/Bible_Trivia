import subprocess, json, re
from collections import Counter

out = subprocess.check_output(['git', 'show', 'acfecb9:client/src/data/questions.json']).decode('utf-8')
data = json.loads(out)

BAD_DISTRACTORS = {
    'A pillar of cloud and fire', 'The covenant of the Lord', 'The law given by Moses',
    'The kingdom of righteousness and peace in Scripture', 'The bread from heaven in the wilderness in Scripture',
    'Proclaiming the good news of salvation in Scripture', 'Proclaiming the good news of salvation',
    'The kingdom of righteousness and peace', 'City of Sea of Galilee', 'City of Garden of Eden',
    'City of Mount of Olives', 'The bread from heaven in the wilderness', 'The mercy and grace of God',
    'Walking humbly before the Lord', 'Faith in the promises of God', 'Obedience to the divine commandment',
    'Trusting in the Word of God', 'Prayer and fasting before God', 'Following the call of the Lord',
    'Grace bestowed through faith', 'Offering sacrifices upon the altar', 'Repentance with sackcloth and ashes',
}

bad_q = [q for q in data if any(o in BAD_DISTRACTORS for i, o in enumerate(q['options']) if i != q['correctAnswer'])]

# Let's inspect the distribution of questions and answers by word count
counts_by_wc = Counter()
for q in bad_q:
    ans = q['options'][q['correctAnswer']]
    wc = len(ans.strip().split())
    counts_by_wc[wc] += 1

print("Word count distribution of correct answers in 819 questions:")
for wc, cnt in sorted(counts_by_wc.items()):
    print(f"  {wc} words: {cnt}")

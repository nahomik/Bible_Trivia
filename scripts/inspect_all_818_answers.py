import subprocess, json

out = subprocess.check_output(['git', 'show', 'acfecb9:client/src/data/questions.json'])
data = json.loads(out)

PLACEHOLDER_SET = {
    'A pillar of cloud and fire', 'The covenant of the Lord', 'The law given by Moses',
    'The kingdom of righteousness and peace in Scripture', 'The bread from heaven in the wilderness in Scripture',
    'Proclaiming the good news of salvation in Scripture', 'Proclaiming the good news of salvation',
    'The kingdom of righteousness and peace', 'City of Sea of Galilee', 'City of Garden of Eden',
    'City of Mount of Olives', 'The bread from heaven in the wilderness', 'The mercy and grace of God',
    'Walking humbly before the Lord', 'Faith in the promises of God', 'Obedience to the divine commandment',
    'Trusting in the Word of God', 'Prayer and fasting before God', 'Following the call of the Lord',
    'Grace bestowed through faith'
}

flagged = []
for q in data:
    if 'guided the israelites through the wilderness' in q['question'].lower():
        continue
    opts = set(q.get('options', []))
    if opts.intersection(PLACEHOLDER_SET):
        real_ans = [o for o in q['options'] if o not in PLACEHOLDER_SET]
        if real_ans:
            flagged.append((q['id'], q['book'], q['category'], q['question'], real_ans[0]))

print(f"Total flagged: {len(flagged)}")
with open('scratch_818_items.json', 'w') as f:
    json.dump(flagged, f, indent=2)
print("Saved scratch_818_items.json")

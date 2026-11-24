import json, re

with open('bad_819_questions.json') as f:
    qs = json.load(f)

# Helper to check if text has bad options
BAD_DISTRACTORS = {
    'A pillar of cloud and fire', 'The covenant of the Lord', 'The law given by Moses',
    'The kingdom of righteousness and peace in Scripture', 'The bread from heaven in the wilderness in Scripture',
    'Proclaiming the good news of salvation in Scripture', 'Proclaiming the good news of salvation',
    'The kingdom of righteousness and peace', 'City of Sea of Galilee', 'City of Garden of Eden',
    'City of Mount of Olives', 'The bread from heaven in the wilderness', 'The mercy and grace of God',
    'Walking humbly before the Lord', 'Faith in the promises of God', 'Obedience to the divine commandment',
    'Trusting in the Word of God', 'Prayer and fasting before God', 'Following the call of the Lord',
    'Grace bestowed through faith', 'Offering sacrifices upon the altar', 'Repentance with sackcloth and ashes',
    'The law given by Moses', 'A pillar of cloud and fire', 'The covenant of the Lord'
}

print("Checking bad questions...")
print(f"Total: {len(qs)}")

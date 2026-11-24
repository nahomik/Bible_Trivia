from collections import Counter
import json, re

with open('scratch_675_defaults.json') as f:
    qs = json.load(f)

# Test categorizing questions based on question text and answer
def categorize_question(q, ans):
    ql = q['question'].lower()
    al = ans.lower()
    
    # Check books
    bible_books = {'genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth',
                   'samuel', 'kings', 'chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs',
                   'ecclesiastes', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel',
                   'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah',
                   'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans', 'corinthians', 'galatians',
                   'ephesians', 'philippians', 'colossians', 'thessalonians', 'timothy', 'titus', 'philemon',
                   'hebrews', 'james', 'peter', 'jude', 'revelation'}
    if 'book' in ql and any(b in al for b in bible_books):
        return 'BOOK'
    if al in bible_books:
        return 'BOOK'
        
    # Check kings
    kings = {'belshazzar', 'nebuchadnezzar', 'david', 'solomon', 'saul', 'hezekiah', 'josiah', 'ahab',
             'jeroboam', 'rehoboam', 'darius', 'cyrus', 'herod', 'agrippa', 'caesar', 'pharaoh', 'artaxerxes'}
    if 'king' in ql and any(k in al for k in kings):
        return 'KING'
    if al in kings:
        return 'KING'
        
    # Check feasts / ceremonies
    feasts = {'passover', 'pentecost', 'tabernacles', 'purim', 'atonement', 'unleavened bread', 'trumpets', 'sabbath'}
    if ('feast' in ql or 'ceremony' in ql or 'celebrate' in ql) and any(f in al for f in feasts):
        return 'FEAST'
    if al in feasts:
        return 'FEAST'
        
    # Check numbers
    numbers = {'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'twelve',
               'forty', 'fifty', 'seventy', 'hundred', 'thousand', 'sixty-six', 'thirty', '1', '2', '3', '4',
               '5', '6', '7', '8', '9', '10', '12', '40', '70', '100', '1,000', '30'}
    if 'how many' in ql or any(al == n or al.isdigit() for n in numbers):
        return 'NUMBER'
        
    # Check mountains
    mountains = {'sinai', 'carmel', 'olives', 'zion', 'nebo', 'hermon', 'ararat', 'horeb', 'moriah', 'tabor'}
    if 'mountain' in ql or any(m in al for m in mountains):
        return 'MOUNTAIN'
        
    # Check cities / places
    places = {'jerusalem', 'bethlehem', 'nazareth', 'jericho', 'hebron', 'samaria', 'damascus', 'babylon',
              'nineveh', 'antioch', 'rome', 'egypt', 'canaan', 'sodom', 'gomorrah', 'eden', 'tarshish', 'ur'}
    if ('city' in ql or 'land' in ql or 'place' in ql or 'where' in ql) and any(p in al for p in places):
        return 'PLACE'
    if al in places:
        return 'PLACE'
        
    # Check people (who ...)
    if ql.startswith('who ') or ql.startswith('which man') or ql.startswith('which woman') or ql.startswith('whose '):
        if 'female' in ql or 'woman' in ql or 'mother' in ql or 'wife' in ql or 'queen' in ql or 'sister' in ql or 'daughter' in ql:
            return 'WOMAN'
        return 'PERSON'
        
    return 'GENERAL'

categories = Counter()
for q in qs:
    bad_defaults = {'A pillar of cloud and fire', 'The covenant of the Lord', 'The law given by Moses', 'The mercy and grace of God'}
    non_bad = [o for o in q['options'] if o not in bad_defaults]
    if non_bad:
        cat = categorize_question(q, non_bad[0])
        categories[cat] += 1

print("Categories detected across 675 questions:")
for c, cnt in categories.most_common():
    print(f"  {c:10s}: {cnt}")

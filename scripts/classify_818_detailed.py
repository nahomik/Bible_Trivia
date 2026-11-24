import json, re
from collections import Counter

with open('scratch_818_items.json') as f:
    items = json.load(f)

# items: [id, book, category, question, real_ans]

BIBLE_BOOKS = {
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
    'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
    '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
}
BIBLE_BOOKS_LOWER = {b.lower(): b for b in BIBLE_BOOKS}

FEASTS = {
    'passover': ('Passover', ['Pentecost', 'Tabernacles', 'Purim']),
    'pentecost': ('Pentecost', ['Passover', 'Tabernacles', 'Purim']),
    'tabernacles': ('Tabernacles', ['Passover', 'Pentecost', 'Atonement']),
    'purim': ('Purim', ['Passover', 'Pentecost', 'Tabernacles']),
    'day of atonement': ('Day of Atonement', ['Feast of Booths', 'Feast of Weeks', 'Feast of Trumpets']),
    'unleavened bread': ('Unleavened Bread', ['Feast of Weeks', 'Feast of Booths', 'Feast of Trumpets']),
    'sabbath': ('Sabbath day', ['New Moon day', 'Jubilee year', 'Feast of Weeks'])
}

KINGS = {
    'belshazzar': ('Belshazzar', ['Nebuchadnezzar', 'Evil-Merodach', 'Sennacherib']),
    'nebuchadnezzar': ('Nebuchadnezzar', ['Evil-Merodach', 'Belshazzar', 'Sennacherib']),
    'david': ('David', ['Solomon', 'Saul', 'Hezekiah']),
    'solomon': ('Solomon', ['David', 'Saul', 'Josiah']),
    'saul': ('Saul', ['David', 'Solomon', 'Rehoboam']),
    'hezekiah': ('Hezekiah', ['Josiah', 'Manasseh', 'Jehoshaphat']),
    'josiah': ('Josiah', ['Hezekiah', 'Manasseh', 'Jehoshaphat']),
    'ahab': ('Ahab', ['Jeroboam', 'Omri', 'Jehu']),
    'jeroboam': ('Jeroboam', ['Rehoboam', 'Nadab', 'Baasha']),
    'rehoboam': ('Rehoboam', ['Jeroboam', 'Abijah', 'Asa']),
    'herod': ('Herod', ['Agrippa', 'Pilate', 'Felix']),
    'agrippa': ('Agrippa', ['Herod', 'Pilate', 'Festus']),
    'pharaoh': ('Pharaoh', ['Nebuchadnezzar', 'Sennacherib', 'Artaxerxes']),
    'darius': ('Darius', ['Cyrus', 'Xerxes', 'Artaxerxes']),
    'cyrus': ('Cyrus', ['Darius', 'Xerxes', 'Artaxerxes'])
}

def get_bucket(q_text, ans):
    ql = q_text.lower()
    al = ans.lower().strip()
    
    # Check bible book
    if al in BIBLE_BOOKS_LOWER or ('book' in ql and any(b in al for b in BIBLE_BOOKS_LOWER)):
        return 'BOOK'
    if al in FEASTS or 'ceremony' in ql or 'feast' in ql:
        return 'FEAST'
    if al in KINGS or ('king' in ql and 'who' in ql):
        return 'KING'
    if 'how many' in ql or al.isdigit():
        return 'NUMBER'
    if 'mountain' in ql:
        return 'MOUNTAIN'
    if 'river' in ql or 'sea' in ql or 'lake' in ql:
        return 'WATER'
    if 'city' in ql or 'town' in ql or 'land' in ql or 'where' in ql:
        return 'PLACE'
    if 'animal' in ql or 'creature' in ql or 'beast' in ql or 'bird' in ql:
        return 'ANIMAL'
    if 'tree' in ql or 'plant' in ql or 'fruit' in ql:
        return 'PLANT'
    if 'prophet' in ql:
        return 'PROPHET'
    if 'who' in ql or 'whose' in ql or 'which man' in ql or 'which son' in ql:
        return 'PERSON'
    return 'PHRASE'

buckets = Counter()
for it in items:
    b = get_bucket(it[3], it[4])
    buckets[b] += 1

print("Buckets distribution:")
for b, count in buckets.most_common():
    print(f"  {b:10s}: {count}")

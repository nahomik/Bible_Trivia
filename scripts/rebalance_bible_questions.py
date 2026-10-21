#!/usr/bin/env python3
import json
import os
import re
import random
from import_user_trivia import (
    extract_pdf_questions_and_answers,
    extract_downloads_json_questions,
    detect_book_and_testament,
    generate_distractors,
    balance_options,
    clean_text,
    CANONICAL_STORIES
)

ALL_66_BOOKS = [
    # Old Testament (39)
    ("Genesis", "Old"), ("Exodus", "Old"), ("Leviticus", "Old"), ("Numbers", "Old"), ("Deuteronomy", "Old"),
    ("Joshua", "Old"), ("Judges", "Old"), ("Ruth", "Old"), ("1 Samuel", "Old"), ("2 Samuel", "Old"),
    ("1 Kings", "Old"), ("2 Kings", "Old"), ("1 Chronicles", "Old"), ("2 Chronicles", "Old"), ("Ezra", "Old"),
    ("Nehemiah", "Old"), ("Esther", "Old"), ("Job", "Old"), ("Psalms", "Old"), ("Proverbs", "Old"),
    ("Ecclesiastes", "Old"), ("Song of Solomon", "Old"), ("Isaiah", "Old"), ("Jeremiah", "Old"), ("Lamentations", "Old"),
    ("Ezekiel", "Old"), ("Daniel", "Old"), ("Hosea", "Old"), ("Joel", "Old"), ("Amos", "Old"),
    ("Obadiah", "Old"), ("Jonah", "Old"), ("Micah", "Old"), ("Nahum", "Old"), ("Habakkuk", "Old"),
    ("Zephaniah", "Old"), ("Haggai", "Old"), ("Zechariah", "Old"), ("Malachi", "Old"),
    # New Testament (27)
    ("Matthew", "New"), ("Mark", "New"), ("Luke", "New"), ("John", "New"), ("Acts", "New"),
    ("Romans", "New"), ("1 Corinthians", "New"), ("2 Corinthians", "New"), ("Galatians", "New"), ("Ephesians", "New"),
    ("Philippians", "New"), ("Colossians", "New"), ("1 Thessalonians", "New"), ("2 Thessalonians", "New"), ("1 Timothy", "New"),
    ("2 Timothy", "New"), ("Titus", "New"), ("Philemon", "New"), ("Hebrews", "New"), ("James", "New"),
    ("1 Peter", "New"), ("2 Peter", "New"), ("1 John", "New"), ("2 John", "New"), ("3 John", "New"),
    ("Jude", "New"), ("Revelation", "New")
]

CANONICAL_VERSES = {
    'Genesis': 'Genesis 1:1',
    'Exodus': 'Exodus 14:14',
    'Leviticus': 'Leviticus 19:18',
    'Numbers': 'Numbers 6:24-26',
    'Deuteronomy': 'Deuteronomy 6:4-5',
    'Joshua': 'Joshua 1:9',
    'Judges': 'Judges 5:31',
    'Ruth': 'Ruth 1:16-17',
    '1 Samuel': '1 Samuel 16:7',
    '2 Samuel': '2 Samuel 22:2-3',
    '1 Kings': '1 Kings 3:9',
    '2 Kings': '2 Kings 2:11',
    '1 Chronicles': '1 Chronicles 16:11',
    '2 Chronicles': '2 Chronicles 7:14',
    'Ezra': 'Ezra 7:10',
    'Nehemiah': 'Nehemiah 8:10',
    'Esther': 'Esther 4:14',
    'Job': 'Job 19:25',
    'Psalms': 'Psalm 23:1-3',
    'Proverbs': 'Proverbs 3:5-6',
    'Ecclesiastes': 'Ecclesiastes 3:1',
    'Song of Solomon': 'Song of Songs 2:16',
    'Isaiah': 'Isaiah 40:31',
    'Jeremiah': 'Jeremiah 29:11',
    'Lamentations': 'Lamentations 3:22-23',
    'Ezekiel': 'Ezekiel 36:26',
    'Daniel': 'Daniel 6:26-27',
    'Hosea': 'Hosea 6:3',
    'Joel': 'Joel 2:28',
    'Amos': 'Amos 5:24',
    'Obadiah': 'Obadiah 1:21',
    'Jonah': 'Jonah 2:9',
    'Micah': 'Micah 6:8',
    'Nahum': 'Nahum 1:7',
    'Habakkuk': 'Habakkuk 3:19',
    'Zephaniah': 'Zephaniah 3:17',
    'Haggai': 'Haggai 2:9',
    'Zechariah': 'Zechariah 4:6',
    'Malachi': 'Malachi 4:2',
    'Matthew': 'Matthew 28:19-20',
    'Mark': 'Mark 10:45',
    'Luke': 'Luke 19:10',
    'John': 'John 3:16',
    'Acts': 'Acts 1:8',
    'Romans': 'Romans 8:28',
    '1 Corinthians': '1 Corinthians 13:4-7',
    '2 Corinthians': '2 Corinthians 5:17',
    'Galatians': 'Galatians 5:22-23',
    'Ephesians': 'Ephesians 2:8-9',
    'Philippians': 'Philippians 4:13',
    'Colossians': 'Colossians 3:12-14',
    '1 Thessalonians': '1 Thessalonians 5:16-18',
    '2 Thessalonians': '2 Thessalonians 3:3',
    '1 Timothy': '1 Timothy 4:12',
    '2 Timothy': '2 Timothy 3:16-17',
    'Titus': 'Titus 2:11-12',
    'Philemon': 'Philemon 1:6',
    'Hebrews': 'Hebrews 11:1',
    'James': 'James 1:2-4',
    '1 Peter': '1 Peter 5:7',
    '2 Peter': '2 Peter 3:9',
    '1 John': '1 John 4:7-8',
    '2 John': '2 John 1:6',
    '3 John': '3 John 1:4',
    'Jude': 'Jude 1:24-25',
    'Revelation': 'Revelation 21:4'
}

def normalize_q(text):
    return re.sub(r'[^a-z0-9]', '', clean_text(text).lower())

def load_all_book_files():
    books_dir = 'scripts/books'
    questions = []
    
    for filename in sorted(os.listdir(books_dir)):
        if not filename.endswith('.js'):
            continue
        filepath = os.path.join(books_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Parse module.exports = [...]
        # Clean JS comments or syntax
        m = re.search(r'module\.exports\s*=\s*(\[[\s\S]*\]);?', content)
        if not m:
            continue
            
        json_str = m.group(1)
        # Handle unquoted JS keys if present
        json_str = re.sub(r'([,{]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)
        try:
            entries = json.loads(json_str)
        except Exception as e:
            # Fallback to python eval if simple
            try:
                entries = eval(json_str)
            except Exception as e2:
                print(f"Error parsing {filename}: {e2}")
                continue
                
        for item in entries:
            t = item.get('t', 'Old')
            b = item.get('b', 'Genesis')
            c = item.get('c', 'General Knowledge')
            d = item.get('d', 'Medium')
            q_text = clean_text(item.get('q'))
            a_text = clean_text(item.get('a'))
            wrongs = [clean_text(w) for w in item.get('w', [])]
            
            if not q_text or not a_text or len(wrongs) < 3:
                continue
                
            options, correct_idx = balance_options(a_text, wrongs)
            verse = CANONICAL_VERSES.get(b, f"{b} Context")
            story = CANONICAL_STORIES.get(b, f"In the book of {b}, God revealed His faithfulness, righteousness, and eternal grace.")
            
            questions.append({
                'question': q_text,
                'options': options,
                'correctAnswer': correct_idx,
                'testament': t,
                'book': b,
                'category': c,
                'difficulty': d,
                'verse': verse,
                'story': story
            })
            
    print(f"Loaded {len(questions)} total questions from scripts/books/*.js across all 66 books.")
    return questions

def main():
    # 1. Load book files
    book_questions = load_all_book_files()
    
    # 2. Load PDF questions and Downloads JSON questions
    pdf_questions = extract_pdf_questions_and_answers()
    json_questions = extract_downloads_json_questions()
    
    # 3. Read current client/src/data/questions.json
    client_q_file = 'client/src/data/questions.json'
    existing = []
    if os.path.exists(client_q_file):
        with open(client_q_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
            
    print(f"Existing questions currently in DB: {len(existing)}")
    
    # Group existing questions by book
    by_book = {}
    for q in existing:
        b = q.get('book', 'Genesis')
        by_book.setdefault(b, []).append(q)
        
    # Books that were massively overrepresented (over 100 questions for small books):
    # Cap Song of Solomon, Lamentations, etc. to 60-70 best questions
    for over_book in ['Song of Solomon', 'Lamentations', 'Habakkuk', 'Nahum', 'Ecclesiastes', 'Judges', '1 Chronicles', '2 Chronicles']:
        if over_book in by_book and len(by_book[over_book]) > 70:
            print(f"Trimming overrepresented book {over_book} from {len(by_book[over_book])} to 70 questions.")
            by_book[over_book] = by_book[over_book][:70]
            
    # Combine all into a unified set deduplicated by question text
    seen_q = set()
    final_questions = []
    
    # Add capped existing questions
    for b, q_list in by_book.items():
        for q in q_list:
            norm = normalize_q(q['question'])
            if norm not in seen_q:
                seen_q.add(norm)
                final_questions.append(q)
                
    # Add new book questions from scripts/books (especially the 44 new books!)
    added_from_books = 0
    for q in book_questions:
        norm = normalize_q(q['question'])
        if norm not in seen_q:
            seen_q.add(norm)
            final_questions.append(q)
            added_from_books += 1
            
    # Add PDF questions
    added_from_pdf = 0
    for q in pdf_questions:
        norm = normalize_q(q['question'])
        if norm not in seen_q:
            seen_q.add(norm)
            final_questions.append(q)
            added_from_pdf += 1
            
    # Add Downloads JSON questions
    added_from_json = 0
    for q in json_questions:
        norm = normalize_q(q['question'])
        if norm not in seen_q:
            seen_q.add(norm)
            final_questions.append(q)
            added_from_json += 1
            
    # Renumber IDs 1..N
    for idx, q in enumerate(final_questions, start=1):
        q['id'] = idx
        # Ensure clean text on question and options
        q['question'] = clean_text(q['question'])
        q['options'] = [clean_text(opt) for opt in q['options']]
        q['verse'] = clean_text(q.get('verse', CANONICAL_VERSES.get(q.get('book'), 'Scripture Context')))
        q['story'] = clean_text(q.get('story', CANONICAL_STORIES.get(q.get('book'), '')))

    # Verify coverage across ALL 66 books of the Bible
    book_counts = {}
    for q in final_questions:
        b = q['book']
        book_counts[b] = book_counts.get(b, 0) + 1
        
    print("\n--- Bible Book Representation (All 66 Books) ---")
    missing_books = []
    for b, t in ALL_66_BOOKS:
        cnt = book_counts.get(b, 0)
        print(f"[{t}] {b:18}: {cnt} questions")
        if cnt == 0:
            missing_books.append(b)
            
    print(f"\nTotal final questions: {len(final_questions)}")
    print(f"Missing books out of 66: {len(missing_books)} -> {missing_books}")
    
    # Verify no brackets exist anywhere
    bracket_count = sum(
        1 for q in final_questions
        if any(b in q['question'] for b in '()[]{}') or any(any(b in opt for b in '()[]{}') for opt in q['options'])
    )
    print(f"Bracket count: {bracket_count} (Must be 0)")
    
    with open(client_q_file, 'w', encoding='utf-8') as f:
        json.dump(final_questions, f, indent=2, ensure_ascii=False)
        
    print(f"Saved rebalanced dataset to {client_q_file}.")

if __name__ == '__main__':
    main()

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

QUESTIONS_PATH = 'client/src/data/questions.json'
CACHE_PATH = 'client/src/data/questions_am_cache.json'

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

def translate_numbered_items(items, max_retries=4):
    """
    Translates a list of strings using numbered list trick via Google Translate.
    Returns dict mapping 1-based index to translated string.
    """
    numbered_text = '\n'.join([f'{i+1}. {item}' for i, item in enumerate(items)])
    url = 'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=am&dt=t&q=' + urllib.parse.quote(numbered_text)
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                translated = ''.join([part[0] for part in res[0] if part and part[0]])
                
                results = {}
                for line in translated.strip().split('\n'):
                    line = line.strip()
                    m = re.match(r'^(\d+)[\.:\s\-]+(.*)$', line)
                    if m:
                        results[int(m.group(1))] = m.group(2).strip()
                
                # Check if we got all or most items
                if len(results) == len(items):
                    return [results[i+1] for i in range(len(items))]
                
                # If slight mismatch, retry
                time.sleep(0.5)
        except Exception as e:
            time.sleep(1 + attempt * 0.5)

    # Fallback: translate individual items if batch failed
    fallback_results = []
    for item in items:
        try:
            single_url = 'https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=en&tl=am&dt=t&q=' + urllib.parse.quote(item)
            single_req = urllib.request.Request(single_url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(single_req, timeout=10) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                translated = ''.join([part[0] for part in res[0] if part and part[0]])
                fallback_results.append(translated.strip() or item)
        except Exception:
            fallback_results.append(item)
    return fallback_results

def process_question_batch(batch):
    """
    Batch is a list of question dicts.
    Each question has 1 question string and N options (usually 4).
    Total items per question = 1 + len(options).
    """
    all_items = []
    layout = [] # list of (q_id, num_options)
    for q in batch:
        all_items.append(q['question'])
        for opt in q['options']:
            all_items.append(opt)
        layout.append((q['id'], len(q['options'])))

    translated_items = translate_numbered_items(all_items)
    
    results = {}
    curr = 0
    for q_id, num_opts in layout:
        q_trans = translated_items[curr]
        opts_trans = translated_items[curr + 1 : curr + 1 + num_opts]
        curr += 1 + num_opts
        results[q_id] = {
            'question_am': q_trans,
            'options_am': opts_trans
        }
    return results

def main():
    print(f'Loading questions from {QUESTIONS_PATH}...')
    with open(QUESTIONS_PATH, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f'Total questions: {len(questions)}')

    cache = {}
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, 'r', encoding='utf-8') as f:
                cache = json.load(f)
            # Keys in json are strings, convert to int for checking
            cache = {int(k): v for k, v in cache.items()}
            print(f'Loaded {len(cache)} existing cached translations from {CACHE_PATH}')
        except Exception as e:
            print(f'Warning loading cache: {e}')

    untranslated = [q for q in questions if q['id'] not in cache]
    print(f'Questions remaining to translate: {len(untranslated)}')

    if not untranslated:
        print('All questions are already translated! Updating questions.json...')
        merge_cache_into_questions(questions, cache)
        return

    BATCH_SIZE = 5  # 5 questions = ~25 items per request, very reliable
    batches = [untranslated[i:i + BATCH_SIZE] for i in range(0, len(untranslated), BATCH_SIZE)]
    print(f'Processing {len(batches)} batches of {BATCH_SIZE} questions with 6 concurrent workers...')

    start_time = time.time()
    completed_count = len(cache)
    total_count = len(questions)

    def save_cache():
        temp_path = CACHE_PATH + '.tmp'
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        os.replace(temp_path, CACHE_PATH)

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(process_question_batch, b): b for b in batches}
        
        batch_done = 0
        for future in as_completed(futures):
            try:
                res = future.result()
                cache.update(res)
                completed_count += len(res)
                batch_done += 1

                if batch_done % 10 == 0 or completed_count >= total_count:
                    elapsed = time.time() - start_time
                    percent = (completed_count / total_count) * 100
                    speed = (completed_count - (total_count - len(untranslated))) / max(1, elapsed)
                    remaining = (total_count - completed_count) / max(0.1, speed)
                    print(f'[{completed_count}/{total_count} ({percent:.1f}%)] '
                          f'{speed:.1f} q/s | Est. remaining: {remaining/60:.1f}m')
                    save_cache()
            except Exception as e:
                print(f'Error processing batch: {e}')

    save_cache()
    print('All batches processed! Merging into questions.json...')
    merge_cache_into_questions(questions, cache)

def merge_cache_into_questions(questions, cache):
    updated_count = 0
    for q in questions:
        qid = q['id']
        if qid in cache:
            q['question_am'] = cache[qid]['question_am']
            q['options_am'] = cache[qid]['options_am']
            updated_count += 1

    print(f'Writing updated questions with Amharic to {QUESTIONS_PATH}...')
    temp_path = QUESTIONS_PATH + '.tmp'
    with open(temp_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    os.replace(temp_path, QUESTIONS_PATH)
    print(f'Done! Successfully updated {updated_count} questions with Amharic translations.')

if __name__ == '__main__':
    main()

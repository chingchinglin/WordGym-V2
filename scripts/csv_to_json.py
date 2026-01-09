import csv
import json
import sys
import re

# Publisher to education stage mapping
# 出版商 → 教育階段映射
PUBLISHER_TO_STAGE = {
    '康軒': '國中',
    '翰林': '國中',
    '南一': '國中',
    '龍騰': '高中',
    '三民': '高中',
    '遠東': '高中',
}

def infer_stage_from_textbook(textbook_index):
    """
    Infer education stage from textbook_index based on publisher.
    This is more reliable than the CSV stage column.

    Args:
        textbook_index: List of textbook entries like [{"version": "康軒", "vol": "B1", "lesson": "U1"}]

    Returns:
        '國中' or '高中' or '' if cannot determine
    """
    if not textbook_index or not isinstance(textbook_index, list):
        return ''

    # Check each textbook entry
    for entry in textbook_index:
        if isinstance(entry, dict):
            version = entry.get('version', '')
            if version in PUBLISHER_TO_STAGE:
                return PUBLISHER_TO_STAGE[version]

    return ''

def normalize_stage(stage_value, textbook_index=None):
    """
    Normalize stage value to education level (國中/高中).
    Priority:
      1. If textbook_index has publisher info, use that (most reliable)
      2. If stage_value is already 國中/高中, use that
      3. If stage_value is a publisher name, map it
      4. Fallback to textbook inference if stage is invalid
    """
    # Priority 1: If textbook_index has clear publisher info, use it
    # This is the most reliable source
    if textbook_index:
        inferred = infer_stage_from_textbook(textbook_index)
        if inferred:
            return inferred

    # If no stage value provided
    if not stage_value or stage_value.strip() == '':
        return ''

    stage_value = stage_value.strip()

    # Priority 2: If already education level, return as-is
    if stage_value in ['國中', '高中']:
        return stage_value

    # Priority 3: Try to map publisher to education level
    if stage_value in PUBLISHER_TO_STAGE:
        return PUBLISHER_TO_STAGE[stage_value]

    # Priority 4: Unknown value - try textbook inference again, or return empty
    # Don't return invalid values like "名詞", "過去式" etc.
    return ''

def parse_array_field(value, delimiter=';'):
    """
    Parse a field that might be a comma or semicolon-separated array
    Returns an empty list if the field is empty
    """
    if not value or value.strip() == '':
        return []

    # Split and strip each item, remove empty items
    return [item.strip() for item in value.split(delimiter) if item.strip()]

def extract_pos_from_definition(chinese_def):
    """
    Extract part of speech tags from chinese_definition field
    Pattern: (n.), (v.), (adj./n.), etc.
    Returns: (pos_tags_array, cleaned_definition)
    """
    if not chinese_def or chinese_def.strip() == '':
        return [], ''

    # POS mapping to standardized format
    pos_mapping = {
        'n.': 'noun',
        'v.': 'verb',
        'adj.': 'adjective',
        'adv.': 'adverb',
        'prep.': 'preposition',
        'conj.': 'conjunction',
        'pron.': 'pronoun',
        'interj.': 'interjection',
        'det.': 'determiner',
        'aux.': 'auxiliary'
    }

    # Match pattern like (adj./n.) or (adv.) at the beginning
    pattern = r'^\(([^)]+)\)\s*'
    match = re.match(pattern, chinese_def)

    if not match:
        return [], chinese_def

    pos_string = match.group(1)
    cleaned_def = re.sub(pattern, '', chinese_def).strip()

    # Handle compound POS like "adj./n."
    pos_parts = pos_string.split('/')
    pos_tags = []

    for part in pos_parts:
        part = part.strip()
        if part in pos_mapping:
            pos_tags.append(pos_mapping[part])
        elif part:
            # Keep unknown POS as-is for debugging
            pos_tags.append(part)

    return pos_tags, cleaned_def

def parse_textbook_index(value):
    """
    Parse textbook index into a structured array
    Expected format: "龍騰-B1-U4" or "version-vol-lesson" or empty
    """
    if not value or value.strip() == '':
        return []

    # Split by dash (actual format: 龍騰-B1-U4)
    parts = value.split('-')
    if len(parts) >= 3:
        return [{"version": parts[0].strip(), "vol": parts[1].strip(), "lesson": parts[2].strip()}]
    return []

def parse_theme_index(value):
    """
    Parse theme index into a structured array
    Expected format: "1200-Holidays-festivals" or "800-Time-1" (range-theme-subtheme)
    """
    if not value or value.strip() == '':
        return []

    # Split by dash, first part is range, rest is theme
    parts = value.split('-', 1)  # Split on first dash only
    if len(parts) >= 2:
        range_val = parts[0].strip()
        theme_val = parts[1].strip()
        return [{"range": range_val, "theme": theme_val}]
    return []

def parse_word_forms(value):
    """
    Parse word_forms into structured format
    Expected format:
    名詞
    可數；複數: criminals

    形容詞
    比較級: more criminal
    最高級: most criminal
    """
    if not value or value.strip() == '':
        return []

    result = []
    lines = value.split('\n')
    current_pos = None
    current_details = []

    for line in lines:
        line = line.strip()
        if not line:
            if current_pos and current_details:
                result.append({
                    'pos': current_pos,
                    'details': '\n'.join(current_details)
                })
                current_details = []
            continue

        # Check if it's a POS header (名詞, 動詞, 形容詞, etc.)
        if line in ['名詞', '動詞', '形容詞', '副詞', '介係詞', '連接詞', '代名詞', '感嘆詞']:
            # Save previous POS if exists
            if current_pos and current_details:
                result.append({
                    'pos': current_pos,
                    'details': '\n'.join(current_details)
                })
                current_details = []
            current_pos = line
        else:
            # It's a detail line
            if current_pos:
                current_details.append(line)

    # Don't forget the last one
    if current_pos and current_details:
        result.append({
            'pos': current_pos,
            'details': '\n'.join(current_details)
        })

    return result if result else value  # Return original if parsing fails

def clean_english_word(word):
    """
    Clean POS annotations, phonetics, and markers from english_word field
    Removes: (adj.), (n.), (vi. vt.), [phonetic], [C], [U], (him; his; himself), etc.
    Examples:
      "historic (adj.)" -> "historic"
      "appearance (n.) [C]" -> "appearance"
      "he (him; his; himself)" -> "he"
      "average [U, C]" -> "average"
      "encourage [ɪn`kɝɪdʒ]vt." -> "encourage"
      "promise (vi. vt.)" -> "promise"
    """
    if not word or word.strip() == '':
        return ''

    cleaned = word
    # Remove phonetic transcriptions in brackets like [ɪn`kɝɪdʒ], [prɪzṇ]
    cleaned = re.sub(r'\s*\[[^\]]*[ɪəɛæɔʌʊɝɑˏ`ṇ][^\]]*\]\s*', ' ', cleaned)
    # Remove trailing POS like vt., vi., n., adj., adv. (not in parentheses)
    cleaned = re.sub(r'\s*(vt\.|vi\.|n\.|adj\.|adv\.)\s*$', '', cleaned)
    # Remove POS annotations like (adj.), (n.), (adv.), (v.), (vi. vt.), (usu. pl.)
    cleaned = re.sub(r'\s*\([a-z\.\s\/]+\)\s*', ' ', cleaned)
    # Remove pronoun/verb variants like (him; his; himself), (me; my; mine; myself)
    cleaned = re.sub(r'\s*\([^)]*;\s*[^)]+\)\s*', ' ', cleaned)
    # Remove countable/uncountable markers like [C], [U], [U, C], [C, U]
    cleaned = re.sub(r'\s*\[[A-Z,\s]+\]\s*', ' ', cleaned)
    # Clean up extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned

def parse_pos_tags(pos_column):
    """
    Parse part of speech tags from the '詞性' column (if exists)
    This is a fallback if POS is in a separate column
    """
    if not pos_column or pos_column.strip() == '':
        return []

    pos_mapping = {
        'n.': 'noun',
        'v.': 'verb',
        'adj.': 'adjective',
        'adv.': 'adverb',
        'prep.': 'preposition',
        'conj.': 'conjunction',
        'pron.': 'pronoun',
        'interj.': 'interjection',
        'det.': 'determiner',
        'aux.': 'auxiliary'
    }

    # Check for any known POS markers
    return [pos_mapping.get(tag.strip(), tag.strip()) for tag in pos_mapping.keys() if tag in pos_column]

def merge_word_entries(existing, new_entry):
    """
    Merge two word entries, combining arrays and preferring non-empty values
    """
    # Helper to merge arrays with deduplication
    def merge_arrays(arr1, arr2):
        combined = arr1 + arr2
        # Deduplicate while preserving order
        seen = set()
        result = []
        for item in combined:
            # Handle both string and dict items
            key = item if isinstance(item, str) else json.dumps(item, sort_keys=True)
            if key not in seen:
                seen.add(key)
                result.append(item)
        return result

    # Helper to prefer non-empty string
    def prefer_non_empty(val1, val2):
        if val1 and val2:
            # Both have values, prefer longer or more complete one
            return val1 if len(str(val1)) >= len(str(val2)) else val2
        return val1 or val2

    # Helper to merge word_forms (can be array of objects or string)
    def merge_word_forms(forms1, forms2):
        if not forms1:
            return forms2
        if not forms2:
            return forms1

        # If both are arrays of objects, merge them
        if isinstance(forms1, list) and isinstance(forms2, list):
            if all(isinstance(f, dict) for f in forms1) and all(isinstance(f, dict) for f in forms2):
                return merge_arrays(forms1, forms2)

        # Otherwise prefer non-empty
        return prefer_non_empty(forms1, forms2)

    # Helper to merge affix_info objects
    def merge_affix_info(info1, info2):
        if not info1:
            return info2
        if not info2:
            return info1

        merged = {}
        all_keys = set(info1.keys()) | set(info2.keys())
        for key in all_keys:
            merged[key] = prefer_non_empty(info1.get(key, ''), info2.get(key, ''))
        return merged

    # Merge arrays
    existing['textbook_index'] = merge_arrays(existing['textbook_index'], new_entry['textbook_index'])
    existing['exam_tags'] = merge_arrays(existing['exam_tags'], new_entry['exam_tags'])
    existing['theme_index'] = merge_arrays(existing['theme_index'], new_entry['theme_index'])
    existing['phrases'] = merge_arrays(existing['phrases'], new_entry['phrases'])
    existing['synonyms'] = merge_arrays(existing['synonyms'], new_entry['synonyms'])
    existing['antonyms'] = merge_arrays(existing['antonyms'], new_entry['antonyms'])
    existing['confusables'] = merge_arrays(existing['confusables'], new_entry['confusables'])
    existing['posTags'] = merge_arrays(existing['posTags'], new_entry['posTags'])

    # Merge word_forms
    existing['word_forms'] = merge_word_forms(existing['word_forms'], new_entry['word_forms'])

    # Merge affix_info
    existing['affix_info'] = merge_affix_info(existing['affix_info'], new_entry['affix_info'])

    # Special handling for stage: recalculate from merged textbook_index
    # This ensures publisher-based inference takes priority after merging
    merged_textbook = existing['textbook_index']  # Already merged above
    inferred_stage = infer_stage_from_textbook(merged_textbook)
    if inferred_stage:
        existing['stage'] = inferred_stage
    else:
        # Fallback to prefer_non_empty if no textbook info
        existing['stage'] = prefer_non_empty(existing['stage'], new_entry['stage'])

    # Prefer non-empty strings for other fields
    for key in ['level', 'cefr', 'kk_phonetic', 'chinese_definition',
                'example_sentence', 'example_translation', 'example_sentence_2',
                'example_translation_2', 'example_sentence_3', 'example_translation_3',
                'example_sentence_4', 'example_translation_4', 'example_sentence_5',
                'example_translation_5', 'year_1', 'part_1', 'source_1', 'pos', 'videoUrl']:
        existing[key] = prefer_non_empty(existing[key], new_entry[key])

    return existing

def csv_to_json(csv_path, json_path):
    # Complete field name mapping from Chinese to English
    field_mapping = {
        'stage': 'stage',
        'textbook_index': 'textbook_index',
        'exam_tags': 'exam_tags',
        'level': 'level',
        'CEFR': 'cefr',
        '主題': 'theme_index',
        'english_word': 'english_word',
        'KK音標': 'kk_phonetic',
        '中譯': 'chinese_definition',
        '例句': 'example_sentence',
        '翻譯': 'example_translation',
        '例句2': 'example_sentence_2',
        '翻譯2': 'example_translation_2',
        '例句3': 'example_sentence_3',
        '翻譯3': 'example_translation_3',
        '例句4': 'example_sentence_4',
        '翻譯4': 'example_translation_4',
        '例句5': 'example_sentence_5',
        '翻譯5': 'example_translation_5',
        'Year_1': 'year_1',
        'Part_1': 'part_1',
        'Source_1': 'source_1',
        '詞性': 'pos',
        '詞性變化': 'word_forms',
        '片語': 'phrases',
        '同義字': 'synonyms',
        '反義字': 'antonyms',
        '易混淆字': 'confusables',
        '字首': 'prefix',
        '字尾': 'suffix',
        '字根': 'root',
        '意思': 'meaning',
        '例子': 'example',
        'videoUrl': 'videoUrl'
    }

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        # Use dictionary to track words by lowercase english_word
        words_dict = {}

        for row in reader:
            # Create a new row with all possible keys initialized
            processed_row = {
                'stage': '',
                'textbook_index': [],
                'exam_tags': [],
                'level': '',
                'cefr': '',
                'theme_index': [],
                'english_word': '',
                'kk_phonetic': '',
                'chinese_definition': '',
                'example_sentence': '',
                'example_translation': '',
                'example_sentence_2': '',
                'example_translation_2': '',
                'example_sentence_3': '',
                'example_translation_3': '',
                'example_sentence_4': '',
                'example_translation_4': '',
                'example_sentence_5': '',
                'example_translation_5': '',
                'year_1': '',
                'part_1': '',
                'source_1': '',
                'pos': '',
                'posTags': [],
                'word_forms': [],
                'phrases': [],
                'synonyms': [],
                'antonyms': [],
                'confusables': [],
                'affix_info': {},
                'videoUrl': ''
            }

            # Go through each key-value pair
            for key, value in row.items():
                # Map Chinese field names to English
                mapped_key = field_mapping.get(key, key)

                # Skip if value is None or empty string
                if value is None or value.strip() == '':
                    continue

                # Special parsing for specific fields
                if key == 'textbook_index' or mapped_key == 'textbook_index':
                    processed_row['textbook_index'] = parse_textbook_index(value)
                elif key == 'exam_tags' or mapped_key == 'exam_tags':
                    processed_row['exam_tags'] = parse_array_field(value)
                elif key == '主題' or mapped_key == 'theme_index':
                    processed_row['theme_index'] = parse_theme_index(value)
                elif key == '詞性':
                    processed_row['posTags'] = parse_pos_tags(value)
                elif key == '詞性變化' or mapped_key == 'word_forms':
                    processed_row['word_forms'] = parse_word_forms(value)
                elif key == '片語' or mapped_key == 'phrases':
                    processed_row['phrases'] = parse_array_field(value)
                elif key == '同義字' or mapped_key == 'synonyms':
                    processed_row['synonyms'] = parse_array_field(value, delimiter=';')
                elif key == '反義字' or mapped_key == 'antonyms':
                    processed_row['antonyms'] = parse_array_field(value, delimiter=';')
                elif key == '易混淆字' or mapped_key == 'confusables':
                    processed_row['confusables'] = parse_array_field(value, delimiter=';')
                elif key in ['字首', '字尾', '字根', '意思', '例子']:
                    # Collect affix info
                    if key == '字首':
                        if not processed_row['affix_info']:
                            processed_row['affix_info'] = {}
                        processed_row['affix_info']['prefix'] = value
                    elif key == '字尾':
                        if not processed_row['affix_info']:
                            processed_row['affix_info'] = {}
                        processed_row['affix_info']['suffix'] = value
                    elif key == '字根':
                        if not processed_row['affix_info']:
                            processed_row['affix_info'] = {}
                        processed_row['affix_info']['root'] = value
                    elif key == '意思':
                        if not processed_row['affix_info']:
                            processed_row['affix_info'] = {}
                        processed_row['affix_info']['meaning'] = value
                    elif key == '例子':
                        if not processed_row['affix_info']:
                            processed_row['affix_info'] = {}
                        processed_row['affix_info']['example'] = value
                elif key == '中譯' or mapped_key == 'chinese_definition':
                    # Extract POS from definition but keep original value
                    pos_tags, _ = extract_pos_from_definition(value)
                    processed_row['chinese_definition'] = value  # Keep original with POS
                    # Only set posTags if not already set by '詞性' column
                    if not processed_row['posTags'] and pos_tags:
                        processed_row['posTags'] = pos_tags
                elif key == 'english_word' or mapped_key == 'english_word':
                    # Clean POS annotations from english_word at source
                    processed_row['english_word'] = clean_english_word(value)
                elif key == 'stage' or mapped_key == 'stage':
                    # Store raw stage value, will normalize after textbook_index is processed
                    processed_row['_raw_stage'] = value
                else:
                    # For other fields, use mapped key
                    if mapped_key in processed_row:
                        processed_row[mapped_key] = value

            # Final stage normalization using textbook_index (guaranteed to be processed now)
            # This ensures publisher-based inference takes priority over invalid CSV stage values
            raw_stage = processed_row.pop('_raw_stage', '')
            processed_row['stage'] = normalize_stage(raw_stage, processed_row.get('textbook_index'))

            # Clean up empty affix_info
            if not processed_row['affix_info']:
                processed_row['affix_info'] = {}

            # Only process rows with at least english_word
            if processed_row.get('english_word'):
                word_key = processed_row['english_word'].lower()

                # Check if we've seen this word before
                if word_key in words_dict:
                    # Merge with existing entry
                    words_dict[word_key] = merge_word_entries(words_dict[word_key], processed_row)
                else:
                    # First occurrence of this word
                    words_dict[word_key] = processed_row

    # Convert dictionary to list
    data = list(words_dict.values())

    # Write processed data to JSON
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python csv_to_json.py input.csv output.json")
        sys.exit(1)

    csv_to_json(sys.argv[1], sys.argv[2])
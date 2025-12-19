import csv
import json
import sys
import re

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

def csv_to_json(csv_path, json_path):
    # Field name mapping from Chinese to English
    field_mapping = {
        '中譯': 'chinese_definition',
        '例句': 'example_sentence',
        '翻譯': 'example_translation',
        'KK音標': 'kk_phonetic',
        '詞性': 'pos',
        '主題': 'theme_index'
    }

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        data = []

        for row in reader:
            # Create a new row for processing
            processed_row = {}

            # Go through each key-value pair
            for key, value in row.items():
                # Skip completely empty values
                if value is None or value.strip() == '':
                    continue

                # Map Chinese field names to English
                mapped_key = field_mapping.get(key, key)

                # Special parsing for specific fields
                if key == 'textbook_index' or mapped_key == 'textbook_index':
                    processed_row['textbook_index'] = parse_textbook_index(value)
                elif key == 'exam_tags' or mapped_key == 'exam_tags':
                    processed_row['exam_tags'] = parse_array_field(value)
                elif key == '主題' or mapped_key == 'theme_index':
                    processed_row['theme_index'] = parse_theme_index(value)
                elif key == '詞性':
                    processed_row['posTags'] = parse_pos_tags(value)
                elif key == 'videoUrl':
                    processed_row[key] = value or ''
                elif key == '中譯' or mapped_key == 'chinese_definition':
                    # Extract POS from definition but keep original value
                    pos_tags, _ = extract_pos_from_definition(value)
                    processed_row['chinese_definition'] = value  # Keep original with POS
                    # Only set posTags if not already set by '詞性' column
                    if 'posTags' not in processed_row and pos_tags:
                        processed_row['posTags'] = pos_tags
                else:
                    # For other fields, use mapped key
                    processed_row[mapped_key] = value

            # Only add non-empty rows
            if processed_row:
                data.append(processed_row)

    # Write processed data to JSON
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python csv_to_json.py input.csv output.json")
        sys.exit(1)

    csv_to_json(sys.argv[1], sys.argv[2])
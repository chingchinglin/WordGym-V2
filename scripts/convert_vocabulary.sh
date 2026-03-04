#!/bin/bash
# Convert CSV to JSON and place in correct location

CSV_FILE="WordGym for students 國高中 - 工作表1.csv"
OUTPUT_FILE="src/data/vocabulary.json"

echo "Converting $CSV_FILE to $OUTPUT_FILE..."
python3 scripts/csv_to_json.py "$CSV_FILE" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Conversion successful!"
    echo "📊 Generated: $OUTPUT_FILE"
    wc -l "$OUTPUT_FILE"
else
    echo "❌ Conversion failed!"
    exit 1
fi

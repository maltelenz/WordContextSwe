#!/usr/bin/env python3
"""
Script to create a list of the 1500 most common Swedish nouns.
Requirements:
- Word must be present in all three sources:
  1. data/swedish_nouns.json (list of Swedish nouns)
  2. data/swedish_words.txt (word frequency list)  
  3. /tmp/saol2018clean.csv (SAOL dictionary)
- Output sorted by frequency from swedish_words.txt
"""

import json
import csv

def load_swedish_nouns():
    """Load the list of Swedish nouns from JSON file."""
    with open('data/swedish_nouns.json', 'r', encoding='utf-8') as f:
        nouns = json.load(f)
    return set(word.lower() for word in nouns)

def load_swedish_words_frequency():
    """Load word frequency data from text file."""
    word_freq = {}
    with open('data/swedish_words.txt', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    word = parts[0].lower()
                    try:
                        freq = int(parts[1])
                        word_freq[word] = freq
                    except ValueError:
                        continue
    return word_freq

def load_saol_words():
    """Load words from SAOL CSV file."""
    saol_words = set()
    with open('/tmp/saol2018clean.csv', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                parts = line.split(',')
                if len(parts) >= 2:
                    word = parts[1].strip()
                    # Skip empty words or words starting with special characters
                    if word and len(word) > 1 and word[0].isalpha():
                        saol_words.add(word.lower())
    return saol_words

def create_top_nouns_list():
    """Create the top 1500 nouns list."""
    
    # File paths
    output_file = "data/swedish_top_1500_nouns.json"
    
    print("Loading Swedish nouns...")
    nouns = load_swedish_nouns()
    print(f"Loaded {len(nouns)} nouns")
    
    print("Loading word frequency data...")
    word_freq = load_swedish_words_frequency()
    print(f"Loaded frequency data for {len(word_freq)} words")
    
    print("Loading SAOL words...")
    saol_words = load_saol_words()
    print(f"Loaded {len(saol_words)} SAOL words")
    
    # Find intersection of all three sets
    print("Finding words in all three sources...")
    common_words = []
    
    for noun in nouns:
        if noun in word_freq and noun in saol_words:
            common_words.append((noun, word_freq[noun]))
    
    print(f"Found {len(common_words)} words in all three sources")
    
    # Sort by frequency (descending)
    common_words.sort(key=lambda x: x[1], reverse=True)
    
    # Take top 1500
    top_1500 = [word for word, freq in common_words[:1500]]
    
    print(f"Selected top {len(top_1500)} words")
    
    # Save to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(top_1500, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {output_file}")
    print(f"Top 20 words: {top_1500[:20]}")
    
    return len(common_words), len(top_1500)

if __name__ == "__main__":
    total_common, selected = create_top_nouns_list()
    print(f"\nSummary:")
    print(f"- Total words found in all three sources: {total_common}")
    print(f"- Top words selected: {selected}")
    print(f"- Output file: data/swedish_top_1500_nouns.json")
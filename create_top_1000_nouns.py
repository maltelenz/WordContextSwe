#!/usr/bin/env python3
import json

def get_word_frequencies():
    """Load word frequencies from the original frequency list"""
    word_freq = {}
    with open('data/swedish_words.txt', 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                word = parts[0].lower()
                try:
                    freq = int(parts[1])
                    word_freq[word] = freq
                except ValueError:
                    continue
    return word_freq

def main():
    # Load current nouns
    with open('data/swedish_nouns.json', 'r', encoding='utf-8') as f:
        nouns = json.load(f)
    
    print(f"Loaded {len(nouns)} Swedish nouns")
    
    # Load word frequencies
    word_freq = get_word_frequencies()
    
    # Get noun frequencies and sort by frequency
    noun_freq = []
    for noun in nouns:
        if noun in word_freq:
            noun_freq.append((noun, word_freq[noun]))
    
    # Sort by frequency (descending)
    noun_freq.sort(key=lambda x: x[1], reverse=True)
    
    # Take top 1000
    top_1000_nouns = [noun for noun, freq in noun_freq[:1000]]
    
    print(f"Selected top {len(top_1000_nouns)} most frequent nouns")
    
    # Save the top 1000 nouns
    with open('data/swedish_top_1000_nouns.json', 'w', encoding='utf-8') as f:
        json.dump(top_1000_nouns, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to data/swedish_top_1000_nouns.json")
    
    # Show examples
    print("\nTop 20 most frequent nouns:")
    for i, (noun, freq) in enumerate(noun_freq[:20], 1):
        print(f"{i:3d}. {noun:<15} ({freq:,} occurrences)")
    
    print(f"\nNouns 990-1000:")
    for i, (noun, freq) in enumerate(noun_freq[989:1000], 990):
        print(f"{i:3d}. {noun:<15} ({freq:,} occurrences)")

if __name__ == "__main__":
    main()
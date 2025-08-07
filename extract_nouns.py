#!/usr/bin/env python3
import json

def load_swedish_words(words_file):
    """Load our Swedish words from frequency list"""
    words = set()
    with open(words_file, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if parts:
                word = parts[0].lower()
                if word and all(c.isalpha() or c in 'åäö' for c in word):
                    words.add(word)
    return words

def extract_nouns_from_saldo(saldo_file):
    """Extract nouns from SALDO lexicon"""
    nouns = set()
    
    with open(saldo_file, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#'):
                continue
            
            parts = line.strip().split('\t')
            if len(parts) >= 6:
                word = parts[4].lower()  # The word form
                pos = parts[5]           # Part of speech
                
                # Check if it's a noun (nn = noun)
                if pos == 'nn' and word:
                    # Only alphabetic Swedish characters
                    if all(c.isalpha() or c in 'åäö' for c in word):
                        nouns.add(word)
    
    return nouns

def main():
    print("Loading Swedish words...")
    swedish_words = load_swedish_words('data/swedish_words.txt')
    print(f"Loaded {len(swedish_words)} Swedish words")
    
    print("Extracting nouns from SALDO...")
    saldo_nouns = extract_nouns_from_saldo('data/saldo_2.3/saldo20v03.txt')
    print(f"Found {len(saldo_nouns)} nouns in SALDO")
    
    # Find intersection - nouns that are in both our word list and SALDO
    valid_nouns = swedish_words.intersection(saldo_nouns)
    print(f"Found {len(valid_nouns)} nouns that are in our vocabulary")
    
    # Save as JSON for easy loading in the game
    nouns_list = sorted(list(valid_nouns))
    with open('data/swedish_nouns.json', 'w', encoding='utf-8') as f:
        json.dump(nouns_list, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(nouns_list)} Swedish nouns to data/swedish_nouns.json")
    
    # Show some examples
    print("\nExample nouns:")
    for i, noun in enumerate(sorted(nouns_list)[:20]):
        print(f"  {noun}")
    
    print(f"\nTotal: {len(nouns_list)} Swedish nouns available for secret word selection")

if __name__ == "__main__":
    main()
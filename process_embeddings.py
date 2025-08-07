#!/usr/bin/env python3
import json
import sys

def load_swedish_words(words_file):
    """Load Swedish words from frequency list"""
    words = set()
    with open(words_file, 'r', encoding='utf-8') as f:
        for line in f:
            parts = line.strip().split()
            if parts:
                word = parts[0].lower()
                # Only include words with Swedish characters and alphabetic
                if word and all(c.isalpha() or c in 'åäö' for c in word):
                    words.add(word)
    return words

def process_embeddings(embeddings_file, swedish_words, output_file):
    """Process embeddings file to extract only Swedish words"""
    embeddings = {}
    total_lines = 0
    processed = 0
    
    print("Processing embeddings...")
    
    with open(embeddings_file, 'r', encoding='utf-8', errors='ignore') as f:
        # Skip first line (header)
        header = next(f)
        print(f"Header: {header.strip()}")
        
        for line in f:
            total_lines += 1
            if total_lines % 100000 == 0:
                print(f"Processed {total_lines} lines, found {len(embeddings)} Swedish words")
            
            parts = line.strip().split(' ')
            if len(parts) != 301:  # Word + exactly 300 dimensions
                print(f"Warning: Line {total_lines + 1} has {len(parts)} parts, expected 301")
                continue
                
            original_word = parts[0]
            word = original_word.lower()
            
            if word in swedish_words:
                # Convert vector to list of floats - take exactly 300 dimensions
                try:
                    vector = [float(x) for x in parts[1:301]]
                    if len(vector) == 300:
                        # Only use if this is the first (or exact case match) we see for this word
                        if word not in embeddings or original_word.islower():
                            embeddings[word] = vector
                            processed += 1
                            if processed <= 5:  # Debug first few
                                print(f"Added {word} (from {original_word}): first 3 values = {vector[:3]}")
                        else:
                            print(f"Skipping {original_word} -> {word} (already have lowercase version)")
                    else:
                        print(f"Warning: {word} vector has {len(vector)} dimensions")
                except ValueError as e:
                    print(f"Warning: Could not parse vector for {word}: {e}")
                    continue
    
    print(f"Found embeddings for {len(embeddings)} Swedish words")
    
    # Save as JSON
    print("Saving to JSON...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(embeddings, f, separators=(',', ':'))
    
    print(f"Saved {len(embeddings)} embeddings to {output_file}")
    return len(embeddings)

if __name__ == "__main__":
    words_file = "data/swedish_words.txt"
    embeddings_file = "data/cc.sv.300.vec"
    output_file = "data/swedish_embeddings.json"
    
    print("Loading Swedish words...")
    swedish_words = load_swedish_words(words_file)
    print(f"Loaded {len(swedish_words)} Swedish words")
    
    embeddings_count = process_embeddings(embeddings_file, swedish_words, output_file)
    
    print("Processing complete!")
    print(f"Swedish words: {len(swedish_words)}")
    print(f"Embeddings found: {embeddings_count}")
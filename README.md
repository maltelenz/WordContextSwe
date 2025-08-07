# Ordjakt - Swedish Word Guessing Game

A semantic word guessing game where players try to discover a secret Swedish word by making guesses and receiving similarity-based feedback.

## How to Play

1. **Goal**: Guess the secret Swedish word
2. **Feedback**: Each guess receives a rank from 1 to 50,000
   - **Rank 1** = Correct answer! 🎉
   - **Lower ranks** = Semantically closer to the secret word
   - **Higher ranks** = More distant from the secret word
3. **Strategy**: Use the ranking feedback to guide your next guesses toward words with similar meanings

## Features

- **50,000 Swedish words** from frequency-based word lists
- **Semantic similarity scoring** using FastText embeddings trained on Common Crawl and Wikipedia
- **Real-time feedback** with color-coded results and highlighted recent guesses
- **Fully offline** - no internet required after initial load
- **Responsive design** - works on desktop and mobile
- **Swedish interface** - fully localized UI

## Getting Started

### Quick Start
1. Open `index.html` in a modern web browser
2. Wait for the word database and language model to load (~104MB)
3. Start guessing Swedish words!

### Development Server
For best results, serve the files through a local HTTP server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## Technical Details

### Architecture
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Word Data**: 50,000 most common Swedish words (610KB)
- **Embeddings**: Pre-processed FastText vectors (104MB JSON)
- **Similarity**: Cosine similarity with rank-based scoring

### Data Sources
- **Word Frequency**: [OpenSubtitles Swedish corpus](https://github.com/hermitdave/FrequencyWords)
- **Embeddings**: [FastText Swedish vectors](https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.sv.300.vec.gz)

## Development

### Data Processing
The `process_embeddings.py` script converts the raw FastText vectors into a optimized JSON format:

```bash
python3 process_embeddings.py
```

This filters the 2M+ word embeddings down to only the 50K Swedish words in our vocabulary.

## License

- **Code**: MIT License
- **Swedish word data**: CC-BY-SA 4.0 (OpenSubtitles corpus)
- **FastText embeddings**: CC-BY-SA 3.0

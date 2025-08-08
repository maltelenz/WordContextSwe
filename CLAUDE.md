# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ordjakt is a Swedish word guessing game where players guess Swedish words and receive semantic similarity feedback based on FastText embeddings. The goal is to find a secret word using ranking feedback (1-50,000) where lower ranks indicate higher semantic similarity.

## Architecture

### Core Components

- **Frontend**: Single-page vanilla JavaScript application with three main views (loading, game, victory)
- **Game Engine**: `SwedishWordGame` class in `game.js` handles all game logic, similarity calculations, and UI updates
- **Data Loading**: Asynchronous loading of word lists, embeddings, and noun selections with progress tracking
- **Similarity Engine**: Cosine similarity calculation using pre-processed FastText embeddings

### Data Pipeline

The game uses a multi-stage data processing pipeline:

1. **Raw Data**: Swedish word frequency list (50K words) and FastText embeddings (2M+ words)
2. **Processing Scripts**: Python scripts filter and optimize data for web delivery
3. **Game Data**: Compressed JSON files served to the browser

### Key Files

- `game.js` - Main game logic and UI management
- `index.html` - Single HTML file with embedded structure
- `style.css` - Responsive CSS with color-coded similarity feedback
- `data/swedish_embeddings_ultra.json` - Ultra-compressed embeddings (integers scaled by 100)
- `data/swedish_top_1000_nouns.json` - Curated noun list for secret word selection

## Data Processing

### Embedding Processing
```bash
python3 process_embeddings.py
```
Converts raw FastText vectors to optimized JSON format, filtering to only Swedish vocabulary words and converting floats to scaled integers for size reduction (65% compression).

### Noun List Generation
```bash
python3 create_top_1000_nouns.py
```
Selects the 1000 most frequent Swedish nouns from the word frequency list for use as secret words.

## Development

### Local Development
Serve files via HTTP server due to CORS restrictions on local file access:
```bash
python3 -m http.server 8000
# or
npx serve .
```

### Data Requirements
- `data/swedish_words.txt` - Word frequency list (50K Swedish words)
- `data/cc.sv.300.vec` - Raw FastText embeddings (download separately)
- Generated files are created by processing scripts and committed to repo

### Game Logic Details

- **Secret Word Selection**: Random selection from top 1000 Swedish nouns that have embeddings
- **Similarity Calculation**: Cosine similarity converted to distance score (0-1 range)
- **Ranking System**: Pre-calculated similarity rankings for all vocabulary words against secret word
- **Color Coding**: HSL color mapping from green (close) to aggressive red (distant) based on absolute score ranges
- **Victory Condition**: Exact word match displays 10 closest semantic neighbors

## File Structure

- Root files: Core web application (HTML, CSS, JS)
- `data/` - All game data and processing outputs
- Python scripts: Data processing and optimization tools

## Deployment

Static web application suitable for GitHub Pages or any static hosting. No server-side processing required after initial data preparation.
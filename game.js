class SwedishWordGame {
    constructor() {
        this.words = [];
        this.nouns = [];
        this.embeddings = new Map();
        this.secretWord = '';
        this.guesses = [];
        this.gameWon = false;
        this.lastGuessWord = null;
        this.wordSimilarities = null;
        this.hintsGiven = [];
        this.isRandomMode = false;
        
        this.loadingEl = document.getElementById('loading');
        this.gameEl = document.getElementById('game');
        this.victoryEl = document.getElementById('victory');
        this.wordInput = document.getElementById('wordInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.guessesList = document.getElementById('guessesList');
        this.guessCount = document.getElementById('guessCount');
        this.progressEl = document.getElementById('progress');
        this.messageArea = document.getElementById('messageArea');
        this.hintBtn = document.getElementById('hintBtn');
        this.hintsArea = document.getElementById('hintsArea');
        this.gameModeEl = document.getElementById('gameMode');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.startNewGame(false); // Start with daily word
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Kunde inte ladda spelet. Försök igen senare.');
        }
    }
    
    async loadData() {
        this.updateProgress(10, 'Laddar ordlista...');
        await this.loadWords();
        
        this.updateProgress(30, 'Laddar ordlista...');
        await this.loadNouns();
        
        this.updateProgress(60, 'Laddar språkmodell...');
        await this.loadEmbeddings();
        
        this.updateProgress(100, 'Klar!');
        
        setTimeout(() => {
            this.loadingEl.style.display = 'none';
            this.gameEl.style.display = 'block';
        }, 500);
    }
    
    async loadWords() {
        try {
            const response = await fetch('data/swedish_words.txt');
            const text = await response.text();
            
            this.words = text.trim().split('\n').map(line => {
                const parts = line.split(' ');
                return parts[0].toLowerCase();
            }).filter(word => word && /^[a-zåäö]+$/i.test(word));
            
            console.log(`Loaded ${this.words.length} Swedish words`);
        } catch (error) {
            console.error('Failed to load words:', error);
            throw error;
        }
    }
    
    async loadNouns() {
        try {
            const response = await fetch('data/swedish_top_1000_nouns.json');
            const nouns = await response.json();
            
            this.nouns = nouns.filter(noun => noun && /^[a-zåäö]+$/i.test(noun));
            
            console.log(`Loaded ${this.nouns.length} top Swedish nouns`);
        } catch (error) {
            console.error('Failed to load nouns:', error);
            throw error;
        }
    }
    
    async loadEmbeddings() {
        try {
            const response = await fetch('data/swedish_embeddings_ultra.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            this.updateProgress(70, 'Laddar språkmodell...');
            const embeddings = await response.json();
            
            this.updateProgress(90, 'Bearbetar språkmodell...');
            
            // Convert to Map and convert integers back to floats
            for (const [word, intVector] of Object.entries(embeddings)) {
                // Convert integer array back to float array (divide by 100)
                const floatVector = intVector.map(v => v / 100.0);
                this.embeddings.set(word, floatVector);
            }
            
            console.log(`Loaded embeddings for ${this.embeddings.size} words`);
        } catch (error) {
            console.error('Failed to load embeddings:', error);
            throw error;
        }
    }
    
    updateProgress(percent, message) {
        this.progressEl.style.width = percent + '%';
        this.loadingEl.querySelector('p').textContent = message;
    }
    
    startNewGame(useRandom = false) {
        // Select from filtered word list
        const availableWords = this.nouns.filter(word => this.embeddings.has(word));
        
        this.isRandomMode = useRandom;
        
        if (useRandom) {
            // Random word for replay
            this.secretWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        } else {
            // Daily/hourly word using current date and hour as seed
            this.secretWord = this.getDailyWord(availableWords);
        }
        
        this.guesses = [];
        this.gameWon = false;
        this.lastGuessWord = null;
        this.hintsGiven = [];
        
        // Pre-calculate similarities for ranking
        this.calculateWordSimilarities();
        
        console.log('Secret word:', this.secretWord);
        
        this.updateDisplay();
        this.gameEl.style.display = 'block';
        this.victoryEl.style.display = 'none';
        this.wordInput.value = '';
        this.wordInput.focus();
        this.hideMessage();
        this.hintBtn.style.display = 'none';
        this.hintsArea.style.display = 'none';
        this.hintsArea.innerHTML = '';
        
        // Update game mode display
        this.gameModeEl.textContent = this.isRandomMode ? 'Slumpord' : 'Timmens ord';
    }
    
    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.makeGuess());
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame(true)); // Use random mode for new games
        this.hintBtn.addEventListener('click', () => this.giveHint());
    }
    
    makeGuess() {
        const word = this.wordInput.value.trim().toLowerCase();
        
        if (!word) return;
        if (this.gameWon) return;
        if (this.guesses.some(g => g.word === word)) {
            this.showMessage('Du har redan gissat det ordet!', 'error');
            this.wordInput.value = '';
            return;
        }
        
        if (!this.embeddings.has(word)) {
            this.showMessage('Ordet finns inte i ordlistan. Försök med ett annat ord.', 'error');
            this.wordInput.value = '';
            return;
        }
        
        // Hide any previous messages (error or guess)
        this.hideMessage();
        
        if (word === this.secretWord) {
            this.gameWon = true;
            this.showVictory();
            return;
        }
        
        const rawScore = this.calculateSimilarity(word, this.secretWord);
        const rank = this.getRankFromSimilarity(rawScore, word);
        this.guesses.push({ word, score: rawScore, rank });
        this.guesses.sort((a, b) => a.score - b.score);
        this.lastGuessWord = word;
        
        // Show the guess in the message area
        this.showGuessMessage(word, rank);
        
        this.wordInput.value = '';
        this.updateDisplay();
        
        // Show hint button after first guess
        if (this.guesses.length === 1) {
            this.hintBtn.style.display = 'inline-block';
        }
    }
    
    calculateSimilarity(word1, word2) {
        const vec1 = this.embeddings.get(word1);
        const vec2 = this.embeddings.get(word2);
        
        if (!vec1 || !vec2) return 1.0;
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }
        
        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return Math.max(0, (1 - similarity) / 2);
    }
    
    updateDisplay() {
        // Count only actual guesses, not hints
        const actualGuesses = this.guesses.filter(g => !g.isHint);
        this.guessCount.textContent = actualGuesses.length;
        
        if (this.guesses.length === 0) {
            this.guessesList.innerHTML = '<p class="no-guesses">Inga gissningar ännu</p>';
            return;
        }
        
        const guessesHTML = this.guesses.map((guess, index) => {
            const scoreColor = this.getScoreColor(guess.score);
            const isLastGuess = guess.word === this.lastGuessWord;
            const highlightClass = isLastGuess ? ' last-guess' : '';
            const isHint = guess.isHint;
            const hintBorder = isHint ? 'border: 2px solid #4CAF50;' : '';
            const wordDisplay = isHint ? `💡 ${guess.word}` : guess.word;
            const rankDisplay = isHint ? 'Ledtråd' : '';
            
            return `
                <div class="guess-item${highlightClass}" style="background-color: ${scoreColor}; ${hintBorder}">
                    <span class="guess-word">${wordDisplay}</span>
                    <span class="guess-score">${guess.rank}</span>
                    <span class="guess-rank">${rankDisplay}</span>
                </div>
            `;
        }).join('');
        
        this.guessesList.innerHTML = guessesHTML;
    }
    
    getScoreColor(score) {
        // Absolute color scheme: green (correct) to red (worst possible)
        // Use the full theoretical range of similarity scores
        
        if (!this.wordSimilarities || this.wordSimilarities.length === 0) {
            // Fallback to simple normalization if no similarities calculated
            const normalizedScore = Math.min(1, Math.max(0, score));
            const hue = Math.max(0, (1 - normalizedScore) * 120);
            return `hsl(${hue}, 70%, 85%)`;
        }
        
        // Find the theoretical worst possible score (furthest word from secret)
        const allScores = this.wordSimilarities.map(w => w.similarity);
        const bestPossible = 0; // Secret word itself
        const worstPossible = Math.max(...allScores);
        
        // Normalize score within the full theoretical range
        const normalizedScore = worstPossible > bestPossible 
            ? (score - bestPossible) / (worstPossible - bestPossible)
            : 0;
        
        // Linear mapping to hue: 120 (green) to 0 (red)
        const hue = Math.max(0, (1 - normalizedScore) * 120);
        
        // Vary saturation and lightness for better visual distinction
        // More aggressive red coloring for bad scores
        let saturation, lightness;
        
        if (normalizedScore < 0.1) {
            // Excellent scores: bright green with high saturation
            saturation = 85;
            lightness = 80;
        } else if (normalizedScore < 0.3) {
            // Good scores: green/yellow-green
            saturation = 80;
            lightness = 85;
        } else if (normalizedScore < 0.6) {
            // Medium scores: yellow/orange
            saturation = 75;
            lightness = 87;
        } else if (normalizedScore < 0.8) {
            // Poor scores: orange/red-orange - start getting more intense
            saturation = 80;
            lightness = 85;
        } else {
            // Very poor scores: aggressive red with high saturation and lower lightness
            saturation = 90;
            lightness = 75;
        }
        
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    showVictory() {
        document.getElementById('secretWordDisplay').textContent = this.secretWord;
        document.getElementById('finalGuessCount').textContent = this.guesses.length;
        
        // Show the 10 closest words
        this.showClosestWords();
        
        this.gameEl.style.display = 'none';
        this.victoryEl.style.display = 'block';
    }
    
    showClosestWords() {
        if (!this.wordSimilarities || this.wordSimilarities.length === 0) return;
        
        // Get the 10 most similar words (excluding the secret word itself)
        const closestWords = this.wordSimilarities.slice(0, 10);
        
        const closestWordsEl = document.getElementById('closestWords');
        if (closestWordsEl) {
            const wordsHTML = closestWords.map((wordData, index) => {
                const rank = this.getRankFromSimilarity(wordData.similarity, wordData.word);
                const scoreColor = this.getScoreColor(wordData.similarity);
                return `
                    <div class="guess-item" style="background-color: ${scoreColor}; margin: 2px 0;">
                        <span class="guess-word">${wordData.word}</span>
                        <span class="guess-score">${rank}</span>
                    </div>
                `;
            }).join('');
            
            closestWordsEl.innerHTML = `
                <h3>De 10 närmaste orden:</h3>
                ${wordsHTML}
            `;
        }
    }
    
    showMessage(message, type = 'error') {
        this.messageArea.textContent = message;
        this.messageArea.className = `message-area ${type}`;
        this.messageArea.style.display = 'block';
        
        // No auto-hide - messages persist until next guess attempt
    }
    
    hideMessage() {
        this.messageArea.style.display = 'none';
        this.messageArea.className = 'message-area';
    }
    
    calculateWordSimilarities() {
        if (!this.secretWord || !this.embeddings.has(this.secretWord)) return;
        
        this.wordSimilarities = [];
        const secretVec = this.embeddings.get(this.secretWord);
        
        for (const word of this.embeddings.keys()) {
            if (word !== this.secretWord) {
                const similarity = this.calculateSimilarity(word, this.secretWord);
                this.wordSimilarities.push({ word, similarity });
            }
        }
        
        // Sort by similarity (lower = more similar)
        this.wordSimilarities.sort((a, b) => a.similarity - b.similarity);
    }
    
    getRankFromSimilarity(similarity, word) {
        if (word === this.secretWord) return 1;
        
        if (!this.wordSimilarities) return 50000;
        
        // Find where this word would rank
        let rank = 1; // Start at 1 (secret word is rank 1)
        for (const wordSim of this.wordSimilarities) {
            rank++;
            if (Math.abs(wordSim.similarity - similarity) < 0.0001) {
                return rank;
            }
        }
        
        return Math.min(rank, 50000);
    }
    
    showGuessMessage(word, rank) {
        const rawScore = this.guesses.find(g => g.word === word)?.score || 0;
        const scoreColor = this.getScoreColor(rawScore);
        const guessRank = this.guesses.findIndex(g => g.word === word) + 1;
        
        this.messageArea.innerHTML = `
            <div class="guess-item" style="background-color: ${scoreColor}; margin: 0; border: none;">
                <span class="guess-word">${word}</span>
                <span class="guess-score">${rank}</span>
                <span class="guess-rank">#${guessRank}</span>
            </div>
        `;
        this.messageArea.className = 'message-area success';
        this.messageArea.style.display = 'block';
        
        // No auto-hide for guess messages - they persist until next guess
    }
    
    getDailyWord(availableWords) {
        // Create a seed based on current date and hour
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // getMonth() returns 0-11
        const day = now.getDate();
        const hour = now.getHours();
        
        // Create a simple hash from the date/hour
        const seedString = `${year}-${month}-${day}-${hour}`;
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use the hash as seed for word selection
        const index = Math.abs(hash) % availableWords.length;
        
        console.log(`Daily word seed: ${seedString}, hash: ${hash}, index: ${index}`);
        
        return availableWords[index];
    }
    
    giveHint() {
        if (this.guesses.length === 0 || this.gameWon) return;
        
        const bestGuess = this.guesses[0];
        const bestRank = bestGuess.rank;
        
        // Find a word that ranks roughly halfway between best guess and secret word
        const targetRank = Math.ceil(bestRank / 2);
        
        console.log(`Looking for hint around rank ${targetRank} (between best rank ${bestRank} and secret rank 1)`);
        
        // Since wordSimilarities is already sorted by similarity (rank order),
        // we can directly access the word around the target rank position
        const targetIndex = Math.min(targetRank - 2, this.wordSimilarities.length - 1); // -2 because ranks start at 1, array at 0, and secret word is rank 1
        
        // Look around the target index for an unused word
        let bestCandidate = null;
        const searchRadius = 50; // Look within 50 positions of target
        
        for (let offset = 0; offset < searchRadius && offset < this.wordSimilarities.length; offset++) {
            // Check both directions from target
            for (const direction of [-1, 1]) {
                const checkIndex = targetIndex + (direction * offset);
                if (checkIndex < 0 || checkIndex >= this.wordSimilarities.length) continue;
                
                const wordData = this.wordSimilarities[checkIndex];
                const word = wordData.word;
                
                // Skip if already guessed or given as hint
                if (this.guesses.some(g => g.word === word) || 
                    this.hintsGiven.includes(word)) {
                    continue;
                }
                
                // Found a good candidate
                const rank = checkIndex + 2; // +2 because secret is rank 1, and array starts at 0
                bestCandidate = { word, rank };
                break;
            }
            if (bestCandidate) break;
        }
        
        if (bestCandidate) {
            console.log(`Selected hint: "${bestCandidate.word}" with rank ${bestCandidate.rank}`);
            this.hintsGiven.push(bestCandidate.word);
            this.showHint(bestCandidate.word);
        } else {
            console.log('No suitable hint found');
        }
    }
    
    showHint(hintWord) {
        const similarity = this.calculateSimilarity(hintWord, this.secretWord);
        const rank = this.getRankFromSimilarity(similarity, hintWord);
        
        // Add hint to guesses array so it appears in ranked order
        this.guesses.push({ 
            word: hintWord, 
            score: similarity, 
            rank: rank,
            isHint: true 
        });
        
        // Re-sort guesses by score to maintain ranking
        this.guesses.sort((a, b) => a.score - b.score);
        
        // Update the display to show hints in their proper ranked position
        this.updateDisplay();
    }
    
    showError(message) {
        this.loadingEl.innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

window.addEventListener('load', () => {
    new SwedishWordGame();
});
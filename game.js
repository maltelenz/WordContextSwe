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
        
        this.loadingEl = document.getElementById('loading');
        this.gameEl = document.getElementById('game');
        this.victoryEl = document.getElementById('victory');
        this.wordInput = document.getElementById('wordInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.guessesList = document.getElementById('guessesList');
        this.guessCount = document.getElementById('guessCount');
        this.bestScore = document.getElementById('bestScore');
        this.progressEl = document.getElementById('progress');
        this.messageArea = document.getElementById('messageArea');
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.startNewGame();
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
            const response = await fetch('data/swedish_nouns.json');
            const nouns = await response.json();
            
            this.nouns = nouns.filter(noun => noun && /^[a-zåäö]+$/i.test(noun));
            
            console.log(`Loaded ${this.nouns.length} Swedish nouns`);
        } catch (error) {
            console.error('Failed to load nouns:', error);
            throw error;
        }
    }
    
    async loadEmbeddings() {
        try {
            const response = await fetch('data/swedish_embeddings.json');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            this.updateProgress(70, 'Laddar språkmodell...');
            const embeddings = await response.json();
            
            this.updateProgress(90, 'Bearbetar språkmodell...');
            
            // Convert to Map
            for (const [word, vector] of Object.entries(embeddings)) {
                this.embeddings.set(word, vector);
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
    
    startNewGame() {
        // Select from filtered word list
        const availableWords = this.nouns.filter(word => this.embeddings.has(word));
        this.secretWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        this.guesses = [];
        this.gameWon = false;
        this.lastGuessWord = null;
        
        // Pre-calculate similarities for ranking
        this.calculateWordSimilarities();
        
        console.log('Secret word:', this.secretWord);
        
        this.updateDisplay();
        this.gameEl.style.display = 'block';
        this.victoryEl.style.display = 'none';
        this.wordInput.value = '';
        this.wordInput.focus();
        this.hideMessage();
    }
    
    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.makeGuess());
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.makeGuess();
        });
        
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
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
        this.guessCount.textContent = this.guesses.length;
        this.bestScore.textContent = this.guesses.length > 0 ? 
            this.guesses[0].rank : '-';
        
        if (this.guesses.length === 0) {
            this.guessesList.innerHTML = '<p class="no-guesses">Inga gissningar ännu</p>';
            return;
        }
        
        const guessesHTML = this.guesses.map((guess, index) => {
            const scoreColor = this.getScoreColor(guess.score);
            const isLastGuess = guess.word === this.lastGuessWord;
            const highlightClass = isLastGuess ? ' last-guess' : '';
            return `
                <div class="guess-item${highlightClass}" style="background-color: ${scoreColor}">
                    <span class="guess-word">${guess.word}</span>
                    <span class="guess-score">${guess.rank}</span>
                    <span class="guess-rank">#${index + 1}</span>
                </div>
            `;
        }).join('');
        
        this.guessesList.innerHTML = guessesHTML;
    }
    
    getScoreColor(score) {
        const hue = Math.max(0, (1 - score * 4) * 120);
        return `hsl(${hue}, 70%, 90%)`;
    }
    
    showVictory() {
        document.getElementById('secretWordDisplay').textContent = this.secretWord;
        document.getElementById('finalGuessCount').textContent = this.guesses.length;
        this.gameEl.style.display = 'none';
        this.victoryEl.style.display = 'block';
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
    
    showError(message) {
        this.loadingEl.innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

window.addEventListener('load', () => {
    new SwedishWordGame();
});
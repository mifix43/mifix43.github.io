// DOM Elements
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const tabButtons = document.querySelectorAll('.tab-button');
const subtitleBtn = document.getElementById('subtitleBtn');
const tabContents = document.querySelectorAll('.tab-content');
const gamesContainer = document.getElementById('games');
const moviesContainer = document.getElementById('movies');
const counterElement = document.getElementById('counter');
const controlsElement = document.getElementById('controls');
const moviesControlsElement = document.getElementById('movies-controls');
const sortBtn = document.getElementById('sortBtn');
const moviesSortBtn = document.getElementById('movies-sortBtn');

let gamesData = [];
let moviesData = [];
let gamesSortOrder = null;
let moviesSortOrder = null;
let currentItem = null;
let currentItemType = null;
let reviews = {};
let currentTab = 'games';

// Escape any string before it is inserted into innerHTML, to prevent XSS
// if game/movie names or other fields ever contain HTML-special characters.
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Only allow http/https URLs to be used as href/src, to avoid javascript: URIs
// or other unsafe schemes sneaking in through data files.
function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // invalid URL
    }
    return '';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    loadGames();
    loadMovies();
    setupTabButtons();
    setupSubtitleButton();
    setupModalClose();
});

// Subtitle button functionality (cycles through tabs)
function setupSubtitleButton() {
    subtitleBtn.addEventListener('click', () => {
        currentTab = currentTab === 'games' ? 'movies' : 'games';
        switchTab(currentTab);
    });
}

// Tab functionality
function setupTabButtons() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            currentTab = tabName;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Update buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Update header subtitle and counter
    if (tabName === 'games') {
        subtitleBtn.textContent = 'Мой личный рейтинг игр';
        updateCounter(gamesData.length);
    } else {
        subtitleBtn.textContent = 'Мой личный рейтинг фильмов';
        updateCounter(moviesData.length);
    }
}

// Rating color
    if (rating >= 7.5) return 'green';
    if (rating >= 5) return 'yellow';
    return 'red';
}

// Games
function loadGames() {
    gamesContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 15px;">Загрузка игр...</p>
        </div>
    `;

    fetch('games.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load games.json');
            return response.json();
        })
        .then(games => {
            gamesData = normalizeItems(games);
            updateCounter(gamesData.length);
            renderGames(gamesData);
            controlsElement.style.display = 'flex';
            sortBtn.addEventListener('click', () => toggleSort('games'));
        })
        .catch(error => {
            console.error(error);
            gamesContainer.innerHTML = `
                <div class="empty">
                    Не удалось загрузить список игр. 🎮
                </div>
            `;
        });
}

// Validate/normalize raw JSON data so a malformed games.json/movies.json
// can't crash rendering or inject unexpected values.
function normalizeItems(items) {
    if (!Array.isArray(items)) return [];
    return items
        .filter(item => item && typeof item === 'object' && typeof item.name === 'string')
        .map(item => ({
            name: item.name,
            rating: typeof item.rating === 'number' && isFinite(item.rating) ? item.rating : 0,
            steam: typeof item.steam === 'string' ? item.steam : '',
            image: typeof item.image === 'string' ? item.image : ''
        }));
}

function renderGames(games) {
    if (!games.length) {
        gamesContainer.innerHTML = `
            <div class="empty">
                Пока игр нет 🎮
            </div>
        `;
        return;
    }

    gamesContainer.innerHTML = games.map((game, index) => {
        const safeImage = sanitizeUrl(game.image);
        const safeSteam = sanitizeUrl(game.steam);
        return `
            <article class="game" data-index="${index}">
                <div class="game-info">
                    ${safeImage ? `
                        <img class="game-image" src="${safeImage}" alt="${escapeHtml(game.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'game-image'}))">
                    ` : `
                        <div class="game-image"></div>
                    `}
                    <div>
                        <div class="game-name">${escapeHtml(game.name)}</div>
                        ${safeSteam ? `
                            <a class="steam" href="${safeSteam}" target="_blank" rel="noopener noreferrer">
                                Открыть в Steam ↗
                            </a>
                        ` : ''}
                    </div>
                </div>
                
                </div>
            </article>
        `;
    }).join('');

    gamesContainer.querySelectorAll('.game').forEach(el => {
        el.addEventListener('click', () => {
            const idx = Number(el.getAttribute('data-index'));
            openReview(games[idx].name, 'game');
        });
    });

    gamesContainer.querySelectorAll('.steam').forEach(el => {
        el.addEventListener('click', (e) => e.stopPropagation());
    });
}

function toggleSort(type) {
    if (type === 'games') {
        if (gamesSortOrder === 'desc') {
            gamesSortOrder = 'asc';
            const sorted = [...gamesData].sort((a, b) => a.rating - b.rating);
            sortBtn.textContent = 'Сортировка: по рейтингу ⬆️';
            renderGames(sorted);
        } else {
            gamesSortOrder = 'desc';
            const sorted = [...gamesData].sort((a, b) => b.rating - a.rating);
            sortBtn.textContent = 'Сортировка: по рейтингу ⬇️';
            renderGames(sorted);
        }
    } else {
        if (moviesSortOrder === 'desc') {
            moviesSortOrder = 'asc';
            const sorted = [...moviesData].sort((a, b) => a.rating - b.rating);
            moviesSortBtn.textContent = 'Сортировка: по рейтингу ⬆️';
            renderMovies(sorted);
        } else {
            moviesSortOrder = 'desc';
            const sorted = [...moviesData].sort((a, b) => b.rating - a.rating);
            moviesSortBtn.textContent = 'Сортировка: по рейтингу ⬇️';
            renderMovies(sorted);
        }
    }
}

// Movies
function loadMovies() {
    moviesContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p style="margin-top: 15px;">Загрузка фильмов...</p>
        </div>
    `;

    fetch('movies.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load movies.json');
            return response.json();
        })
        .then(movies => {
            moviesData = normalizeItems(movies);
            renderMovies(moviesData);
            moviesControlsElement.style.display = 'flex';
            moviesSortBtn.addEventListener('click', () => toggleSort('movies'));
        })
        .catch(error => {
            console.error(error);
            moviesContainer.innerHTML = `
                <div class="empty">
                    Пока фильмов нет 🎬
                </div>
            `;
        });
}

function renderMovies(movies) {
    if (!movies.length) {
        moviesContainer.innerHTML = `
            <div class="empty">
                Пока фильмов нет 🎬
            </div>
        `;
        return;
    }

    moviesContainer.innerHTML = movies.map((movie, index) => {
        const safeImage = sanitizeUrl(movie.image);
        return `
            <article class="movie" data-index="${index}">
                <div class="movie-info">
                    ${safeImage ? `
                        <img class="movie-image" src="${safeImage}" alt="${escapeHtml(movie.name)}" onerror="this.replaceWith(Object.assign(document.createElement('div'), {className: 'movie-image'}))">
                    ` : `
                        <div class="movie-image"></div>
                    `}
                    <div>
                        <div class="movie-name">${escapeHtml(movie.name)}</div>
                    </div>
                </div>
                
                </div>
            </article>
        `;
    }).join('');

    moviesContainer.querySelectorAll('.movie').forEach(el => {
        el.addEventListener('click', () => {
            const idx = Number(el.getAttribute('data-index'));
            openReview(movies[idx].name, 'movie');
        });
    });
}

// Modal & Reviews
function openReview(itemName, type) {
    currentItem = itemName;
    currentItemType = type;
    
    const reviewKey = `${type}_${itemName}`;
    const review = reviews[reviewKey] || {
        graphics: 0,
        story: 0,
        music: 0,
        gameplay: 0,
        overall: 0,
        hours: 0,
        recommendation: null
    } else if (review.recommendation === 'not-recommend') {
        notRecommendBtn.classList.add('not-recommended');
    }
    
    recommendBtn.onclick = () => setRecommendation('recommend');
    notRecommendBtn.onclick = () => setRecommendation('not-recommend');
    
    modal.classList.add('open');
}

    const element = document.getElementById(elementId);
    const starsContainer = element.querySelector('.stars');
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {;
        starsContainer.appendChild(star);
    }
    
    if (valueSpan) valueSpan.remove();
    
    if (rating > 0) {
        const valueSpan = document.createElement('span');
        valueSpan.textContent = `${rating}/5`;
        element.appendChild(valueSpan);
    }
}

    const categoryMap = {
        'graphicsRating': 'graphics',
        'storyRating': 'story',
        'musicRating': 'music',
        'gameplayRating': 'gameplay',
        'overallRating': 'overall'
    };
    
    const category = categoryMap[elementId];
    const reviewKey = `${currentItemType}_${currentItem}`;
    
    if (!reviews[reviewKey]) {
        reviews[reviewKey] = {
            graphics: 0,
            story: 0,
            music: 0,
            gameplay: 0,
            overall: 0,
            hours: 0,
            recommendation: null
        };
    }
    
    reviews[reviewKey][category] = rating;
    saveReviews();
}

function setRecommendation(type) {
    const reviewKey = `${currentItemType}_${currentItem}`;
    
    if (!reviews[reviewKey]) {
        reviews[reviewKey] = {
            graphics: 0,
            story: 0,
            music: 0,
            gameplay: 0,
            overall: 0,
            hours: 0,
            recommendation: null
        };
    }
    
    if (reviews[reviewKey].recommendation === type) {
        reviews[reviewKey].recommendation = null;
    } else {
        reviews[reviewKey].recommendation = type;
    }
    
    saveReviews();
    
    const recommendBtn = document.getElementById('recommendBtn');
    const notRecommendBtn = document.getElementById('notRecommendBtn');
    
    recommendBtn.classList.remove('recommended');
    notRecommendBtn.classList.remove('not-recommended');
    
    if (reviews[reviewKey].recommendation === 'recommend') {
        recommendBtn.classList.add('recommended');
    } else if (reviews[reviewKey].recommendation === 'not-recommend') {
        notRecommendBtn.classList.add('not-recommended');
    }
}

function setupModalClose() {
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    modal.classList.remove('open');
}

// Storage
function saveReviews() {
    localStorage.setItem('reviews', JSON.stringify(reviews));
}

function loadReviews() {
    const stored = localStorage.getItem('reviews');
    if (!stored) {
        reviews = {};
        return;
    }
    try {
        const parsed = JSON.parse(stored);
        reviews = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        console.error('Corrupted reviews data in localStorage, resetting.', e);
        reviews = {};
    }
}

function updateCounter(count) {
    const plural = count % 10 === 1 && count % 100 !== 11 ? 'игра' : 'игр';
    counterElement.textContent = `${count} ${plural}`;
}


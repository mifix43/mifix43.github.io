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
function getRatingColor(rating) {
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
            gamesData = games;
            updateCounter(games.length);
            renderGames(games);
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

function renderGames(games) {
    if (!games.length) {
        gamesContainer.innerHTML = `
            <div class="empty">
                Пока игр нет 🎮
            </div>
        `;
        return;
    }

    gamesContainer.innerHTML = games.map(game => {
        const ratingColor = getRatingColor(game.rating);
        return `
            <article class="game" onclick="openReview(this, '${game.name}', 'game')">
                <div class="game-info">
                    ${game.image ? `
                        <img class="game-image" src="${game.image}" alt="${game.name}">
                    ` : `
                        <div class="game-image"></div>
                    `}
                    <div>
                        <div class="game-name">${game.name}</div>
                        ${game.steam ? `
                            <a class="steam" href="${game.steam}" target="_blank" rel="noopener" onclick="event.stopPropagation();">
                                Открыть в Steam ↗
                            </a>
                        ` : ''}
                    </div>
                </div>
                <div class="rating ${ratingColor}">
                    ${game.rating}
                    <span>/10</span>
                </div>
            </article>
        `;
    }).join('');
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
            moviesData = movies;
            renderMovies(movies);
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

    moviesContainer.innerHTML = movies.map(movie => {
        const ratingColor = getRatingColor(movie.rating);
        return `
            <article class="movie" onclick="openReview(this, '${movie.name}', 'movie')">
                <div class="movie-info">
                    ${movie.image ? `
                        <img class="movie-image" src="${movie.image}" alt="${movie.name}">
                    ` : `
                        <div class="movie-image"></div>
                    `}
                    <div>
                        <div class="movie-name">${movie.name}</div>
                    </div>
                </div>
                <div class="rating ${ratingColor}">
                    ${movie.rating}
                    <span>/10</span>
                </div>
            </article>
        `;
    }).join('');
}

// Modal & Reviews
function openReview(element, itemName, type) {
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
    };

    modalTitle.textContent = itemName;
    
    // Render star ratings
    renderStarRating('graphicsRating', review.graphics);
    renderStarRating('storyRating', review.story);
    renderStarRating('musicRating', review.music);
    renderStarRating('gameplayRating', review.gameplay);
    renderStarRating('overallRating', review.overall);
    
    // Hours
    document.getElementById('hoursValue').textContent = review.hours;
    
    // Recommendation
    const recommendBtn = document.getElementById('recommendBtn');
    const notRecommendBtn = document.getElementById('notRecommendBtn');
    
    recommendBtn.classList.remove('recommended');
    notRecommendBtn.classList.remove('not-recommended');
    
    if (review.recommendation === 'recommend') {
        recommendBtn.classList.add('recommended');
    } else if (review.recommendation === 'not-recommend') {
        notRecommendBtn.classList.add('not-recommended');
    }
    
    recommendBtn.onclick = () => setRecommendation('recommend');
    notRecommendBtn.onclick = () => setRecommendation('not-recommend');
    
    modal.classList.add('open');
}

function renderStarRating(elementId, rating) {
    const element = document.getElementById(elementId);
    const starsContainer = element.querySelector('.stars');
    starsContainer.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i <= rating ? 'filled' : 'empty'}`;
        star.textContent = '★';
        star.onclick = (e) => {
            e.stopPropagation();
            setStarRating(elementId, i);
        };
        starsContainer.appendChild(star);
    }
    
    const valueSpan = element.querySelector('.rating-value');
    if (valueSpan) valueSpan.remove();
    
    if (rating > 0) {
        const valueSpan = document.createElement('span');
        valueSpan.className = 'rating-value';
        valueSpan.textContent = `${rating}/5`;
        element.appendChild(valueSpan);
    }
}

function setStarRating(elementId, rating) {
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
    renderStarRating(elementId, rating);
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
    reviews = stored ? JSON.parse(stored) : {};
}

function updateCounter(count) {
    const plural = count % 10 === 1 && count % 100 !== 11 ? 'игра' : 'игр';
    counterElement.textContent = `${count} ${plural}`;
}

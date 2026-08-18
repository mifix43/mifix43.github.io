// ================================
// MIFIX — Games & Movies
// ================================


// ================================
// DOM Elements
// ================================

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


// ================================
// Data
// ================================

let gamesData = [];
let moviesData = [];

let gamesSortOrder = null;
let moviesSortOrder = null;

let currentTab = 'games';


// ================================
// Security helpers
// ================================

function escapeHtml(str) {
    if (str === null || str === undefined) {
        return '';
    }

    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


function sanitizeUrl(url) {
    if (typeof url !== 'string') {
        return '';
    }

    try {
        const parsed = new URL(url, window.location.href);

        if (
            parsed.protocol === 'http:' ||
            parsed.protocol === 'https:'
        ) {
            return parsed.href;
        }
    } catch (error) {
        return '';
    }

    return '';
}


// ================================
// Initialization
// ================================

document.addEventListener('DOMContentLoaded', () => {
    loadGames();
    loadMovies();

    setupTabButtons();
    setupSubtitleButton();
    setupSortButtons();
});


// ================================
// Tabs
// ================================

function setupTabButtons() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            if (!tabName) {
                return;
            }

            switchTab(tabName);
        });
    });
}


function setupSubtitleButton() {
    if (!subtitleBtn) {
        return;
    }

    subtitleBtn.addEventListener('click', () => {
        const nextTab =
            currentTab === 'games'
                ? 'movies'
                : 'games';

        switchTab(nextTab);
    });
}


function switchTab(tabName) {
    currentTab = tabName;

    // Buttons
    tabButtons.forEach(button => {
        button.classList.remove('active');

        if (
            button.getAttribute('data-tab') === tabName
        ) {
            button.classList.add('active');
        }
    });


    // Content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });


    const activeContent =
        document.getElementById(`${tabName}-tab`);

    if (activeContent) {
        activeContent.classList.add('active');
    }


    // Header
    if (tabName === 'games') {
        if (subtitleBtn) {
            subtitleBtn.textContent =
                'Мой личный рейтинг игр';
        }

        updateCounter(
            gamesData.length,
            'game'
        );

    } else {
        if (subtitleBtn) {
            subtitleBtn.textContent =
                'Мой личный рейтинг фильмов';
        }

        updateCounter(
            moviesData.length,
            'movie'
        );
    }
}


// ================================
// Rating
// ================================

function getRatingColor(rating) {
    if (rating >= 7.5) {
        return 'green';
    }

    if (rating >= 5) {
        return 'yellow';
    }

    return 'red';
}


// ================================
// Data normalization
// ================================

function normalizeItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter(item => {
            return (
                item &&
                typeof item === 'object' &&
                typeof item.name === 'string'
            );
        })
        .map(item => {
            return {
                name: item.name,

                rating:
                    typeof item.rating === 'number' &&
                    Number.isFinite(item.rating)
                        ? item.rating
                        : 0,

                steam:
                    typeof item.steam === 'string'
                        ? item.steam
                        : '',

                image:
                    typeof item.image === 'string'
                        ? item.image
                        : '',

                description:
                    typeof item.description === 'string'
                        ? item.description
                        : ''
            };
        });
}


// ================================
// Games
// ================================

function loadGames() {
    gamesContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>

            <p style="margin-top: 15px;">
                Загрузка игр...
            </p>
        </div>
    `;


    fetch('games.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    'Не удалось загрузить games.json'
                );
            }

            return response.json();
        })

        .then(games => {
            gamesData = normalizeItems(games);

            updateCounter(
                gamesData.length,
                'game'
            );

            renderGames(gamesData);

            if (controlsElement) {
                controlsElement.style.display = 'flex';
            }
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


    gamesContainer.innerHTML = games
        .map(game => {
            const ratingColor =
                getRatingColor(game.rating);

            const safeImage =
                sanitizeUrl(game.image);

            const safeSteam =
                sanitizeUrl(game.steam);


            return `
                <article class="game">

                    <div class="game-info">

                        ${
                            safeImage
                                ? `
                                    <img
                                        class="game-image"
                                        src="${escapeHtml(safeImage)}"
                                        alt="${escapeHtml(game.name)}"
                                        onerror="
                                            this.replaceWith(
                                                Object.assign(
                                                    document.createElement('div'),
                                                    {
                                                        className: 'game-image'
                                                    }
                                                )
                                            )
                                        "
                                    >
                                `
                                : `
                                    <div class="game-image"></div>
                                `
                        }

                        <div>

                            <div class="game-name">
                                ${escapeHtml(game.name)}
                            </div>


                            ${
                                game.description
                                    ? `
                                        <div class="description">
                                            ${escapeHtml(game.description)}
                                        </div>
                                    `
                                    : ''
                            }


                            ${
                                safeSteam
                                    ? `
                                        <a
                                            class="steam"
                                            href="${escapeHtml(safeSteam)}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Открыть в Steam ↗
                                        </a>
                                    `
                                    : ''
                            }

                        </div>

                    </div>


                    <div class="rating ${ratingColor}">
                        ${escapeHtml(game.rating)}

                        <span>
                            /10
                        </span>
                    </div>

                </article>
            `;
        })
        .join('');


    // Prevent Steam link clicks from doing anything else.
    gamesContainer
        .querySelectorAll('.steam')
        .forEach(link => {
            link.addEventListener(
                'click',
                event => event.stopPropagation()
            );
        });
}


// ================================
// Movies
// ================================

function loadMovies() {
    moviesContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>

            <p style="margin-top: 15px;">
                Загрузка фильмов...
            </p>
        </div>
    `;


    fetch('movies.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    'Не удалось загрузить movies.json'
                );
            }

            return response.json();
        })

        .then(movies => {
            moviesData = normalizeItems(movies);

            renderMovies(moviesData);

            if (moviesControlsElement) {
                moviesControlsElement.style.display = 'flex';
            }
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


    moviesContainer.innerHTML = movies
        .map(movie => {
            const ratingColor =
                getRatingColor(movie.rating);

            const safeImage =
                sanitizeUrl(movie.image);


            return `
                <article class="movie">

                    <div class="movie-info">

                        ${
                            safeImage
                                ? `
                                    <img
                                        class="movie-image"
                                        src="${escapeHtml(safeImage)}"
                                        alt="${escapeHtml(movie.name)}"
                                        onerror="
                                            this.replaceWith(
                                                Object.assign(
                                                    document.createElement('div'),
                                                    {
                                                        className: 'movie-image'
                                                    }
                                                )
                                            )
                                        "
                                    >
                                `
                                : `
                                    <div class="movie-image"></div>
                                `
                        }

                        <div>

                            <div class="movie-name">
                                ${escapeHtml(movie.name)}
                            </div>


                            ${
                                movie.description
                                    ? `
                                        <div class="description">
                                            ${escapeHtml(movie.description)}
                                        </div>
                                    `
                                    : ''
                            }

                        </div>

                    </div>


                    <div class="rating ${ratingColor}">
                        ${escapeHtml(movie.rating)}

                        <span>
                            /10
                        </span>
                    </div>

                </article>
            `;
        })
        .join('');
}


// ================================
// Sorting
// ================================

function setupSortButtons() {
    if (sortBtn) {
        sortBtn.addEventListener(
            'click',
            () => toggleSort('games')
        );
    }


    if (moviesSortBtn) {
        moviesSortBtn.addEventListener(
            'click',
            () => toggleSort('movies')
        );
    }
}


function toggleSort(type) {
    if (type === 'games') {
        if (gamesSortOrder === 'desc') {
            gamesSortOrder = 'asc';

            const sorted =
                [...gamesData]
                    .sort(
                        (a, b) =>
                            a.rating - b.rating
                    );

            sortBtn.textContent =
                'Сортировка: по рейтингу ⬆️';

            renderGames(sorted);

        } else {
            gamesSortOrder = 'desc';

            const sorted =
                [...gamesData]
                    .sort(
                        (a, b) =>
                            b.rating - a.rating
                    );

            sortBtn.textContent =
                'Сортировка: по рейтингу ⬇️';

            renderGames(sorted);
        }

        return;
    }


    if (type === 'movies') {
        if (moviesSortOrder === 'desc') {
            moviesSortOrder = 'asc';

            const sorted =
                [...moviesData]
                    .sort(
                        (a, b) =>
                            a.rating - b.rating
                    );

            moviesSortBtn.textContent =
                'Сортировка: по рейтингу ⬆️';

            renderMovies(sorted);

        } else {
            moviesSortOrder = 'desc';

            const sorted =
                [...moviesData]
                    .sort(
                        (a, b) =>
                            b.rating - a.rating
                    );

            moviesSortBtn.textContent =
                'Сортировка: по рейтингу ⬇️';

            renderMovies(sorted);
        }
    }
}


// ================================
// Counter
// ================================

function updateCounter(count, type = 'game') {
    let word;


    if (type === 'movie') {
        if (
            count % 10 === 1 &&
            count % 100 !== 11
        ) {
            word = 'фильм';

        } else if (
            count % 10 >= 2 &&
            count % 10 <= 4 &&
            (
                count % 100 < 10 ||
                count % 100 >= 20
            )
        ) {
            word = 'фильма';

        } else {
            word = 'фильмов';
        }

    } else {
        if (
            count % 10 === 1 &&
            count % 100 !== 11
        ) {
            word = 'игра';

        } else if (
            count % 10 >= 2 &&
            count % 10 <= 4 &&
            (
                count % 100 < 10 ||
                count % 100 >= 20
            )
        ) {
            word = 'игры';

        } else {
            word = 'игр';
        }
    }


    if (counterElement) {
        counterElement.textContent =
            `${count} ${word}`;
    }
}

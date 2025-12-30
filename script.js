// FLYING DINOSAUR GAME - Complete JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // GAME VARIABLES AND CONSTANTS
    // ============================================
    const GAME_STATES = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    };

    // Game configuration
    const CONFIG = {
        INITIAL_SPEED: 5,
        MAX_SPEED: 20,
        SPEED_INCREMENT: 0.005,
        FLY_SPEED: 4,
        MAX_ALTITUDE: 180,
        MIN_ALTITUDE: 20,
        OBSTACLE_INTERVAL: 1500,
        CLOUD_INTERVAL: 3000,
        SCORE_INCREMENT: 1,
        GROUND_HEIGHT: 25
    };

    // Game state
    let state = {
        current: GAME_STATES.MENU,
        score: 0,
        highScore: parseInt(localStorage.getItem('dinoHighScore')) || 0,
        speed: CONFIG.INITIAL_SPEED,
        dinoAltitude: 100,
        altitudeChange: 0,
        obstacles: [],
        clouds: [],
        groundPositions: [0, 800],
        lastObstacleTime: 0,
        lastCloudTime: 0,
        gameLoopId: null,
        level: 1
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        gameArea: document.getElementById('game-area'),
        dino: document.getElementById('dino'),
        ground: document.querySelector('.ground'),
        scoreElement: document.getElementById('score'),
        highScoreElement: document.getElementById('high-score'),
        finalScoreElement: document.getElementById('final-score'),
        finalHighScoreElement: document.getElementById('final-high-score'),
        gameOverScreen: document.getElementById('game-over'),
        restartBtn: document.getElementById('restart-btn'),
        speedElement: document.getElementById('speed'),
        obstaclesCountElement: document.getElementById('obstacles-count'),
        pausedText: document.getElementById('paused-text'),
        jumpBtn: document.getElementById('jump-btn'),
        duckBtn: document.getElementById('duck-btn'),
        altitudeDisplay: document.getElementById('altitude-display')
    };

    // ============================================
    // GAME INITIALIZATION
    // ============================================
    function initGame() {
        // Set initial UI state
        updateUI();
        updateAltitudeDisplay();
        createInitialClouds();
        createGroundPattern();
        
        // Setup event listeners
        setupEventListeners();
        
        // Show start screen
        showStartScreen();
        
        // Start animation loop
        requestAnimationFrame(gameLoop);
    }

    // ============================================
    // EVENT LISTENERS SETUP
    // ============================================
    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Button controls
        elements.restartBtn.addEventListener('click', handleRestart);
        
        // Mobile controls
        elements.jumpBtn.addEventListener('touchstart', () => changeAltitude(1));
        elements.jumpBtn.addEventListener('touchend', () => stopAltitudeChange());
        elements.jumpBtn.addEventListener('mousedown', () => changeAltitude(1));
        elements.jumpBtn.addEventListener('mouseup', () => stopAltitudeChange());
        elements.jumpBtn.addEventListener('mouseleave', () => stopAltitudeChange());
        
        elements.duckBtn.addEventListener('touchstart', () => changeAltitude(-1));
        elements.duckBtn.addEventListener('touchend', () => stopAltitudeChange());
        elements.duckBtn.addEventListener('mousedown', () => changeAltitude(-1));
        elements.duckBtn.addEventListener('mouseup', () => stopAltitudeChange());
        elements.duckBtn.addEventListener('mouseleave', () => stopAltitudeChange());
        
        // Touch controls for mobile
        elements.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (state.current === GAME_STATES.MENU) {
                startGame();
            }
        });
    }

    // ============================================
    // INPUT HANDLING
    // ============================================
    function handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                if (state.current === GAME_STATES.MENU) {
                    startGame();
                } else if (state.current === GAME_STATES.PLAYING) {
                    changeAltitude(1);
                } else if (state.current === GAME_STATES.GAME_OVER) {
                    handleRestart();
                }
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                if (state.current === GAME_STATES.PLAYING) {
                    changeAltitude(-1);
                }
                break;
                
            case 'KeyP':
                e.preventDefault();
                togglePause();
                break;
                
            case 'KeyR':
                if (state.current === GAME_STATES.GAME_OVER) {
                    handleRestart();
                }
                break;
                
            case 'Escape':
                if (state.current === GAME_STATES.PLAYING) {
                    togglePause();
                }
                break;
        }
        
        // Start game on any key if not running
        if (state.current === GAME_STATES.MENU) {
            if (e.code !== 'Tab' && e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') {
                startGame();
            }
        }
    }

    function handleKeyUp(e) {
        if ((e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowDown' || 
            e.key === 's' || e.key === 'S' || e.key === 'w' || e.key === 'W') && 
            state.current === GAME_STATES.PLAYING) {
            e.preventDefault();
            stopAltitudeChange();
        }
    }

    // ============================================
    // FLYING MECHANICS
    // ============================================
    function updateDinoAltitude() {
        if (state.current !== GAME_STATES.PLAYING) return;
        
        if (state.altitudeChange === 1 && state.dinoAltitude < CONFIG.MAX_ALTITUDE) {
            state.dinoAltitude += CONFIG.FLY_SPEED;
            elements.dino.classList.add('tilt-up');
            elements.dino.classList.remove('tilt-down');
        } else if (state.altitudeChange === -1 && state.dinoAltitude > CONFIG.MIN_ALTITUDE) {
            state.dinoAltitude -= CONFIG.FLY_SPEED;
            elements.dino.classList.add('tilt-down');
            elements.dino.classList.remove('tilt-up');
        } else {
            elements.dino.classList.remove('tilt-up', 'tilt-down');
            // Gentle downward drift
            if (state.dinoAltitude > CONFIG.MIN_ALTITUDE + 20) {
                state.dinoAltitude -= 0.8;
            }
        }
        
        // Apply altitude to dino
        elements.dino.style.bottom = `${state.dinoAltitude}px`;
        
        // Update altitude display
        updateAltitudeDisplay();
    }

    function changeAltitude(direction) {
        if (state.current === GAME_STATES.PLAYING) {
            state.altitudeChange = direction;
        }
    }

    function stopAltitudeChange() {
        state.altitudeChange = 0;
    }

    function updateAltitudeDisplay() {
        if (elements.altitudeDisplay) {
            elements.altitudeDisplay.textContent = Math.round(state.dinoAltitude) + 'px';
        }
        
        // Update altitude bar
        const altitudeBar = document.getElementById('altitude-bar');
        const altitudeText = document.getElementById('altitude-text');
        
        if (altitudeBar && altitudeText) {
            const percent = ((state.dinoAltitude - CONFIG.MIN_ALTITUDE) / 
                           (CONFIG.MAX_ALTITUDE - CONFIG.MIN_ALTITUDE)) * 100;
            
            altitudeBar.style.height = `${Math.max(0, Math.min(100, percent))}%`;
            altitudeText.textContent = `Altitude: ${Math.round(state.dinoAltitude)}px`;
            
            // Change color based on altitude
            if (percent > 80) {
                altitudeBar.style.background = 'linear-gradient(to top, #ea4335, #fbbc04)';
            } else if (percent > 50) {
                altitudeBar.style.background = 'linear-gradient(to top, #fbbc04, #34a853)';
            } else {
                altitudeBar.style.background = 'linear-gradient(to top, #34a853, #1a73e8)';
            }
        }
    }

    // ============================================
    // GAME STATE MANAGEMENT
    // ============================================
    function startGame() {
        if (state.current !== GAME_STATES.MENU) return;
        
        resetGame();
        state.current = GAME_STATES.PLAYING;
        
        // Update UI
        elements.gameOverScreen.style.display = 'none';
        
        // Start game loop
        if (!state.gameLoopId) {
            state.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    function togglePause() {
        if (state.current === GAME_STATES.PLAYING) {
            state.current = GAME_STATES.PAUSED;
            elements.pausedText.style.display = 'block';
        } else if (state.current === GAME_STATES.PAUSED) {
            state.current = GAME_STATES.PLAYING;
            elements.pausedText.style.display = 'none';
            
            // Resume game loop
            if (!state.gameLoopId) {
                state.gameLoopId = requestAnimationFrame(gameLoop);
            }
        }
    }

    function gameOver() {
        state.current = GAME_STATES.GAME_OVER;
        
        // Remove flying animation
        elements.dino.classList.remove('flying', 'tilt-up', 'tilt-down');
        
        // Cancel animation frame
        if (state.gameLoopId) {
            cancelAnimationFrame(state.gameLoopId);
            state.gameLoopId = null;
        }
        
        // Update high score
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('dinoHighScore', state.highScore);
        }
        
        // Show game over screen
        showGameOver();
    }

    function resetGame() {
        // Clear all obstacles and clouds
        state.obstacles.forEach(obstacle => obstacle.element.remove());
        state.clouds.forEach(cloud => cloud.element.remove());
        
        // Reset state
        state.obstacles = [];
        state.clouds = [];
        state.score = 0;
        state.speed = CONFIG.INITIAL_SPEED;
        state.dinoAltitude = 100;
        state.altitudeChange = 0;
        state.level = 1;
        
        // Reset dino position
        elements.dino.classList.remove('tilt-up', 'tilt-down');
        elements.dino.style.bottom = '100px';
        elements.dino.classList.add('flying');
        updateAltitudeDisplay();
        
        // Reset UI
        updateUI();
    }

    function handleRestart() {
        if (state.current === GAME_STATES.GAME_OVER || state.current === GAME_STATES.MENU) {
            resetGame();
            startGame();
        }
    }

    // ============================================
    // GAME LOGIC
    // ============================================
    function gameLoop(timestamp) {
        if (state.current === GAME_STATES.PLAYING) {
            // Update game state
            updateGame(timestamp);
            
            // Check for collisions
            checkCollisions();
            
            // Schedule next frame
            state.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    function updateGame(timestamp) {
        // Update dino altitude
        updateDinoAltitude();
        
        // Update score
        state.score += CONFIG.SCORE_INCREMENT;
        if (state.score % 100 === 0) {
            // Flash score animation
            elements.scoreElement.classList.add('score-increase');
            setTimeout(() => {
                elements.scoreElement.classList.remove('score-increase');
            }, 300);
        }
        
        // Increase speed gradually
        if (state.speed < CONFIG.MAX_SPEED) {
            state.speed += CONFIG.SPEED_INCREMENT;
        }
        
        // Update level based on score
        const newLevel = Math.floor(state.score / 1000) + 1;
        if (newLevel > state.level) {
            state.level = newLevel;
        }
        
        // Spawn obstacles
        if (timestamp - state.lastObstacleTime > CONFIG.OBSTACLE_INTERVAL / (state.speed / CONFIG.INITIAL_SPEED)) {
            spawnObstacle();
            state.lastObstacleTime = timestamp;
        }
        
        // Spawn clouds
        if (timestamp - state.lastCloudTime > CONFIG.CLOUD_INTERVAL) {
            spawnCloud();
            state.lastCloudTime = timestamp;
        }
        
        // Update ground movement
        updateGround();
        
        // Update all moving objects
        updateObstacles();
        updateClouds();
        
        // Update UI
        updateUI();
    }

    // ============================================
    // GAME OBJECT MANAGEMENT
    // ============================================
    function spawnObstacle() {
        const obstacleTypes = ['ground', 'low', 'mid', 'high'];
        const type = obstacleTypes[Math.floor(Math.random() * 4)];
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        let width, height, bottomPos;
        
        if (type === 'ground') {
            width = 20;
            height = 50;
            bottomPos = 20; // Ground
        } else if (type === 'low') {
            width = 25;
            height = 40;
            bottomPos = 60; // Low flying
        } else if (type === 'mid') {
            width = 30;
            height = 50;
            bottomPos = 100; // Mid flying
        } else { // 'high'
            width = 25;
            height = 60;
            bottomPos = 140; // High flying
        }
        
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        obstacle.style.bottom = `${bottomPos}px`;
        
        elements.gameArea.appendChild(obstacle);
        
        state.obstacles.push({
            element: obstacle,
            x: elements.gameArea.offsetWidth,
            y: bottomPos,
            width: width,
            height: height
        });
        
        updateObstacleCount();
    }

    function spawnCloud() {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        const size = 40 + Math.random() * 40;
        const y = 20 + Math.random() * 100;
        
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size/2}px`;
        cloud.style.top = `${y}px`;
        cloud.style.left = `${elements.gameArea.offsetWidth}px`;
        
        elements.gameArea.appendChild(cloud);
        clouds.push({
            element: cloud,
            x: elements.gameArea.offsetWidth,
            width: size,
            speed: 0.5 + Math.random() * 1
        });
    }

    function createInitialClouds() {
        for (let i = 0; i < 3; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            
            const size = 40 + Math.random() * 40;
            const y = 20 + Math.random() * 100;
            const x = Math.random() * elements.gameArea.offsetWidth;
            
            cloud.style.width = `${size}px`;
            cloud.style.height = `${size/2}px`;
            cloud.style.top = `${y}px`;
            cloud.style.left = `${x}px`;
            
            elements.gameArea.appendChild(cloud);
            
            state.clouds.push({
                element: cloud,
                x: x,
                width: size,
                speed: 0.5 + Math.random() * 1
            });
        }
    }

    function createGroundPattern() {
        elements.ground.style.background = `
            repeating-linear-gradient(
                90deg,
                ${getComputedStyle(document.documentElement).getPropertyValue('--ground-color') || '#5f6368'},
                ${getComputedStyle(document.documentElement).getPropertyValue('--ground-color') || '#5f6368'} 20px,
                transparent 20px,
                transparent 40px
            )
        `;
    }

    // ============================================
    // UPDATE FUNCTIONS
    // ============================================
    function updateObstacles() {
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obstacle = state.obstacles[i];
            obstacle.x -= state.speed;
            obstacle.element.style.left = `${obstacle.x}px`;
            
            if (obstacle.x < -obstacle.width) {
                obstacle.element.remove();
                state.obstacles.splice(i, 1);
                updateObstacleCount();
            }
        }
    }

    function updateClouds() {
        for (let i = state.clouds.length - 1; i >= 0; i--) {
            const cloud = state.clouds[i];
            cloud.x -= cloud.speed;
            cloud.element.style.left = `${cloud.x}px`;
            
            if (cloud.x < -cloud.width) {
                cloud.element.remove();
                state.clouds.splice(i, 1);
            }
        }
    }

    function updateGround() {
        state.groundPositions = state.groundPositions.map(pos => {
            pos -= state.speed;
            if (pos <= -800) pos = 800;
            return pos;
        });
        
        elements.ground.style.backgroundPositionX = `${state.groundPositions[0]}px`;
    }

    // ============================================
    // COLLISION DETECTION
    // ============================================
    function checkCollisions() {
        const dinoRect = {
            x: 50,
            y: state.dinoAltitude,
            width: 60,
            height: 40
        };
        
        // Check obstacle collisions
        for (const obstacle of state.obstacles) {
            const obstacleRect = {
                x: obstacle.x,
                y: obstacle.y,
                width: obstacle.width,
                height: obstacle.height
            };
            
            if (checkRectCollision(dinoRect, obstacleRect)) {
                handleCollision();
                return;
            }
        }
    }

    function checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function handleCollision() {
        // Visual feedback
        const collisionEffect = document.querySelector('.collision-effect');
        if (collisionEffect) {
            collisionEffect.style.display = 'block';
            collisionEffect.style.animation = 'none';
            void collisionEffect.offsetWidth;
            collisionEffect.style.animation = 'flashRed 0.5s';
            
            setTimeout(() => {
                collisionEffect.style.display = 'none';
            }, 500);
        }
        
        // End game
        gameOver();
    }

    // ============================================
    // UI UPDATES
    // ============================================
    function updateUI() {
        elements.scoreElement.textContent = Math.floor(state.score);
        elements.highScoreElement.textContent = state.highScore;
        elements.speedElement.textContent = state.speed.toFixed(1) + 'x';
    }

    function updateObstacleCount() {
        if (elements.obstaclesCountElement) {
            elements.obstaclesCountElement.textContent = state.obstacles.length;
        }
    }

    // ============================================
    // VISUAL EFFECTS
    // ============================================
    function showStartScreen() {
        elements.gameOverScreen.style.display = 'block';
        const title = elements.gameOverScreen.querySelector('h2');
        const message = elements.gameOverScreen.querySelectorAll('p')[0];
        
        if (title) title.textContent = 'Flying Dino Game';
        if (message) message.textContent = 'Press SPACE or tap to start';
        
        if (elements.restartBtn) {
            elements.restartBtn.textContent = 'Start Game';
        }
    }

    function showGameOver() {
        elements.gameOverScreen.style.display = 'block';
        const title = elements.gameOverScreen.querySelector('h2');
        
        if (title) title.textContent = 'Game Over';
        
        if (elements.finalScoreElement) {
            elements.finalScoreElement.textContent = Math.floor(state.score);
        }
        
        if (elements.finalHighScoreElement) {
            elements.finalHighScoreElement.textContent = state.highScore;
        }
        
        if (elements.restartBtn) {
            elements.restartBtn.textContent = 'Play Again';
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ============================================
    // CREATE UI ELEMENTS
    // ============================================
    function createUIElements() {
        // Create collision effect element
        if (!document.querySelector('.collision-effect')) {
            const collisionEffect = document.createElement('div');
            collisionEffect.className = 'collision-effect';
            elements.gameArea.appendChild(collisionEffect);
        }
        
        // Create altitude indicator if it doesn't exist
        if (!document.getElementById('altitude-indicator')) {
            const altitudeIndicator = document.createElement('div');
            altitudeIndicator.className = 'altitude-indicator';
            altitudeIndicator.id = 'altitude-indicator';
            altitudeIndicator.innerHTML = '<div class="altitude-bar" id="altitude-bar"></div>';
            elements.gameArea.appendChild(altitudeIndicator);
        }
        
        if (!document.getElementById('altitude-text')) {
            const altitudeText = document.createElement('div');
            altitudeText.className = 'altitude-text';
            altitudeText.id = 'altitude-text';
            altitudeText.textContent = 'Altitude: 100px';
            elements.gameArea.appendChild(altitudeText);
        }
    }

    // ============================================
    // INITIALIZE GAME
    // ============================================
    // Create UI elements
    createUIElements();
    
    // Initialize the game
    initGame();

    // ============================================
    // WINDOW EVENT LISTENERS
    // ============================================
    window.addEventListener('blur', () => {
        if (state.current === GAME_STATES.PLAYING) {
            togglePause();
        }
    });

    // ============================================
    // EXPORT GAME FUNCTIONS
    // ============================================
    window.dinoGame = {
        start: startGame,
        pause: togglePause,
        restart: handleRestart,
        getScore: () => state.score,
        getHighScore: () => state.highScore,
        getState: () => state.current
    };
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================
function startDinoGame() {
    if (window.dinoGame) {
        window.dinoGame.start();
    }
}

function pauseDinoGame() {
    if (window.dinoGame) {
        window.dinoGame.pause();
    }
}

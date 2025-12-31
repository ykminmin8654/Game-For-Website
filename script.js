// FLYING DINOSAUR GAME - Complete Version
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Game loading...");

    // Game states
    const GameState = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    };

    // Game settings
    const Settings = {
        INITIAL_SPEED: 3,
        MAX_SPEED: 10,
        SPEED_INCREASE: 0.001,
        FLY_SPEED: 4,
        MAX_ALTITUDE: 250,
        MIN_ALTITUDE: 25,
        OBSTACLE_FREQUENCY: 1800,
        CLOUD_FREQUENCY: 3000,
        SCORE_PER_FRAME: 1,
        DINO_WIDTH: 60,
        DINO_HEIGHT: 40,
        OBSTACLE_WIDTH: 30
    };

    // Game state
    let game = {
        state: GameState.MENU,
        score: 0,
        highScore: parseInt(localStorage.getItem('dinoHighScore')) || 0,
        speed: Settings.INITIAL_SPEED,
        dinoY: 100,
        dinoDirection: 0,
        obstacles: [],
        clouds: [],
        groundX: 0,
        lastObstacleTime: 0,
        lastCloudTime: 0,
        gameLoop: null
    };

    // Get DOM elements
    const elements = {
        // Game area
        gameArea: document.getElementById('game-area'),
        dino: document.getElementById('dino'),
        ground: document.querySelector('.ground'),
        
        // Scores
        score: document.getElementById('score'),
        highScore: document.getElementById('high-score'),
        finalScore: document.getElementById('final-score'),
        finalHighScore: document.getElementById('final-high-score'),
        
        // UI elements
        gameOverScreen: document.getElementById('game-over'),
        restartButton: document.getElementById('restart-btn'),
        speedDisplay: document.getElementById('speed'),
        obstacleCount: document.getElementById('obstacles-count'),
        pauseText: document.getElementById('paused-text'),
        
        // Controls
        upButton: document.getElementById('jump-btn'),
        downButton: document.getElementById('duck-btn'),
        
        // Displays
        altitudeDisplay: document.getElementById('altitude-display'),
        altitudeBar: document.getElementById('altitude-bar'),
        altitudeText: document.getElementById('altitude-text'),
        gameTitle: document.getElementById('game-title'),
        gameMessage: document.getElementById('game-message'),
        
        // Effects
        collisionEffect: document.querySelector('.collision-effect')
    };

    // ============ GAME SETUP ============
    function setupGame() {
        console.log("Setting up game...");
        
        // Set initial displays
        updateDisplays();
        updateAltitude();
        createStartingClouds();
        
        // Setup controls
        setupControls();
        
        // Show menu
        showMenu();
        
        // Start game loop
        game.gameLoop = requestAnimationFrame(gameUpdate);
        
        console.log("Game ready!");
    }

    // ============ CONTROLS ============
    function setupControls() {
        // Keyboard
        document.addEventListener('keydown', handleKeyPress);
        document.addEventListener('keyup', handleKeyRelease);
        
        // Restart button
        elements.restartButton.addEventListener('click', function() {
            console.log("Restart clicked - state:", game.state);
            if (game.state === GameState.MENU || game.state === GameState.GAME_OVER) {
                startNewGame();
            }
        });
        
        // Mobile buttons
        elements.upButton.addEventListener('mousedown', () => changeDinoDirection(1));
        elements.upButton.addEventListener('mouseup', () => changeDinoDirection(0));
        elements.upButton.addEventListener('mouseleave', () => changeDinoDirection(0));
        
        elements.downButton.addEventListener('mousedown', () => changeDinoDirection(-1));
        elements.downButton.addEventListener('mouseup', () => changeDinoDirection(0));
        elements.downButton.addEventListener('mouseleave', () => changeDinoDirection(0));
        
        // Touch events
        elements.upButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            changeDinoDirection(1);
        });
        elements.upButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            changeDinoDirection(0);
        });
        
        elements.downButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            changeDinoDirection(-1);
        });
        elements.downButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            changeDinoDirection(0);
        });
        
        // Mobile controls
        if ('ontouchstart' in window) {
            document.querySelector('.mobile-controls').style.display = 'flex';
        }
    }

    function handleKeyPress(e) {
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                e.preventDefault();
                if (game.state === GameState.MENU) {
                    startNewGame();
                } else if (game.state === GameState.PLAYING) {
                    changeDinoDirection(1);
                } else if (game.state === GameState.GAME_OVER) {
                    startNewGame();
                } else if (game.state === GameState.PAUSED) {
                    togglePause();
                }
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                if (game.state === GameState.PLAYING) {
                    changeDinoDirection(-1);
                }
                break;
                
            case 'KeyP':
            case 'Escape':
                e.preventDefault();
                if (game.state === GameState.PLAYING || game.state === GameState.PAUSED) {
                    togglePause();
                }
                break;
                
            case 'KeyR':
                e.preventDefault();
                if (game.state === GameState.GAME_OVER) {
                    startNewGame();
                }
                break;
        }
    }

    function handleKeyRelease(e) {
        if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW' || 
             e.code === 'ArrowDown' || e.code === 'KeyS') && 
            game.state === GameState.PLAYING) {
            e.preventDefault();
            changeDinoDirection(0);
        }
    }

    function changeDinoDirection(dir) {
        if (game.state === GameState.PLAYING) {
            game.dinoDirection = dir;
        }
    }

    // ============ GAME STATES ============
    function startNewGame() {
        console.log("Starting NEW game!");
        
        // Stop any running game
        if (game.gameLoop) {
            cancelAnimationFrame(game.gameLoop);
        }
        
        // Reset game state
        game.state = GameState.PLAYING;
        game.score = 0;
        game.speed = Settings.INITIAL_SPEED;
        game.dinoY = 100;
        game.dinoDirection = 0;
        game.obstacles = [];
        game.clouds = [];
        game.groundX = 0;
        game.lastObstacleTime = 0;
        game.lastCloudTime = 0;
        
        // Clear all obstacles and clouds
        document.querySelectorAll('.obstacle').forEach(el => el.remove());
        document.querySelectorAll('.cloud').forEach(el => el.remove());
        
        // Reset dino
        elements.dino.classList.remove('tilt-up', 'tilt-down');
        elements.dino.classList.add('flying');
        elements.dino.style.bottom = '100px';
        
        // Hide UI elements
        elements.gameOverScreen.style.display = 'none';
        elements.pauseText.style.display = 'none';
        
        // Update displays
        updateDisplays();
        updateAltitude();
        
        // Create new clouds
        createStartingClouds();
        
        // Start game loop
        game.gameLoop = requestAnimationFrame(gameUpdate);
        
        console.log("Game started!");
    }

    function togglePause() {
        if (game.state === GameState.PLAYING) {
            game.state = GameState.PAUSED;
            elements.pauseText.style.display = 'block';
        } else if (game.state === GameState.PAUSED) {
            game.state = GameState.PLAYING;
            elements.pauseText.style.display = 'none';
        }
    }

    function endGame() {
        console.log("Game over! Score:", game.score);
        game.state = GameState.GAME_OVER;
        
        // Stop dino animations
        elements.dino.classList.remove('flying', 'tilt-up', 'tilt-down');
        
        // Update high score
        if (game.score > game.highScore) {
            game.highScore = game.score;
            localStorage.setItem('dinoHighScore', game.highScore);
        }
        
        // Show game over screen
        showGameOver();
    }

    // ============ GAME LOOP ============
    function gameUpdate(time) {
        if (game.state === GameState.PLAYING) {
            // Update timing
            if (!game.lastObstacleTime) game.lastObstacleTime = time;
            if (!game.lastCloudTime) game.lastCloudTime = time;
            
            // Update game
            updateGame(time);
            
            // Check for collisions
            checkCollisions();
            
            // Continue loop
            game.gameLoop = requestAnimationFrame(gameUpdate);
        } else {
            // Still animate ground and clouds in menu/pause
            moveGround();
            moveClouds();
            game.gameLoop = requestAnimationFrame(gameUpdate);
        }
    }

    function updateGame(time) {
        // Move dino
        moveDino();
        
        // Increase score
        game.score += Settings.SCORE_PER_FRAME;
        
        // Speed up over time
        if (game.speed < Settings.MAX_SPEED) {
            game.speed += Settings.SPEED_INCREASE;
        }
        
        // Create obstacles
        if (time - game.lastObstacleTime > Settings.OBSTACLE_FREQUENCY / (game.speed / Settings.INITIAL_SPEED)) {
            createObstacle();
            game.lastObstacleTime = time;
        }
        
        // Create clouds
        if (time - game.lastCloudTime > Settings.CLOUD_FREQUENCY) {
            createCloud();
            game.lastCloudTime = time;
        }
        
        // Move everything
        moveGround();
        moveObstacles();
        moveClouds();
        
        // Update displays
        updateDisplays();
    }

    // ============ DINO MOVEMENT ============
    function moveDino() {
        if (game.dinoDirection === 1 && game.dinoY < Settings.MAX_ALTITUDE) {
            game.dinoY += Settings.FLY_SPEED;
            elements.dino.classList.add('tilt-up');
            elements.dino.classList.remove('tilt-down');
        } else if (game.dinoDirection === -1 && game.dinoY > Settings.MIN_ALTITUDE) {
            game.dinoY -= Settings.FLY_SPEED;
            elements.dino.classList.add('tilt-down');
            elements.dino.classList.remove('tilt-up');
        } else {
            elements.dino.classList.remove('tilt-up', 'tilt-down');
            // Slight downward drift
            if (game.dinoY > Settings.MIN_ALTITUDE + 20) {
                game.dinoY -= 0.3;
            }
        }
        
        // Keep in bounds
        game.dinoY = Math.max(Settings.MIN_ALTITUDE, 
                            Math.min(Settings.MAX_ALTITUDE, game.dinoY));
        
        // Update position
        elements.dino.style.bottom = `${game.dinoY}px`;
        
        // Update altitude display
        updateAltitude();
    }

    function updateAltitude() {
        if (elements.altitudeDisplay) {
            elements.altitudeDisplay.textContent = Math.round(game.dinoY) + 'px';
        }
        
        if (elements.altitudeBar && elements.altitudeText) {
            const percent = ((game.dinoY - Settings.MIN_ALTITUDE) / 
                           (Settings.MAX_ALTITUDE - Settings.MIN_ALTITUDE)) * 100;
            const height = Math.max(0, Math.min(100, percent));
            
            elements.altitudeBar.style.height = `${height}%`;
            elements.altitudeText.textContent = `Altitude: ${Math.round(game.dinoY)}px`;
            
            // Color coding
            if (height > 80) {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #ea4335, #fbbc04)';
            } else if (height > 50) {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #fbbc04, #34a853)';
            } else {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #34a853, #1a73e8)';
            }
        }
    }

    // ============ OBSTACLES ============
    function createObstacle() {
        const types = ['ground', 'low', 'mid', 'high'];
        const type = types[Math.floor(Math.random() * 4)];
        
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        let height, width = Settings.OBSTACLE_WIDTH;
        
        switch(type) {
            case 'ground': height = 50; break;
            case 'low': height = 100; break;
            case 'mid': height = 150; break;
            case 'high': height = 200; break;
        }
        
        // All obstacles touch the ground
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        obstacle.style.bottom = '0px';
        obstacle.style.left = `${elements.gameArea.offsetWidth}px`;
        
        // Set color
        switch(type) {
            case 'ground':
                obstacle.style.background = 'linear-gradient(135deg, #008080 0%, #006400 100%)';
                break;
            case 'low':
                obstacle.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';
                break;
            case 'mid':
                obstacle.style.background = 'linear-gradient(135deg, #FFD93D 0%, #FF9A3D 100%)';
                break;
            case 'high':
                obstacle.style.background = 'linear-gradient(135deg, #6BCF7F 0%, #4CD97B 100%)';
                break;
        }
        
        elements.gameArea.appendChild(obstacle);
        
        game.obstacles.push({
            element: obstacle,
            x: elements.gameArea.offsetWidth,
            width: width,
            height: height,
            type: type
        });
        
        updateObstacleCount();
    }

// FLYING DINOSAUR GAME - Complete Fixed JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎮 Flying Dinosaur Game initializing...");

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
        INITIAL_SPEED: 3,
        MAX_SPEED: 10,
        SPEED_INCREMENT: 0.001,
        FLY_SPEED: 4,
        MAX_ALTITUDE: 250,
        MIN_ALTITUDE: 25,
        OBSTACLE_INTERVAL: 1800,
        CLOUD_INTERVAL: 3000,
        SCORE_INCREMENT: 1,
        GROUND_HEIGHT: 25,
        DINOSAUR_WIDTH: 60,
        DINOSAUR_HEIGHT: 40,
        OBSTACLE_WIDTH: 30
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
        groundPosition: 0,
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
        altitudeDisplay: document.getElementById('altitude-display'),
        altitudeBar: document.getElementById('altitude-bar'),
        altitudeText: document.getElementById('altitude-text'),
        gameTitle: document.getElementById('game-title'),
        gameMessage: document.getElementById('game-message'),
        collisionEffect: document.querySelector('.collision-effect')
    };

    // ============================================
    // GAME INITIALIZATION
    // ============================================
    function initGame() {
        console.log("✅ Initializing game...");
        
        // Set initial UI state
        updateUI();
        updateAltitudeDisplay();
        createInitialClouds();
        
        // Setup event listeners
        setupEventListeners();
        
        // Show start screen
        showStartScreen();
        
        // Start animation loop
        state.gameLoopId = requestAnimationFrame(gameLoop);
        
        console.log("🎯 Game ready! Current state:", state.current);
    }

    // ============================================
    // EVENT LISTENERS SETUP
    // ============================================
    function setupEventListeners() {
        console.log("🎮 Setting up event listeners...");
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Button controls - SIMPLIFIED: Direct call
        elements.restartBtn.addEventListener('click', function() {
            console.log("🔄 Restart button clicked!");
            restartGameCompletely();
        });
        
        // Mobile controls
        setupMobileControls();
        
        // Window focus events
        window.addEventListener('blur', function() {
            if (state.current === GAME_STATES.PLAYING) {
                console.log("⏸️ Window lost focus, pausing game");
                togglePause();
            }
        });
    }

    function setupMobileControls() {
        // Fly Up button
        elements.jumpBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            changeAltitude(1);
        });
        elements.jumpBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopAltitudeChange();
        });
        elements.jumpBtn.addEventListener('mousedown', function() {
            changeAltitude(1);
        });
        elements.jumpBtn.addEventListener('mouseup', function() {
            stopAltitudeChange();
        });
        
        // Fly Down button
        elements.duckBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            changeAltitude(-1);
        });
        elements.duckBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            stopAltitudeChange();
        });
        elements.duckBtn.addEventListener('mousedown', function() {
            changeAltitude(-1);
        });
        elements.duckBtn.addEventListener('mouseup', function() {
            stopAltitudeChange();
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
                    console.log("▶️ Starting game from menu");
                    startGame();
                } else if (state.current === GAME_STATES.PLAYING) {
                    changeAltitude(1);
                } else if (state.current === GAME_STATES.GAME_OVER) {
                    restartGameCompletely();
                } else if (state.current === GAME_STATES.PAUSED) {
                    togglePause();
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
            case 'Escape':
                e.preventDefault();
                if (state.current === GAME_STATES.PLAYING || state.current === GAME_STATES.PAUSED) {
                    togglePause();
                }
                break;
                
            case 'KeyR':
                e.preventDefault();
                restartGameCompletely();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (state.current === GAME_STATES.MENU) {
                    startGame();
                } else if (state.current === GAME_STATES.GAME_OVER) {
                    restartGameCompletely();
                }
                break;
        }
    }

    function handleKeyUp(e) {
        if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW' || 
             e.code === 'ArrowDown' || e.code === 'KeyS') && 
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
                state.dinoAltitude -= 0.3;
            }
        }
        
        // Ensure dino stays within bounds
        state.dinoAltitude = Math.max(CONFIG.MIN_ALTITUDE, Math.min(CONFIG.MAX_ALTITUDE, state.dinoAltitude));
        
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
        if (elements.altitudeBar && elements.altitudeText) {
            const percent = ((state.dinoAltitude - CONFIG.MIN_ALTITUDE) / 
                           (CONFIG.MAX_ALTITUDE - CONFIG.MIN_ALTITUDE)) * 100;
            
            const clampedPercent = Math.max(0, Math.min(100, percent));
            elements.altitudeBar.style.height = `${clampedPercent}%`;
            elements.altitudeText.textContent = `Altitude: ${Math.round(state.dinoAltitude)}px`;
            
            // Change color based on altitude
            if (clampedPercent > 80) {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #ea4335, #fbbc04)';
            } else if (clampedPercent > 50) {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #fbbc04, #34a853)';
            } else {
                elements.altitudeBar.style.background = 'linear-gradient(to top, #34a853, #1a73e8)';
            }
        }
    }

    // ============================================
    // GAME STATE MANAGEMENT
    // ============================================
    function startGame() {
        console.log("▶️ Starting game from menu...");
        if (state.current !== GAME_STATES.MENU) return;
        
        // Set state to playing
        state.current = GAME_STATES.PLAYING;
        state.score = 0;
        state.speed = CONFIG.INITIAL_SPEED;
        state.dinoAltitude = 100;
        state.altitudeChange = 0;
        state.level = 1;
        state.groundPosition = 0;
        
        // Clear any existing obstacles
        clearAllObstacles();
        clearAllClouds();
        
        // Update UI
        elements.gameOverScreen.style.display = 'none';
        elements.pausedText.style.display = 'none';
        elements.dino.classList.add('flying');
        elements.dino.style.bottom = '100px';
        
        // Update displays
        updateUI();
        updateAltitudeDisplay();
        updateObstacleCount();
        
        // Create initial clouds
        createInitialClouds();
        
        // Reset timing
        state.lastObstacleTime = performance.now();
        state.lastCloudTime = performance.now();
        
        console.log("🚀 Game started! Current state:", state.current);
    }

    function restartGameCompletely() {
        console.log("🔄 COMPLETE GAME RESTART");
        
        // Stop current game loop
        if (state.gameLoopId) {
            cancelAnimationFrame(state.gameLoopId);
            state.gameLoopId = null;
        }
        
        // Reset ALL state
        state.current = GAME_STATES.PLAYING;
        state.score = 0;
        state.highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
        state.speed = CONFIG.INITIAL_SPEED;
        state.dinoAltitude = 100;
        state.altitudeChange = 0;
        state.obstacles = [];
        state.clouds = [];
        state.level = 1;
        state.groundPosition = 0;
        state.lastObstacleTime = 0;
        state.lastCloudTime = 0;
        
        // Clear ALL game objects from DOM
        clearAllObstacles();
        clearAllClouds();
        
        // Reset UI completely
        elements.gameOverScreen.style.display = 'none';
        elements.pausedText.style.display = 'none';
        elements.dino.classList.remove('tilt-up', 'tilt-down');
        elements.dino.classList.add('flying');
        elements.dino.style.bottom = '100px';
        
        // Update all displays
        updateUI();
        updateAltitudeDisplay();
        updateObstacleCount();
        
        // Update button text
        elements.restartBtn.textContent = 'Start Game';
        
        // Create initial clouds
        createInitialClouds();
        
        // Start new game loop
        state.lastObstacleTime = performance.now();
        state.lastCloudTime = performance.now();
        state.gameLoopId = requestAnimationFrame(gameLoop);
        
        console.log("🔄 Game completely restarted! State:", state.current);
    }

    function clearAllObstacles() {
        // Clear obstacles array
        state.obstacles = [];
        
        // Remove all obstacle elements from DOM
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obstacle => {
            if (obstacle.parentNode) {
                obstacle.remove();
            }
        });
    }

    function clearAllClouds() {
        // Clear clouds array
        state.clouds = [];
        
        // Remove all cloud elements from DOM
        const clouds = document.querySelectorAll('.cloud');
        clouds.forEach(cloud => {
            if (cloud.parentNode) {
                cloud.remove();
            }
        });
    }

    function togglePause() {
        if (state.current === GAME_STATES.PLAYING) {
            state.current = GAME_STATES.PAUSED;
            elements.pausedText.style.display = 'block';
            console.log("⏸️ Game paused");
        } else if (state.current === GAME_STATES.PAUSED) {
            state.current = GAME_STATES.PLAYING;
            elements.pausedText.style.display = 'none';
            console.log("▶️ Game resumed");
        }
    }

    function gameOver() {
        console.log("💥 Game Over! Score:", state.score);
        state.current = GAME_STATES.GAME_OVER;
        
        // Remove flying animation
        elements.dino.classList.remove('flying', 'tilt-up', 'tilt-down');
        
        // Update high score
        if (state.score > state.highScore) {
            state.highScore = state.score;
            localStorage.setItem('dinoHighScore', state.highScore);
            console.log("🏆 New high score!", state.highScore);
        }
        
        // Show game over screen
        setTimeout(showGameOver, 300);
    }

    // ============================================
    // GAME LOGIC
    // ============================================
    function gameLoop(timestamp) {
        if (state.current === GAME_STATES.PLAYING) {
            // Initialize timestamps if not set
            if (!state.lastObstacleTime) state.lastObstacleTime = timestamp;
            if (!state.lastCloudTime) state.lastCloudTime = timestamp;
            
            // Update game state
            updateGame(timestamp);
            
            // Check for collisions
            checkCollisions();
            
            // Schedule next frame
            state.gameLoopId = requestAnimationFrame(gameLoop);
        } else if (state.current === GAME_STATES.MENU || state.current === GAME_STATES.GAME_OVER || state.current === GAME_STATES.PAUSED) {
            // Animate clouds and ground in menu/game over/paused states
            updateGround();
            updateClouds();
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
        
        let height, width = CONFIG.OBSTACLE_WIDTH;
        
        switch(type) {
            case 'ground':
                height = 50;  // Shortest obstacle
                break;
            case 'low':
                height = 100; // Low obstacle
                break;
            case 'mid':
                height = 150; // Medium obstacle
                break;
            case 'high':
                height = 200; // Tall obstacle
                break;
        }
        
        // All obstacles touch the ground
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        obstacle.style.bottom = '0px';
        obstacle.style.left = `${elements.gameArea.offsetWidth}px`;
        
        // Set obstacle color based on type
        switch(type) {
            case 'ground':
                obstacle.style.background = 'linear-gradient(135deg, var(--teal) 0%, var(--dark-green) 100%)';
                break;
            case 'low':
                obstacle.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';
                break;
            case 'mid':
                obstacle.style.background = 'linear-gradient(135deg, #FFD93D 0%, #FF9A3D 100%)';
                break;
            case 'high':
                obstacle.style.background = 'linear-gradient(135deg, #6BCF7F 0%, #4CD97B 100%)';
                break;
        }
        
        elements.gameArea.appendChild(obstacle);
        
        state.obstacles.push({
            element: obstacle,
            x: elements.gameArea.offsetWidth,
            y: 0,
            width: width,
            height: height,
            type: type
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
        state.clouds.push({
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
            const x = Math.random() * (elements.gameArea.offsetWidth / 2);
            
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

    // ============================================
    // UPDATE FUNCTIONS
    // ============================================
    function updateObstacles() {
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obstacle = state.obstacles[i];
            obstacle.x -= state.speed;
            obstacle.element.style.left = `${obstacle.x}px`;
            
            if (obstacle.x < -obstacle.width) {
                if (obstacle.element && obstacle.element.parentNode) {
                    obstacle.element.remove();
                }
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
                if (cloud.element && cloud.element.parentNode) {
                    cloud.element.remove();
                }
                state.clouds.splice(i, 1);
            }
        }
    }

    function updateGround() {
        state.groundPosition -= state.speed;
        if (state.groundPosition <= -800) {
            state.groundPosition = 0;
        }
        elements.ground.style.backgroundPositionX = `${state.groundPosition}px`;
    }

    // ============================================
    // COLLISION DETECTION
    // ============================================
    function checkCollisions() {
        const dinoRect = {
            x: 50, // Dino's fixed X position
            y: state.dinoAltitude,
            width: CONFIG.DINOSAUR_WIDTH,
            height: CONFIG.DINOSAUR_HEIGHT
        };
        
        // Check obstacle collisions
        for (const obstacle of state.obstacles) {
            const obstacleRect = {
                x: obstacle.x,
                y: 0, // All obstacles start at bottom
                width: obstacle.width,
                height: obstacle.height
            };
            
            // Simple AABB collision detection
            if (dinoRect.x < obstacleRect.x + obstacleRect.width &&
                dinoRect.x + dinoRect.width > obstacleRect.x &&
                dinoRect.y < obstacleRect.height && // Check if dino is above obstacle top
                dinoRect.y + dinoRect.height > obstacleRect.y) {
                
                console.log("💥 Collision detected with", obstacle.type, "obstacle!");
                handleCollision();
                return;
            }
        }
        
        // Check ground collision
        if (state.dinoAltitude <= CONFIG.MIN_ALTITUDE) {
            console.log("💥 Ground collision detected!");
            handleCollision();
        }
    }

    function handleCollision() {
        // Visual feedback
        if (elements.collisionEffect) {
            elements.collisionEffect.style.display = 'block';
            elements.collisionEffect.style.animation = 'none';
            void elements.collisionEffect.offsetWidth; // Trigger reflow
            elements.collisionEffect.style.animation = 'flashRed 0.5s';
            
            setTimeout(() => {
                elements.collisionEffect.style.display = 'none';
            }, 500);
        }
        
        // End game
        setTimeout(gameOver, 200);
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
        console.log("📱 Showing start screen");
        elements.gameOverScreen.style.display = 'block';
        
        if (elements.gameTitle) {
            elements.gameTitle.textContent = 'Flying Dino Game';
        }
        
        if (elements.gameMessage) {
            elements.gameMessage.textContent = 'Press SPACE or click Start to play';
        }
        
        if (elements.restartBtn) {
            elements.restartBtn.textContent = 'Start Game';
        }
        
        if (elements.finalScoreElement) {
            elements.finalScoreElement.textContent = '0';
        }
        
        if (elements.finalHighScoreElement) {
            elements.finalHighScoreElement.textContent = state.highScore;
        }
    }

    function showGameOver() {
        console.log("📱 Showing game over screen");
        elements.gameOverScreen.style.display = 'block';
        
        if (elements.gameTitle) {
            elements.gameTitle.textContent = 'Game Over';
        }
        
        if (elements.gameMessage) {
            elements.gameMessage.textContent = 'Your score: ' + Math.floor(state.score);
        }
        
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
    // INITIALIZE THE GAME
    // ============================================
    // Initialize the game
    initGame();
    
    // Show mobile controls on mobile devices
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        const mobileControls = document.querySelector('.mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'flex';
        }
    }
    
    console.log("✅ Game initialization complete!");
});

// ============================================
// GLOBAL FUNCTIONS
// ============================================
function startDinoGame() {
    console.log("🌍 Global start function called");
    const event = new KeyboardEvent('keydown', { code: 'Space' });
    document.dispatchEvent(event);
}

function restartDinoGame() {
    console.log("🌍 Global restart function called");
    const event = new KeyboardEvent('keydown', { code: 'KeyR' });
    document.dispatchEvent(event);
}

// Export game object
window.dinoGame = {
    start: startDinoGame,
    restart: restartDinoGame
};
})
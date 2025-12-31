    // ============================================
    // FLYING DINOSAUR GAME - COMPLETE FIXED VERSION
    // ============================================

    // ====== GAME STATE ======
    const GameState = {
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over'
    };

    const GameConfig = {
        INITIAL_SPEED: 3,
        MAX_SPEED: 8,
        SPEED_INCREMENT: 0.001,
        FLY_SPEED: 4,
        MAX_ALTITUDE: 250,
        MIN_ALTITUDE: 25,
        OBSTACLE_INTERVAL: 1800,
        CLOUD_INTERVAL: 3000,
        SCORE_INCREMENT: 1,
        DINO_X: 50,
        DINO_WIDTH: 60,
        DINO_HEIGHT: 40,
        OBSTACLE_WIDTH: 30
    };

    // Game state
    let game = {
        state: GameState.MENU,
        score: 0,
        highScore: parseInt(localStorage.getItem('dinoHighScore')) || 0,
        speed: GameConfig.INITIAL_SPEED,
        dinoY: 100,
        dinoDirection: 0,
        obstacles: [],
        clouds: [],
        groundX: 0,
        lastObstacleTime: 0,
        lastCloudTime: 0,
        gameLoop: null
    };

    // ====== DOM ELEMENTS ======
    const dino = document.getElementById('dino');
    const gameArea = document.getElementById('game-area');
    const ground = document.querySelector('.ground');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const finalScoreElement = document.getElementById('final-score');
    const finalHighScoreElement = document.getElementById('final-high-score');
    const gameOverScreen = document.getElementById('game-over');
    const restartBtn = document.getElementById('restart-btn');
    const speedDisplay = document.getElementById('speed');
    const obstaclesCount = document.getElementById('obstacles-count');
    const altitudeDisplay = document.getElementById('altitude-display');
    const pausedText = document.getElementById('paused-text');
    const collisionEffect = document.querySelector('.collision-effect');
    const jumpBtn = document.getElementById('jump-btn');
    const duckBtn = document.getElementById('duck-btn');
    const gameTitle = document.getElementById('game-title');
    const gameMessage = document.getElementById('game-message');
    const altitudeBar = document.getElementById('altitude-bar');
    const altitudeText = document.getElementById('altitude-text');

    // ====== GAME INITIALIZATION ======
    function initGame() {
        console.log("🎮 Game initializing...");
        
        // Load high score
        game.highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
        
        // Set initial displays
        updateDisplays();
        updateAltitude();
        createInitialClouds();
        
        // Setup controls
        setupEventListeners();
        
        // Show menu
        showMenu();
        
        // Start game loop
        game.gameLoop = requestAnimationFrame(gameUpdate);
        
        console.log("✅ Game ready! State:", game.state);
    }

    // ====== EVENT LISTENERS ======
    function setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Restart button
        restartBtn.addEventListener('click', function() {
            console.log("🔄 Restart button clicked");
            if (game.state === GameState.MENU || game.state === GameState.GAME_OVER) {
                startNewGame();
            }
        });
        
        // Mobile controls
        setupMobileControls();
        
        // Window focus events
        window.addEventListener('blur', function() {
            if (game.state === GameState.PLAYING) {
                console.log("⏸️ Window lost focus, pausing game");
                togglePause();
            }
        });
    }

    function setupMobileControls() {
        // Jump button
        jumpBtn.addEventListener('mousedown', () => changeDinoDirection(1));
        jumpBtn.addEventListener('mouseup', () => changeDinoDirection(0));
        jumpBtn.addEventListener('mouseleave', () => changeDinoDirection(0));
        
        // Duck button
        duckBtn.addEventListener('mousedown', () => changeDinoDirection(-1));
        duckBtn.addEventListener('mouseup', () => changeDinoDirection(0));
        duckBtn.addEventListener('mouseleave', () => changeDinoDirection(0));
        
        // Touch events
        jumpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            changeDinoDirection(1);
        });
        jumpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            changeDinoDirection(0);
        });
        
        duckBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            changeDinoDirection(-1);
        });
        duckBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            changeDinoDirection(0);
        });
        
        // Show mobile controls on touch devices
        if ('ontouchstart' in window) {
            const mobileControls = document.querySelector('.mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = 'flex';
            }
        }
    }

    function handleKeyDown(e) {
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
                
            case 'Enter':
                e.preventDefault();
                if (game.state === GameState.MENU) {
                    startNewGame();
                } else if (game.state === GameState.GAME_OVER) {
                    startNewGame();
                }
                break;
        }
    }

    function handleKeyUp(e) {
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

    // ====== GAME STATE MANAGEMENT ======
    function startNewGame() {
        console.log("🚀 Starting new game...");
        
        // Reset game state
        game.state = GameState.PLAYING;
        game.score = 0;
        game.speed = GameConfig.INITIAL_SPEED;
        game.dinoY = 100;
        game.dinoDirection = 0;
        game.obstacles = [];
        game.clouds = [];
        game.groundX = 0;
        game.lastObstacleTime = 0;
        game.lastCloudTime = 0;
        
        // Clear all obstacles
        clearAllObstacles();
        
        // Reset dino
        dino.classList.remove('tilt-up', 'tilt-down');
        dino.classList.add('flying');
        dino.style.bottom = '100px';
        
        // Hide UI elements
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        if (pausedText) pausedText.style.display = 'none';
        
        // Update button text
        if (restartBtn) restartBtn.textContent = 'Restart Game';
        
        // Update displays
        updateDisplays();
        updateAltitude();
        
        // Create initial clouds
        createInitialClouds();
        
        console.log("✅ Game started! State:", game.state);
    }

    function togglePause() {
        if (game.state === GameState.PLAYING) {
            game.state = GameState.PAUSED;
            if (pausedText) pausedText.style.display = 'block';
            console.log("⏸️ Game paused");
        } else if (game.state === GameState.PAUSED) {
            game.state = GameState.PLAYING;
            if (pausedText) pausedText.style.display = 'none';
            console.log("▶️ Game resumed");
        }
    }

    function gameOver() {
        console.log("💥 Game Over! Score:", game.score);
        game.state = GameState.GAME_OVER;
        
        // Remove flying animation
        dino.classList.remove('flying', 'tilt-up', 'tilt-down');
        
        // Update high score
        if (game.score > game.highScore) {
            game.highScore = game.score;
            localStorage.setItem('dinoHighScore', game.highScore);
            console.log("🏆 New high score!", game.highScore);
        }
        
        // Show game over screen
        showGameOver();
    }

    function clearAllObstacles() {
        // Clear obstacles array
        game.obstacles = [];
        
        // Remove all obstacle elements from DOM
        const obstacles = document.querySelectorAll('.obstacle');
        obstacles.forEach(obstacle => {
            if (obstacle.parentNode) {
                obstacle.remove();
            }
        });
    }

    // ====== GAME LOOP ======
    function gameUpdate(timestamp) {
        if (game.state === GameState.PLAYING) {
            // Initialize timestamps if not set
            if (!game.lastObstacleTime) game.lastObstacleTime = timestamp;
            if (!game.lastCloudTime) game.lastCloudTime = timestamp;
            
            updateGame(timestamp);
            checkCollisions();
        } else if (game.state === GameState.MENU || game.state === GameState.GAME_OVER || game.state === GameState.PAUSED) {
            // Animate ground and clouds in menu/game over/paused states
            updateGround();
            updateClouds();
        }
        
        // Continue game loop
        game.gameLoop = requestAnimationFrame(gameUpdate);
    }

    function updateGame(timestamp) {
        // Move dino
        moveDino();
        
        // Update score
        game.score += GameConfig.SCORE_INCREMENT;
        
        // Speed up
        if (game.speed < GameConfig.MAX_SPEED) {
            game.speed += GameConfig.SPEED_INCREMENT;
        }
        
        // Create obstacles
        if (timestamp - game.lastObstacleTime > GameConfig.OBSTACLE_INTERVAL / (game.speed / GameConfig.INITIAL_SPEED)) {
            createObstacle();
            game.lastObstacleTime = timestamp;
        }
        
        // Create clouds
        if (timestamp - game.lastCloudTime > GameConfig.CLOUD_INTERVAL) {
            createCloud();
            game.lastCloudTime = timestamp;
        }
        
        // Move everything
        updateGround();
        moveObstacles();
        moveClouds();
        
        // Update displays
        updateDisplays();
    }

    // ====== DINOSAUR MOVEMENT ======
    function moveDino() {
        if (game.dinoDirection === 1 && game.dinoY < GameConfig.MAX_ALTITUDE) {
            game.dinoY += GameConfig.FLY_SPEED;
            dino.classList.add('tilt-up');
            dino.classList.remove('tilt-down');
        } else if (game.dinoDirection === -1 && game.dinoY > GameConfig.MIN_ALTITUDE) {
            game.dinoY -= GameConfig.FLY_SPEED;
            dino.classList.add('tilt-down');
            dino.classList.remove('tilt-up');
        } else {
            dino.classList.remove('tilt-up', 'tilt-down');
            // Gentle downward drift
            if (game.dinoY > GameConfig.MIN_ALTITUDE + 20) {
                game.dinoY -= 0.3;
            }
        }
        
        // Keep in bounds
        game.dinoY = Math.max(GameConfig.MIN_ALTITUDE, 
                            Math.min(GameConfig.MAX_ALTITUDE, game.dinoY));
        
        // Apply position
        dino.style.bottom = `${game.dinoY}px`;
        
        // Update altitude display
        updateAltitude();
    }

    function updateAltitude() {
        if (altitudeDisplay) {
            altitudeDisplay.textContent = Math.round(game.dinoY) + 'px';
        }
        
        if (altitudeBar && altitudeText) {
            const percent = ((game.dinoY - GameConfig.MIN_ALTITUDE) / 
                           (GameConfig.MAX_ALTITUDE - GameConfig.MIN_ALTITUDE)) * 100;
            const height = Math.max(0, Math.min(100, percent));
            
            altitudeBar.style.height = `${height}%`;
            altitudeText.textContent = `Altitude: ${Math.round(game.dinoY)}px`;
            
            // Color coding
            if (height > 80) {
                altitudeBar.style.background = 'linear-gradient(to top, #ea4335, #fbbc04)';
            } else if (height > 50) {
                altitudeBar.style.background = 'linear-gradient(to top, #fbbc04, #34a853)';
            } else {
                altitudeBar.style.background = 'linear-gradient(to top, #34a853, #1a73e8)';
            }
        }
    }

    // ====== OBSTACLES ======
    function createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        
        const types = ['ground', 'low', 'mid', 'high'];
        const type = types[Math.floor(Math.random() * 4)];
        
        let height = 50;
        switch(type) {
            case 'low': height = 100; break;
            case 'mid': height = 150; break;
            case 'high': height = 200; break;
        }
        
        obstacle.style.width = `${GameConfig.OBSTACLE_WIDTH}px`;
        obstacle.style.height = `${height}px`;
        obstacle.style.bottom = '0px';
        obstacle.style.left = `${gameArea.offsetWidth}px`;
        
        // Set color based on height
        if (height <= 50) {
            obstacle.style.background = 'linear-gradient(135deg, #008080 0%, #006400 100%)';
        } else if (height <= 100) {
            obstacle.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)';
        } else if (height <= 150) {
            obstacle.style.background = 'linear-gradient(135deg, #FFD93D 0%, #FF9A3D 100%)';
        } else {
            obstacle.style.background = 'linear-gradient(135deg, #6BCF7F 0%, #4CD97B 100%)';
        }
        
        gameArea.appendChild(obstacle);
        
        game.obstacles.push({
            element: obstacle,
            x: gameArea.offsetWidth,
            width: GameConfig.OBSTACLE_WIDTH,
            height: height,
            type: type
        });
        
        if (obstaclesCount) {
            obstaclesCount.textContent = game.obstacles.length;
        }
    }

    function moveObstacles() {
        for (let i = game.obstacles.length - 1; i >= 0; i--) {
            const obstacle = game.obstacles[i];
            obstacle.x -= game.speed;
            obstacle.element.style.left = `${obstacle.x}px`;
            
            if (obstacle.x < -obstacle.width) {
                if (obstacle.element.parentNode) {
                    obstacle.element.remove();
                }
                game.obstacles.splice(i, 1);
            }
        }
        if (obstaclesCount) {
            obstaclesCount.textContent = game.obstacles.length;
        }
    }

    // ====== CLOUDS ======
    function createInitialClouds() {
        for (let i = 0; i < 3; i++) {
            createCloud(true);
        }
    }

    function createCloud(randomX = false) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        
        const size = 40 + Math.random() * 40;
        const y = 20 + Math.random() * 100;
        const x = randomX ? Math.random() * gameArea.offsetWidth : gameArea.offsetWidth;
        
        cloud.style.width = `${size}px`;
        cloud.style.height = `${size/2}px`;
        cloud.style.top = `${y}px`;
        cloud.style.left = `${x}px`;
        
        gameArea.appendChild(cloud);
        game.clouds.push({
            element: cloud,
            x: x,
            width: size,
            speed: 0.5 + Math.random() * 1
        });
    }

    function moveClouds() {
        for (let i = game.clouds.length - 1; i >= 0; i--) {
            const cloud = game.clouds[i];
            cloud.x -= cloud.speed;
            cloud.element.style.left = `${cloud.x}px`;
            
            if (cloud.x < -cloud.width) {
                if (cloud.element.parentNode) {
                    cloud.element.remove();
                }
                game.clouds.splice(i, 1);
            }
        }
    }

    // ====== GROUND ======
    function updateGround() {
        game.groundX -= game.speed;
        if (game.groundX <= -800) {
            game.groundX = 0;
        }
        if (ground) {
            ground.style.transform = `translateX(${game.groundX}px)`;
        }
    }

    // ====== COLLISION DETECTION ======
    function checkCollisions() {
        const dinoRect = {
            x: GameConfig.DINO_X,
            y: game.dinoY,
            width: GameConfig.DINO_WIDTH,
            height: GameConfig.DINO_HEIGHT
        };
        
        for (const obstacle of game.obstacles) {
            const obstacleRect = {
                x: obstacle.x,
                y: 0,
                width: obstacle.width,
                height: obstacle.height
            };
            
            if (dinoRect.x < obstacleRect.x + obstacleRect.width &&
                dinoRect.x + dinoRect.width > obstacleRect.x &&
                dinoRect.y < obstacleRect.height &&
                dinoRect.y + dinoRect.height > obstacleRect.y) {
                
                handleCollision();
                return;
            }
        }
        
        // Check ground collision
        if (game.dinoY <= GameConfig.MIN_ALTITUDE) {
            handleCollision();
        }
    }

    function handleCollision() {
        console.log("💥 Collision detected!");
        
        // Visual feedback
        if (collisionEffect) {
            collisionEffect.style.display = 'block';
            collisionEffect.style.animation = 'none';
            void collisionEffect.offsetWidth; // Trigger reflow
            collisionEffect.style.animation = 'flashRed 0.5s';
            
            setTimeout(() => {
                collisionEffect.style.display = 'none';
            }, 500);
        }
        
        // End game
        setTimeout(gameOver, 200);
    }

    // ====== UI UPDATES ======
    function updateDisplays() {
        if (scoreElement) scoreElement.textContent = Math.floor(game.score);
        if (highScoreElement) highScoreElement.textContent = game.highScore;
        if (speedDisplay) speedDisplay.textContent = game.speed.toFixed(1) + 'x';
        
        // Flash score on milestones
        if (Math.floor(game.score) % 100 === 0 && Math.floor(game.score) > 0) {
            scoreElement.classList.add('score-increase');
            setTimeout(() => {
                scoreElement.classList.remove('score-increase');
            }, 300);
        }
    }

    function showMenu() {
        console.log("📱 Showing menu");
        if (gameOverScreen) {
            gameOverScreen.style.display = 'block';
        }
        if (gameTitle) {
            gameTitle.textContent = 'Flying Dino Game';
        }
        if (gameMessage) {
            gameMessage.textContent = 'Press SPACE or click Start to play';
        }
        if (restartBtn) {
            restartBtn.textContent = 'Start Game';
        }
        if (finalScoreElement) {
            finalScoreElement.textContent = '0';
        }
        if (finalHighScoreElement) {
            finalHighScoreElement.textContent = game.highScore;
        }
    }

    function showGameOver() {
        console.log("📱 Showing game over screen");
        if (gameOverScreen) {
            gameOverScreen.style.display = 'block';
        }
        if (gameTitle) {
            gameTitle.textContent = 'Game Over';
        }
        if (gameMessage) {
            gameMessage.textContent = 'You crashed! Try again?';
        }
        if (finalScoreElement) {
            finalScoreElement.textContent = Math.floor(game.score);
        }
        if (finalHighScoreElement) {
            finalHighScoreElement.textContent = game.highScore;
        }
        if (restartBtn) {
            restartBtn.textContent = 'Play Again';
        }
    }

    // ====== INITIALIZATION ======
    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }

    // ====== GLOBAL FUNCTIONS ======
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

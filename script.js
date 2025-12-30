// Google Dino Game - Complete JavaScript Implementation
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
        JUMP_HEIGHT: 150,
        JUMP_DURATION: 500,
        DUCK_HEIGHT: 30,
        OBSTACLE_INTERVAL: 1500,
        CLOUD_INTERVAL: 3000,
        BIRD_SPAWN_INTERVAL: 10000,
        SCORE_INCREMENT: 1,
        GROUND_HEIGHT: 25
    };

    // Game state
    let state = {
        current: GAME_STATES.MENU,
        score: 0,
        highScore: parseInt(localStorage.getItem('dinoHighScore')) || 0,
        speed: CONFIG.INITIAL_SPEED,
        isJumping: false,
        isDucking: false,
        isInvincible: false,
        obstacles: [],
        clouds: [],
        birds: [],
        groundPositions: [0, 800],
        lastObstacleTime: 0,
        lastCloudTime: 0,
        lastBirdTime: 0,
        gameLoopId: null,
        level: 1,
        combo: 0,
        lastJumpTime: 0
    };

    // ============================================
    // DOM ELEMENTS
    // ============================================
    const elements = {
        // Game elements
        gameArea: document.getElementById('game-area'),
        dino: document.getElementById('dino'),
        ground: document.querySelector('.ground'),
        
        // UI elements
        scoreElement: document.getElementById('score'),
        highScoreElement: document.getElementById('high-score'),
        finalScoreElement: document.getElementById('final-score'),
        finalHighScoreElement: document.getElementById('final-high-score'),
        gameOverScreen: document.getElementById('game-over'),
        restartBtn: document.getElementById('restart-btn'),
        speedElement: document.getElementById('speed'),
        obstaclesCountElement: document.getElementById('obstacles-count'),
        pausedText: document.getElementById('paused-text'),
        
        // Control elements
        jumpBtn: document.getElementById('jump-btn'),
        duckBtn: document.getElementById('duck-btn'),
        
        // Game stats
        levelElement: document.getElementById('level'),
        comboElement: document.getElementById('combo'),
        
        // Collision effect
        collisionEffect: document.querySelector('.collision-effect'),
        
        // Difficulty indicator dots
        difficultyDots: document.querySelectorAll('.difficulty-dot'),
        
        // Speed indicator
        speedIndicator: document.querySelector('.speed-indicator')
    };

    // ============================================
    // GAME INITIALIZATION
    // ============================================
    function initGame() {
        // Set initial UI state
        updateUI();
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
        elements.jumpBtn.addEventListener('click', handleJump);
        elements.duckBtn.addEventListener('mousedown', () => handleDuck(true));
        elements.duckBtn.addEventListener('mouseup', () => handleDuck(false));
        elements.duckBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleDuck(true);
        });
        elements.duckBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleDuck(false);
        });
        
        // Touch controls for mobile
        elements.gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (state.current === GAME_STATES.MENU) {
                startGame();
            } else if (state.current === GAME_STATES.PLAYING) {
                handleJump();
            }
        });
        
        // Prevent context menu on right click
        elements.gameArea.addEventListener('contextmenu', (e) => e.preventDefault());
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
                    handleJump();
                } else if (state.current === GAME_STATES.GAME_OVER) {
                    handleRestart();
                }
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                if (state.current === GAME_STATES.PLAYING) {
                    handleDuck(true);
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
    }

    function handleKeyUp(e) {
        if ((e.code === 'ArrowDown' || e.code === 'KeyS') && state.current === GAME_STATES.PLAYING) {
            handleDuck(false);
        }
    }

    function handleJump() {
        if (!state.isJumping && state.current === GAME_STATES.PLAYING) {
            const now = Date.now();
            if (now - state.lastJumpTime < 100) return; // Prevent rapid jumping
            
            state.isJumping = true;
            state.lastJumpTime = now;
            
            // Add combo for consecutive jumps
            if (now - state.lastJumpTime < 1000) {
                state.combo++;
                updateCombo();
            } else {
                state.combo = 1;
            }
            
            // Jump animation
            elements.dino.classList.add('jumping');
            elements.dino.style.bottom = `${CONFIG.GROUND_HEIGHT + CONFIG.JUMP_HEIGHT}px`;
            
            // Jump sound effect
            playJumpSound();
            
            // Reset jump after duration
            setTimeout(() => {
                if (state.current === GAME_STATES.PLAYING) {
                    elements.dino.classList.remove('jumping');
                    elements.dino.style.bottom = `${CONFIG.GROUND_HEIGHT}px`;
                    state.isJumping = false;
                }
            }, CONFIG.JUMP_DURATION);
        }
    }

    function handleDuck(isDucking) {
        if (state.current === GAME_STATES.PLAYING && !state.isJumping) {
            state.isDucking = isDucking;
            if (isDucking) {
                elements.dino.classList.add('ducking');
                elements.dino.style.height = '40px';
            } else {
                elements.dino.classList.remove('ducking');
                elements.dino.style.height = '70px';
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
        updateDifficultyDots();
        
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
        
        // Play game over sound
        playGameOverSound();
    }

    function resetGame() {
        // Clear all obstacles, clouds, and birds
        state.obstacles.forEach(obstacle => obstacle.element.remove());
        state.clouds.forEach(cloud => cloud.element.remove());
        state.birds.forEach(bird => bird.element.remove());
        
        // Reset state
        state.obstacles = [];
        state.clouds = [];
        state.birds = [];
        state.score = 0;
        state.speed = CONFIG.INITIAL_SPEED;
        state.isJumping = false;
        state.isDucking = false;
        state.level = 1;
        state.combo = 0;
        
        // Reset dino position
        elements.dino.classList.remove('jumping', 'ducking');
        elements.dino.style.bottom = `${CONFIG.GROUND_HEIGHT}px`;
        elements.dino.style.height = '70px';
        
        // Reset UI
        updateUI();
        updateDifficultyDots();
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
            
            // Draw everything
            draw();
            
            // Check for collisions
            checkCollisions();
            
            // Schedule next frame
            state.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    function updateGame(timestamp) {
        // Update score
        state.score += CONFIG.SCORE_INCREMENT;
        if (state.score % 100 === 0) {
            // Play score milestone sound
            playScoreSound();
            
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
            updateLevel();
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
        
        // Spawn birds (after level 2)
        if (state.level >= 2 && timestamp - state.lastBirdTime > CONFIG.BIRD_SPAWN_INTERVAL) {
            spawnBird();
            state.lastBirdTime = timestamp;
        }
        
        // Update ground movement
        updateGround();
        
        // Update all moving objects
        updateObstacles();
        updateClouds();
        updateBirds();
        
        // Update UI
        updateUI();
    }

    function draw() {
        // Update positions of all game objects
        state.obstacles.forEach(obstacle => {
            obstacle.element.style.left = `${obstacle.x}px`;
        });
        
        state.clouds.forEach(cloud => {
            cloud.element.style.left = `${cloud.x}px`;
        });
        
        state.birds.forEach(bird => {
            bird.element.style.left = `${bird.x}px`;
            bird.element.style.top = `${bird.y}px`;
        });
    }

    // ============================================
    // GAME OBJECT MANAGEMENT
    // ============================================
    function spawnObstacle() {
        const obstacleTypes = ['cactus-small', 'cactus-small', 'cactus-small', 'cactus-large'];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle ${type}`;
        
        // Randomize properties based on type
        let width, height;
        if (type === 'cactus-small') {
            width = 25;
            height = 40 + Math.random() * 20;
        } else {
            width = 40;
            height = 60 + Math.random() * 20;
        }
        
        obstacle.style.width = `${width}px`;
        obstacle.style.height = `${height}px`;
        
        elements.gameArea.appendChild(obstacle);
        
        state.obstacles.push({
            element: obstacle,
            x: elements.gameArea.offsetWidth,
            y: CONFIG.GROUND_HEIGHT,
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
        cloud.style.height = `${size / 2}px`;
        cloud.style.top = `${y}px`;
        cloud.style.left = `${elements.gameArea.offsetWidth}px`;
        cloud.style.opacity = 0.7 + Math.random() * 0.3;
        
        elements.gameArea.appendChild(cloud);
        
        state.clouds.push({
            element: cloud,
            x: elements.gameArea.offsetWidth,
            y: y,
            width: size,
            speed: 0.5 + Math.random() * 1
        });
    }

    function spawnBird() {
        const bird = document.createElement('div');
        bird.className = 'bird';
        bird.innerHTML = `
            <div class="bird-body"></div>
            <div class="bird-wing"></div>
        `;
        
        const height = 80 + Math.random() * 100;
        const size = 20 + Math.random() * 10;
        
        bird.style.width = `${size}px`;
        bird.style.height = `${size}px`;
        bird.style.top = `${height}px`;
        bird.style.left = `${elements.gameArea.offsetWidth}px`;
        
        // Style bird parts
        const style = document.createElement('style');
        style.textContent = `
            .bird { position: absolute; }
            .bird-body { 
                width: 100%; 
                height: 100%; 
                background: #5f6368; 
                border-radius: 50%; 
                position: absolute; 
            }
            .bird-wing { 
                width: 150%; 
                height: 80%; 
                background: #5f6368; 
                border-radius: 50%; 
                position: absolute; 
                top: 20%; 
                left: -25%; 
                transform-origin: center; 
                animation: flap 0.3s infinite alternate; 
            }
            @keyframes flap {
                from { transform: scaleY(1); }
                to { transform: scaleY(0.7); }
            }
        `;
        document.head.appendChild(style);
        
        elements.gameArea.appendChild(bird);
        
        state.birds.push({
            element: bird,
            x: elements.gameArea.offsetWidth,
            y: height,
            width: size,
            speed: 3 + Math.random() * 2
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
            cloud.style.height = `${size / 2}px`;
            cloud.style.top = `${y}px`;
            cloud.style.left = `${x}px`;
            cloud.style.opacity = 0.7 + Math.random() * 0.3;
            
            elements.gameArea.appendChild(cloud);
            
            state.clouds.push({
                element: cloud,
                x: x,
                y: y,
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
            
            if (cloud.x < -cloud.width) {
                cloud.element.remove();
                state.clouds.splice(i, 1);
            }
        }
    }

    function updateBirds() {
        for (let i = state.birds.length - 1; i >= 0; i--) {
            const bird = state.birds[i];
            bird.x -= bird.speed;
            
            // Add slight vertical movement
            bird.y += Math.sin(Date.now() / 500) * 0.5;
            
            if (bird.x < -bird.width) {
                bird.element.remove();
                state.birds.splice(i, 1);
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
        if (state.isInvincible) return;
        
        const dinoRect = {
            x: 60,
            y: state.isJumping ? CONFIG.GROUND_HEIGHT + CONFIG.JUMP_HEIGHT : CONFIG.GROUND_HEIGHT,
            width: state.isDucking ? 60 : 60,
            height: state.isDucking ? 40 : 70
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
        
        // Check bird collisions
        for (const bird of state.birds) {
            const birdRect = {
                x: bird.x,
                y: bird.y,
                width: bird.width,
                height: bird.width
            };
            
            if (checkRectCollision(dinoRect, birdRect)) {
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
        showCollisionEffect();
        
        // End game
        gameOver();
    }

    // ============================================
    // UI UPDATES
    // ============================================
    function updateUI() {
        elements.scoreElement.textContent = Math.floor(state.score);
        elements.highScoreElement.textContent = state.highScore;
        elements.speedElement.textContent = state.speed.toFixed(1);
        
        // Update speed indicator
        if (elements.speedIndicator) {
            elements.speedIndicator.textContent = `Speed: ${state.speed.toFixed(1)}x`;
            elements.speedIndicator.style.display = 'block';
        }
    }

    function updateObstacleCount() {
        if (elements.obstaclesCountElement) {
            elements.obstaclesCountElement.textContent = state.obstacles.length;
        }
    }

    function updateLevel() {
        if (elements.levelElement) {
            elements.levelElement.textContent = state.level;
        }
        updateDifficultyDots();
    }

    function updateCombo() {
        if (elements.comboElement && state.combo > 1) {
            elements.comboElement.textContent = `Combo: x${state.combo}`;
            elements.comboElement.style.display = 'block';
            
            // Hide combo after 1 second
            setTimeout(() => {
                if (elements.comboElement) {
                    elements.comboElement.style.display = 'none';
                }
            }, 1000);
        }
    }

    function updateDifficultyDots() {
        if (elements.difficultyDots) {
            const activeDots = Math.min(state.level, elements.difficultyDots.length);
            elements.difficultyDots.forEach((dot, index) => {
                dot.classList.toggle('active', index < activeDots);
            });
        }
    }

    // ============================================
    // VISUAL EFFECTS
    // ============================================
    function showCollisionEffect() {
        if (elements.collisionEffect) {
            elements.collisionEffect.style.display = 'block';
            elements.collisionEffect.style.animation = 'none';
            void elements.collisionEffect.offsetWidth; // Trigger reflow
            elements.collisionEffect.style.animation = 'flashRed 0.5s';
            
            setTimeout(() => {
                elements.collisionEffect.style.display = 'none';
            }, 500);
        }
    }

    function showStartScreen() {
        elements.gameOverScreen.style.display = 'block';
        const title = elements.gameOverScreen.querySelector('h2');
        const message = elements.gameOverScreen.querySelectorAll('p')[0];
        
        if (title) title.textContent = 'Chrome Dino Game';
        if (message) message.textContent = 'Press SPACE or TAP to start';
        
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
        
        // Show level reached
        const message = elements.gameOverScreen.querySelectorAll('p')[0];
        if (message) {
            message.textContent = `You reached level ${state.level} with a score of ${Math.floor(state.score)}!`;
        }
    }

    // ============================================
    // SOUND EFFECTS
    // ============================================
    function playJumpSound() {
        // Create jump sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Audio context not supported");
        }
    }

    function playScoreSound() {
        // Play sound for every 100 points
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
            oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log("Audio context not supported");
        }
    }

    function playGameOverSound() {
        // Play game over sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime); // F4
            oscillator.frequency.exponentialRampToValueAtTime(261.63, audioContext.currentTime + 0.3); // C4
            oscillator.frequency.exponentialRampToValueAtTime(196.00, audioContext.currentTime + 0.6); // G3
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
            
            oscillator.type = 'sine';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        } catch (e) {
            console.log("Audio context not supported");
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // ============================================
    // INITIALIZE GAME
    // ============================================
    // Create additional UI elements if they don't exist
    function createUIElements() {
        // Create collision effect element
        if (!elements.collisionEffect) {
            const collisionEffect = document.createElement('div');
            collisionEffect.className = 'collision-effect';
            elements.gameArea.appendChild(collisionEffect);
            elements.collisionEffect = collisionEffect;
        }
        
        // Create level and combo displays if they don't exist
        if (!elements.levelElement) {
            const levelElement = document.createElement('div');
            levelElement.id = 'level-display';
            levelElement.style.cssText = 'position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px;';
            levelElement.innerHTML = 'Level: <span id="level">1</span>';
            elements.gameArea.appendChild(levelElement);
            elements.levelElement = levelElement.querySelector('#level');
        }
        
        if (!elements.comboElement) {
            const comboElement = document.createElement('div');
            comboElement.id = 'combo-display';
            comboElement.style.cssText = 'position: absolute; top: 40px; left: 50%; transform: translateX(-50%); background: rgba(255,215,0,0.9); color: black; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; display: none;';
            comboElement.textContent = 'Combo: x1';
            elements.gameArea.appendChild(comboElement);
            elements.comboElement = comboElement;
        }
        
        // Create speed indicator
        if (!elements.speedIndicator) {
            const speedIndicator = document.createElement('div');
            speedIndicator.className = 'speed-indicator';
            speedIndicator.textContent = 'Speed: 1.0x';
            elements.gameArea.appendChild(speedIndicator);
            elements.speedIndicator = speedIndicator;
        }
        
        // Create difficulty indicator
        if (!elements.difficultyDots || elements.difficultyDots.length === 0) {
            const difficultyIndicator = document.createElement('div');
            difficultyIndicator.className = 'difficulty-indicator';
            difficultyIndicator.innerHTML = `
                <div class="difficulty-dot"></div>
                <div class="difficulty-dot"></div>
                <div class="difficulty-dot"></div>
                <div class="difficulty-dot"></div>
                <div class="difficulty-dot"></div>
            `;
            elements.gameArea.appendChild(difficultyIndicator);
            elements.difficultyDots = difficultyIndicator.querySelectorAll('.difficulty-dot');
        }
    }

    // Initialize the game
    createUIElements();
    initGame();

    // ============================================
    // WINDOW EVENT LISTENERS
    // ============================================
    window.addEventListener('blur', () => {
        if (state.current === GAME_STATES.PLAYING) {
            togglePause();
        }
    });

    window.addEventListener('resize', () => {
        // Adjust game elements on resize
        if (state.current === GAME_STATES.PLAYING) {
            // Reposition obstacles and clouds
            state.obstacles.forEach(obstacle => {
                if (obstacle.x > elements.gameArea.offsetWidth) {
                    obstacle.element.remove();
                }
            });
            
            state.clouds.forEach(cloud => {
                if (cloud.x > elements.gameArea.offsetWidth) {
                    cloud.element.remove();
                }
            });
        }
    });

    // ============================================
    // DEBUG FUNCTIONS (Optional - remove in production)
    // ============================================
    window.debugGame = {
        setScore: (value) => {
            state.score = value;
            updateUI();
        },
        setSpeed: (value) => {
            state.speed = value;
            updateUI();
        },
        setInvincible: (value) => {
            state.isInvincible = value;
            console.log(`Invincibility: ${value ? 'ON' : 'OFF'}`);
        },
        skipLevel: () => {
            state.score = state.level * 1000;
            updateUI();
            updateLevel();
        },
        getState: () => ({ ...state }),
        clearObstacles: () => {
            state.obstacles.forEach(obstacle => obstacle.element.remove());
            state.obstacles = [];
            updateObstacleCount();
        }
    };

    // ============================================
    // EXPORT GAME FUNCTIONS (for integration)
    // ============================================
    window.dinoGame = {
        start: startGame,
        pause: togglePause,
        restart: handleRestart,
        jump: handleJump,
        duck: (isDucking) => handleDuck(isDucking),
        getScore: () => state.score,
        getHighScore: () => state.highScore,
        getState: () => state.current
    };
});

// ============================================
// ADDITIONAL GLOBAL FUNCTIONS
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
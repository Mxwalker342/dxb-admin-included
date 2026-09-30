/**
 * DXB Arcade: Burger Blitz // Zone 04
 * Interactive retro arcade mini-game for DXB Gaming Zone
 */

(function () {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArcade);
  } else {
    initArcade();
  }

  function initArcade() {
    const canvas = document.getElementById('dxb-arcade-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const wrap = document.getElementById('arcade-canvas-wrap');
    const soundBtn = document.getElementById('arcade-sound-btn');
    const topScoreEl = document.getElementById('arcade-top-score');
    const currentScoreEl = document.getElementById('arcade-current-score');

    // Controls (Only Left and Right buttons)
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // Canvas internal resolution
    const V_WIDTH = 800;
    const V_HEIGHT = 520;
    canvas.width = V_WIDTH;
    canvas.height = V_HEIGHT;

    // High Score from storage
    const HIGH_SCORE_KEY = 'dxb_arcade_high_score_v1';
    let highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '850', 10);
    if (topScoreEl) {
      topScoreEl.textContent = String(highScore).padStart(6, '0');
    }
    if (currentScoreEl) {
      currentScoreEl.textContent = '000000';
    }

    // Sound System (Web Audio API Synthesizer)
    let soundEnabled = true;
    let audioCtx = null;

    function getAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    function playTone(freq, type, duration, endFreq = null, volume = 0.15) {
      if (!soundEnabled) return;
      try {
        const actx = getAudioContext();
        if (!actx) return;
        const osc = actx.createOscillator();
        const gain = actx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, actx.currentTime);
        if (endFreq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), actx.currentTime + duration);
        }

        gain.gain.setValueAtTime(volume, actx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);

        osc.connect(gain);
        gain.connect(actx.destination);

        osc.start();
        osc.stop(actx.currentTime + duration);
      } catch (e) {
        // Audio error suppression
      }
    }

    function playSound(name) {
      if (!soundEnabled) return;
      switch (name) {
        case 'coin':
          playTone(523.25, 'sine', 0.08, 659.25, 0.2);
          setTimeout(() => playTone(1046.5, 'sine', 0.2, 1318.5, 0.25), 90);
          break;
        case 'catch_patty':
          playTone(220, 'square', 0.1, 440, 0.12);
          break;
        case 'catch_cheese':
          playTone(440, 'triangle', 0.09, 660, 0.15);
          break;
        case 'catch_bacon':
          playTone(330, 'square', 0.1, 550, 0.15);
          break;
        case 'catch_fries':
          playTone(587, 'sine', 0.12, 880, 0.2);
          break;
        case 'powerup':
          [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
            setTimeout(() => playTone(f, 'square', 0.09, f * 1.2, 0.18), idx * 55);
          });
          break;
        case 'complete_burger':
          [523, 659, 784, 1046, 1318].forEach((f, idx) => {
            setTimeout(() => playTone(f, 'triangle', 0.15, null, 0.22), idx * 60);
          });
          break;
        case 'hazard':
          playTone(150, 'sawtooth', 0.25, 40, 0.25);
          break;
        case 'gameover':
          [440, 392, 349, 293, 220].forEach((f, idx) => {
            setTimeout(() => playTone(f, 'sawtooth', 0.22, f * 0.85, 0.2), idx * 100);
          });
          break;
        case 'wave_up':
          [440, 554, 659, 880].forEach((f, idx) => {
            setTimeout(() => playTone(f, 'sine', 0.14, null, 0.2), idx * 75);
          });
          break;
      }
    }

    // Sound toggle button
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 SOUND: ON' : '🔇 SOUND: OFF';
        soundBtn.classList.toggle('muted', !soundEnabled);
        if (soundEnabled) {
          getAudioContext();
          playSound('coin');
        }
      });
    }

    // Input States
    const keys = {
      left: false,
      right: false,
      turbo: false
    };

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      // Avoid stealing arrows if player is elsewhere unless arcade canvas is in view or focused
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        const rect = canvas.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView && gameState !== 'GAMEOVER') {
          // allow space or arrows to control game
          if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            e.preventDefault();
          }
        }
      }

      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = true;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = true;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keys.turbo = true;
      }
      if (e.code === 'KeyP') {
        togglePause();
      }

      // Start game on keypress from title screen
      if (gameState === 'TITLE' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        startGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keys.left = false;
      }
      if (e.code === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keys.right = false;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keys.turbo = false;
      }
    });

    // Touch and On-Screen buttons
    function attachHoldButton(btn, onDown, onUp) {
      if (!btn) return;
      const start = (e) => {
        e.preventDefault();
        getAudioContext();
        if (gameState === 'TITLE' || gameState === 'GAMEOVER') {
          startGame();
        }
        onDown();
      };
      const end = (e) => {
        e.preventDefault();
        onUp();
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', end);
    }

    attachHoldButton(btnLeft, () => { keys.left = true; }, () => { keys.left = false; });
    attachHoldButton(btnRight, () => { keys.right = true; }, () => { keys.right = false; });

    // Direct touch / mouse drag on canvas
    let isDragging = false;
    function getCanvasCoords(evt) {
      const rect = canvas.getBoundingClientRect();
      const clientX = evt.clientX || (evt.touches && evt.touches[0] ? evt.touches[0].clientX : 0);
      const clientY = evt.clientY || (evt.touches && evt.touches[0] ? evt.touches[0].clientY : 0);
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    canvas.addEventListener('pointerdown', (e) => {
      getAudioContext();
      const coords = getCanvasCoords(e);

      if (gameState === 'TITLE') {
        startGame();
        return;
      }
      if (gameState === 'GAMEOVER') {
        // Check retry button click
        if (coords.x >= 280 && coords.x <= 520 && coords.y >= 380 && coords.y <= 440) {
          startGame();
        } else {
          startGame();
        }
        return;
      }
      if (gameState === 'PAUSED') {
        togglePause();
        return;
      }

      isDragging = true;
      targetPlayerX = coords.x;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging || gameState !== 'PLAYING') return;
      const coords = getCanvasCoords(e);
      targetPlayerX = coords.x;
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });

    // Game Variables
    let gameState = 'TITLE'; // 'TITLE', 'PLAYING', 'PAUSED', 'GAMEOVER'
    let score = 0;
    let displayedScore = 0;
    let lives = 3;
    let wave = 1;
    let combo = 0;
    let maxCombo = 0;
    let burgersCompleted = 0;
    let frenzyTimer = 0; // Frenzy mode in seconds
    let screenShake = 0;
    let targetPlayerX = V_WIDTH / 2;

    // Item Definitions
    const ITEM_TYPES = [
      { id: 'patty', name: 'Smash Patty', pts: 20, color: '#633919', icon: '🥩', weight: 30 },
      { id: 'cheese', name: 'Cheddar Melt', pts: 15, color: '#f7bf35', icon: '🧀', weight: 26 },
      { id: 'bacon', name: 'Crispy Bacon', pts: 25, color: '#b93822', icon: '🥓', weight: 18 },
      { id: 'fries', name: 'DXB Fries', pts: 35, color: '#f59e0b', icon: '🍟', weight: 12 },
      { id: 'shake', name: 'Choco Shake', pts: 50, color: '#7c3aed', icon: '🥤', special: 'frenzy', weight: 6 },
      { id: 'topbun', name: 'Brioche Crown', pts: 40, color: '#e09f47', icon: '🍔', finisher: true, weight: 10 },
      { id: 'hazard_chili', name: 'Spicy Coal', pts: -10, color: '#ef4444', icon: '🌶️', hazard: true, weight: 12 }
    ];

    // Player Object
    const player = {
      x: V_WIDTH / 2,
      y: V_HEIGHT - 65,
      width: 104,
      height: 24,
      speed: 8.5,
      dashMultiplier: 1.8,
      vx: 0,
      burgerStack: ['bun'], // base bun starts on spatula
      glowPhase: 0
    };

    // Falling Objects
    let items = [];
    let particles = [];
    let floatingTexts = [];

    // Wave Configs
    const WAVES = [
      { name: 'XTREME BOSS BLITZ', targetScore: 250, spawnRate: 65, baseSpeed: 2.8, hazardChance: 0.1 },
      { name: 'DRIP BEAST RUSH', targetScore: 600, spawnRate: 52, baseSpeed: 3.6, hazardChance: 0.16 },
      { name: 'HEXXA BURGER WAVE', targetScore: 1100, spawnRate: 42, baseSpeed: 4.4, hazardChance: 0.22 },
      { name: 'DALLAS SMASHED MASTER', targetScore: 99999, spawnRate: 34, baseSpeed: 5.2, hazardChance: 0.28 }
    ];

    let spawnTimer = 0;

    function resetGame() {
      score = 0;
      displayedScore = 0;
      if (currentScoreEl) {
        currentScoreEl.textContent = '000000';
      }
      lives = 3;
      wave = 1;
      combo = 0;
      maxCombo = 0;
      burgersCompleted = 0;
      frenzyTimer = 0;
      screenShake = 0;
      items = [];
      particles = [];
      floatingTexts = [];
      player.x = V_WIDTH / 2;
      player.vx = 0;
      player.burgerStack = ['bun'];
      targetPlayerX = V_WIDTH / 2;
      spawnTimer = 0;
    }

    function startGame() {
      resetGame();
      gameState = 'PLAYING';
      playSound('coin');
    }

    function togglePause() {
      if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
      } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
      }
    }

    // Spawn falling items
    function spawnItem() {
      const currentWaveConfig = WAVES[Math.min(wave - 1, WAVES.length - 1)];

      // Pick item based on weighted probability
      let pool = [...ITEM_TYPES];
      if (player.burgerStack.length < 3) {
        // Don't spawn top bun until stack has some meat/cheese!
        pool = pool.filter(i => !i.finisher);
      }

      // Total weights
      const totalWeight = pool.reduce((acc, i) => acc + i.weight, 0);
      let rand = Math.random() * totalWeight;
      let chosen = pool[0];

      for (let item of pool) {
        if (rand < item.weight) {
          chosen = item;
          break;
        }
        rand -= item.weight;
      }

      const speedVariation = 0.8 + Math.random() * 0.4;
      const speed = currentWaveConfig.baseSpeed * speedVariation;

      items.push({
        x: 40 + Math.random() * (V_WIDTH - 80),
        y: -30,
        type: chosen,
        speed: frenzyTimer > 0 ? speed * 0.8 : speed,
        size: 34,
        rotation: (Math.random() - 0.5) * 0.4,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Particle effect
    function addBurst(x, y, color, count = 10, isSpecial = false) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (Math.random() * 4 + 2) * (isSpecial ? 1.6 : 1);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - (Math.random() * 2),
          size: Math.random() * 5 + 3,
          color,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02
        });
      }
    }

    // Floating text feedback (+20, COMBO x2, etc.)
    function addFloatingText(text, x, y, color = '#f7bf35', size = 16) {
      floatingTexts.push({
        text,
        x,
        y,
        color,
        size,
        alpha: 1,
        vy: -1.6
      });
    }

    // Main Game Update
    function update(dt) {
      if (gameState !== 'PLAYING') return;

      // Smooth score rolling
      if (displayedScore < score) {
        displayedScore = Math.min(score, displayedScore + Math.max(1, Math.ceil((score - displayedScore) * 0.15)));
        if (currentScoreEl) {
          currentScoreEl.textContent = String(displayedScore).padStart(6, '0');
        }
      }
      if (displayedScore > highScore) {
        highScore = displayedScore;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        if (topScoreEl) {
          topScoreEl.textContent = String(highScore).padStart(6, '0');
        }
      }

      // Frenzy Countdown
      if (frenzyTimer > 0) {
        frenzyTimer -= dt;
        if (frenzyTimer <= 0) frenzyTimer = 0;
      }

      // Screen shake decay
      if (screenShake > 0) {
        screenShake -= dt * 30;
        if (screenShake < 0) screenShake = 0;
      }

      // Player Movement
      let moveDir = 0;
      if (keys.left) moveDir -= 1;
      if (keys.right) moveDir += 1;

      const currentSpeed = player.speed * (keys.turbo || frenzyTimer > 0 ? player.dashMultiplier : 1);

      if (moveDir !== 0) {
        player.vx = moveDir * currentSpeed;
      } else if (isDragging) {
        const dx = targetPlayerX - (player.x + player.width / 2);
        player.vx = Math.max(-currentSpeed, Math.min(currentSpeed, dx * 0.25));
      } else {
        player.vx *= 0.75; // Friction
      }

      player.x += player.vx;
      if (player.x < 10) {
        player.x = 10;
        player.vx = 0;
      }
      if (player.x + player.width > V_WIDTH - 10) {
        player.x = V_WIDTH - 10 - player.width;
        player.vx = 0;
      }

      player.glowPhase += dt * 5;

      // Spawn items
      spawnTimer += dt * 60;
      const currentWaveConfig = WAVES[Math.min(wave - 1, WAVES.length - 1)];
      const currentRate = frenzyTimer > 0 ? currentWaveConfig.spawnRate * 0.55 : currentWaveConfig.spawnRate;

      if (spawnTimer >= currentRate) {
        spawnItem();
        spawnTimer = 0;
      }

      // Update falling items
      const playerCatchBox = {
        left: player.x - 6,
        right: player.x + player.width + 6,
        top: player.y - (player.burgerStack.length * 7),
        bottom: player.y + player.height
      };

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;
        item.rotation += item.rotSpeed;

        // Frenzy magnet pull
        if (frenzyTimer > 0 && !item.type.hazard) {
          const targetX = player.x + player.width / 2;
          const dist = targetX - item.x;
          item.x += dist * 0.045;
        }

        // Collision check with player tray
        if (
          item.y + item.size / 2 >= playerCatchBox.top &&
          item.y - item.size / 2 <= playerCatchBox.bottom &&
          item.x + item.size / 2 >= playerCatchBox.left &&
          item.x - item.size / 2 <= playerCatchBox.right
        ) {
          handleCatch(item, i);
          continue;
        }

        // Missed item falling off-screen
        if (item.y > V_HEIGHT + 40) {
          items.splice(i, 1);
          // If missed a food item (not a hazard), break combo streak
          if (!item.type.hazard && combo > 0) {
            combo = 0;
            addFloatingText('COMBO LOST', player.x + player.width / 2, player.y - 40, '#94a3b8', 12);
          }
        }
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      // Update floating texts
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy;
        t.alpha -= dt * 0.9;
        if (t.alpha <= 0) {
          floatingTexts.splice(i, 1);
        }
      }

      // Check wave progression
      if (wave < WAVES.length && score >= currentWaveConfig.targetScore) {
        wave++;
        playSound('wave_up');
        addFloatingText(`WAVE ${wave}: ${WAVES[wave - 1].name}!`, V_WIDTH / 2, V_HEIGHT / 2 - 40, '#f7bf35', 24);
        addBurst(V_WIDTH / 2, V_HEIGHT / 2, '#f7bf35', 25, true);
      }
    }

    // Handle caught item
    function handleCatch(item, index) {
      items.splice(index, 1);

      if (item.type.hazard) {
        // Hit hazard!
        lives--;
        combo = 0;
        playSound('hazard');
        addBurst(item.x, item.y, '#ef4444', 16);
        addFloatingText('-1 LIFE! 🌶️', item.x, item.y - 20, '#ef4444', 18);

        if (lives <= 0) {
          gameOver();
        }
        return;
      }

      // Good food item!
      combo++;
      if (combo > maxCombo) maxCombo = combo;
      const multiplier = combo >= 15 ? 4 : combo >= 8 ? 3 : combo >= 4 ? 2 : 1;
      const earned = item.type.pts * multiplier * (frenzyTimer > 0 ? 2 : 1);
      score += earned;

      // Sound mapping
      if (item.type.id === 'patty') playSound('catch_patty');
      else if (item.type.id === 'cheese') playSound('catch_cheese');
      else if (item.type.id === 'bacon') playSound('catch_bacon');
      else if (item.type.id === 'fries') playSound('catch_fries');
      else if (item.type.id === 'shake') {
        playSound('powerup');
        frenzyTimer = 6.0;
        addFloatingText('SUPER SHAKE FRENZY! 🥤', V_WIDTH / 2, V_HEIGHT / 2 - 20, '#a855f7', 22);
        addBurst(item.x, item.y, '#a855f7', 25, true);
      } else {
        playSound('catch_patty');
      }

      // Burst & Floating text
      addBurst(item.x, item.y, item.type.color, 10);
      const comboText = multiplier > 1 ? ` (+${earned} x${multiplier}!)` : ` +${earned}`;
      addFloatingText(`${item.type.name}${comboText}`, item.x, item.y - 18, item.type.color, 14);

      // Add to player burger stack
      player.burgerStack.push(item.type.id);

      // Check if burger is completed (either Crown caught OR 6 layers stacked)
      if (item.type.finisher || player.burgerStack.length >= 6) {
        completeBurger();
      }
    }

    function completeBurger() {
      burgersCompleted++;
      const bonus = 100 * (frenzyTimer > 0 ? 2 : 1);
      score += bonus;
      playSound('complete_burger');
      addBurst(player.x + player.width / 2, player.y - 30, '#f7bf35', 30, true);
      addFloatingText(`BURGER COMPLETE! +${bonus} PTS! 🍔`, player.x + player.width / 2, player.y - 50, '#f7bf35', 20);

      // Reset stack back to base bun
      player.burgerStack = ['bun'];
    }

    function gameOver() {
      gameState = 'GAMEOVER';
      playSound('gameover');

      // Update High Score
      if (score > highScore) {
        highScore = score;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        if (topScoreEl) {
          topScoreEl.textContent = String(highScore).padStart(6, '0');
        }
      }
    }

    // Drawing Helpers
    function drawPixelText(text, x, y, size = 16, color = '#fff', align = 'center') {
      ctx.save();
      ctx.font = `${size}px 'Press Start 2P', monospace, sans-serif`;
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      // Shadow
      ctx.fillStyle = '#000';
      ctx.fillText(text, x + 2, y + 2);
      // Main text
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function drawItem(item) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);

      const type = item.type;
      const s = item.size;

      if (type.id === 'patty') {
        // Patty
        ctx.fillStyle = '#451e0e';
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s / 4, s, s / 2, 6);
        ctx.fill();
        ctx.fillStyle = '#7a3c1a';
        ctx.fillRect(-s / 2 + 4, -s / 4 + 2, s - 8, 3);
        // Grill lines
        ctx.strokeStyle = '#2b1206';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -5); ctx.lineTo(-4, 5);
        ctx.moveTo(0, -5); ctx.lineTo(6, 5);
        ctx.moveTo(8, -5); ctx.lineTo(14, 5);
        ctx.stroke();
      } else if (type.id === 'cheese') {
        // Cheese slice
        ctx.fillStyle = '#f7bf35';
        ctx.beginPath();
        ctx.moveTo(-s / 2, -s / 4);
        ctx.lineTo(s / 2, -s / 4);
        ctx.lineTo(s / 3, s / 3);
        ctx.lineTo(0, s / 6);
        ctx.lineTo(-s / 3, s / 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d99a14';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (type.id === 'bacon') {
        // Wavy bacon
        ctx.fillStyle = '#b93822';
        ctx.beginPath();
        ctx.moveTo(-s / 2, 0);
        ctx.bezierCurveTo(-s / 4, -s / 3, 0, s / 3, s / 4, -s / 4);
        ctx.lineTo(s / 2, -s / 6);
        ctx.bezierCurveTo(s / 4, s / 4, 0, -s / 4, -s / 4, s / 3);
        ctx.closePath();
        ctx.fill();
        // Fat line
        ctx.strokeStyle = '#fecaca';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s / 2 + 4, 1);
        ctx.bezierCurveTo(-s / 4, -s / 3 + 2, 0, s / 3 - 2, s / 4, -s / 4 + 2);
        ctx.stroke();
      } else if (type.id === 'topbun') {
        // Crown Bun
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        // Sesame seeds
        ctx.fillStyle = '#fff9e9';
        [-8, 0, 8].forEach((sx, i) => {
          ctx.beginPath();
          ctx.arc(sx, -8 + (i % 2) * 3, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (type.id === 'fries') {
        // Fries container
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-s / 3, s / 3);
        ctx.lineTo(s / 3, s / 3);
        ctx.lineTo(s / 2.5, -s / 6);
        ctx.lineTo(-s / 2.5, -s / 6);
        ctx.closePath();
        ctx.fill();
        // Golden fries sticking out
        ctx.fillStyle = '#fbbf24';
        [-8, -4, 0, 4, 8].forEach(fx => {
          ctx.fillRect(fx, -s / 2, 3, s / 2.5);
        });
        // DXB lettering
        ctx.fillStyle = '#fff';
        ctx.font = '7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DXB', 0, 4);
      } else if (type.id === 'shake') {
        // Milkshake glass with straw
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.moveTo(-s / 4, s / 2);
        ctx.lineTo(s / 4, s / 2);
        ctx.lineTo(s / 3, -s / 4);
        ctx.lineTo(-s / 3, -s / 4);
        ctx.closePath();
        ctx.fill();
        // Whipped cream
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -s / 4, s / 4, Math.PI, 0, false);
        ctx.fill();
        // Cherry
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -s / 3 - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Straw
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(3, -s / 4);
        ctx.lineTo(10, -s / 2 - 2);
        ctx.stroke();
      } else if (type.hazard) {
        // Chili hazard
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-s / 3, -s / 4);
        ctx.bezierCurveTo(0, -s / 3, s / 2, 0, s / 3, s / 2);
        ctx.bezierCurveTo(s / 4, s / 4, 0, s / 3, -s / 3, -s / 4);
        ctx.fill();
        // Green stem
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(-s / 3 - 2, -s / 4 - 4, 4, 4);
        // Sparkle / Danger glow
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(s / 3, s / 2, 3 + Math.sin(Date.now() * 0.02) * 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    function drawPlayer() {
      ctx.save();

      // Turbo / Frenzy speed trails
      if (keys.turbo || frenzyTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = frenzyTimer > 0 ? '#a855f7' : '#f7bf35';
        ctx.fillRect(player.x - player.vx * 1.5, player.y, player.width, player.height);
        ctx.restore();
      }

      // Smashed Spatula / Grill Platter Tray
      const x = player.x;
      const y = player.y;
      const w = player.width;
      const h = player.height;

      // Glow under spatula
      ctx.save();
      const glowColor = frenzyTimer > 0 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(247, 191, 53, 0.35)';
      ctx.shadowColor = frenzyTimer > 0 ? '#c084fc' : '#f7bf35';
      ctx.shadowBlur = 15;
      ctx.fillStyle = glowColor;
      ctx.fillRect(x + 5, y + h - 4, w - 10, 8);
      ctx.restore();

      // Metal Spatula Blade
      const metalGrad = ctx.createLinearGradient(x, y, x, y + h);
      metalGrad.addColorStop(0, '#e2e8f0');
      metalGrad.addColorStop(0.5, '#94a3b8');
      metalGrad.addColorStop(1, '#475569');
      ctx.fillStyle = metalGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, [4, 4, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = '#f7bf35';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // DXB Badge in center of spatula
      ctx.fillStyle = '#241e17';
      ctx.fillRect(x + w / 2 - 24, y + 4, 48, 14);
      ctx.fillStyle = '#f7bf35';
      ctx.font = "bold 9px 'Press Start 2P', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('DXB', x + w / 2, y + 15);

      // Spatula handle on right side
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + w - 4, y + 6, 14, 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + w + 10, y + 7, 8, 8);

      // Stacked burger ingredients on the spatula!
      const stackStartX = x + w / 2 - 28;
      const stackWidth = 56;
      let stackY = y - 4;

      player.burgerStack.forEach((layer) => {
        if (layer === 'bun') {
          // Bottom bun
          ctx.fillStyle = '#d97706';
          ctx.fillRect(stackStartX, stackY, stackWidth, 6);
          stackY -= 6;
        } else if (layer === 'patty') {
          // Smashed patty
          ctx.fillStyle = '#451e0e';
          ctx.fillRect(stackStartX - 2, stackY, stackWidth + 4, 7);
          ctx.fillStyle = '#7a3c1a';
          ctx.fillRect(stackStartX + 4, stackY + 2, stackWidth - 8, 2);
          stackY -= 7;
        } else if (layer === 'cheese') {
          // Melted cheese
          ctx.fillStyle = '#f7bf35';
          ctx.fillRect(stackStartX - 4, stackY, stackWidth + 8, 4);
          ctx.fillStyle = '#d99a14';
          ctx.fillRect(stackStartX + 8, stackY + 4, 4, 4); // cheese drip
          stackY -= 5;
        } else if (layer === 'bacon') {
          // Bacon strip
          ctx.fillStyle = '#b93822';
          ctx.fillRect(stackStartX, stackY, stackWidth, 4);
          stackY -= 5;
        } else if (layer === 'fries') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(stackStartX + 4, stackY, stackWidth - 8, 5);
          stackY -= 6;
        } else if (layer === 'shake') {
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(stackStartX + 8, stackY, stackWidth - 16, 4);
          stackY -= 5;
        } else if (layer === 'topbun') {
          // Crown bun
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(x + w / 2, stackY, stackWidth / 2, Math.PI, 0, false);
          ctx.fill();
          stackY -= 12;
        }
      });

      ctx.restore();
    }

    function drawHUD() {
      // Top status bar
      ctx.save();
      ctx.fillStyle = 'rgba(20, 16, 12, 0.85)';
      ctx.fillRect(0, 0, V_WIDTH, 48);
      ctx.strokeStyle = 'rgba(247, 191, 53, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(V_WIDTH, 48);
      ctx.stroke();

      // Score
      drawPixelText(`SCORE`, 35, 16, 9, '#94a3b8', 'left');
      drawPixelText(String(displayedScore).padStart(6, '0'), 35, 34, 13, '#f7bf35', 'left');

      // Total Score
      drawPixelText(`TOTAL SCORE`, V_WIDTH / 2, 16, 9, '#94a3b8', 'center');
      drawPixelText(String(Math.max(highScore, score)).padStart(6, '0'), V_WIDTH / 2, 34, 13, '#fff', 'center');

      // Lives
      let livesText = '';
      for (let i = 0; i < lives; i++) livesText += '🍔';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(livesText, V_WIDTH - 35, 34);

      // Frenzy Timer Indicator
      if (frenzyTimer > 0) {
        ctx.fillStyle = '#c084fc';
        ctx.font = "bold 10px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ FRENZY: ${frenzyTimer.toFixed(1)}s`, V_WIDTH / 2, 70);
      } else if (combo >= 4) {
        // Combo text
        const mult = combo >= 15 ? 'x4 BOOST!' : combo >= 8 ? 'x3 BOOST!' : 'x2 BOOST!';
        ctx.fillStyle = '#f7bf35';
        ctx.font = "bold 11px 'Press Start 2P', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO ${mult} (${combo} STREAK)`, V_WIDTH / 2, 70);
      }

      ctx.restore();
    }

    function render() {
      ctx.save();

      // Background Retro Cyber / Kitchen Grate
      ctx.fillStyle = '#1c1712';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(247, 191, 53, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < V_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, V_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < V_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(V_WIDTH, y);
        ctx.stroke();
      }

      // Kitchen Grill counter at bottom
      ctx.fillStyle = '#2b221a';
      ctx.fillRect(0, V_HEIGHT - 35, V_WIDTH, 35);
      ctx.fillStyle = '#f7bf35';
      ctx.fillRect(0, V_HEIGHT - 36, V_WIDTH, 2);

      // Draw Items
      items.forEach(drawItem);

      // Draw Particles
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      });

      // Draw Player
      drawPlayer();

      // Draw Floating Texts
      floatingTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.alpha;
        drawPixelText(t.text, t.x, t.y, t.size, t.color, 'center');
        ctx.restore();
      });

      // Draw HUD
      drawHUD();

      // Screen Overlays based on state
      if (gameState === 'TITLE') {
        drawTitleScreen();
      } else if (gameState === 'PAUSED') {
        drawPausedScreen();
      } else if (gameState === 'GAMEOVER') {
        drawGameOverScreen();
      }

      ctx.restore();
    }

    function drawTitleScreen() {
      // Dimmed backdrop
      ctx.fillStyle = 'rgba(24, 20, 15, 0.94)';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Neon Marquee Box
      ctx.beginPath();
      ctx.strokeStyle = '#f7bf35';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, V_WIDTH - 120, V_HEIGHT - 120);

      drawPixelText('DXB GAMING ZONE', V_WIDTH / 2, 120, 14, '#94a3b8');
      drawPixelText('BURGER BLITZ', V_WIDTH / 2, 175, 30, '#f7bf35');

      // Mascot graphics
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍔 🎮 🍟', V_WIDTH / 2, 260);

      // Simple Clean Prompt
      drawPixelText('TAP SCREEN OR BUTTON TO PLAY', V_WIDTH / 2, 360, 13, '#f7bf35');
    }

    function drawPausedScreen() {
      ctx.fillStyle = 'rgba(15, 12, 9, 0.85)';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      drawPixelText('PAUSED', V_WIDTH / 2, V_HEIGHT / 2 - 20, 26, '#f7bf35');
      drawPixelText('TAP SCREEN TO RESUME', V_WIDTH / 2, V_HEIGHT / 2 + 25, 12, '#e2e8f0');
    }

    function drawGameOverScreen() {
      // Solid clean background
      ctx.fillStyle = '#14100c';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // Clean Border
      ctx.beginPath();
      ctx.strokeStyle = '#e94b26';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 45, V_WIDTH - 100, V_HEIGHT - 90);

      drawPixelText('GAME OVER', V_WIDTH / 2, 115, 28, '#ef4444');

      // Stats: Score and Total Score
      drawPixelText(`SCORE: ${score}`, V_WIDTH / 2, 185, 18, '#f7bf35');
      drawPixelText(`TOTAL SCORE: ${Math.max(highScore, score)}`, V_WIDTH / 2, 230, 15, '#e2e8f0');

      // High Score check
      if (score >= highScore && score > 0) {
        drawPixelText('★ NEW HIGH SCORE RECORD! ★', V_WIDTH / 2, 275, 13, '#fbbf24');
      }

      // Retry Button on Canvas
      ctx.beginPath();
      ctx.fillStyle = '#f7bf35';
      ctx.roundRect(280, 330, 240, 52, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#d99a14';
      ctx.lineWidth = 2;
      ctx.roundRect(280, 330, 240, 52, 8);
      ctx.stroke();

      drawPixelText('PLAY AGAIN', V_WIDTH / 2, 356, 14, '#1c1712');
    }

    // Main Loop
    let lastTime = performance.now();
    function loop(now) {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      update(dt);
      render();

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }
})();

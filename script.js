/* ========== Shakrit - Phase 2: Basic Game Framework ========== */
/* Features:
   - Player left/right movement, jump
   - Shoot bullets
   - Simple moving enemies with respawn
   - Collision detection (bullet <-> enemy, player <-> enemy)
   - Score & lives HUD
   - On-screen touch buttons + keyboard controls
   - Pause / Resume / Restart
*/

/* ---------------- DOM ---------------- */
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const gameWrap = document.getElementById('gameWrap');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');
const shootBtn = document.getElementById('shootBtn');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const pauseBtn = document.getElementById('pauseBtn');

const pauseMenu = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');

/* ---------------- Game State ---------------- */
let width = canvas.width;
let height = canvas.height;

let running = false;
let paused = false;
let animationId = null;

let score = 0;
let lives = 3;

/* Player */
const player = {
  x: 60,
  y: height - 80,
  w: 40,
  h: 60,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jumpPow: -11,
  gravity: 0.55,
  onGround: false,
  flip: false
};

/* Input state (keyboard + touch) */
const input = { left:false, right:false, up:false, shoot:false };

/* Bullets */
const bullets = []; // {x,y,w,h,vx}

/* Enemies array */
const enemies = []; // {x,y,w,h,vx,alive}

/* Basic settings */
const MAX_BULLETS = 6;
const ENEMY_SPAWN_X = width + 80;

/* ---------------- Utility ---------------- */
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

/* ---------------- Init / Start / Restart ---------------- */
startBtn.addEventListener('click', ()=>{
  overlay.style.display='none';
  gameWrap.style.display='block';
  initGame();
  startLoop();
});

restartBtn.addEventListener('click', ()=> {
  pauseMenu.style.display='none';
  initGame();
  startLoop();
});
resumeBtn.addEventListener('click', ()=> {
  pauseMenu.style.display='none';
  paused=false;
  startLoop();
});

pauseBtn.addEventListener('click', ()=>{
  if(!running) return;
  paused = true;
  pauseMenu.style.display='flex';
});

/* ---------------- Keyboard input ---------------- */
window.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowLeft') input.left = true;
  if(e.key === 'ArrowRight') input.right = true;
  if(e.key === ' ' || e.key === 'ArrowUp') input.up = true;
  if(e.key.toLowerCase() === 'z') input.shoot = true;
});
window.addEventListener('keyup', (e)=>{
  if(e.key === 'ArrowLeft') input.left = false;
  if(e.key === 'ArrowRight') input.right = false;
  if(e.key === ' ' || e.key === 'ArrowUp') input.up = false;
  if(e.key.toLowerCase() === 'z') input.shoot = false;
});

/* ---------------- Touch / Button input ---------------- */
/* Touchstart & touchend for mobile buttons */
function attachTouch(btn, prop){
  btn.addEventListener('touchstart', (ev)=>{ ev.preventDefault(); input[prop]=true; }, {passive:false});
  btn.addEventListener('touchend', (ev)=>{ ev.preventDefault(); input[prop]=false; }, {passive:false});
  // also support mouse for testing on iPad Safari
  btn.addEventListener('mousedown', ()=>input[prop]=true);
  btn.addEventListener('mouseup', ()=>input[prop]=false);
  btn.addEventListener('mouseleave', ()=>input[prop]=false);
}
attachTouch(leftBtn,'left');
attachTouch(rightBtn,'right');
attachTouch(jumpBtn,'up');
attachTouch(shootBtn,'shoot');

/* ---------------- Game init ---------------- */
function initGame(){
  // reset
  running = true;
  paused = false;
  score = 0;
  lives = 3;
  bullets.length = 0;
  enemies.length = 0;

  player.x = 60;
  player.y = height - player.h - 10;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;

  // spawn some enemies spaced out
  for(let i=0;i<5;i++){
    let ex = ENEMY_SPAWN_X + i*150 + rand(0,120);
    enemies.push({
      x: ex,
      y: height - 60 - 10,
      w: 40,
      h: 50,
      vx: 1.6 + Math.random()*1.4,
      alive: true
    });
  }

  updateHUD();
}

/* ---------------- HUD ---------------- */
function updateHUD(){
  scoreEl.textContent = 'Score: ' + score;
  livesEl.textContent = 'Lives: ' + lives;
}

/* ---------------- Collision Helpers ---------------- */
function rectsOverlap(a,b){
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

/* ---------------- Game Loop ---------------- */
function startLoop(){
  if(animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function loop(){
  if(paused){ running = true; return; } /* stop drawing while paused - resume via resumeBtn */
  update();
  render();
  if(running) animationId = requestAnimationFrame(loop); else cancelAnimationFrame(animationId);
}

/* ---------------- Update ---------------- */
function update(){
  // ----- player horizontal movement
  player.vx = 0;
  if(input.left) { player.vx = -player.speed; player.flip = true; }
  if(input.right) { player.vx = player.speed; player.flip = false; }
  player.x += player.vx;
  // clamp
  if(player.x < 0) player.x = 0;
  if(player.x + player.w > width) player.x = width - player.w;

  // ----- jumping
  if(input.up && player.onGround){
    player.vy = player.jumpPow;
    player.onGround = false;
  }
  // gravity
  player.vy += player.gravity;
  player.y += player.vy;
  // ground collision
  if(player.y + player.h >= height - 10){
    player.y = height - 10 - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // ----- shooting (limit bullets)
  if(input.shoot && bullets.length < MAX_BULLETS){
    bullets.push({ x: player.x + player.w + 2, y: player.y + player.h/2 - 4, w: 10, h: 6, vx: 10 });
    // make shoot only once per press (prevents auto spam if user holds)
    input.shoot = false;
  }

  // ----- update bullets
  for(let i = bullets.length -1; i >=0; i--){
    const b = bullets[i];
    b.x += b.vx;
    if(b.x > width + 20) bullets.splice(i,1);
  }

  // ----- update enemies
  for(let i = enemies.length -1; i>=0; i--){
    const e = enemies[i];
    if(!e.alive) continue;
    e.x -= e.vx;
    // if enemy goes off left, respawn to right
    if(e.x + e.w < -40){
      e.x = ENEMY_SPAWN_X + rand(0,200);
      e.vx = 1.6 + Math.random()*1.6;
    }
    // check collision: bullet hits enemy
    for(let j = bullets.length -1; j>=0; j--){
      if(rectsOverlap(e, bullets[j])){
        // kill enemy, remove bullet
        enemies.splice(i,1); // enemy removed
        bullets.splice(j,1);
        score += 10;
        updateHUD();
        break;
      }
    }
  }

  // ----- player collision with enemy (hurt)
  for(let i = enemies.length -1; i>=0; i--){
    const e = enemies[i];
    if(rectsOverlap(player, e)){
      // lose a life and respawn player, respawn that enemy
      lives -= 1;
      updateHUD();
      // simple knockback & reset
      player.x = 60; player.y = height - player.h - 10; player.vx = 0; player.vy = 0;
      if(lives <= 0){
        running = false;
        setTimeout(()=>{ alert('Game Over\nScore: '+score); }, 50);
      }
      // respawn the enemy
      e.x = ENEMY_SPAWN_X + rand(0,300);
      e.vx = 1.6 + Math.random()*1.6;
      break;
    }
  }

  // optional: spawn additional enemies over time for increasing difficulty
  if(Math.random() < 0.006){ // small chance each frame
    enemies.push({ x: ENEMY_SPAWN_X + rand(0,200), y: height - 60 -10, w:40, h:50, vx: 1.6 + Math.random()*1.6, alive:true });
  }
}

/* ---------------- Render ---------------- */
function render(){
  // clear
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(0,0,width,height);

  // ground
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(0, height - 10, width, 10);

  // player (simple rectangle for phase 2)
  ctx.fillStyle = '#00ff66';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // small eye to indicate facing
  ctx.fillStyle = '#003300';
  if(player.flip) ctx.fillRect(player.x+6, player.y+14, 6, 6); else ctx.fillRect(player.x+player.w-12, player.y+14, 6,6);

  // bullets
  ctx.fillStyle = '#ffd24d';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // enemies
  ctx.fillStyle = '#ff4d4d';
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
    // eyes
    ctx.fillStyle = '#2b0000';
    ctx.fillRect(e.x + 6, e.y + 12, 6, 6);
    ctx.fillRect(e.x + e.w - 12, e.y + 12, 6, 6);
    ctx.fillStyle = '#ff4d4d';
  });

  // HUD is DOM-based (score, lives)
}

/* ---------------- Resize handling (optional) ---------------- */
window.addEventListener('resize', ()=> {
  // keep canvas logical size fixed; CSS scales it automatically via style
});

/* ---------------- End of script ---------------- */

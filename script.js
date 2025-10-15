const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("start-btn");
const titleScreen = document.getElementById("title-screen");

let keys = {};
let bullets = [];
let enemies = [];
let player, bgX, scrollOffset, gameRunning;

const bgImg = new Image();
bgImg.src = "assets/background/bg1.png";

const playerImg = new Image();
playerImg.src = "assets/player/player.png";

const enemyImg = new Image();
enemyImg.src = "assets/enemies/enemy1.png";

// Player setup
function createPlayer() {
  return {
    x: 100,
    y: 400,
    width: 64,
    height: 64,
    speed: 5,
    velocityY: 0,
    jumping: false,
    facing: "right"
  };
}

// Enemy factory
function createEnemy(x) {
  return {
    x,
    y: 400,
    width: 64,
    height: 64,
    patrolMin: x - 50,
    patrolMax: x + 50,
    dir: Math.random() < 0.5 ? "left" : "right",
    shootCooldown: 0
  };
}

function resetGame() {
  player = createPlayer();
  bullets = [];
  enemies = [];
  bgX = 0;
  scrollOffset = 0;
  gameRunning = true;
}

// Draw background
function drawBackground() {
  const scrollSpeed = 2;
  if (keys["ArrowRight"]) bgX -= scrollSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// Draw player
function drawPlayer() {
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
}

// Handle movement
function handlePlayerMovement() {
  if (keys["ArrowRight"]) {
    player.x += player.speed;
    player.facing = "right";
    scrollOffset += 5;
  }
  if (keys["ArrowLeft"]) {
    player.x -= player.speed;
    player.facing = "left";
  }

  if (keys[" "] && !player.jumping) {
    player.jumping = true;
    player.velocityY = -12;
  }

  player.velocityY += 0.5;
  player.y += player.velocityY;

  if (player.y >= 400) {
    player.y = 400;
    player.jumping = false;
  }
}

// Shoot bullet
function shoot() {
  bullets.push({
    x: player.x + player.width / 2,
    y: player.y + 30,
    dir: player.facing,
    speed: 10
  });
}

// Update bullets
function updateBullets() {
  bullets.forEach((b, i) => {
    b.x += b.dir === "right" ? b.speed : -b.speed;
    if (b.x > canvas.width || b.x < 0) bullets.splice(i, 1);
    ctx.fillStyle = "yellow";
    ctx.fillRect(b.x, b.y, 10, 4);
  });
}

// Update enemies
function updateEnemies() {
  enemies.forEach((e, i) => {
    // Patrol behavior
    if (e.dir === "right") e.x += 2;
    else e.x -= 2;

    if (e.x >= e.patrolMax) e.dir = "left";
    if (e.x <= e.patrolMin) e.dir = "right";

    // Draw
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

    // Detect bullet hit
    bullets.forEach((b, bi) => {
      if (
        b.x < e.x + e.width &&
        b.x + 10 > e.x &&
        b.y < e.y + e.height &&
        b.y + 4 > e.y
      ) {
        enemies.splice(i, 1);
        bullets.splice(bi, 1);
      }
    });
  });

  // Spawn new enemies as player moves forward
  if (scrollOffset % 800 === 0 && scrollOffset > 0) {
    enemies.push(createEnemy(canvas.width - 200 + scrollOffset));
  }
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  handlePlayerMovement();
  drawPlayer();
  updateBullets();
  updateEnemies();

  requestAnimationFrame(gameLoop);
}

// Start button
startBtn.addEventListener("click", () => {
  titleScreen.style.display = "none";
  canvas.style.display = "block";
  resetGame();
  gameLoop();
});

// Controls
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "z") shoot();
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

// Mobile controls
document.getElementById("left").ontouchstart = () => (keys["ArrowLeft"] = true);
document.getElementById("left").ontouchend = () => (keys["ArrowLeft"] = false);

document.getElementById("right").ontouchstart = () => (keys["ArrowRight"] = true);
document.getElementById("right").ontouchend = () => (keys["ArrowRight"] = false);

document.getElementById("jump").ontouchstart = () => {
  if (!player.jumping) {
    player.velocityY = -12;
    player.jumping = true;
  }
};

document.getElementById("fire").ontouchstart = shoot;

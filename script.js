// === BASIC SETUP ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 960;
canvas.height = 540;

let gameRunning = false;
let keys = {};
let bullets = [];
let enemies = [];
let bgX = 0;

// === LOAD IMAGES ===
const playerRight = new Image();
playerRight.src = 'assets/player/player-right.png';
const playerLeft = new Image();
playerLeft.src = 'assets/player/player-left.png';

const enemyImg = new Image();
enemyImg.src = 'assets/enemies/enemy1.png';

const bgImg = new Image();
bgImg.src = 'assets/background/bg1.png';

// === PLAYER OBJECT ===
let player = {
    x: 50,
    y: 400,
    width: 64,
    height: 64,
    speed: 5,
    jumping: false,
    velocityY: 0,
    facing: "right"
};

// === ENEMY SPAWN ===
function spawnEnemy() {
    enemies.push({
        x: 900,
        y: 400,
        width: 64,
        height: 64,
        speed: 3
    });
}

// === DRAW BACKGROUND ===
function drawBackground() {
    bgX -= 2;
    if (bgX <= -canvas.width) bgX = 0;
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

// === UPDATE PLAYER ===
function updatePlayer() {
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.facing = "right";
    }
    if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.facing = "left";
    }
    if (keys[' '] && !player.jumping) {
        player.jumping = true;
        player.velocityY = -12;
    }

    player.velocityY += 0.5;
    player.y += player.velocityY;

    if (player.y > 400) {
        player.y = 400;
        player.jumping = false;
    }

    const img = player.facing === "right" ? playerRight : playerLeft;
    ctx.drawImage(img, player.x, player.y, player.width, player.height);
}

// === BULLET UPDATE ===
function updateBullets() {
    bullets.forEach((b, i) => {
        b.x += b.dir === "right" ? 10 : -10;
        if (b.x > canvas.width || b.x < 0) bullets.splice(i, 1);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(b.x, b.y, 10, 5);
    });
}

// === SHOOT ===
function shoot() {
    const dir = player.facing;
    bullets.push({
        x: player.x + (dir === "right" ? player.width : 0),
        y: player.y + player.height / 2,
        dir
    });
}

// === ENEMY UPDATE ===
function updateEnemies() {
    enemies.forEach((e, ei) => {
        e.x -= e.speed;
        if (e.x + e.width < 0) enemies.splice(ei, 1);
        ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

        bullets.forEach((b, bi) => {
            if (b.x < e.x + e.width && b.x + 10 > e.x &&
                b.y < e.y + e.height && b.y + 5 > e.y) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
            }
        });
    });
}

// === GAME LOOP ===
function gameLoop() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    updatePlayer();
    updateBullets();
    updateEnemies();
    requestAnimationFrame(gameLoop);
}

// === EVENT LISTENERS ===
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'z') shoot();
});
document.addEventListener('keyup', e => keys[e.key] = false);

// === START GAME ===
document.getElementById('start-btn').onclick = () => {
    document.getElementById('title-screen').style.display = 'none';
    canvas.style.display = 'block';
    gameRunning = true;
    setInterval(spawnEnemy, 2000);
    gameLoop();
};

// === ON-SCREEN TOUCH CONTROLS ===
document.getElementById('left').ontouchstart = () => keys['ArrowLeft'] = true;
document.getElementById('left').ontouchend = () => keys['ArrowLeft'] = false;

document.getElementById('right').ontouchstart = () => keys['ArrowRight'] = true;
document.getElementById('right').ontouchend = () => keys['ArrowRight'] = false;

document.getElementById('jump').ontouchstart = () => {
    if (!player.jumping) player.velocityY = -12;
};

document.getElementById('fire').ontouchstart = shoot;

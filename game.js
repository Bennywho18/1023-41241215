const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const difficultySelect = document.getElementById("difficulty");
const startButton = document.getElementById("startButton");
const backgroundSelect = document.getElementById("backgroundSelect");
const backgroundMusic = new Audio("audio/audio.mp3");
const hitSound = new Audio("audio/heavy_punch1.mp3");
const restartButton = document.getElementById("restartButton");
const maxTrailLength = 15; // 尾跡的最大長度，可以調整長度
const collisionTolerance = 5; // 容差距離
const hideBricksCheckbox = document.getElementById("hideBricks");
const brickImageCheckbox = document.getElementById("brickImageCheckbox");
const brickImage = new Image();
brickImage.src = "3.jpg"; // 使用自定义图片的路径
backgroundMusic.loop = true; // 背景音樂循環播放
const levels = [
    { brickRowCount: 3, brickColumnCount: 5 },
    { brickRowCount: 4, brickColumnCount: 6 },
    { brickRowCount: 5, brickColumnCount: 7 },
    { brickRowCount: 6, brickColumnCount: 8 },
    { brickRowCount: 7, brickColumnCount: 9 },
];

const backgrounds = [
    { name: "Night Sky", color: "black", image: "1.jpeg" },
    { name: "Desert", color: "yellow", image: "2.jfif" },
];

let currentBackground = 0;

let balls = [{
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 2,
    dy: -2,
    radius: 10,
}];

let paddle = {
    width: 75,
    height: 10,
    x: (canvas.width - 75) / 2,
    y: canvas.height - 10,
    speed: 7,
    rightPressed: false,
    leftPressed: false,
    jumpCooldown: 2000,
    canJump: true,
};

let brickRowCount = 5;
let brickColumnCount = 8;
let brickWidth = 50;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding)) + brickPadding) / 2;
let currentLevel = 0;
let bricks = [];
let score = 0;
let gameStarted = false;
let gameEnded = false;
let trail = []; // 儲存球的尾跡位置
let comboCount = 0; // 連擊計數器
let comboTimeout; // 連擊重置計時器
let explosionEffects = []; // 儲存所有的爆炸特效

function initBricks() {
    bricks = [];
    brickRowCount = levels[currentLevel].brickRowCount;
    brickColumnCount = levels[currentLevel].brickColumnCount;
    brickOffsetLeft = (canvas.width - (brickColumnCount * (brickWidth + brickPadding)) + brickPadding) / 2;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            let hitCount;
            if (difficultySelect.value === "easy") {
                hitCount = 1;
            } else if (difficultySelect.value === "medium") {
                hitCount = Math.random() < 0.5 ? 1 : 2;
            } else {
                hitCount = Math.floor(Math.random() * 3) + 1;
            }
            // 根據勾選框的狀態決定磚塊是否隱藏
            const isHidden = hideBricksCheckbox.checked ? Math.random() < 0.3 : false; // 30%機率隱藏
            bricks[c][r] = { x: 0, y: 0, status: 1, hitCount: hitCount, isHidden: isHidden };
        }
    }
}


function nextLevel() {
    if (currentLevel < levels.length - 1) {
        currentLevel++;
        initBricks();
        balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2, radius: 10 }];
        gameEnded = false;
    } else {
        alert("恭喜通关！总得分: " + score);
        gameEnded = true;
    }
}

function drawLevel() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Level: " + (currentLevel + 1), canvas.width - 100, 20);
}

function setDifficulty() {
    const difficulty = difficultySelect.value;
    switch (difficulty) {
        case "easy":
            brickRowCount = 3;
            balls[0].dx = 2;
            break;
        case "medium":
            brickRowCount = 6;
            balls[0].dx = 4;
            break;
        case "hard":
            brickRowCount = 8;
            balls[0].dx = 5;
            break;
    }
    initBricks();
}
// 播放背景音樂
function playBackgroundMusic() {
    backgroundMusic.play();
}

// 停止背景音樂
function stopBackgroundMusic() {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// 播放擊打磚塊的音效
function playHitSound() {
    hitSound.currentTime = 0; // 重置音效播放進度
    hitSound.play();
}

// 修改 initGame 函數
// 完整重製遊戲，包括分數和關卡
function initGame() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height - 30,
        dx: 2,
        dy: -2,
        radius: 10,
    }];
    paddle.x = (canvas.width - paddle.width) / 2;
    score = 0;              // 重設分數
    currentLevel = 0;       // 重設關卡
    gameStarted = false;
    gameEnded = false;
    currentBackground = backgroundSelect.selectedIndex; // 根據下拉選單的索引設定背景
    setDifficulty();
    hideRestartButton();    // 隱藏重啟按鈕
    initBricks();           // 初始化磚塊
    playBackgroundMusic();  // 開始遊戲時播放背景音樂
    drawBackground(); // 繪製選定的背景
    
}

backgroundSelect.addEventListener("change", function() {
    currentBackground = this.selectedIndex; // 更新當前背景索引
    drawBackground(); // 繪製選定的背景
});

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("click", mouseClickHandler, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        paddle.rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        paddle.leftPressed = true;
    } else if (e.code === "Space") {
        gameStarted = true;
    }
}

function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        paddle.rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        paddle.leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    let relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
    }
}

function mouseClickHandler() {
    if (paddle.canJump) {
        const originalY = paddle.y;
        paddle.y -= 30;
        paddle.canJump = false;

        setTimeout(() => {
            paddle.y = originalY;
            paddle.canJump = true;
        }, 200);
    }
}

// 繪製球的尾跡和球
function drawBalls() {
    // 繪製尾跡
    for (let i = 0; i < trail.length; i++) {
        const opacity = (i + 1) / trail.length; // 隨尾跡距離球的遠近調整透明度
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, balls[0].radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 149, 221, ${opacity})`; // 使用透明度來實現淡化效果
        ctx.fill();
        ctx.closePath();
    }
    // 繪製當前的球
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                if (!b.isHidden) {
                    ctx.beginPath();
                    if (brickImageCheckbox.checked) {
                        // 使用圖片繪製磚塊
                        ctx.drawImage(brickImage, brickX, brickY, brickWidth, brickHeight);

                        // 在圖片上顯示深色擊打次數文字
                        ctx.fillStyle = "#FF0000"; // 深色文字
                        ctx.font = "16px Arial";
                        ctx.fillText(b.hitCount, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5);
                    } else {
                        // 使用顏色繪製磚塊並顯示擊打次數
                        ctx.rect(brickX, brickY, brickWidth, brickHeight);
                        ctx.fillStyle = b.hitCount === 1 ? "green" : b.hitCount === 2 ? "yellow" : "red";
                        ctx.fill();

                        // 顏色磚塊上的擊打次數顯示
                        ctx.fillStyle = "black";
                        ctx.font = "16px Arial";
                        ctx.fillText(b.hitCount, brickX + brickWidth / 2 - 5, brickY + brickHeight / 2 + 5);
                    }
                    ctx.closePath();
                }
            }
        }
    }
}


// 添加爆炸特效的物件
function createExplosionEffect(x, y) {
    explosionEffects.push({ x, y, alpha: 1.0, radius: 20 });
}

// 在繪製中添加爆炸特效
function drawExplosionEffects() {
    for (let i = explosionEffects.length - 1; i >= 0; i--) {
        const effect = explosionEffects[i];
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${effect.alpha})`; // 使用金色的顏色和透明度
        ctx.fill();
        ctx.closePath();

        // 減少透明度
        effect.alpha -= 0.05; // 每幀降低透明度
        effect.radius += 2; // 增加半徑

        // 如果透明度小於等於0，則移除特效
        if (effect.alpha <= 0) {
            explosionEffects.splice(i, 1);
        }
    }
}

function collisionDetection() {
    let allBricksDestroyed = true;
    let currentCombo = 0; // 本次連擊計數

    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                allBricksDestroyed = false;
                for (let ball of balls) {
                    if (
                        ball.x > b.x - collisionTolerance &&
                        ball.x < b.x + brickWidth + collisionTolerance &&
                        ball.y > b.y - collisionTolerance &&
                        ball.y < b.y + brickHeight + collisionTolerance
                    ) {
                        ball.dy = -ball.dy;
                        playHitSound();

                        // 減少擊打次數
                        b.hitCount--;

                        // 如果擊打次數降到 0，更新狀態並加分
                        if (b.hitCount <= 0) {
                            b.status = 0;
                            score += 10;
                            createExplosionEffect(
                                b.x + brickWidth / 2,
                                b.y + brickHeight / 2
                            );
                            currentCombo++;
                        }
                    }
                }
            }
        }
    }

    if (currentCombo > 0) {
        comboCount += currentCombo;
        if (comboCount >= 3) {
            score += 20;
            comboCount = 0;
        }

        clearTimeout(comboTimeout);
        comboTimeout = setTimeout(() => {
            comboCount = 0;
        }, 3000);
    }

    if (allBricksDestroyed) {
        nextLevel();
    }
}

function drawCombo() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FF0000"; // 顯示顏色為紅色
    ctx.fillText("連擊次數: " + comboCount, 8, 40); // 在畫布上顯示連擊次數
}

// 重啟當前關卡，保留分數和關卡數
function restartCurrentLevel() {
    balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2, radius: 10 }];
    paddle.x = (canvas.width - paddle.width) / 2;
    gameEnded = false;
    gameStarted = true;
    initBricks();           // 初始化磚塊
    drawBackground();       // 重繪背景
    drawLevel();            // 顯示當前關卡
    hideRestartButton();    // 隱藏重啟按鈕
    playBackgroundMusic();  // 重新播放背景音樂
    requestAnimationFrame(gameLoop);
}

// 顯示和隱藏重啟按鈕
function showRestartButton() {
    restartButton.style.display = "block";
}

function hideRestartButton() {
    restartButton.style.display = "none";
}

// 當按下「重新開始本關」按鈕時，重新開始關卡
restartButton.addEventListener("click", restartCurrentLevel);

// 更新遊戲結束時的邏輯以顯示重啟按鈕
function gameOver() {
    stopBackgroundMusic();
    alert("遊戲結束！您的總得分為: " + score);
    showRestartButton(); // 顯示重啟按鈕
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFA500"; // 設定得分文字顏色為橘色
    ctx.fillText("Score: " + score, 8, 20);
}

function movePaddle() {
    if (paddle.rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.speed;
    } else if (paddle.leftPressed && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
}

function moveBalls() {
    for (let ball of balls) {
        // 將當前位置推入尾跡陣列
        trail.push({ x: ball.x, y: ball.y });

        // 保持尾跡陣列的長度不超過最大值
        if (trail.length > maxTrailLength) {
            trail.shift(); // 移除最早的點
        }

        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx = -ball.dx;
        }

        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy;
        }

        if (ball.y + ball.radius > canvas.height) {
            gameEnded = true;
            ball.dx = 0;
            ball.dy = 0;
        }

        if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.dy = -ball.dy;
        }
    }
}
function drawBackground() {
    const bg = backgrounds[currentBackground]; // 獲取當前背景
    ctx.fillStyle = bg.color; // 填充顏色
    ctx.fillRect(0, 0, canvas.width, canvas.height); // 填充背景

    if (bg.image) {
        const backgroundImage = new Image();
        backgroundImage.src = bg.image;
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }
}


function update() {
    if (gameStarted && !gameEnded) {
        drawBackground();
        drawBricks();
        drawBalls();
        drawPaddle();
        drawScore();
        drawCombo(); // 顯示連擊次數
        drawLevel(); // 显示当前关卡号
        drawExplosionEffects(); // 繪製爆炸特效
        collisionDetection();
        movePaddle();
        moveBalls();

        // 检查分数，创建新的球
        if (score >= 100 && balls.length === 1) {
            balls.push({
                x: canvas.width / 2,
                y: canvas.height - 30,
                dx: 2,
                dy: -2,
                radius: 10,
            });
        }
    }
}

// 在「開始遊戲」按鈕點擊時啟動遊戲
startButton.addEventListener("click", function() {
    initGame();
    gameStarted = true;
    requestAnimationFrame(gameLoop);
});

// 在遊戲循環中調用 gameOver 並顯示重啟按鈕
function gameLoop() {
    update();
    if (!gameEnded) {
        requestAnimationFrame(gameLoop);
    } else {
        stopBackgroundMusic();
        alert("遊戲結束！得分: " + score);
        showRestartButton(); // 顯示重啟按鈕
    }
}

// 初始化遊戲時隱藏重啟按鈕
initGame();
hideRestartButton();
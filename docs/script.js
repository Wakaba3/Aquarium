//キャンバスの準備
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });

//入力
let clicked = false;
let clickX = 0;
let clickY = 0;

canvas.addEventListener("click", (event) => {
    clicked = true;
    clickX = event.offsetX;
    clickY = event.offsetY;
});


//時間（描画を補間するため）の準備
let frameTime = 0;
let oldFrameTime = 0;
let newFrameTime = 0;
let lerpTime = 0;
let lerpStep = 0;

//カメラの準備
const CAMERA = new Camera();

document.addEventListener("keydown", (event) => moveCamera(event, CAMERA));

//セルの準備
const CELLS = [];
const MAX_CELL_COUNT = 32;

//その他
let fric = 0.05;

setInterval(loop, 1000 / 20);
setInterval(draw, 1000 / 1000);

//メインループ
function loop() {
    oldFrameTime = newFrameTime;
    newFrameTime = frameTime;
    lerpTime = 0;

    updateCamera();
    updateCells();
}

//描画のためのループ
function draw() {
    lerpStep = lerpTime / (newFrameTime - oldFrameTime);
    ++frameTime;
    ++lerpTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawCells();
}


//カメラの関数
function moveCamera(event, camera) {
    switch (event.key) {
        case "ArrowUp":
            camera.setVelocity(0, -10);
            break;
        case "ArrowDown":
            camera.setVelocity(0, 10);
            break;
        case "ArrowLeft":
            camera.setVelocity(-10, 0);
            break;
        case "ArrowRight":
            camera.setVelocity(10, 0);
            break;
    }
}

function updateCamera() {
    CAMERA.update(0.5);
}

//セルの関数
function spawnCell() {
    var index = getEmptyIndex();

    if (index >= 0) {
        CELLS.splice(index, 1, newCell());
    }
}

function newCell() {
    var cell = new Cell();

    cell.setPosition(Math.random() * 800, Math.random() * 800);

    return cell;
}

function updateCells() {
    CELLS.forEach((cell, index) => {
        if (!cell)
            return;

        cell.update(fric);
    });

    if (CELLS.length < MAX_CELL_COUNT) {
        spawnCell();
    }

    this.clickCells();

    this.collideCells();
}

function clickCells() {
    CELLS.forEach((cell, index) => {
        var cx = CAMERA.x + clickX;
        var cy = CAMERA.y + clickY;

        if (clicked && cell.isInRange(cx, cy)) {
            clicked = false;

            if (cell.vx || cell.vy) {
                cell.setVelocity(0, 0);
            } else {
                var dx = cell.x - cx;
                var dy = cell.y - cy;
                var dst = Math.sqrt(dx * dx + dy * dy);
            
                cell.setVelocity(dx / dst * 10, dy / dst * 10);
            }
        }
    });
}

function collideCells() {
    var len = CELLS.length;
    var celA, celB;

    for (var i = 0; i < len; ++i) {
        celA = CELLS[i];

        if (!celA)
            continue;

        for (var j = 0; j < len; ++j) {
            if (i == j)
                continue;

            celB = CELLS[j];

            if (!celB)
                continue;

            celA.collide(celB, 1);
        }
    }
}

function drawCells() {
    CELLS.forEach((cell, index) => {
        if (!cell)
            return;

        cell.draw(ctx, CAMERA, lerpStep);
    });
}

//その他
function getEmptyIndex() {
    for (var i = 0; i < CELLS.length; ++i) {
        if (!CELLS[i]) {
            return i;
        }
    }

    return CELLS.length < MAX_CELL_COUNT ? CELLS.length : -1;
}

function isSameSign(a, b) {
    return a >= 0 && b >= 0 || a < 0 && b < 0;
}
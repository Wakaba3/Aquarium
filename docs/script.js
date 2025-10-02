//キャンバスの準備
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });

//デバッグ情報の準備
const info = document.querySelector("#info");

//入力の準備
let clicked = false;
let clickX = 0;
let clickY = 0;

canvas.addEventListener("click", (event) => {
    clicked = true;

    var scaleX = canvas.width / ctx.canvas.scrollWidth;
    var scaleY = canvas.height / ctx.canvas.scrollHeight;

    clickX = event.offsetX * scaleX;
    clickY = event.offsetY * scaleY;
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
const MAX_CELL_COUNT = 256;
let cells = [];

//エフェクトの準備
let effects = [];

//その他
let fric = 0.05;
let gridSize = 32;

setInterval(loop, 1000 / 20);
setInterval(draw, 1000 / 1000);

//メインループ
function loop() {
    oldFrameTime = newFrameTime;
    newFrameTime = frameTime;
    lerpTime = 0;

    updateCamera();
    updateCells();
    updateEffects();
}

//描画のためのループ
function draw() {
    lerpStep = lerpTime / (newFrameTime - oldFrameTime);
    ++frameTime;
    ++lerpTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawCells();
    drawEffects();

    clearInfo();
    addInfo("frameTime: " + frameTime);
    addInfo("(cameraX, cameraY) = (" + CAMERA.x + ", " + CAMERA.y + ")");
    addInfo("(clickX, clickY) = (" + clickX + ", " + clickY + ")");
    addInfo("cells: " + cells.length);
    addInfo("effects: " + effects.length);
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
        cells.splice(index, 1, newCell());
    }
}

function newCell() {
    var cell = new Cell();

    cell.setPosition(canvas.width / 2 + Math.random() * 2000 - 1000, canvas.height / 2 + Math.random() * 2000 - 1000);

    return cell;
}

function clickCells() {
    cells.forEach((cell, index) => {
        var cx = CAMERA.x + clickX;
        var cy = CAMERA.y + clickY;

        if (clicked && !cell.discard && cell.isInRange(cx, cy)) {
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

function updateCells() {
    this.flushCells();

    cells.forEach((cell, index) => {
        if (!cell || cell.discard)
            return;

        cell.update(fric);
    });

    if (cells.length < MAX_CELL_COUNT) {
        spawnCell();
    }

    this.clickCells();

    this.collideCells();
}

function collideCells() {
    var len = cells.length;
    var celA, celB;

    for (var c = 0; c < 10; ++c) {
        for (var i = 0; i < len; ++i) {
            celA = cells[i];

            if (!celA || celA.discard)
                continue;

            for (var j = i + 1; j < len; ++j) {
                if (i == j)
                    continue;

                celB = cells[j];

                if (!celB || celB.discard)
                    continue;

                celA.collide(celB, 1);
            }
        }
    }
}

function flushCells() {
    var newCells = [];

    cells.forEach((cell, index) => {
        if (cell && !cell.discard) {
            newCells.push(cell);
        }
    });

    cells = newCells;
}

function drawCells() {
    cells.forEach((cell, index) => {
        if (!cell || cell.discard)
            return;

        cell.draw(ctx, CAMERA, lerpStep);
    });
}

//エフェクトの関数
function updateEffects() {
    this.flushEffects();

    effects.forEach((effect, index) => {
        if (!effect || effect.discard)
            return;

        effect.update(fric);
    })
}

function flushEffects() {
    var newEffects = [];

    effects.forEach((effect, index) => {
        if (effect && !effect.discard) {
            newEffects.push(effect);
        }
    });

    effects = newEffects;
}

function drawEffects() {
    effects.forEach((effect, index) => {
        if (!effect || effect.discard)
            return;

        effect.draw(ctx, CAMERA, lerpStep);
    });
}

//その他
function clearInfo() {
    info.innerHTML = "";
}

function addInfo(string) {
    if (info.innerHTML) {
        info.innerHTML = info.innerHTML + "<br>";
    }

    info.innerHTML = info.innerHTML + string;
}

function drawGrid() {
    var ox = CAMERA.getLerpX(lerpStep) % gridSize;
    var oy = CAMERA.getLerpY(lerpStep) % gridSize;

    var width = Math.floor(canvas.width / gridSize) + 2;
    var height = Math.floor(canvas.height / gridSize) + 2;

    var c;

    ctx.strokeStyle = "rgb(128, 128, 128)";

    for (var i = 0; i < width; ++i) {
        c = -16 + i * gridSize - ox;

        ctx.beginPath();
        ctx.moveTo(c, -16);
        ctx.lineTo(c, canvas.height + 15);
        ctx.stroke();
    }

    for (var j = 0; j < height; ++j) {
        c = -16 + j * gridSize - oy;

        ctx.beginPath();
        ctx.moveTo(-16, c);
        ctx.lineTo(canvas.width + 15, c);
        ctx.stroke();
    }
}

function getEmptyIndex() {
    for (var i = 0; i < cells.length; ++i) {
        if (!cells[i]) {
            return i;
        }
    }

    return cells.length < MAX_CELL_COUNT ? cells.length : -1;
}

function isSameSign(a, b) {
    return a >= 0 && b >= 0 || a < 0 && b < 0;
}
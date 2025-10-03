//キャンバスの準備
const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });

//デバッグ情報の準備
const info = document.querySelector("#info");

//入力の準備
let isPointDown = false;
let pointX = 0;
let pointY = 0;
let pointScaleX = 0;
let pointScaleY = 0;

calculatePointScale();

window.addEventListener("resize", (event) => {
    calculatePointScale();
});

canvas.addEventListener("pointerdown", (event) => {
    isPointDown = true;
    pointX = event.offsetX * pointScaleX;
    pointY = event.offsetY * pointScaleY;
});

canvas.addEventListener("pointerup", (event) => {
    isPointDown = false;
})

canvas.addEventListener("keydown", (event) => {
});

canvas.addEventListener("keyup", (event) => {
});

//時間（描画を補間するため）の準備
const PPS = 20;
const FPS = 60;
let frameTime = 0;
let oldFrameTime = 0;
let newFrameTime = 0;
let lerpTime = 0;
let lerpStep = 0;

//カメラの準備
const CAMERA = new Camera();

document.addEventListener("keydown", (event) => moveCamera(event));

//セルの準備
const MAX_CELL_COUNT = 64;
let cells = [];

//エフェクトの準備
const MAX_EFFECT_COUNT = 1024;
let effects = [];

//その他
let friction = 0;
let restitution = 1;
let gravConst = 6.674e-1;

let gridSize = 32;

//実行
let loopId = setInterval(loop, 1000 / PPS);
let drawId = setInterval(draw, 1000 / FPS);

//メインループ
function loop() {
    oldFrameTime = newFrameTime;
    newFrameTime = frameTime;
    lerpTime = 0;

    updateCamera();
    updateCells();
    updateEffects();
    updateInputs();
}

//描画のためのループ
function draw() {
    lerpStep = lerpTime / (newFrameTime - oldFrameTime);
    ++frameTime;
    ++lerpTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawEffects();
    drawCells();

    clearInfo();
    addInfo("PPS: " + PPS);
    addInfo("FPS: " + FPS);
    addInfo("frameTime: " + frameTime);
    addInfo("lerpTime: " + lerpTime);
    addInfo("lerpStep: " + lerpStep);
    addInfo("(cameraX, cameraY) = (" + CAMERA.x + ", " + CAMERA.y + ")");
    addInfo("(pointX, pointY) = (" + pointX + ", " + pointY + ")");
    addInfo("cells: " + cells.length);
    addInfo("effects: " + effects.length);
    addInfo("friction: " + friction);
    addInfo("restitution: " + restitution);
    addInfo("gravConst: " + gravConst);
}


//カメラの関数
function moveCamera(pointer) {
}

function updateCamera() {
    CAMERA.update(1);
}

//セルの関数
function spawnCell() {
    if (cells.length >= MAX_CELL_COUNT)
        return;

    var cell = new Cell();

    cell.setPosition(canvas.width / 2 + Math.random() * 512 - 256, canvas.height / 2 + Math.random() * 512 - 256);

    cells.push(cell);
}

function clickCells() {
    for (var cell of cells) {
        var cx = CAMERA.x + pointX;
        var cy = CAMERA.y + pointY;

        if (!cell.discard && cell.isInRange(cx, cy)) {
            var dx = cell.x - cx;
            var dy = cell.y - cy;
            var dst = Math.sqrt(dx * dx + dy * dy);
            
            cell.setVelocity(dx / dst * 10, dy / dst * 10);

            return true;
        }
    }

    return false;
}

function updateCells() {
    this.flushCells();

    cells.forEach((cell, index) => {
        if (!cell || cell.discard)
            return;

        cell.update(friction);
    });

    spawnCell();

    this.clickCells();

    this.interactCells();
}

function interactCells() {
    var len = cells.length;
    var celA, celB;

    for (var c = 0; c < 5; ++c) {
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

                celA.gravitate(celB, gravConst);

                if (celA.collide(celB, restitution)) {
                    spawnWave((celA.x + celB.x) / 2, (celA.y + celB.y) / 2, (celA.getMomentum() + celB.getMomentum()) / 2);
                }
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
function spawnWave(x, y, radius) {
    if (effects.length >= MAX_EFFECT_COUNT)
        return;

    var wave = new Wave(20, radius);
        
    wave.setPosition(x, y);

    effects.push(wave);
}

function updateEffects() {
    this.flushEffects();

    effects.forEach((effect, index) => {
        if (!effect || effect.discard)
            return;

        effect.update(friction);
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

//入力の関数
function updateInputs() {
    if (isPointDown) {
        if (clickCells()) return;
    }
}

function flushInputs() {
    var newPointers = [];

    pointers.forEach((pointer, index) => {
        if (pointer && !pointer.discard) {
            newPointers.push(pointer);
        }
    });

    pointers = newPointers;
}

//その他
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

function calculatePointScale() {
    pointScaleX = canvas.width / ctx.canvas.scrollWidth;
    pointScaleY = canvas.height / ctx.canvas.scrollHeight;
}

function clearInfo() {
    info.innerHTML = "";
}

function addInfo(string) {
    if (info.innerHTML) {
        info.innerHTML = info.innerHTML + "<br>";
    }

    info.innerHTML = info.innerHTML + string;
}

function isSameSign(a, b) {
    return a >= 0 && b >= 0 || a < 0 && b < 0;
}
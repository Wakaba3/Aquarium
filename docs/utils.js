//Math
function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
}

function red(color) {
    return color >> 16 & 255;
}

function green(color) {
    return color >> 8 & 255;
}

function blue(color) {
    return color & 255;
}

function alpha(color) {
    return color >>> 24;
}

function color(red, green, blue, alpha) {
    return clamp(alpha << 24, 0, 255) | clamp(red << 16, 0, 255) | clamp(green << 16, 0, 255) | clamp(blue, 0, 255);
}

//Blending
function alpha(sARGB, dARGB) {
    if (sARGB === 0)
        return dARGB;
    if (dARGB === 0)
        return sARGB;
        
    var sA = alpha(sARGB) / 255;
    var dA = alpha(dARGB) / 255;

    var oA = sA + dA * (1 - sA);
    var oR = ((red(sARGB) / 255) * sA + (red(dARGB) / 255) * dA * (1 - sA)) / oA;
    var oG = ((green(sARGB) / 255) * sA + (green(dARGB) / 255) * dA * (1 - sA)) / oA;
    var oB = ((blue(sARGB) / 255) * sA + (blue(dARGB) / 255) * dA * (1 - sA)) / oA;

    return color(oR * 255, oG * 255, oB * 255, oA * 255);
}

function add(sARGB, dARGB) {
    if (sARGB === 0)
        return dARGB;
    if (dARGB === 0)
        return sARGB;

    var sA = alpha(sARGB) / 255;
    var dA = alpha(dARGB) / 255;

    var oA = sA + dA * (1 - sA);
    var oR = (red(sARGB) / 255) * sA + (red(dARGB) / 255) * dA;
    var oG = (green(sARGB) / 255) * sA + (green(dARGB) / 255) * dA;
    var oB = (blue(sARGB) / 255) * sA + (blue(dARGB) / 255) * dA;

    return color(oR * 255, oG * 255, oB * 255, oA * 255);
}

//Canvas
class Canvas {
    constructor(context) {
        this.context = context;
        this.x = 0;
        this.y = 0;
        this.width = -1;
        this.height = -1;
        this.layerIndex = -1;
        this.layers = [];
    }

    addLayer(index) {
        if (index < 0) {
            console.warn("Could not add a new layer: the index is invalid");

            return;
        }

        if (this.width > 0 && this.height > 0) {
            this.layers.push(undefined);

            for (var i = this.layers.length - 1; i >= index; --i) {
                this.layers[i] = this.layers[i > index ? i - 1 : i];
            }
        } else {
            console.warn("Could not add a new layer: the canvas width or height is invalid");
        }
    }
}
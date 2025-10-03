class Entity {
    #x = 0;
    #y = 0;
    #ox = 0;
    #oy = 0;
    #vx = 0;
    #vy = 0;
    #ax = 0;
    #ay = 0;

    constructor() {
        this.discard = false;
    }

    update(friction) {
        this.x += this.#vx;
        this.y += this.#vy;

        this.#ax -= Math.sign(this.#vx) * friction;
        this.#ay -= Math.sign(this.#vy) * friction;

        this.#vx += this.#ax;
        this.#vy += this.#ay;

        if (Math.abs(this.#vx) < friction) this.#vx = 0;
        if (Math.abs(this.#vy) < friction) this.#vy = 0;
        
        this.#ax = 0;
        this.#ay = 0;
    }

    draw(ctx) {}

    setPosition(x, y) {
        this.#x = x;
        this.#y = y;
        this.#ox = this.#x;
        this.#oy = this.#y;
    }

    setVelocity(vx, vy) {
        this.#vx = vx;
        this.#vy = vy;
    }

    getLerpX(lerpStep) {
        if (!Number.isFinite(lerpStep))
            return this.#x;

        return this.#ox + (this.#x - this.#ox) * lerpStep;
    }

    getLerpY(lerpStep) {
        if (!Number.isFinite(lerpStep))
            return this.#y;

        return this.#oy + (this.#y - this.#oy) * lerpStep;
    }

    set x(value) {
        this.#ox = this.#x;
        this.#x = value;
    }

    set y(value) {
        this.#oy = this.#y;
        this.#y = value;
    }

    set vx(value) {
        this.#vx = value;
    }

    set vy(value) {
        this.#vy = value;
    }

    set ax(value) {
        this.#ax = value;
    }

    set ay(value) {
        this.#ay = value;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get vx() {
        return this.#vx;
    }

    get vy() {
        return this.#vy;
    }

    get ax() {
        return this.#ax;
    }

    get ay() {
        return this.#ay;
    }
}

class Camera extends Entity {
    constructor() {
        super();
    }
}

class Cell extends Entity {
    static #colors = ["rgb(255, 0, 255)", "rgb(255, 255, 0)", "rgb(0, 255, 255)", "rgb(255, 255, 255)"];

    #radius;
    #mass;
    #sqrRds;
    #color;

    constructor() {
        super();

        this.#mass = 12;
        this.#radius = this.#mass;
        this.#sqrRds = this.#radius * this.#radius;
        this.#color = Cell.#colors[Math.round(Math.random() * (Cell.#colors.length - 1))];
    }

    draw(ctx, camera, lerpStep) {
        ctx.fillStyle = this.#color;
        ctx.beginPath();
        ctx.arc(
            this.getLerpX(lerpStep) - camera.getLerpX(lerpStep),
            this.getLerpY(lerpStep) - camera.getLerpY(lerpStep),
            this.#radius,
            0,
            Math.PI * 2,
            true
        );
        ctx.fill();
    }

    gravitate(target, gravConst) {
        var dx = target.x - this.x;
        var dy = target.y - this.y;

        if (!dx || !dy)
            return;

        var sqrLen = dx * dx + dy * dy;
        var len = Math.sqrt(sqrLen);
        var cst = gravConst / len;
        var cos = dx / len;
        var sin = dy / len;

        this.ax += target.#mass * cst * cos;
        this.ay += target.#mass * cst * sin;
        target.ax += this.#mass * cst * -cos;
        target.ay += this.#mass * cst * -sin;
    }

    collide(target, restitution) {
        var dx, dy, dst;
        var steps = 1 + 2 * Math.max(Math.abs(this.vx), Math.max(Math.abs(this.vy), Math.max(Math.abs(target.vx), Math.abs(target.vy))));

        if (steps <= 1)
            return false;

        var cof0 = 0;
        var c0 = (1 + restitution) / (this.#mass / target.#mass + 1);
        var c1 = (1 + restitution) / (target.#mass / this.#mass + 1);
        var vx0, vy0, vx1, vy1;

        for (var i = 0; i <= steps; ++i) {
            cof0 = i / steps;

            dx = (target.x + target.vx * cof0) - (this.x + this.vx * cof0);
            dy = (target.y + target.vy * cof0) - (this.y + this.vy * cof0);
            
            dst = this.#radius + target.#radius;

            if (dx * dx + dy * dy <= dst * dst) {
                vx0 = (-this.vx + target.vx) * c0 + this.vx;
                vy0 = (-this.vy + target.vy) * c0 + this.vy;
                vx1 = (-target.vx + this.vx) * c1 + target.vx;
                vy1 = (-target.vy + this.vy) * c1 + target.vy;

                this.vx = vx0;
                this.vy = vy0;
                target.vx = vx1;
                target.vy = vy1;

                return true;
            }
        }

        return false;
    }

    getMomentum() {
        return this.#mass * Math.hypot(this.vx, this.vy);
    }

    isInRange(x, y) {
        var dx = x - this.x;
        var dy = y - this.y;

        return dx * dx + dy * dy <= this.#sqrRds;
    }
}

class Effect extends Entity {
    #animTime = 0;
    #animStep = 0;
    #animDuration = 20;

    constructor(duration) {
        super();

        this.#animDuration = duration;
    }

    update(friction) {
        super.update(friction);

        this.#animStep = this.#animTime / this.#animDuration;

        if (this.#animTime < this.#animDuration) {
            ++this.#animTime;
        } else {
            this.discard = true;
        }
    }

    draw(ctx, camera, lerpStep) {}

    get animTime() {
        return this.#animTime;
    }

    get animStep() {
        return this.#animStep;
    }

    get animDuration() {
        return this.#animDuration;
    }
}

class Wave extends Effect {
    #radius;

    constructor(duration, radius) {
        super(duration);

        this.#radius = radius;
    }

    update(friction) {
        super.update(friction);   
    }

    draw(ctx, camera, lerpStep) {
        ctx.strokeStyle = "rgba(128, 128, 128, " + (1 - this.animStep) + ")";
        ctx.beginPath();
        ctx.arc(this.getLerpX(lerpStep) - camera.getLerpX(lerpStep), this.getLerpY(lerpStep) - camera.getLerpY(lerpStep), this.#radius * this.animStep, 0, Math.PI * 2, true);
        ctx.stroke();
    }
}

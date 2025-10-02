class Entity {
    #x = 0;
    #y = 0;
    #ox = 0;
    #oy = 0;
    #vx = 0;
    #vy = 0;
    #ax = 0;
    #ay = 0;

    update(fric) {
        this.x += this.#vx;
        this.y += this.#vy;

        this.#ax -= Math.sign(this.#vx) * fric;
        this.#ay -= Math.sign(this.#vy) * fric;

        this.#vx += this.#ax;
        this.#vy += this.#ay;

        if (Math.abs(this.#vx) < fric) this.#vx = 0;
        if (Math.abs(this.#vy) < fric) this.#vy = 0;
        
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
    constructor(step) {
        super(step);
    }
}

class Cell extends Entity {
    static #colors = ["rgb(255, 0, 255)", "rgb(255, 255, 0)", "rgb(0, 255, 255)", "rgb(255, 255, 255)"];

    #mass;
    #radius;
    #sqrRds;
    #color;

    constructor(step) {
        super(step);

        this.#mass = 1 + Math.random() * 31;
        this.#radius = this.#mass;
        this.#sqrRds = this.#radius * this.#radius;
        this.#color = Cell.#colors[Math.round(Math.random() * (Cell.#colors.length - 1))];
    }

    draw(ctx, camera, lerpStep) {
        ctx.strokeStyle = this.#color;
        ctx.beginPath();
        ctx.arc(
            this.getLerpX(lerpStep) - camera.getLerpX(lerpStep),
            this.getLerpY(lerpStep) - camera.getLerpY(lerpStep),
            this.#radius,
            0,
            Math.PI * 2,
            true
        );
        ctx.stroke();
    }

    collide(target, elm) {
        var dx, dy, coef, dst;
        var val = 3 + 2 * Math.max(Math.abs(this.vx), Math.max(Math.abs(this.vy), Math.max(Math.abs(target.vx), Math.abs(target.vy))));
        var c0 = (1 + elm) / (this.#mass / target.#mass + 1);
        var c1 = (1 + elm) / (target.#mass / this.#mass + 1);
        var avx, avy, bvx, bvy

        for (var i = 0; i <= val; ++i) {
            coef = i / val;

            dx = (target.x + target.vx * coef) - (this.x + this.vx * coef);
            dy = (target.y + target.vy * coef) - (this.y + this.vy * coef);
            
            dst = this.#radius + target.#radius;

            if (dx * dx + dy * dy <= dst * dst) {
                avx = (-this.vx + target.vx) * c0 + this.vx;
                avy = (-this.vy + target.vy) * c0 + this.vy;
                bvx = (-target.vx + this.vx) * c1 + target.vx;
                bvy = (-target.vy + this.vy) * c1 + target.vy;

                this.vx = avx;
                this.vy = avy;
                target.vx = bvx;
                target.vy = bvy;

                return true;
            }
        }

        return false;
    }

    isInRange(x, y) {
        var dx = x - this.x;
        var dy = y - this.y;

        return dx * dx + dy * dy <= this.#sqrRds;
    }
}
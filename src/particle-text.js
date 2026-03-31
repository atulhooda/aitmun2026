class Particle {
    constructor() {
        this.pos = { x: 0, y: 0 };
        this.vel = { x: 0, y: 0 };
        this.acc = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.closeEnoughTarget = 100;
        this.maxSpeed = 1.0;
        this.maxForce = 0.1;
        this.particleSize = 10;
        this.isKilled = false;
        this.startColor = { r: 0, g: 0, b: 0 };
        this.targetColor = { r: 0, g: 0, b: 0 };
        this.colorWeight = 0;
        this.colorBlendRate = 0.01;
    }

    move() {
        let proximityMult = 1;
        const dx = this.pos.x - this.target.x;
        const dy = this.pos.y - this.target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.closeEnoughTarget) {
            proximityMult = distance / this.closeEnoughTarget;
        }

        const towardsTarget = {
            x: this.target.x - this.pos.x,
            y: this.target.y - this.pos.y,
        };

        const magnitude = Math.sqrt(towardsTarget.x * towardsTarget.x + towardsTarget.y * towardsTarget.y);
        if (magnitude > 0) {
            towardsTarget.x = (towardsTarget.x / magnitude) * this.maxSpeed * proximityMult;
            towardsTarget.y = (towardsTarget.y / magnitude) * this.maxSpeed * proximityMult;
        }

        const steer = {
            x: towardsTarget.x - this.vel.x,
            y: towardsTarget.y - this.vel.y,
        };

        const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y);
        if (steerMagnitude > 0) {
            steer.x = (steer.x / steerMagnitude) * this.maxForce;
            steer.y = (steer.y / steerMagnitude) * this.maxForce;
        }

        this.acc.x += steer.x;
        this.acc.y += steer.y;

        this.vel.x += this.acc.x;
        this.vel.y += this.acc.y;
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
        this.acc.x = 0;
        this.acc.y = 0;
    }

    draw(ctx, drawAsPoints) {
        if (this.colorWeight < 1.0) {
            this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
        }

        const currentColor = {
            r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
            g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
            b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
        };

        ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
        if (drawAsPoints) {
            ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
        } else {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    kill(width, height) {
        if (!this.isKilled) {
            const randomPos = this.generateRandomPos(width / 2, height / 2, (width + height) / 2);
            this.target.x = randomPos.x;
            this.target.y = randomPos.y;

            this.startColor = {
                r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
                g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
                b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
            };
            this.targetColor = { r: 5, g: 5, b: 5 };
            this.colorWeight = 0;
            this.isKilled = true;
        }
    }

    generateRandomPos(x, y, mag) {
        const randomX = Math.random() * 1400;
        const randomY = Math.random() * 400;
        const direction = { x: randomX - x, y: randomY - y };
        const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        if (magnitude > 0) {
            direction.x = (direction.x / magnitude) * mag;
            direction.y = (direction.y / magnitude) * mag;
        }
        return { x: x + direction.x, y: y + direction.y };
    }
}

export class ParticleTextEffect {
    constructor(canvas, words) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.words = words || ["WELCOME TO", "AIT-MUN"];
        this.particles = [];
        this.frameCount = 0;
        this.wordIndex = 0;
        this.pixelSteps = 6;
        this.drawAsPoints = true;
        this.mouse = { x: 0, y: 0, isPressed: false, isRightClick: false };
        this.animationId = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isPressed = true;
            this.mouse.isRightClick = e.button === 2;
            this.updateMousePos(e);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isPressed = false;
            this.mouse.isRightClick = false;
        });

        this.canvas.addEventListener('mousemove', (e) => this.updateMousePos(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.nextWord(this.words[0]);
        this.animate();
    }

    updateMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    }

    resize() {
        this.canvas.width = 1400;
        this.canvas.height = 400;
    }

    nextWord(word) {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = this.canvas.width;
        offscreenCanvas.height = this.canvas.height;
        const offCtx = offscreenCanvas.getContext('2d');

        offCtx.fillStyle = "white";
        // Measure text to fit
        offCtx.font = "bold 120px Montserrat, sans-serif";
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        offCtx.fillText(word, this.canvas.width / 2, this.canvas.height / 2);

        const imageData = offCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const pixels = imageData.data;

        const palette = [
            { r: 212, g: 175, b: 53 }, // Gold
            { r: 249, g: 228, b: 152 }, // Light Gold
            { r: 184, g: 134, b: 11 }  // Dark Gold
        ];
        const newColor = palette[Math.floor(Math.random() * palette.length)];

        let particleIndex = 0;
        const coordsIndexes = [];
        for (let i = 0; i < pixels.length; i += this.pixelSteps * 4) {
            coordsIndexes.push(i);
        }

        for (let i = coordsIndexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [coordsIndexes[i], coordsIndexes[j]] = [coordsIndexes[j], coordsIndexes[i]];
        }

        for (const coordIndex of coordsIndexes) {
            if (pixels[coordIndex + 3] > 0) {
                const x = (coordIndex / 4) % this.canvas.width;
                const y = Math.floor(coordIndex / 4 / this.canvas.width);

                let particle;
                if (particleIndex < this.particles.length) {
                    particle = this.particles[particleIndex];
                    particle.isKilled = false;
                    particleIndex++;
                } else {
                    particle = new Particle();
                    const rand = particle.generateRandomPos(this.canvas.width / 2, this.canvas.height / 2, (this.canvas.width + this.canvas.height) / 2);
                    particle.pos.x = rand.x;
                    particle.pos.y = rand.y;
                    particle.maxSpeed = Math.random() * 6 + 4;
                    particle.maxForce = particle.maxSpeed * 0.05;
                    particle.particleSize = Math.random() * 6 + 6;
                    particle.colorBlendRate = Math.random() * 0.0275 + 0.0025;
                    this.particles.push(particle);
                }

                particle.startColor = {
                    r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
                    g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
                    b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
                };
                particle.targetColor = { ...newColor };
                particle.colorWeight = 0;
                particle.target.x = x;
                particle.target.y = y;
            }
        }

        for (let i = particleIndex; i < this.particles.length; i++) {
            this.particles[i].kill(this.canvas.width, this.canvas.height);
        }
    }

    animate() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.move();
            p.draw(this.ctx, this.drawAsPoints);

            if (p.isKilled) {
                if (p.pos.x < -100 || p.pos.x > this.canvas.width + 100 || p.pos.y < -100 || p.pos.y > this.canvas.height + 100) {
                    this.particles.splice(i, 1);
                }
            }
        }

        if (this.mouse.isPressed && this.mouse.isRightClick) {
            this.particles.forEach(p => {
                const dist = Math.sqrt(Math.pow(p.pos.x - this.mouse.x, 2) + Math.pow(p.pos.y - this.mouse.y, 2));
                if (dist < 50) p.kill(this.canvas.width, this.canvas.height);
            });
        }

        this.frameCount++;
        if (this.frameCount % 240 === 0) {
            this.wordIndex = (this.wordIndex + 1) % this.words.length;
            this.nextWord(this.words[this.wordIndex]);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
}

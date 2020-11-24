import SimplexNoise from 'simplex-noise';

export type Vector2 = [number, number];

export interface FireworksOptions {
    count?: number;
    duration?: number;
    radius?: number;
    initialVelocity?: Vector2;
    velocityRandom?: Vector2;
    acceleration?: Vector2;
    noiseScale?: Vector2;
    noiseIntensity?: Vector2;
    scaleRange?: Vector2;
}

export interface Particle {
    el: HTMLElement;
    pos: Vector2;
    vel: Vector2;
}

export async function fireworks(container: HTMLElement, options: FireworksOptions = {}) {
    const {
        count = 50,
        duration = 3000,
        radius = 50,
        initialVelocity = [0, 30],
        velocityRandom = [5, 5],
        acceleration = [0, -20],
        noiseScale = [.02, .02],
        noiseIntensity = [2, 2],
        scaleRange = [1, 0],
    } = options;
    const noise = new SimplexNoise();
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.setAttribute('class', 'particle');
        container.appendChild(el);
        particles.push({
            el,
            pos: randomInsideCircle(radius),
            vel: [
                randomRange(initialVelocity[0] - velocityRandom[0], initialVelocity[0] + velocityRandom[0]),
                randomRange(initialVelocity[1] - velocityRandom[1], initialVelocity[1] + velocityRandom[1])
            ],
        });
    }
    // Now update them each frame, calculating velocities, positions and noises
    const startedAt = Date.now();
    let lastFrameAt = Date.now();
    while (Date.now() < startedAt + duration) {
        const t = (Date.now() - startedAt) / duration;
        const dt = Date.now() - lastFrameAt;
        lastFrameAt = Date.now();
        for (const p of particles) {
            const dv: Vector2 = dt > 0 ? [acceleration[0] / dt, acceleration[1] / dt] : [0, 0];
            const dn = sampleNoise2D(noise, p.pos, noiseScale, noiseIntensity);
            const vel: Vector2 = [p.vel[0] + dv[0] + dn[0], p.vel[1] + dv[1] + dn[1]];
            p.vel = vel;
            const dp: Vector2 = dt > 0 ? [vel[0] / dt, vel[1] / dt] : [0, 0];
            const pos: Vector2 = [p.pos[0] + dp[0], p.pos[1] + dp[1]];
            p.pos = pos;
            const scale = lerp(scaleRange[0], scaleRange[1], t);
            p.el.style.transform = `translate(${p.pos[0]}px, ${-p.pos[1]}px) scale(${scale})`;
        }
        await new Promise(r => requestAnimationFrame(r));
    }
    // Finally dispose em
    for (const p of particles) {
        p.el.parentElement!.removeChild(p.el);
    }
}

function randomRange(min: number = 0, max: number = 1): number {
    return Math.random() * (max - min) + min;
}

function randomInsideCircle(radius: number): Vector2 {
    const r = randomRange(0, 1) * radius;
    const theta = randomRange(0, 2 * Math.PI);
    return [Math.cos(theta) * r, Math.sin(theta) * r];
}

function sampleNoise2D(noise: SimplexNoise, pos: Vector2, scale: Vector2, intensity: Vector2): Vector2 {
    const nx = noise.noise2D(pos[0] * scale[0], pos[1] * scale[1]) * intensity[0];
    const ny = noise.noise2D(100 + pos[0] * scale[0], 100 + pos[1] * scale[1]) * intensity[0];
    return [nx, ny];
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function lerp(min: number, max: number, t: number) {
    return min + (max - min) * clamp(t, 0, 1);
}

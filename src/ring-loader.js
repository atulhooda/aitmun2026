import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const INSCRIPTION = 'Forging Leadership  ·  AIT MUN 2026  ·  Diplomacy & Excellence  ·  ';

function makeInscriptionTexture() {
    const c = document.createElement('canvas');
    c.width = 2048; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 2048, 128);
    ctx.font = 'italic 700 42px "Cinzel", serif';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#d4af37'; ctx.shadowBlur = 24;
    ctx.fillStyle = '#f1f5f9'; // Mithril text
    const tw = ctx.measureText(INSCRIPTION).width;
    for (let x = 0; x < 2048 + tw; x += tw) ctx.fillText(INSCRIPTION, x, 64);
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#d4af37'; // Gold Leaf glow
    for (let x = 0; x < 2048 + tw; x += tw) ctx.fillText(INSCRIPTION, x, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

function makeCircleSprite(size, inner, outer, color0, color1) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d').createRadialGradient(size / 2, size / 2, inner, size / 2, size / 2, outer);
    g.addColorStop(0, color0); g.addColorStop(1, color1);
    c.getContext('2d').fillStyle = g;
    c.getContext('2d').fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
}

function makeEmberTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d').createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(212,175,55,0.9)');
    g.addColorStop(0.7, 'rgba(10,25,47,0.4)');
    g.addColorStop(1, 'rgba(10,25,47,0)');
    c.getContext('2d').fillStyle = g;
    c.getContext('2d').fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
}

export function initRingLoader(mountId, loaderId) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 5.6);
    camera.lookAt(0, 0, 0);

    const onResize = () => {
        const w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    scene.add(new THREE.AmbientLight(0x0a192f, 2.5)); // Deep Blue Ambient
    const fire = new THREE.PointLight(0xd4af37, 8, 15); // Gold Point Light
    fire.position.set(0, -2.0, 1.0);
    scene.add(fire);

    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = -0.40;
    ringGroup.scale.setScalar(0.35);
    scene.add(ringGroup);

    const torusGeo = new THREE.TorusGeometry(1.5, 0.3, 64, 200);
    const torusMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37, // Gold Leaf
        metalness: 1.0,
        roughness: 0.15,
        emissive: 0x0a192f, // Deep Blue Emissive
        emissiveIntensity: 0.4,
        envMapIntensity: 2.0,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    ringGroup.add(torusMesh);

    const inscTex = makeInscriptionTexture();
    const inscGeo = new THREE.TorusGeometry(1.5, 0.305, 8, 200);
    const inscMat = new THREE.MeshBasicMaterial({
        map: inscTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const inscMesh = new THREE.Mesh(inscGeo, inscMat);
    ringGroup.add(inscMesh);

    const glowTex = makeCircleSprite(512, 0, 256, 'rgba(212,175,55,0.06)', 'rgba(0,0,0,0)');
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(6, 6, 1);
    scene.add(glow);

    const N = 80;
    const emPos = new Float32Array(N * 3);
    const emVel = [];
    const spawnEmber = (i) => {
        const a = Math.random() * Math.PI * 2;
        const r = 1.1 + Math.random() * 0.9;
        emPos[i * 3] = Math.cos(a) * r;
        emPos[i * 3 + 1] = -0.9 + Math.random() * 0.5;
        emPos[i * 3 + 2] = Math.sin(a) * r;
        emVel[i] = { x: (Math.random() - 0.5) * 0.01, y: 0.01 + Math.random() * 0.02, z: (Math.random() - 0.5) * 0.01 };
    };
    for (let i = 0; i < N; i++) { spawnEmber(i); emPos[i * 3 + 1] = -1.2 + Math.random() * 4.0; }
    const emGeo = new THREE.BufferGeometry();
    emGeo.setAttribute('position', new THREE.BufferAttribute(emPos, 3));
    const emTex = makeEmberTexture();
    const emMat = new THREE.PointsMaterial({ map: emTex, size: 0.05, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xd4af37 }); // Gold Embers
    const emPoints = new THREE.Points(emGeo, emMat);
    scene.add(emPoints);

    let raf;
    let t = 0;
    const tick = () => {
        raf = requestAnimationFrame(tick);
        t += 0.016;
        ringGroup.rotation.y = t * 0.5;
        ringGroup.position.y = Math.sin(t * 0.7) * 0.05;
        inscTex.offset.y += 0.0008;
        fire.intensity = 4 + Math.sin(t * 3) * 1;
        const pos = emGeo.attributes.position.array;
        for (let i = 0; i < N; i++) {
            pos[i * 3] += emVel[i].x; pos[i * 3 + 1] += emVel[i].y; pos[i * 3 + 2] += emVel[i].z;
            if (pos[i * 3 + 1] > 3) spawnEmber(i);
        }
        emGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    };
    tick();

    const hideLoader = () => {
        const loader = document.getElementById(loaderId);
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                cancelAnimationFrame(raf);
                window.removeEventListener('resize', onResize);
                renderer.dispose();
                torusGeo.dispose(); torusMat.dispose();
                inscGeo.dispose(); inscMat.dispose();
                emGeo.dispose(); emMat.dispose();
                envTex.dispose(); glowTex.dispose(); glowMat.dispose();
                loader.remove();
            }, 1000);
        }
    };

    return hideLoader;
}

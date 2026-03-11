import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './Ring3D.css';

const INSCRIPTION =
  'Ash nazg durbatulûk  ·  ash nazg gimbatul  ·  ash nazg thrakatulûk  ·  agh burzum-ishi krimpatul  ·  ';

/* ── Texture helpers ─────────────────────────────────────────── */
function makeInscriptionTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 2048, 128);
  ctx.font = 'italic bold 38px "Palatino Linotype", Palatino, serif';
  ctx.textBaseline = 'middle';
  // outer glow
  ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 28;
  ctx.fillStyle   = '#cc1100';
  const tw = ctx.measureText(INSCRIPTION).width;
  for (let x = 0; x < 2048 + tw; x += tw) ctx.fillText(INSCRIPTION, x, 64);
  // crisp bright pass
  ctx.shadowBlur = 8;
  ctx.fillStyle  = '#ffaa55';
  for (let x = 0; x < 2048 + tw; x += tw) ctx.fillText(INSCRIPTION, x, 64);
  const tex = new THREE.CanvasTexture(c);
  // TorusGeometry: U = around tube, V = around ring circumference
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeCircleSprite(size, inner, outer, color0, color1) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d').createRadialGradient(size/2,size/2,inner,size/2,size/2,outer);
  g.addColorStop(0, color0); g.addColorStop(1, color1);
  c.getContext('2d').fillStyle = g;
  c.getContext('2d').fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

function makeEmberTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d').createRadialGradient(16,16,0,16,16,16);
  g.addColorStop(0,   'rgba(255,255,200,1)');
  g.addColorStop(0.2, 'rgba(255,180,40,0.9)');
  g.addColorStop(0.7, 'rgba(255,60,0,0.4)');
  g.addColorStop(1,   'rgba(255,30,0,0)');
  c.getContext('2d').fillStyle = g;
  c.getContext('2d').fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function makeShadowTexture() {
  const c = document.createElement('canvas'); c.width=256; c.height=128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128,64,0,128,64,110);
  g.addColorStop(0,   'rgba(220,65,0,0.55)');
  g.addColorStop(0.5, 'rgba(180,35,0,0.22)');
  g.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(128,64,112,54,0,0,Math.PI*2); ctx.fill();
  return new THREE.CanvasTexture(c);
}

/* ── Component ────────────────────────────────────────────────── */
export default function Ring3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;

    /* ── Renderer ─────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping          = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure  = 1.35;
    renderer.outputColorSpace     = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    /* ── Scene & Camera ──────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 5.6);
    camera.lookAt(0, 0, 0);

    /* ── Resize handler ──────────────────────── */
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    /* ── Environment (drives PBR reflections) ── */
    const pmrem  = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    /* ── Lights ──────────────────────────────── */
    scene.add(new THREE.AmbientLight(0x180c00, 3));

    const key = new THREE.DirectionalLight(0xfff4d0, 4.5);
    key.position.set(-3, 5, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffcc66, 1.2);
    fill.position.set(4, 1, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff6600, 1.8);
    rim.position.set(0, -2, -3);
    scene.add(rim);

    const fire = new THREE.PointLight(0xff4400, 6, 14);
    fire.position.set(0, -2.0, 0.8);
    scene.add(fire);

    const topLight = new THREE.PointLight(0xffd080, 2.2, 12);
    topLight.position.set(0, 4, 1.5);
    scene.add(topLight);

    /* ── Ring group ──────────────────────────── */
    const ringGroup = new THREE.Group();
    ringGroup.rotation.x = -0.40;
    ringGroup.scale.setScalar(0.35);
    scene.add(ringGroup);

    // PBR gold torus — metalness + roughness gives real gold look
    const torusGeo = new THREE.TorusGeometry(1.5, 0.3, 128, 400);
    const torusMat = new THREE.MeshStandardMaterial({
      color:             new THREE.Color(0xD4920A),
      metalness:         0.92,
      roughness:         0.22,
      emissive:          new THREE.Color(0x2a1200),
      emissiveIntensity: 0.6,
      envMapIntensity:   1.4,
    });
    const torusMesh = new THREE.Mesh(torusGeo, torusMat);
    ringGroup.add(torusMesh);

    // Thin bright edge ring
    const edgeGeo = new THREE.TorusGeometry(1.5, 0.31, 12, 400);
    const edgeMat = new THREE.MeshStandardMaterial({
      color:             0xFFE066,
      metalness:         0.95,
      roughness:         0.12,
      emissive:          0x3a2200,
      emissiveIntensity: 0.3,
      transparent:       true,
      opacity:           0.30,
      envMapIntensity:   1.8,
    });
    ringGroup.add(new THREE.Mesh(edgeGeo, edgeMat));

    // Inscription overlay scrolled along the ring circumference (V axis)
    const inscTex = makeInscriptionTexture();
    const inscGeo = new THREE.TorusGeometry(1.5, 0.312, 8, 400);
    const inscMat = new THREE.MeshBasicMaterial({
      map:         inscTex,
      transparent: true,
      blending:    THREE.AdditiveBlending,
      depthWrite:  false,
    });
    const inscMesh = new THREE.Mesh(inscGeo, inscMat);
    ringGroup.add(inscMesh);

    /* ── Glow sprites ────────────────────────── */
    const glowTex  = makeCircleSprite(512, 0, 256,
      'rgba(255,120,0,0.09)', 'rgba(0,0,0,0)');
    const glowMat  = new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(4.5, 4.5, 1);
    scene.add(glow);

    // Inner hot-spot glow
    const coreTex = makeCircleSprite(256, 0, 128,
      'rgba(255,200,60,0.10)', 'rgba(0,0,0,0)');
    const coreMat = new THREE.SpriteMaterial({
      map: coreTex, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    core.scale.set(2.2, 2.2, 1);
    scene.add(core);

    /* ── Ember particles ─────────────────────── */
    const N = 160;
    const emPos = new Float32Array(N * 3);
    const emVel = [];

    const spawnEmber = (i) => {
      const a = Math.random() * Math.PI * 2;
      const r = 1.1 + Math.random() * 0.9;
      emPos[i * 3]     = Math.cos(a) * r;
      emPos[i * 3 + 1] = -0.9 + Math.random() * 0.5;
      emPos[i * 3 + 2] = Math.sin(a) * r;
      emVel[i] = {
        x: (Math.random() - 0.5) * 0.014,
        y:  0.007 + Math.random() * 0.022,
        z: (Math.random() - 0.5) * 0.014,
      };
    };
    for (let i = 0; i < N; i++) {
      spawnEmber(i);
      emPos[i * 3 + 1] = -1.2 + Math.random() * 4.0; // spread initial heights
    }

    const emGeo = new THREE.BufferGeometry();
    emGeo.setAttribute('position', new THREE.BufferAttribute(emPos, 3));
    const emTex = makeEmberTexture();
    const emMat = new THREE.PointsMaterial({
      map: emTex, size: 0.075, sizeAttenuation: true,
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, color: 0xff9900,
    });
    scene.add(new THREE.Points(emGeo, emMat));

    /* ── Animation loop ──────────────────────── */
    let raf;
    let t = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t  += 0.016;

      // Rotate ring
      ringGroup.rotation.y  = t * 0.55;
      // Gentle bob
      ringGroup.position.y  = Math.sin(t * 0.65) * 0.07;
      // Scroll inscription along the ring circumference (V / offset.y)
      inscTex.offset.y     += 0.0007;

      // Fire flicker
      fire.intensity = 4.2 + Math.sin(t * 2.5) * 1.1 + Math.sin(t * 5.3) * 0.35;
      fire.color.setHSL(0.065 - Math.abs(Math.sin(t * 1.6)) * 0.025, 1, 0.5);

      // Glow pulse
      const gs = 4.2 + Math.sin(t * 1.8) * 0.4;
      glow.scale.set(gs, gs, 1);
      const cs = 2.0 + Math.sin(t * 2.3) * 0.2;
      core.scale.set(cs, cs, 1);

      // Ember physics
      const pos = emGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        pos[i * 3]     += emVel[i].x;
        pos[i * 3 + 1] += emVel[i].y;
        pos[i * 3 + 2] += emVel[i].z;
        if (pos[i * 3 + 1] > 3.2) spawnEmber(i);
      }
      emGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };
    tick();

    /* ── Cleanup ─────────────────────────────── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
      pmrem.dispose();
      envTex.dispose();
      [torusGeo, edgeGeo, inscGeo, emGeo].forEach(g => g.dispose());
      [torusMat, edgeMat, inscMat, emMat, glowMat, coreMat].forEach(m => m.dispose());
      [inscTex, emTex, glowTex, coreTex].forEach(tx => tx.dispose());
    };
  }, []);

  return (
    <div className="r3d-page">
      <div ref={mountRef} className="r3d-canvas-mount" />
      <div className="r3d-text-wrap">
        <span className="r3d-verse">One Ring to rule them all</span>
        <span className="r3d-subtitle">Loading</span>
        <div className="r3d-dots">
          <div className="r3d-dot" />
          <div className="r3d-dot" />
          <div className="r3d-dot" />
        </div>
      </div>
    </div>
  );
}

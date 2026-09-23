import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js';

const canvas = document.querySelector('#hero3d');
const frame = document.querySelector('#heroVisual');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 780px)').matches;
let configuredMotion = window.__portfolioSettings?.motion3d || 'full';
window.addEventListener('portfolio:settings', (event) => {
  configuredMotion = event.detail?.motion3d || configuredMotion;
  if (configuredMotion === 'off') canvas?.closest('.scene-frame')?.classList.add('portfolio-3d-off');
  else canvas?.closest('.scene-frame')?.classList.remove('portfolio-3d-off');
});

if (canvas instanceof HTMLCanvasElement && frame) {
  const probe = document.createElement('canvas');
  const supportsWebGL2 = Boolean(probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true }));

  if (supportsWebGL2) {
    try {
      initialiseScene();
    } catch (error) {
      console.warn('3D scene unavailable; retaining the optimized fallback.', error);
    }
  }
}

function initialiseScene() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050912, 0.058);
  const camera = new THREE.PerspectiveCamera(isMobile ? 48 : 42, 1, 0.1, 100);
  camera.position.set(isMobile ? 0.3 : 0.9, 4.25, isMobile ? 12.2 : 11.3);
  camera.lookAt(0, 0.35, 0);

  scene.add(new THREE.HemisphereLight(0x9edfff, 0x04050a, 1.7));
  const keyLight = new THREE.DirectionalLight(0xccecff, 3.5);
  keyLight.position.set(-4, 8, 5);
  scene.add(keyLight);
  const blueLight = new THREE.PointLight(0x2c8dff, 45, 16, 2);
  blueLight.position.set(4.5, 3.5, 2.5);
  scene.add(blueLight);
  const violetLight = new THREE.PointLight(0x8e62ff, 30, 13, 2);
  violetLight.position.set(-4, 1, -1);
  scene.add(violetLight);

  const root = new THREE.Group();
  root.position.y = -0.5;
  root.rotation.y = -0.12;
  scene.add(root);

  const materials = {
    graphite: new THREE.MeshStandardMaterial({ color: 0x101827, metalness: 0.68, roughness: 0.27 }),
    graphiteSoft: new THREE.MeshStandardMaterial({ color: 0x172237, metalness: 0.45, roughness: 0.4 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x060a12, metalness: 0.46, roughness: 0.36 }),
    cyan: new THREE.MeshStandardMaterial({ color: 0x65e5ff, emissive: 0x14749e, emissiveIntensity: 2.2, metalness: 0.15, roughness: 0.22 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x438cff, emissive: 0x123f9b, emissiveIntensity: 1.7, metalness: 0.2, roughness: 0.25 }),
    purple: new THREE.MeshStandardMaterial({ color: 0x9c7bff, emissive: 0x3c228b, emissiveIntensity: 1.7, metalness: 0.2, roughness: 0.25 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x6ab8ff, transparent: true, opacity: 0.15, roughness: 0.08, metalness: 0.05, transmission: 0.28, thickness: 0.7 })
  };

  createDesk(root, materials);
  const laptop = createLaptop(root, materials);
  const monitors = createMonitorSet(root, materials);
  createDeskAccessories(root, materials);
  const server = createServer(root, materials);
  const database = createDatabase(root, materials);
  const brackets = createBrackets(root, materials);
  const badges = createBadges(root);
  const dataFlow = createDataFlow(root, materials);
  const ambientParticles = createParticles(root);

  const grid = new THREE.GridHelper(22, 24, 0x285990, 0x12213a);
  grid.position.y = -2.17;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  root.add(grid);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let scrollTarget = 0;
  let sceneVisible = true;
  let documentVisible = !document.hidden;
  let lastFrame = 0;
  let elapsed = 0;

  const resize = () => {
    const rect = frame.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 520 ? 51 : width < 780 ? 47 : 42;
    camera.updateProjectionMatrix();
  };

  const pointerMove = (event) => {
    const rect = frame.getBoundingClientRect();
    target.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    target.y = THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
  };

  const pointerLeave = () => {
    target.x = 0;
    target.y = 0;
  };

  const updateScroll = () => {
    const rect = frame.getBoundingClientRect();
    scrollTarget = THREE.MathUtils.clamp(-rect.top / Math.max(window.innerHeight, 1), -0.4, 1.2);
  };

  frame.addEventListener('pointermove', pointerMove, { passive: true });
  frame.addEventListener('pointerleave', pointerLeave);
  window.addEventListener('scroll', updateScroll, { passive: true });
  new ResizeObserver(resize).observe(frame);
  new IntersectionObserver((entries) => {
    sceneVisible = entries[0]?.isIntersecting ?? true;
  }, { rootMargin: '120px' }).observe(frame);
  document.addEventListener('visibilitychange', () => {
    documentVisible = !document.hidden;
  });

  const render = (timestamp = 0) => {
    if (!sceneVisible || !documentVisible) return;
    if (isMobile && timestamp - lastFrame < 31) return;
    const delta = Math.min(0.05, (timestamp - lastFrame) / 1000 || 0.016);
    lastFrame = timestamp;
    elapsed += delta;

    if (configuredMotion !== 'off' && !prefersReducedMotion) {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      root.rotation.y = -0.12 + pointer.x * 0.11 + scrollTarget * 0.04;
      root.rotation.x = pointer.y * 0.035;
      root.position.y = -0.5 + pointer.y * 0.08 - scrollTarget * 0.12;
      camera.position.x += ((isMobile ? 0.3 : 0.9) + pointer.x * 0.23 - camera.position.x) * 0.035;
      camera.position.y += (4.25 + pointer.y * 0.12 - camera.position.y) * 0.035;
      camera.lookAt(0, 0.3, 0);

      laptop.position.y = Math.sin(elapsed * 0.82) * 0.055;
      monitors.rotation.y = Math.sin(elapsed * 0.3) * 0.012;
      server.rotation.y = -0.17 + Math.sin(elapsed * 0.42) * 0.025;
      database.rotation.y += delta * 0.18;
      brackets.rotation.y += delta * 0.35;
      brackets.position.y = 1.55 + Math.sin(elapsed * 1.1) * 0.11;
      badges.forEach((badge, index) => {
        badge.position.y = badge.userData.baseY + Math.sin(elapsed * (0.75 + index * 0.05) + index) * 0.09;
        badge.rotation.z = Math.sin(elapsed * 0.5 + index) * 0.035;
      });
      dataFlow.particles.forEach((particle, index) => {
        const route = dataFlow.routes[index % dataFlow.routes.length];
        const t = (elapsed * particle.userData.speed + particle.userData.offset) % 1;
        particle.position.copy(route.getPointAt(t));
      });
      ambientParticles.rotation.y = configuredMotion === 'reduced' ? elapsed * 0.004 : elapsed * 0.012;
    }

    renderer.render(scene, camera);
  };

  resize();
  updateScroll();
  renderer.setAnimationLoop(render);
  frame.classList.add('webgl-ready');
  render(0);
}

function createMonitorSet(root, materials) {
  const monitorSet = new THREE.Group();
  monitorSet.position.set(0, 0.45, -1.55);

  const monitorDefinitions = [
    { x: -2.65, y: 0.7, rotation: 0.19, type: 'terminal' },
    { x: 2.65, y: 0.7, rotation: -0.19, type: 'architecture' }
  ];

  monitorDefinitions.forEach((definition) => {
    const monitor = new THREE.Group();
    monitor.position.set(definition.x, definition.y, 0);
    monitor.rotation.y = definition.rotation;

    const shell = roundedBox(3.2, 2.2, 0.16, 0.12, materials.graphite);
    monitor.add(shell);
    const texture = createMonitorTexture(definition.type);
    const display = new THREE.Mesh(new THREE.PlaneGeometry(2.92, 1.88), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    display.position.z = 0.09;
    monitor.add(display);

    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.82, 0.16), materials.graphiteSoft);
    stem.position.y = -1.48;
    monitor.add(stem);
    const foot = roundedBox(1.25, 0.09, 0.65, 0.05, materials.graphiteSoft);
    foot.position.set(0, -1.86, 0.12);
    monitor.add(foot);
    monitorSet.add(monitor);
  });

  root.add(monitorSet);
  return monitorSet;
}

function createMonitorTexture(type) {
  const screen = document.createElement('canvas');
  screen.width = 720;
  screen.height = 460;
  const context = screen.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 720, 460);
  gradient.addColorStop(0, '#07111f');
  gradient.addColorStop(1, '#090e1b');
  context.fillStyle = gradient;
  context.fillRect(0, 0, screen.width, screen.height);
  context.fillStyle = '#0e1b2e';
  context.fillRect(0, 0, screen.width, 48);
  context.font = '15px monospace';
  context.fillStyle = '#5b6e8a';
  context.fillText(type === 'terminal' ? 'api-terminal' : 'system-architecture', 24, 30);

  if (type === 'terminal') {
    const lines = [
      ['$ dotnet run', '#75e7ff'],
      ['Building application...', '#8292a9'],
      ['ASP.NET Core API started', '#5ee5a4'],
      ['GET  /api/profile       200 OK', '#a9bbd2'],
      ['GET  /api/projects      200 OK', '#a9bbd2'],
      ['POST /api/contact       201 CREATED', '#a9bbd2'],
      ['SQL Server ........ CONNECTED', '#5ee5a4'],
      ['MongoDB ........... CONNECTED', '#5ee5a4'],
      ['API Status: HEALTHY', '#75e7ff']
    ];
    context.font = '17px monospace';
    lines.forEach(([line, color], index) => {
      context.fillStyle = color;
      context.fillText(line, 34, 88 + index * 38);
    });
  } else {
    const blocks = [
      ['ANGULAR', 32, 91, '#ee6b84'],
      ['REST API', 258, 91, '#68ddff'],
      ['ASP.NET CORE', 472, 91, '#8576ff'],
      ['BUSINESS SERVICES', 258, 238, '#68ddff'],
      ['SQL / MONGODB', 258, 352, '#62e5a5']
    ];
    context.font = '700 15px monospace';
    blocks.forEach(([label, x, y, color]) => {
      context.fillStyle = 'rgba(17,31,53,.92)';
      context.strokeStyle = `${color}88`;
      context.lineWidth = 1;
      roundRect(context, x, y, 180, 56, 10);
      context.fill();
      context.stroke();
      context.fillStyle = color;
      context.textAlign = 'center';
      context.fillText(label, x + 90, y + 34);
    });
    context.textAlign = 'left';
    context.strokeStyle = 'rgba(96,206,255,.38)';
    context.beginPath();
    context.moveTo(212, 119); context.lineTo(258, 119);
    context.moveTo(438, 119); context.lineTo(472, 119);
    context.moveTo(562, 147); context.lineTo(348, 238);
    context.moveTo(348, 294); context.lineTo(348, 352);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(screen);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createDeskAccessories(root, materials) {
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), materials.graphiteSoft);
  mouse.scale.set(1, 0.45, 1.25);
  mouse.position.set(2.5, -1.47, 1.15);
  root.add(mouse);

  const mug = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.72, 28, 1, true), materials.graphiteSoft);
  mug.add(cup);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.065, 10, 24, Math.PI * 1.55), materials.graphiteSoft);
  handle.rotation.y = Math.PI / 2;
  handle.position.set(0.35, 0.02, 0);
  mug.add(handle);
  mug.position.set(-3.1, -1.22, 1.05);
  root.add(mug);

  const headphones = new THREE.Group();
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.055, 10, 32, Math.PI), materials.dark);
  band.rotation.z = Math.PI / 2;
  headphones.add(band);
  [-1, 1].forEach((side) => {
    const pad = roundedBox(0.18, 0.52, 0.34, 0.08, materials.graphiteSoft);
    pad.position.set(0, side * 0.61, -0.05);
    headphones.add(pad);
  });
  headphones.position.set(3.55, -0.75, 1.15);
  headphones.rotation.set(0.35, 0.2, -0.22);
  root.add(headphones);
}

function createDesk(root, materials) {
  const group = new THREE.Group();
  const surface = roundedBox(8.8, 0.25, 4.8, 0.16, materials.graphiteSoft);
  surface.position.set(0, -1.75, 0.25);
  group.add(surface);

  const edge = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.035, 0.035), materials.cyan);
  edge.position.set(0, -1.6, 2.55);
  edge.material = edge.material.clone();
  edge.material.transparent = true;
  edge.material.opacity = 0.42;
  group.add(edge);
  root.add(group);
}

function createLaptop(root, materials) {
  const laptop = new THREE.Group();
  laptop.position.set(-0.55, 0, 0.25);

  const base = roundedBox(5.15, 0.22, 3.2, 0.13, materials.graphite);
  base.position.set(0, -1.43, 0.25);
  base.rotation.x = -0.03;
  laptop.add(base);

  const inset = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.8), new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.4, roughness: 0.35 }));
  inset.rotation.x = -Math.PI / 2;
  inset.position.set(0, -1.305, 0.62);
  laptop.add(inset);

  const screen = new THREE.Group();
  screen.position.set(0, 0.12, -1.19);
  screen.rotation.x = -0.09;
  const shell = roundedBox(5.15, 3.25, 0.18, 0.14, materials.graphite);
  shell.position.y = 0.25;
  screen.add(shell);

  const codeTexture = createCodeTexture();
  const display = new THREE.Mesh(new THREE.PlaneGeometry(4.72, 2.78), new THREE.MeshBasicMaterial({ map: codeTexture, toneMapped: false }));
  display.position.set(0, 0.27, 0.101);
  screen.add(display);
  laptop.add(screen);

  const keys = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.055, 0.22), new THREE.MeshStandardMaterial({ color: 0x111a29, metalness: 0.2, roughness: 0.45 }), 48);
  const dummy = new THREE.Object3D();
  let keyIndex = 0;
  for (let row = 0; row < 4; row += 1) {
    const columns = row === 3 ? 9 : 13;
    for (let column = 0; column < columns; column += 1) {
      dummy.position.set((column - (columns - 1) / 2) * 0.335, -1.29, -0.18 + row * 0.31);
      dummy.rotation.x = -0.03;
      dummy.updateMatrix();
      keys.setMatrixAt(keyIndex, dummy.matrix);
      keyIndex += 1;
    }
  }
  keys.count = keyIndex;
  laptop.add(keys);
  root.add(laptop);
  return laptop;
}

function createCodeTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 600;
  const context = textureCanvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1024, 600);
  gradient.addColorStop(0, '#07101d');
  gradient.addColorStop(1, '#0a1326');
  context.fillStyle = gradient;
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  context.fillStyle = '#0e1b30';
  context.fillRect(0, 0, 1024, 62);
  ['#ff6a83', '#ffd36b', '#5ce4a3'].forEach((color, index) => {
    context.beginPath();
    context.fillStyle = color;
    context.arc(34 + index * 28, 31, 7, 0, Math.PI * 2);
    context.fill();
  });
  context.fillStyle = '#5a6b83';
  context.font = '18px monospace';
  context.fillText('DeveloperController.cs', 140, 38);

  const lines = [
    [{ t: '[ApiController]', c: '#61e5ff' }],
    [{ t: '[Route("api/[controller]")]', c: '#61e5ff' }],
    [{ t: 'public class', c: '#72aaff' }, { t: ' DeveloperController', c: '#d9e6f7' }],
    [{ t: '{', c: '#d9e6f7' }],
    [{ t: '  [HttpGet("profile")]', c: '#61e5ff' }],
    [{ t: '  public IActionResult', c: '#72aaff' }, { t: ' GetProfile()', c: '#d9e6f7' }],
    [{ t: '  {', c: '#d9e6f7' }],
    [{ t: '    return Ok', c: '#a987ff' }, { t: '(new {', c: '#b7c8de' }],
    [{ t: '      Name = "Zain Ali",', c: '#78e7af' }],
    [{ t: '      Experience = "5 Years" });', c: '#78e7af' }],
    [{ t: '  }', c: '#d9e6f7' }],
    [{ t: '}', c: '#d9e6f7' }]
  ];
  context.font = '20px monospace';
  lines.forEach((parts, lineIndex) => {
    let x = 75;
    parts.forEach((part) => {
      context.fillStyle = part.c;
      context.fillText(part.t, x, 98 + lineIndex * 39);
      x += context.measureText(part.t).width;
    });
  });

  context.strokeStyle = 'rgba(88,185,255,.16)';
  conte
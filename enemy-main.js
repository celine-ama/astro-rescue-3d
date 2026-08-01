import * as THREE from 'three';

// -----------------------------
// BASIC SCENE SETUP
// -----------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000006);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// -----------------------------
// LIGHTING + VISIBLE SUN
// -----------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.16);
scene.add(ambientLight);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(12, 96, 96),
  new THREE.MeshBasicMaterial({ color: 0xffdd66 })
);
sun.position.set(85, 45, -155);
scene.add(sun);

const sunGlow = new THREE.PointLight(0xffcc77, 5.2, 600);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

const sunLight = new THREE.DirectionalLight(0xffffff, 3.6);
sunLight.position.copy(sun.position);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 900;
sunLight.shadow.camera.left = -180;
sunLight.shadow.camera.right = 180;
sunLight.shadow.camera.top = 180;
sunLight.shadow.camera.bottom = -180;
scene.add(sunLight);

sunLight.target.position.set(0, 0, -120);
scene.add(sunLight.target);

// -----------------------------
// TEXTURES
// -----------------------------
// The original texture files were lost, so this repaired version uses
// solid-color materials. New textures can be added later without changing
// the gameplay logic.

const texMars = null;
const texMarsShade = null;
const texNeptune = null;
const texVenus = null;
const texUranus = null;
const texJupiter = null;
const texSaturnRing = null;


// -----------------------------
// PLAYER SPACESHIP
// -----------------------------
const player = new THREE.Group();

const shipMaterial = new THREE.MeshStandardMaterial({
  color: 0xdde7f2,
  metalness: 0.65,
  roughness: 0.28
});

const shipAccentMaterial = new THREE.MeshStandardMaterial({
  color: 0x2f70d0,
  emissive: 0x07162e,
  metalness: 0.45,
  roughness: 0.35
});

const shipBody = new THREE.Mesh(
  new THREE.ConeGeometry(0.9, 4.2, 8),
  shipMaterial
);
shipBody.rotation.x = -Math.PI / 2;
shipBody.position.z = -0.25;
shipBody.castShadow = true;
player.add(shipBody);

const shipWing = new THREE.Mesh(
  new THREE.BoxGeometry(5.2, 0.18, 1.05),
  shipAccentMaterial
);
shipWing.position.z = 0.35;
shipWing.castShadow = true;
player.add(shipWing);

const shipTail = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.8, 1.0),
  shipMaterial
);
shipTail.position.z = 1.55;
shipTail.castShadow = true;
player.add(shipTail);

const engineGlowMaterial = new THREE.MeshBasicMaterial({ color: 0x55ccff });
for (const x of [-0.48, 0.48]) {
  const engine = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    engineGlowMaterial
  );
  engine.position.set(x, 0, 2.08);
  player.add(engine);
}

player.position.set(0, 0, 10);
scene.add(player);

const playerRadius = 2;


// -----------------------------
// CAMERA
// -----------------------------
const DEFAULT_CAMERA_YAW = 0;
const DEFAULT_CAMERA_PITCH = 0;
let cameraYaw = DEFAULT_CAMERA_YAW;
let cameraPitch = DEFAULT_CAMERA_PITCH;
let isRotatingCamera = false;
let lastPointer = { x: 0, y: 0 };

camera.position.set(0, 11, 34);
camera.lookAt(player.position);

// -----------------------------
// KEYBOARD CONTROLS
// -----------------------------
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  q: false,
  e: false,
  space: false,
  arrowleft: false,
  arrowright: false,
  arrowup: false,
  arrowdown: false
};

window.addEventListener('keydown', (e) => {
  const k = e.code === 'Space' ? 'space' : e.key.toLowerCase();
  if (k in keys) keys[k] = true;
  if (k === 'space') e.preventDefault();
  if (k === 'r') resetCameraView();
});

window.addEventListener('keyup', (e) => {
  const k = e.code === 'Space' ? 'space' : e.key.toLowerCase();
  if (k in keys) keys[k] = false;
});

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button === 0) firePlayerWeapon();
  if (e.button !== 2) return;

  isRotatingCamera = true;
  lastPointer = { x: e.clientX, y: e.clientY };
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!isRotatingCamera) return;

  const dx = e.clientX - lastPointer.x;
  const dy = e.clientY - lastPointer.y;
  cameraYaw -= dx * 0.006;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + dy * 0.004, -0.5, 0.85);
  lastPointer = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (e.button !== 2) return;

  isRotatingCamera = false;
  renderer.domElement.releasePointerCapture(e.pointerId);
});

// -----------------------------
// GALAXY BACKGROUND
// -----------------------------
const galaxy = new THREE.Group();

function createGalaxy() {
  const galaxyGeometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];

  const galaxyColorA = new THREE.Color(0x6688ff);
  const galaxyColorB = new THREE.Color(0xff99cc);
  const galaxyColorC = new THREE.Color(0xffffff);

  const count = 5200;
  const arms = 4;

  for (let i = 0; i < count; i++) {
    const radius = Math.random() * 260;
    const arm = i % arms;
    const angle = (arm / arms) * Math.PI * 2 + radius * 0.035;

    const randomSpread = Math.pow(Math.random(), 2) * 34;
    const randomAngle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * radius + Math.cos(randomAngle) * randomSpread;
    const y = (Math.random() - 0.5) * 28 + Math.sin(radius * 0.03) * 5;
    const z = Math.sin(angle) * radius + Math.sin(randomAngle) * randomSpread - 360;

    positions.push(x, y, z);

    const mixed = galaxyColorA.clone().lerp(galaxyColorB, Math.random());
    mixed.lerp(galaxyColorC, Math.random() * 0.35);
    colors.push(mixed.r, mixed.g, mixed.b);
  }

  galaxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  galaxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const galaxyMaterial = new THREE.PointsMaterial({
    size: 0.75,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    sizeAttenuation: true,
    depthWrite: false
  });

  const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
  galaxyPoints.rotation.x = 0.35;
  galaxyPoints.rotation.z = -0.25;

  galaxy.add(galaxyPoints);
  galaxy.position.set(0, -15, -80);
  scene.add(galaxy);
}

createGalaxy();

// -----------------------------
// STAR FIELD
// -----------------------------
const starGeometry = new THREE.BufferGeometry();
const starPositions = [];

for (let i = 0; i < 3200; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 680,
    (Math.random() - 0.5) * 450,
    (Math.random() - 0.5) * 680
  );
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starPositions, 3)
);

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.22,
    sizeAttenuation: true
  })
);

scene.add(stars);

// -----------------------------
// RING SHADERS
// -----------------------------
const ringVertexShader = `
  varying vec3 vPosition;

  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragmentShader = `
  uniform vec3 ringColor;
  varying vec3 vPosition;

  void main() {
    float dist = length(vPosition.xy);
    float brightness = 0.5 + 0.5 * sin(dist * 28.0);
    gl_FragColor = vec4(ringColor * brightness, 0.78);
  }
`;

// -----------------------------
// RANDOM BACKGROUND PLANETS
// -----------------------------
const backgroundPlanets = [];

const backgroundPlanetStyles = [
  { color: 0xb94f38, radius: [4, 8], ring: false },
  { color: 0x2774c8, radius: [5, 10], ring: false },
  { color: 0xd98b3a, radius: [5, 9], ring: false },
  { color: 0x75cfe0, radius: [6, 11], ring: false },
  { color: 0xc99a70, radius: [8, 14], ring: true }
];

function createBackgroundPlanet(x, y, z, radius, color, hasRing = false) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.MeshPhongMaterial({
      color,
      shininess: 24,
      specular: new THREE.Color(0x222222)
    })
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (hasRing) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.45, radius * 2.4, 140),
      new THREE.MeshBasicMaterial({
        color: 0xb9c7df,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide
      })
    );

    ring.rotation.x = Math.PI / 3;
    ring.rotation.z = THREE.MathUtils.randFloat(-0.5, 0.5);
    group.add(ring);
  }

  scene.add(group);
  backgroundPlanets.push(group);
}

function generateBackgroundPlanets() {
  const planetCount = 10;

  for (let i = 0; i < planetCount; i++) {
    const style = backgroundPlanetStyles[i % backgroundPlanetStyles.length];
    const side = Math.random() < 0.5 ? -1 : 1;

    const x = side * THREE.MathUtils.randFloat(55, 150);
    const y = THREE.MathUtils.randFloat(-60, 70);
    const z = THREE.MathUtils.randFloat(-90, -430);
    const radius = THREE.MathUtils.randFloat(style.radius[0], style.radius[1]);

    createBackgroundPlanet(x, y, z, radius, style.color, style.ring && Math.random() < 0.6);
  }
}

generateBackgroundPlanets();

// -----------------------------
// ASTEROIDS
// -----------------------------
const asteroids = [];
const asteroidPalette = [0x6b6258, 0x7a7065, 0x55585c, 0x8a7a68, 0x5f6257];
let asteroidColorIdx = 0;

function createRealAsteroidGeometry(radius) {
  const geometry = new THREE.SphereGeometry(radius, 32, 24);
  const pos = geometry.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(pos, i);
    const normal = vertex.clone().normalize();

    const noise =
      1 +
      0.18 * Math.sin(vertex.x * 2.3 + vertex.y * 1.1) +
      0.13 * Math.cos(vertex.y * 3.1 + vertex.z * 1.7) +
      0.10 * Math.sin(vertex.z * 4.2 + vertex.x * 0.8) +
      THREE.MathUtils.randFloat(-0.08, 0.08);

    vertex.copy(normal.multiplyScalar(radius * noise));
    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.computeVertexNormals();
  return geometry;
}

function createAsteroid(x, y, z, radius) {
  const color = asteroidPalette[asteroidColorIdx++ % asteroidPalette.length];

  const asteroid = new THREE.Mesh(
    createRealAsteroidGeometry(radius),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
      metalness: 0.04,
      flatShading: false
    })
  );

  asteroid.position.set(x, y, z);
  asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  asteroid.scale.set(
    THREE.MathUtils.randFloat(0.85, 1.35),
    THREE.MathUtils.randFloat(0.75, 1.25),
    THREE.MathUtils.randFloat(0.85, 1.35)
  );

  asteroid.castShadow = true;
  asteroid.receiveShadow = true;

  asteroid.userData = {
    radius: radius * 1.18,
    rotationSpeed: Math.random() * 0.012 + 0.004,
    damage: Math.round(Math.pow(radius, 2) * 11),
    origin: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.005,
      (Math.random() - 0.5) * 0.01
    )
  };

  scene.add(asteroid);
  asteroids.push(asteroid);
}

createAsteroid(4, 1, -15, 1.5);
createAsteroid(-9, -1, -34, 1.8);
createAsteroid(11, 2, -62, 2.0);
createAsteroid(-14, -3, -92, 2.2);
createAsteroid(7, 4, -125, 2.0);
createAsteroid(-17, 3, -158, 2.5);
createAsteroid(15, -4, -188, 2.6);
createAsteroid(-8, -5, -220, 2.0);

// -----------------------------
// OXYGEN TANKS
// -----------------------------
const collectibles = [];

function createOxygenTank(x, y, z) {
  const tank = new THREE.Group();

  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 1.45, 32),
    new THREE.MeshStandardMaterial({
      color: 0x22ff88,
      emissive: 0x003311,
      metalness: 0.35,
      roughness: 0.18
    })
  );
  cylinder.castShadow = true;
  tank.add(cylinder);

  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.45,
    roughness: 0.16
  });

  const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.43, 32, 32), capMat);
  topCap.position.y = 0.78;
  tank.add(topCap);

  const botCap = new THREE.Mesh(new THREE.SphereGeometry(0.43, 32, 32), capMat);
  botCap.position.y = -0.78;
  tank.add(botCap);

  const glow = new THREE.PointLight(0x22ff88, 0.8, 6);
  tank.add(glow);

  tank.position.set(x, y, z);
  tank.userData = { radius: 1.0, collected: false };

  scene.add(tank);
  collectibles.push(tank);
}

createOxygenTank(5, 1, -18);
createOxygenTank(-10, 3, -50);
createOxygenTank(12, -2, -84);
createOxygenTank(-15, 5, -130);
createOxygenTank(10, 6, -180);

// -----------------------------
// HEALTH PACKS
// -----------------------------
const healthPacks = [];

function createHealthPack(x, y, z) {
  const pack = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0x550000,
    metalness: 0.18,
    roughness: 0.25
  });

  const hBar = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 0.35), mat);
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.15, 0.35), mat);
  hBar.castShadow = true;
  vBar.castShadow = true;

  pack.add(hBar);
  pack.add(vBar);

  const glow = new THREE.PointLight(0xff3333, 0.9, 6);
  pack.add(glow);

  pack.position.set(x, y, z);
  pack.userData = { radius: 0.95, collected: false };

  scene.add(pack);
  healthPacks.push(pack);
}

createHealthPack(3, -2, -32);
createHealthPack(-14, 1, -78);
createHealthPack(15, 3, -138);
createHealthPack(-12, -3, -190);

// -----------------------------
// ENEMY SHIPS + PROJECTILES ricks ufo by eeee [CC-BY] via Poly Pizza
// -----------------------------
const enemies = [];
const playerProjectiles = [];
const enemyProjectiles = [];

function createEnemyShip(x, y, z) {
  const enemy = new THREE.Group();

  const enemyHullMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f8792,
    metalness: 0.72,
    roughness: 0.24
  });

  const enemyAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc2233,
    emissive: 0x330006,
    metalness: 0.35,
    roughness: 0.3
  });

  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.05, 0.42, 32),
    enemyHullMaterial
  );
  saucer.castShadow = true;
  enemy.add(saucer);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    enemyAccentMaterial
  );
  dome.position.y = 0.18;
  dome.castShadow = true;
  enemy.add(dome);

  const enemyCore = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.09, 12, 36),
    new THREE.MeshBasicMaterial({ color: 0xff3344 })
  );
  enemyCore.rotation.x = Math.PI / 2;
  enemy.add(enemyCore);

  const glow = new THREE.PointLight(0xff3333, 1.1, 9);
  enemy.add(glow);

  enemy.position.set(x, y, z);
  enemy.userData = {
    start: new THREE.Vector3(x, y, z),
    radius: 1.5,
    health: 3,
    maxHealth: 3,
    speed: 0.055,
    shootCooldown: THREE.MathUtils.randFloat(2.0, 4.0),
    strafePhase: Math.random() * Math.PI * 2
  };

  scene.add(enemy);
  enemies.push(enemy);
}

createEnemyShip(16, 4, -32);
createEnemyShip(-17, 1, -95);
createEnemyShip(17, -2, -150);
createEnemyShip(-12, 5, -205);

function createProjectile(position, direction, speed, damage, color, radius, owner) {
  const projectile = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 16),
    new THREE.MeshBasicMaterial({ color })
  );
  projectile.position.copy(position);
  projectile.userData = {
    velocity: direction.clone().normalize().multiplyScalar(speed),
    damage,
    radius,
    ttl: 3,
    owner
  };
  scene.add(projectile);
  return projectile;
}

function removeProjectile(projectiles, index) {
  scene.remove(projectiles[index]);
  projectiles.splice(index, 1);
}

function clearProjectiles() {
  [...playerProjectiles, ...enemyProjectiles].forEach((projectile) => {
    scene.remove(projectile);
  });
  playerProjectiles.length = 0;
  enemyProjectiles.length = 0;
}

function resetEnemies() {
  enemies.forEach((enemy) => {
    enemy.visible = true;
    enemy.position.copy(enemy.userData.start);
    enemy.userData.health = enemy.userData.maxHealth;
    enemy.userData.shootCooldown = THREE.MathUtils.randFloat(2.0, 4.0);
  });
}

// -----------------------------
// ASTRONAUTS
// -----------------------------
const astronauts = [];

function createAstronaut(x, y, z) {
  const a = new THREE.Group();

  const suit = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.55,
    metalness: 0.12
  });

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), suit);
  helmet.position.y = 1.05;
  helmet.castShadow = true;
  a.add(helmet);

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x2266ff,
      metalness: 0.8,
      roughness: 0.08,
      transparent: true,
      opacity: 0.85
    })
  );
  visor.position.set(0, 1.05, 0.28);
  visor.scale.set(1, 0.68, 0.45);
  a.add(visor);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.85, 18), suit);
  torso.position.y = 0.42;
  torso.castShadow = true;
  a.add(torso);

  const backpack = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.55, 0.2),
    new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      metalness: 0.3,
      roughness: 0.35
    })
  );
  backpack.position.set(0, 0.45, -0.37);
  backpack.castShadow = true;
  a.add(backpack);

  const armGeo = new THREE.CylinderGeometry(0.12, 0.105, 0.65, 12);

  const lArm = new THREE.Mesh(armGeo, suit);
  lArm.position.set(-0.48, 0.45, 0);
  lArm.rotation.z = Math.PI / 4;
  lArm.castShadow = true;
  a.add(lArm);

  const rArm = new THREE.Mesh(armGeo, suit);
  rArm.position.set(0.48, 0.45, 0);
  rArm.rotation.z = -Math.PI / 4;
  rArm.castShadow = true;
  a.add(rArm);

  const legGeo = new THREE.CylinderGeometry(0.12, 0.105, 0.68, 12);

  const lLeg = new THREE.Mesh(legGeo, suit);
  lLeg.position.set(-0.18, -0.12, 0);
  lLeg.castShadow = true;
  a.add(lLeg);

  const rLeg = new THREE.Mesh(legGeo, suit);
  rLeg.position.set(0.18, -0.12, 0);
  rLeg.castShadow = true;
  a.add(rLeg);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x00ffff })
  );
  beacon.position.y = 1.55;
  a.add(beacon);

  const beaconLight = new THREE.PointLight(0x00ffff, 1.3, 8);
  beaconLight.position.y = 1.55;
  a.add(beaconLight);

  a.position.set(x, y, z);

  a.userData = {
    radius: 0.95,
    rescued: false,
    floatPhase: Math.random() * Math.PI * 2,
    baseY: y
  };

  scene.add(a);
  astronauts.push(a);
}

// -----------------------------
// MAIN RESCUE PLANETS
// -----------------------------
const rescuePlanets = [];

function createPlanetMaterial(type, texture, baseColor, specHex, shininess) {
  const material = new THREE.MeshPhongMaterial({
    color: texture ? 0xffffff : baseColor,
    map: texture || null,
    bumpMap: texture && texMarsShade ? texMarsShade : null,
    bumpScale: texture && texMarsShade ? 0.35 : 0,
    shininess,
    specular: new THREE.Color(specHex)
  });

  return material;
}

function addPlanetClouds(group, radius) {
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.015, 96, 96),
    new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      shininess: 8
    })
  );
  clouds.userData.isCloudLayer = true;
  group.add(clouds);
}

function addPlanetRing(group, radius, ringMap = null, ringColor = 0xffffff) {
  const ringMat = ringMap
    ? new THREE.MeshBasicMaterial({
        map: ringMap,
        transparent: true,
        side: THREE.DoubleSide
      })
    : new THREE.ShaderMaterial({
        uniforms: { ringColor: { value: new THREE.Color(ringColor) } },
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        side: THREE.DoubleSide,
        transparent: true
      });

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(radius * 1.45, radius * 2.6, 160),
    ringMat
  );

  ring.rotation.x = Math.PI / 3;
  group.add(ring);
}

function createRescuePlanet(config) {
  const {
    x,
    y,
    z,
    radius,
    texture,
    color,
    specular,
    shininess,
    ring,
    ringColor,
    clouds,
    damage
  } = config;

  const group = new THREE.Group();
  group.position.set(x, y, z);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 128, 128),
    createPlanetMaterial(config.type, texture, color, specular, shininess)
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (clouds) addPlanetClouds(group, radius);
  if (ring) addPlanetRing(group, radius, ring === 'texture' ? texSaturnRing : null, ringColor);

  group.userData = {
    radius,
    mass: Math.pow(radius, 3),
    damage
  };

  scene.add(group);
  rescuePlanets.push(group);

  createAstronaut(x, y + radius + 0.7, z);
}

// 5 gameplay planets: each one visibly different
createRescuePlanet({
  type: 'mars',
  x: -10,
  y: 0,
  z: -26,
  radius: 5.2,
  texture: null,
  color: 0xcc5533,
  specular: 0x331100,
  shininess: 14,
  ring: false,
  clouds: false,
  damage: 25
});

createRescuePlanet({
  type: 'ice',
  x: 11,
  y: 2,
  z: -68,
  radius: 5.8,
  texture: null,
  color: 0x2299cc,
  specular: 0x66ddff,
  shininess: 85,
  ring: false,
  clouds: true,
  damage: 25
});

createRescuePlanet({
  type: 'venus-ring',
  x: -12,
  y: -2,
  z: -112,
  radius: 6.3,
  texture: null,
  color: 0xdd8833,
  specular: 0x997733,
  shininess: 45,
  ring: 'shader',
  ringColor: 0xe8b56b,
  clouds: false,
  damage: 30
});

createRescuePlanet({
  type: 'uranus',
  x: 12,
  y: -1,
  z: -160,
  radius: 5.6,
  texture: null,
  color: 0x88ddff,
  specular: 0xbbffff,
  shininess: 110,
  ring: 'shader',
  ringColor: 0x99ccff,
  clouds: false,
  damage: 25
});

createRescuePlanet({
  type: 'jupiter',
  x: -10,
  y: 3,
  z: -215,
  radius: 7.2,
  texture: null,
  color: 0xffffff,
  specular: 0x554433,
  shininess: 35,
  ring: false,
  clouds: true,
  damage: 35
});

// -----------------------------
// GAME STATE
// -----------------------------
const MAX_HEALTH = 100;
const START_TIME = 50;
const OXYGEN_TIME_BONUS = 15;
const TIME_BONUS_MULTIPLIER = 5;
const HEALTH_BONUS_MULTIPLIER = 2;
const TOTAL_ASTRONAUTS = 5;
const ENEMY_SCORE = 25;

let score = 0;
let health = MAX_HEALTH;
let timeRemaining = START_TIME;
let rescueCount = 0;
let hitCooldown = false;
let planetHitCooldown = false;
let playerShootCooldown = 0;
let gameOver = false;

// -----------------------------
// HUD
// -----------------------------
const scoreDisplay = document.getElementById('score-display');
const healthBar = document.getElementById('health-bar');
const healthText = document.getElementById('health-text');
const rescueDisplay = document.getElementById('rescue-display');
const timerDisplay = document.getElementById('timer-display');
const enemyDisplay = document.getElementById('enemy-display');
const damageFlash = document.getElementById('damage-flash');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const youWonScreen = document.getElementById('you-won');
const winScoreEl = document.getElementById('win-score');
const playAgainBtn = document.getElementById('play-again-btn');

function updateHUD() {
  scoreDisplay.textContent = `Score: ${score}`;
  rescueDisplay.textContent = `Rescued: ${rescueCount} / ${TOTAL_ASTRONAUTS}`;
  timerDisplay.textContent = `Time: ${Math.ceil(Math.max(0, timeRemaining))}s`;
  timerDisplay.style.color = timeRemaining <= 10 ? '#ff5555' : '#ffee88';
  enemyDisplay.textContent = `Enemies: ${enemies.filter((enemy) => enemy.visible).length}`;

  const pct = Math.max(0, health / MAX_HEALTH) * 100;
  healthBar.style.width = `${pct}%`;
  healthText.textContent = String(Math.max(0, health));

  if (pct > 60) healthBar.style.backgroundColor = '#22cc44';
  else if (pct > 30) healthBar.style.backgroundColor = '#ddaa00';
  else healthBar.style.backgroundColor = '#dd2222';
}

function flashDamage() {
  damageFlash.style.opacity = '0.4';
  setTimeout(() => {
    damageFlash.style.opacity = '0';
  }, 200);
}

function triggerWin() {
  const timeBonus = Math.ceil(Math.max(0, timeRemaining)) * TIME_BONUS_MULTIPLIER;
  const healthBonus = Math.ceil(Math.max(0, health)) * HEALTH_BONUS_MULTIPLIER;
  score += timeBonus + healthBonus;
  updateHUD();
  gameOver = true;
  youWonScreen.style.display = 'flex';
  winScoreEl.textContent = `Time Bonus: +${timeBonus} • Health Bonus: +${healthBonus} • Final Score: ${score}`;
}

function triggerGameOver() {
  gameOver = true;
  gameOverScreen.style.display = 'flex';
  finalScoreEl.textContent = `Rescued ${rescueCount} / ${TOTAL_ASTRONAUTS} • Final Score: ${score}`;
}

function restartGame() {
  health = MAX_HEALTH;
  timeRemaining = START_TIME;
  score = 0;
  rescueCount = 0;
  gameOver = false;
  hitCooldown = false;
  planetHitCooldown = false;
  playerShootCooldown = 0;

  player.position.set(0, 0, 10);
  player.rotation.set(0, 0, 0);
  velocity.set(0, 0, 0);
  resetCameraView();
  clearProjectiles();
  resetEnemies();

  [...collectibles, ...healthPacks].forEach((item) => {
    item.userData.collected = false;
    item.visible = true;
  });

  astronauts.forEach((a) => {
    a.userData.rescued = false;
    a.visible = true;
  });

  gameOverScreen.style.display = 'none';
  youWonScreen.style.display = 'none';

  updateHUD();
}

restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', restartGame);
updateHUD();

// -----------------------------
// ENEMY BEHAVIOR
// -----------------------------
function checkSphereCollision(a, ra, b, rb) {
  return a.position.distanceTo(b.position) < ra + rb;
}

function damagePlayer(amount) {
  health -= amount;

  if (health <= 0) {
    health = 0;
    updateHUD();
    triggerGameOver();
    return;
  }

  updateHUD();
}

function resetCameraView() {
  cameraYaw = DEFAULT_CAMERA_YAW;
  cameraPitch = DEFAULT_CAMERA_PITCH;
}

function getCameraForwardVector() {
  return new THREE.Vector3(
    -Math.sin(cameraYaw),
    0,
    -Math.cos(cameraYaw)
  ).normalize();
}

function getCameraRightVector() {
  return new THREE.Vector3(
    Math.cos(cameraYaw),
    0,
    -Math.sin(cameraYaw)
  ).normalize();
}

function getAimDirection() {
  const pitch = cameraPitch * 0.65;
  const flatScale = Math.cos(pitch);
  return new THREE.Vector3(
    -Math.sin(cameraYaw) * flatScale,
    Math.sin(pitch),
    -Math.cos(cameraYaw) * flatScale
  ).normalize();
}

function firePlayerWeapon() {
  if (gameOver || playerShootCooldown > 0) return;

  const direction = getAimDirection();
  const muzzle = player.position
    .clone()
    .addScaledVector(direction, playerRadius + 0.75)
    .add(new THREE.Vector3(0, 0.15, 0));

  playerProjectiles.push(
    createProjectile(muzzle, direction, 1.2, 1, 0x66ddff, 0.18, 'player')
  );
  playerShootCooldown = 0.22;
}

function fireEnemyWeapon(enemy) {
  const direction = player.position.clone().sub(enemy.position).normalize();
  const muzzle = enemy.position.clone().addScaledVector(direction, enemy.userData.radius + 0.4);
  enemyProjectiles.push(
    createProjectile(muzzle, direction, 0.48, 7, 0xff5533, 0.22, 'enemy')
  );
}

function damageEnemy(enemy, amount) {
  enemy.userData.health -= amount;

  if (enemy.userData.health > 0) return;

  enemy.visible = false;
  score += ENEMY_SCORE;
  updateHUD();
}

function updateCameraControls(delta) {
  const turnSpeed = 1.8 * delta;
  if (keys.arrowleft) cameraYaw += turnSpeed;
  if (keys.arrowright) cameraYaw -= turnSpeed;
  if (keys.arrowup) cameraPitch = THREE.MathUtils.clamp(cameraPitch - turnSpeed * 0.7, -0.5, 0.85);
  if (keys.arrowdown) cameraPitch = THREE.MathUtils.clamp(cameraPitch + turnSpeed * 0.7, -0.5, 0.85);
}

function updateEnemies(delta) {
  if (gameOver) return;

  enemies.forEach((enemy) => {
    if (!enemy.visible) return;

    const toPlayer = player.position.clone().sub(enemy.position);
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    const strafe = new THREE.Vector3(-direction.z, 0, direction.x)
      .multiplyScalar(Math.sin(Date.now() * 0.0015 + enemy.userData.strafePhase) * 0.035);

    if (distance > 13) {
      enemy.position.addScaledVector(direction, enemy.userData.speed * delta * 60);
    } else {
      enemy.position.addScaledVector(direction, -0.035 * delta * 60);
    }

    enemy.position.addScaledVector(strafe, delta * 60);
    enemy.lookAt(player.position);

    enemy.userData.shootCooldown -= delta;
    if (distance < 80 && enemy.userData.shootCooldown <= 0) {
      fireEnemyWeapon(enemy);
      enemy.userData.shootCooldown = THREE.MathUtils.randFloat(2.2, 3.8);
    }
  });
}

function updateProjectiles(delta) {
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const projectile = playerProjectiles[i];
    projectile.position.addScaledVector(projectile.userData.velocity, delta * 60);
    projectile.userData.ttl -= delta;

    let remove = projectile.userData.ttl <= 0;
    if (!remove) {
      enemies.forEach((enemy) => {
        if (
          !remove &&
          enemy.visible &&
          checkSphereCollision(projectile, projectile.userData.radius, enemy, enemy.userData.radius)
        ) {
          damageEnemy(enemy, projectile.userData.damage);
          remove = true;
        }
      });
    }

    if (remove) removeProjectile(playerProjectiles, i);
  }

  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const projectile = enemyProjectiles[i];
    projectile.position.addScaledVector(projectile.userData.velocity, delta * 60);
    projectile.userData.ttl -= delta;

    let remove = projectile.userData.ttl <= 0;
    if (
      !remove &&
      !gameOver &&
      checkSphereCollision(projectile, projectile.userData.radius, player, playerRadius)
    ) {
      damagePlayer(projectile.userData.damage);
      flashDamage();
      remove = true;
    }

    if (remove) removeProjectile(enemyProjectiles, i);
  }
}

function updateCombat(delta) {
  if (gameOver) return;

  if (playerShootCooldown > 0) playerShootCooldown -= delta;
  if (keys.space) firePlayerWeapon();

  updateEnemies(delta);
  updateProjectiles(delta);
}

// -----------------------------
// COLLISION HANDLING
// -----------------------------
function handleCollisions() {
  collectibles.forEach((item) => {
    if (
      !item.userData.collected &&
      checkSphereCollision(player, playerRadius, item, item.userData.radius)
    ) {
      item.userData.collected = true;
      item.visible = false;
      score += 10;
      timeRemaining += OXYGEN_TIME_BONUS;
      updateHUD();
    }
  });

  healthPacks.forEach((pack) => {
    if (
      !pack.userData.collected &&
      checkSphereCollision(player, playerRadius, pack, pack.userData.radius)
    ) {
      pack.userData.collected = true;
      pack.visible = false;
      score += 5;
      health = Math.min(MAX_HEALTH, health + 35);
      updateHUD();
    }
  });

  astronauts.forEach((astronaut) => {
    if (
      !astronaut.userData.rescued &&
      checkSphereCollision(player, playerRadius, astronaut, astronaut.userData.radius)
    ) {
      astronaut.userData.rescued = true;
      astronaut.visible = false;
      rescueCount++;
      score += 50;
      updateHUD();

      if (rescueCount === TOTAL_ASTRONAUTS) triggerWin();
    }
  });

  asteroids.forEach((asteroid) => {
    if (
      !hitCooldown &&
      checkSphereCollision(player, playerRadius, asteroid, asteroid.userData.radius)
    ) {
      const normal = player.position.clone().sub(asteroid.position).normalize();
      const safeDistance = playerRadius + asteroid.userData.radius + 0.25;

      player.position.copy(asteroid.position.clone().addScaledVector(normal, safeDistance));

      const dot = velocity.dot(normal);
      if (dot < 0) velocity.addScaledVector(normal, -2 * dot * 0.75);

      velocity.addScaledVector(normal, 0.2);

      damagePlayer(asteroid.userData.damage);
      flashDamage();

      hitCooldown = true;
      setTimeout(() => {
        hitCooldown = false;
      }, 1000);
    }
  });

  rescuePlanets.forEach((planet) => {
    const toPlayer = player.position.clone().sub(planet.position);
    const dist = toPlayer.length();
    const minDist = planet.userData.radius + playerRadius;

    if (dist < minDist) {
      const normal = toPlayer.normalize();

      player.position.copy(
        planet.position.clone().addScaledVector(normal, minDist + 0.45)
      );

      const dot = velocity.dot(normal);
      if (dot < 0) velocity.addScaledVector(normal, -2 * dot * 0.9);

      velocity.addScaledVector(normal, 0.36);

      if (!planetHitCooldown) {
        damagePlayer(planet.userData.damage);
        flashDamage();

        planetHitCooldown = true;
        setTimeout(() => {
          planetHitCooldown = false;
        }, 900);
      }
    }
  });
}

// -----------------------------
// PLAYER MOVEMENT + GRAVITY
// -----------------------------
const velocity = new THREE.Vector3();
const clock = new THREE.Clock();

const ACCEL = 0.026;
const MAX_SPEED = 0.42;
const DRAG = 0.93;
const G = 0.0032;

function applyGravity() {
  rescuePlanets.forEach((planet) => {
    const toPlanet = planet.position.clone().sub(player.position);
    const dist = toPlanet.length();
    const minDist = planet.userData.radius + playerRadius;

    if (dist <= minDist) return;

    const forceMag = G * planet.userData.mass / (dist * dist);
    velocity.addScaledVector(toPlanet.normalize(), forceMag);
  });
}

function updatePlayerMovement() {
  if (gameOver) return;

  const forward = getCameraForwardVector();
  const right = getCameraRightVector();

  if (keys.w) velocity.addScaledVector(forward, ACCEL);
  if (keys.s) velocity.addScaledVector(forward, -ACCEL);
  if (keys.a) velocity.addScaledVector(right, -ACCEL);
  if (keys.d) velocity.addScaledVector(right, ACCEL);
  if (keys.q) velocity.y += ACCEL;
  if (keys.e) velocity.y -= ACCEL;

  applyGravity();

  velocity.multiplyScalar(DRAG);

  velocity.x = THREE.MathUtils.clamp(velocity.x, -MAX_SPEED, MAX_SPEED);
  velocity.y = THREE.MathUtils.clamp(velocity.y, -MAX_SPEED, MAX_SPEED);
  velocity.z = THREE.MathUtils.clamp(velocity.z, -MAX_SPEED, MAX_SPEED);

  player.position.add(velocity);

  player.position.x = THREE.MathUtils.clamp(player.position.x, -30, 30);
  player.position.y = THREE.MathUtils.clamp(player.position.y, -16, 16);

  const targetBank = -velocity.x * 0.75;
  player.rotation.y = cameraYaw;
  player.rotation.z = THREE.MathUtils.lerp(player.rotation.z, targetBank, 0.12);

  const targetPitch = velocity.y * 0.28;
  player.rotation.x = THREE.MathUtils.lerp(player.rotation.x, targetPitch, 0.08);
}

function updateTimer(delta) {
  if (gameOver) return;

  timeRemaining -= delta;
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    updateHUD();
    triggerGameOver();
    return;
  }

  updateHUD();
}

// -----------------------------
// CAMERA FOLLOW
// -----------------------------
function updateCamera() {
  const distance = 12;
  const flatDistance = distance * Math.cos(cameraPitch);
  const offset = new THREE.Vector3(
    Math.sin(cameraYaw) * flatDistance,
    3 + Math.sin(cameraPitch) * 24,
    Math.cos(cameraYaw) * flatDistance
  );
  camera.position.lerp(player.position.clone().add(offset), 0.075);
  camera.lookAt(player.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
}

// -----------------------------
// ANIMATION LOOP
// -----------------------------
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  updateTimer(delta);
  updateCameraControls(delta);
  updatePlayerMovement();
  updateCombat(delta);

  asteroids.forEach((a) => {
    a.rotation.x += a.userData.rotationSpeed;
    a.rotation.y += a.userData.rotationSpeed * 0.7;
    a.rotation.z += a.userData.rotationSpeed * 0.35;

    const toOrigin = a.userData.origin.clone().sub(a.position);
    a.userData.vel.addScaledVector(toOrigin, 0.0008);
    a.position.add(a.userData.vel);
  });

  [...collectibles, ...healthPacks].forEach((item) => {
    if (!item.userData.collected) {
      item.rotation.y += 0.03;
      item.rotation.x += 0.01;
    }
  });

  const t = Date.now() * 0.001;

  astronauts.forEach((astronaut) => {
    if (!astronaut.userData.rescued) {
      astronaut.rotation.y += 0.008;
      astronaut.position.y =
        astronaut.userData.baseY + Math.sin(t + astronaut.userData.floatPhase) * 0.14;
    }
  });

  rescuePlanets.forEach((p) => {
    p.rotation.y += 0.0016;

    p.children.forEach((child) => {
      if (child.userData && child.userData.isCloudLayer) {
        child.rotation.y += 0.0012;
      }
    });
  });

  backgroundPlanets.forEach((p, i) => {
    p.rotation.y += 0.0005 + i * 0.00001;
  });

  galaxy.rotation.y += 0.00008;
  sun.rotation.y += 0.0008;
  stars.rotation.y += 0.00025;

  if (!gameOver) handleCollisions();

  updateCamera();
  renderer.render(scene, camera);
}

animate();

// -----------------------------
// RESPONSIVE WINDOW
// -----------------------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
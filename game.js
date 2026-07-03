import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

// 教師可直接在這裡修改題目、答案及正確答案編號（0、1、2）。
const QUESTIONS = [
  {
    question: '《熊抱青春記》的主角叫甚麼名字？',
    answers: ['李美玲', '李小明', '高先生'],
    correct: 0,
  },
  {
    question: '故事開始時，美玲大約多少歲？',
    answers: ['8 歲', '13 歲', '18 歲'],
    correct: 1,
  },
  {
    question: '美玲和家人住在哪一個城市？',
    answers: ['多倫多', '香港', '巴黎'],
    correct: 0,
  },
  {
    question: '美玲情緒十分激動時，會變成甚麼？',
    answers: ['白兔', '紅熊貓', '小老虎'],
    correct: 1,
  },
  {
    question: '哪一組是美玲的三位好朋友？',
    answers: ['蜜瑞、普莉亞、艾比', '德文、泰勒、高先生', '新怡、李明、錦'],
    correct: 0,
  },
  {
    question: '美玲和朋友最喜歡哪一個男子組合？',
    answers: ['4★TOWN', 'SKY BOYS', 'RED MOON'],
    correct: 0,
  },
  {
    question: '美玲平日會在家附近哪個地方幫忙？',
    answers: ['宗族祠堂', '遊樂場', '太空館'],
    correct: 0,
  },
  {
    question: '封印紅熊貓的儀式要在甚麼時候進行？',
    answers: ['日出時', '紅月之夜', '下雪時'],
    correct: 1,
  },
  {
    question: '甚麼能幫助美玲平靜下來、控制變身？',
    answers: ['想起好朋友', '躲進衣櫃', '吃很多糖果'],
    correct: 0,
  },
  {
    question: '故事最後，美玲作出了哪一個重要選擇？',
    answers: ['永遠離開家人', '接納自己並保留紅熊貓', '忘記所有朋友'],
    correct: 1,
  },
];

const els = {
  canvas: document.querySelector('#game-canvas'),
  startScreen: document.querySelector('#start-screen'),
  startButton: document.querySelector('#start-button'),
  playerName: document.querySelector('#player-name'),
  nameError: document.querySelector('#name-error'),
  hud: document.querySelector('#hud'),
  hudName: document.querySelector('#hud-name'),
  lives: document.querySelector('#lives'),
  progress: document.querySelector('#progress'),
  height: document.querySelector('#height'),
  questionPanel: document.querySelector('#question-panel'),
  questionNumber: document.querySelector('#question-number'),
  questionText: document.querySelector('#question-text'),
  powerPanel: document.querySelector('#power-panel'),
  powerIcon: document.querySelector('#power-icon'),
  powerText: document.querySelector('#power-text'),
  crosshair: document.querySelector('#crosshair'),
  toast: document.querySelector('#toast'),
  damageFlash: document.querySelector('#damage-flash'),
  endScreen: document.querySelector('#end-screen'),
  endIcon: document.querySelector('#end-icon'),
  endTitle: document.querySelector('#end-title'),
  endMessage: document.querySelector('#end-message'),
  resultScore: document.querySelector('#result-score'),
  restartButton: document.querySelector('#restart-button'),
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08051f);
scene.fog = new THREE.FogExp2(0x120a38, 0.0075);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 8.5, 20);

const renderer = new THREE.WebGLRenderer({ canvas: els.canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const keys = new Set();
const levelGroups = [];
const activePowerUps = [];
const safePlatforms = [];
const particles = [];

const state = {
  started: false,
  ended: false,
  playerName: '',
  lives: 5,
  level: 0,
  correctCount: 0,
  grounded: false,
  canCollide: true,
  wrongFall: false,
  questionLocked: false,
  currentPlatform: null,
  checkpoint: new THREE.Vector3(0, 2.3, 0),
  velocity: new THREE.Vector3(),
  cameraY: 8.5,
  toastTimer: null,
  power: null,
  powerEndsAt: 0,
  victoryFlight: false,
  victoryStart: 0,
  victoryFrom: new THREE.Vector3(),
};

const WORLD = {
  startY: 0,
  firstQuestionY: 6,
  levelGap: 9,
  platformTop: 0.42,
  playerHalfHeight: 1.08,
  castleY: 102,
};

setupLights();
createSky();
createMoon();
createCloudLayers();
createStartPlatform();
const player = createBoy();
scene.add(player);
player.position.copy(state.checkpoint);
const catForm = createCatForm();
catForm.visible = false;
player.add(catForm);
const wings = createWings();
wings.visible = false;
player.add(wings);
createAllQuestionLevels();
const castle = createBookCastle();
castle.visible = false;
scene.add(castle);

els.startButton.addEventListener('click', beginGame);
els.restartButton.addEventListener('click', () => location.reload());
els.playerName.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') beginGame();
});

addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  keys.add(event.code);
  if (event.code === 'Space' && state.started && !state.ended) attemptJump();
});

addEventListener('keyup', (event) => keys.delete(event.code));
addEventListener('resize', onResize);
els.canvas.addEventListener('pointerdown', handlePointerKick);

animate();

function setupLights() {
  scene.add(new THREE.HemisphereLight(0x9db7ff, 0x271148, 2.1));

  const moonLight = new THREE.DirectionalLight(0xdde8ff, 2.4);
  moonLight.position.set(-18, 38, 16);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.left = -25;
  moonLight.shadow.camera.right = 25;
  moonLight.shadow.camera.top = 35;
  moonLight.shadow.camera.bottom = -15;
  scene.add(moonLight);

  const magicLight = new THREE.PointLight(0xff7be7, 25, 55, 2);
  magicLight.position.set(8, 20, 4);
  scene.add(magicLight);
}

function createSky() {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(0x9fdcff), new THREE.Color(0xffc8f4), new THREE.Color(0xffe49a)];

  for (let i = 0; i < count; i += 1) {
    const radius = 55 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = -20 + Math.random() * 160;
    positions[i * 3 + 2] = -25 - Math.random() * 95;
    const color = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({ size: 0.36, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
  const starField = new THREE.Points(geometry, material);
  starField.name = 'star-field';
  scene.add(starField);

  for (let i = 0; i < 16; i += 1) {
    const sparkle = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16 + Math.random() * 0.18),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    sparkle.position.set((Math.random() - 0.5) * 35, 6 + Math.random() * 105, -10 - Math.random() * 18);
    sparkle.userData.baseScale = 0.6 + Math.random();
    particles.push(sparkle);
    scene.add(sparkle);
  }
}

function createMoon() {
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(6, 48, 48),
    new THREE.MeshStandardMaterial({ color: 0xfff3c2, emissive: 0xffd97d, emissiveIntensity: 1.1, roughness: 0.92 })
  );
  moon.position.set(-29, 45, -55);
  scene.add(moon);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('rgba(255,235,160,0.72)', 'rgba(255,235,160,0)'),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  halo.scale.set(22, 22, 1);
  moon.add(halo);
}

function createCloudLayers() {
  for (let y = 4; y < 112; y += 11) {
    const cloud = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: y > 70 ? 0xffdff7 : 0xc8d5ff,
      emissive: y > 70 ? 0x3b1438 : 0x151b4d,
      emissiveIntensity: 0.42,
      transparent: true,
      opacity: 0.72,
      roughness: 1,
    });
    const pieces = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < pieces; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 1.4, 18, 18), cloudMaterial);
      puff.scale.y = 0.52 + Math.random() * 0.25;
      puff.position.set(i * 1.7, Math.random() * 0.7, Math.random() * 1.5);
      cloud.add(puff);
    }
    cloud.position.set((Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 14), y, -15 - Math.random() * 12);
    cloud.rotation.y = Math.random() * Math.PI;
    cloud.userData.drift = (Math.random() - 0.5) * 0.003;
    cloud.name = 'cloud';
    scene.add(cloud);
  }
}

function createStartPlatform() {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xd8e4ff, emissive: 0x283c7a, emissiveIntensity: 0.35, roughness: 0.82 });
  for (let i = 0; i < 8; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.8 + Math.random() * 1.2, 24, 24), cloudMat);
    puff.scale.y = 0.46;
    puff.position.set((i - 3.5) * 1.3, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 2.1);
    puff.castShadow = true;
    puff.receiveShadow = true;
    group.add(puff);
  }
  group.position.set(0, 0, 0);
  scene.add(group);

  const collider = { mesh: group, x: 0, y: 0.65, z: 0, radius: 6.4, type: 'safe', active: true };
  safePlatforms.push(collider);
  return collider;
}

function createBoy() {
  const root = new THREE.Group();
  root.name = 'player';

  const skin = new THREE.MeshStandardMaterial({ color: 0xf3b27e, roughness: 0.78 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x4c8eff, roughness: 0.62 });
  const shorts = new THREE.MeshStandardMaterial({ color: 0x303063, roughness: 0.75 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0xffd86b, roughness: 0.65 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x2c1731, roughness: 0.94 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.54, 0.78, 6, 14), shirt);
  body.position.y = 0.15;
  body.castShadow = true;
  body.name = 'boy-body';
  root.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.51, 24, 24), skin);
  head.position.y = 1.12;
  head.castShadow = true;
  head.name = 'boy-body';
  root.add(head);

  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.53, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.58), hair);
  hairCap.position.y = 1.24;
  hairCap.name = 'boy-body';
  root.add(hairCap);

  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x21142c });
  [-0.17, 0.17].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), eyeMaterial);
    eye.position.set(x, 1.17, 0.475);
    eye.name = 'boy-body';
    root.add(eye);
  });

  const arms = new THREE.Group();
  arms.name = 'boy-body';
  [-1, 1].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.55, 4, 10), skin);
    arm.position.set(side * 0.68, 0.18, 0);
    arm.rotation.z = side * 0.16;
    arm.castShadow = true;
    arm.name = 'boy-body';
    arms.add(arm);
  });
  root.add(arms);

  const legs = new THREE.Group();
  legs.position.y = -0.63;
  legs.name = 'legs';
  [-1, 1].forEach((side) => {
    const legPivot = new THREE.Group();
    legPivot.position.x = side * 0.28;
    legPivot.name = side > 0 ? 'kick-leg' : 'boy-body';

    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.5, 4, 10), shorts);
    leg.position.y = -0.23;
    leg.castShadow = true;
    leg.name = 'boy-body';
    legPivot.add(leg);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.65), shoe);
    foot.position.set(0, -0.63, 0.15);
    foot.castShadow = true;
    foot.name = 'boy-body';
    legPivot.add(foot);
    legs.add(legPivot);
  });
  root.add(legs);

  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('rgba(146,112,255,0.32)', 'rgba(146,112,255,0)'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  aura.scale.set(4.2, 4.2, 1);
  aura.position.y = 0.2;
  aura.name = 'boy-body';
  root.add(aura);

  root.userData.bodyParts = [];
  root.traverse((child) => {
    if (child.name === 'boy-body' && child.isObject3D) root.userData.bodyParts.push(child);
  });
  root.userData.kickLeg = root.getObjectByName('kick-leg');
  root.scale.setScalar(1);
  return root;
}

function createCatForm() {
  const cat = new THREE.Group();
  cat.position.y = -0.2;

  const fur = new THREE.MeshStandardMaterial({ color: 0xff9f61, roughness: 0.9 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xffe0b5, roughness: 0.9 });
  const dark = new THREE.MeshBasicMaterial({ color: 0x32182d });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 20), fur);
  body.scale.set(1, 0.85, 1.15);
  body.castShadow = true;
  cat.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 20), fur);
  head.position.set(0, 0.55, 0.25);
  head.castShadow = true;
  cat.add(head);

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.4, 4), fur);
    ear.position.set(side * 0.28, 0.97, 0.22);
    ear.rotation.z = side * -0.12;
    cat.add(ear);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), dark);
    eye.position.set(side * 0.16, 0.62, 0.68);
    cat.add(eye);
  });

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), cream);
  muzzle.scale.set(1.25, 0.7, 0.55);
  muzzle.position.set(0, 0.45, 0.68);
  cat.add(muzzle);

  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 10, 24, Math.PI * 1.4), fur);
  tail.position.set(-0.62, 0.15, -0.3);
  tail.rotation.y = Math.PI / 2;
  cat.add(tail);

  return cat;
}

function createWings() {
  const group = new THREE.Group();
  group.position.set(0, 0.28, -0.48);
  const material = new THREE.MeshStandardMaterial({
    color: 0xe8f8ff,
    emissive: 0x78cfff,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });

  [-1, 1].forEach((side) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(side * 0.75, 0.15, side * 1.2, 0.9, side * 0.8, 1.35);
    shape.bezierCurveTo(side * 0.2, 1.1, side * 0.05, 0.45, 0, 0);
    const wing = new THREE.Mesh(new THREE.ShapeGeometry(shape, 12), material);
    wing.position.x = side * 0.13;
    wing.rotation.y = side * 0.18;
    wing.userData.side = side;
    wing.name = 'wing';
    group.add(wing);
  });
  return group;
}

function createAllQuestionLevels() {
  QUESTIONS.forEach((question, index) => {
    const y = WORLD.firstQuestionY + index * WORLD.levelGap;
    const group = new THREE.Group();
    group.name = `level-${index + 1}`;
    const xPositions = shuffle([-6.2, 0, 6.2]);
    const zPositions = [-0.7, 0.8, -0.2];
    const platforms = question.answers.map((answer, answerIndex) => {
      const platform = createAnswerStar(answer, index, answerIndex, xPositions[answerIndex], y, zPositions[answerIndex]);
      group.add(platform.mesh);
      return platform;
    });

    const tool = createMysteryTool(index, y - 2.2);
    group.add(tool);
    activePowerUps.push(tool);

    group.visible = index === 0;
    levelGroups.push({ group, platforms, y, resolved: false });
    scene.add(group);
  });
}

function createAnswerStar(label, levelIndex, answerIndex, x, y, z) {
  const geometry = createStarGeometry(2.2, 0.95, 0.72);
  const colors = [0xffcc58, 0xff79cd, 0x72d9ff];
  const material = new THREE.MeshStandardMaterial({
    color: colors[answerIndex],
    emissive: colors[answerIndex],
    emissiveIntensity: 0.26,
    metalness: 0.08,
    roughness: 0.42,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = (answerIndex - 1) * 0.12;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const rim = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.68 })
  );
  mesh.add(rim);

  const labelSprite = makeTextSprite(label, {
    width: 640,
    height: 170,
    fontSize: label.length > 12 ? 39 : 48,
    background: 'rgba(20, 10, 55, 0.88)',
    border: 'rgba(255,255,255,0.78)',
  });
  labelSprite.position.set(0, 2.15, 0);
  labelSprite.scale.set(6.2, 1.65, 1);
  mesh.add(labelSprite);

  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('rgba(255,255,255,0.46)', 'rgba(255,255,255,0)'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  glow.scale.set(7, 7, 1);
  glow.position.y = 0.15;
  mesh.add(glow);

  return {
    mesh,
    x,
    y,
    z,
    radius: 2.35,
    type: 'answer',
    levelIndex,
    answerIndex,
    active: levelIndex === 0,
    triggered: false,
    labelSprite,
  };
}

function createMysteryTool(levelIndex, y) {
  const root = new THREE.Group();
  root.position.set(levelIndex % 2 === 0 ? 10.5 : -10.5, y, -1.2);
  root.userData.isPowerUp = true;
  root.userData.collected = false;
  root.userData.levelIndex = levelIndex;

  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.8, 1),
    new THREE.MeshStandardMaterial({ color: 0x9a62ff, emissive: 0xff47de, emissiveIntensity: 1.45, metalness: 0.25, roughness: 0.22 })
  );
  orb.name = 'power-orb';
  orb.userData.powerRoot = root;
  root.add(orb);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.08, 12, 46),
    new THREE.MeshBasicMaterial({ color: 0x8deaff, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.userData.powerRoot = root;
  root.add(ring);

  const symbol = makeTextSprite('?', { width: 180, height: 180, fontSize: 110, background: 'rgba(0,0,0,0)', border: 'rgba(0,0,0,0)' });
  symbol.position.z = 0.85;
  symbol.scale.set(1.35, 1.35, 1);
  symbol.userData.powerRoot = root;
  root.add(symbol);

  return root;
}

function createBookCastle() {
  const root = new THREE.Group();
  root.position.set(0, WORLD.castleY, -2);

  const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffeaff, emissive: 0x672f88, emissiveIntensity: 0.35, roughness: 0.86 });
  for (let i = 0; i < 12; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(2.2 + Math.random() * 1.2, 22, 22), cloudMaterial);
    puff.scale.y = 0.5;
    puff.position.set((i - 5.5) * 1.4, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 3.5);
    root.add(puff);
  }

  const bookMaterial = new THREE.MeshStandardMaterial({ color: 0xefe6c8, roughness: 0.82 });
  const coverMaterial = new THREE.MeshStandardMaterial({ color: 0x9d5cff, emissive: 0x3e176d, emissiveIntensity: 0.55, roughness: 0.48 });
  const goldMaterial = new THREE.MeshStandardMaterial({ color: 0xffd86b, emissive: 0x9a5e13, emissiveIntensity: 0.62, metalness: 0.42, roughness: 0.32 });

  const baseBook = new THREE.Group();
  const pages = new THREE.Mesh(new THREE.BoxGeometry(13, 1.2, 7.2), bookMaterial);
  pages.position.y = 1.4;
  pages.castShadow = true;
  baseBook.add(pages);
  const coverTop = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.35, 7.7), coverMaterial);
  coverTop.position.y = 2.18;
  coverTop.castShadow = true;
  baseBook.add(coverTop);
  const coverBottom = coverTop.clone();
  coverBottom.position.y = 0.68;
  baseBook.add(coverBottom);
  root.add(baseBook);

  const towerPositions = [-4.2, 0, 4.2];
  towerPositions.forEach((x, index) => {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(index === 1 ? 1.55 : 1.25, index === 1 ? 1.75 : 1.45, index === 1 ? 6.8 : 5.2, 8), coverMaterial);
    tower.position.set(x, index === 1 ? 5.55 : 4.75, 0);
    tower.castShadow = true;
    root.add(tower);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(index === 1 ? 2.05 : 1.7, 2.8, 8), goldMaterial);
    roof.position.set(x, index === 1 ? 10.25 : 8.75, 0);
    roof.castShadow = true;
    root.add(roof);
  });

  const gate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.35), goldMaterial);
  gate.position.set(0, 3.5, 3.75);
  root.add(gate);

  const title = makeTextSprite('天空書本城堡', { width: 650, height: 150, fontSize: 62, background: 'rgba(45,18,91,.88)', border: 'rgba(255,225,124,.9)' });
  title.position.set(0, 12.3, 0);
  title.scale.set(8.5, 1.9, 1);
  root.add(title);

  const light = new THREE.PointLight(0xffd86b, 70, 42, 2);
  light.position.set(0, 8, 4);
  root.add(light);
  return root;
}

function createStarGeometry(outerRadius, innerRadius, depth) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i += 1) {
    const angle = i * Math.PI / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.16, bevelThickness: 0.14 });
  geometry.center();
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function beginGame() {
  const name = els.playerName.value.trim();
  if (!name) {
    els.nameError.textContent = '請先輸入姓名。';
    els.playerName.focus();
    return;
  }
  state.playerName = name;
  state.started = true;
  els.hudName.textContent = name;
  els.startScreen.classList.remove('active');
  els.hud.classList.remove('hidden');
  els.questionPanel.classList.remove('hidden');
  els.powerPanel.classList.remove('hidden');
  els.crosshair.classList.remove('hidden');
  updateQuestionUI();
  updateHUD();
  showToast(`🌟 ${name}，向第一組答案星星出發！`);
  playTone(523, 0.14, 'sine');
}

function attemptJump() {
  if (!state.grounded || state.wrongFall || state.victoryFlight) return;
  const powerMultiplier = state.power === 'giant' ? 1.18 : state.power === 'wings' ? 1.1 : 1;
  state.velocity.y = 23 * powerMultiplier;
  state.grounded = false;
  playTone(350, 0.07, 'triangle');
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  animateEnvironment(elapsed, dt);
  animatePlatforms(elapsed);
  updatePowerEffect();

  if (state.started && !state.ended) {
    if (state.victoryFlight) updateVictoryFlight(elapsed);
    else updatePlayer(dt, elapsed);
    updateCamera(dt);
    updateHUD();
  } else {
    camera.position.x = Math.sin(elapsed * 0.18) * 3.2;
    camera.lookAt(0, 9, 0);
  }

  renderer.render(scene, camera);
}

function animateEnvironment(elapsed, dt) {
  const starField = scene.getObjectByName('star-field');
  if (starField) starField.rotation.y += dt * 0.004;
  particles.forEach((sparkle, index) => {
    const scale = sparkle.userData.baseScale * (0.55 + Math.sin(elapsed * 2.3 + index) * 0.35);
    sparkle.scale.setScalar(Math.max(0.15, scale));
    sparkle.rotation.y += dt;
  });
  scene.children.forEach((child) => {
    if (child.name === 'cloud') child.rotation.y += child.userData.drift;
  });
  activePowerUps.forEach((tool, index) => {
    if (tool.userData.collected) return;
    tool.rotation.y += dt * 1.4;
    tool.position.y += Math.sin(elapsed * 2 + index) * 0.004;
    const ring = tool.children.find((child) => child.geometry?.type === 'TorusGeometry');
    if (ring) ring.rotation.z += dt * 1.6;
  });
  if (wings.visible) {
    wings.children.forEach((wing, index) => {
      wing.rotation.z = (index === 0 ? 1 : -1) * (0.12 + Math.sin(elapsed * 12) * 0.16);
    });
  }
}

function animatePlatforms(elapsed) {
  levelGroups.forEach(({ platforms }, levelIndex) => {
    platforms.forEach((platform, answerIndex) => {
      if (!platform.mesh.visible) return;
      platform.mesh.rotation.y += 0.0025 * (answerIndex + 1);
      platform.mesh.position.y = platform.y + Math.sin(elapsed * 1.8 + levelIndex + answerIndex) * 0.11;
    });
  });
}

function updatePlayer(dt, elapsed) {
  const speed = state.power === 'cat' ? 10.4 : state.power === 'giant' ? 7.1 : state.power === 'wings' ? 9.4 : 8.2;
  const desired = new THREE.Vector3();
  if (keys.has('ArrowLeft')) desired.x -= 1;
  if (keys.has('ArrowRight')) desired.x += 1;
  if (keys.has('ArrowUp')) desired.z -= 1;
  if (keys.has('ArrowDown')) desired.z += 1;
  if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed);

  const responsiveness = state.grounded ? 11 : state.power === 'wings' ? 7.5 : 5.2;
  state.velocity.x = THREE.MathUtils.damp(state.velocity.x, desired.x, responsiveness, dt);
  state.velocity.z = THREE.MathUtils.damp(state.velocity.z, desired.z, responsiveness, dt);

  const gravity = state.power === 'wings' ? 12.5 : 26;
  state.velocity.y -= gravity * dt;

  player.position.addScaledVector(state.velocity, dt);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -14.5, 14.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -6.5, 5.5);

  if (desired.lengthSq() > 0.1) {
    player.rotation.y = THREE.MathUtils.damp(player.rotation.y, Math.atan2(desired.x, desired.z), 10, dt);
    player.position.y += state.grounded ? Math.abs(Math.sin(elapsed * 11)) * 0.008 : 0;
  }

  checkPlatformLandings();

  if (state.wrongFall && player.position.y < state.checkpoint.y - 15) {
    respawnAtCheckpoint();
  } else if (!state.wrongFall && player.position.y < state.checkpoint.y - 18) {
    state.lives -= 1;
    updateHUD();
    if (state.lives <= 0) endGame(false);
    else {
      showDamage();
      showToast('💫 你跌得太低了！返回最近的星星檢查點。');
      respawnAtCheckpoint();
    }
  }
}

function checkPlatformLandings() {
  if (!state.canCollide || state.velocity.y > 0.5) return;

  const candidates = [...safePlatforms];
  const current = levelGroups[state.level];
  if (current && !current.resolved) candidates.push(...current.platforms);

  let best = null;
  for (const platform of candidates) {
    if (!platform.active || platform.mesh.visible === false) continue;
    const px = platform.mesh.position?.x ?? platform.x;
    const py = platform.mesh.position?.y ?? platform.y;
    const pz = platform.mesh.position?.z ?? platform.z;
    const dx = player.position.x - px;
    const dz = player.position.z - pz;
    const distance = Math.hypot(dx, dz);
    const landingY = py + WORLD.platformTop + WORLD.playerHalfHeight * player.scale.y;
    const crossedTop = player.position.y <= landingY + 0.32 && player.position.y >= landingY - 1.25;
    if (distance <= platform.radius && crossedTop) {
      if (!best || py > best.py) best = { platform, landingY, py };
    }
  }

  if (!best) {
    state.grounded = false;
    return;
  }

  player.position.y = best.landingY;
  state.velocity.y = 0;
  state.grounded = true;
  state.currentPlatform = best.platform;

  if (best.platform.type === 'answer' && !best.platform.triggered) {
    best.platform.triggered = true;
    resolveAnswer(best.platform);
  }
}

function resolveAnswer(platform) {
  if (state.questionLocked || platform.levelIndex !== state.level) return;
  state.questionLocked = true;
  const question = QUESTIONS[state.level];
  const isCorrect = platform.answerIndex === question.correct;

  if (!isCorrect) {
    platform.mesh.material.color.set(0xff355f);
    platform.mesh.material.emissive.set(0xff153e);
    platform.mesh.material.emissiveIntensity = 1.4;
    state.lives -= 1;
    state.wrongFall = true;
    state.canCollide = false;
    state.grounded = false;
    state.velocity.set((Math.random() - 0.5) * 3, -8, 2);
    showDamage();
    playTone(145, 0.35, 'sawtooth');
    showToast(`❌ 答案不正確！正確答案是「${question.answers[question.correct]}」。`);
    updateHUD();
    if (state.lives <= 0) {
      setTimeout(() => endGame(false), 850);
    }
    return;
  }

  playSuccessChord();
  state.correctCount += 1;
  platform.mesh.material.color.set(0x7dffad);
  platform.mesh.material.emissive.set(0x38ff8b);
  platform.mesh.material.emissiveIntensity = 0.85;
  platform.type = 'safe';
  platform.active = true;
  safePlatforms.push(platform);
  state.checkpoint.set(platform.mesh.position.x, platform.mesh.position.y + WORLD.platformTop + WORLD.playerHalfHeight + 0.08, platform.mesh.position.z);
  showToast(`✅ 正確！「${question.answers[question.correct]}」`);
  burstParticles(platform.mesh.position, 0x7dffad);

  const groupInfo = levelGroups[state.level];
  groupInfo.resolved = true;
  groupInfo.platforms.forEach((item) => {
    if (item !== platform) {
      item.active = false;
      fadeOutObject(item.mesh);
    }
  });

  state.level += 1;
  state.questionLocked = false;

  if (state.level >= QUESTIONS.length) {
    castle.visible = true;
    state.victoryFlight = true;
    state.victoryStart = clock.elapsedTime;
    state.victoryFrom.copy(player.position);
    wings.visible = true;
    showToast('🏰 十題完成！魔法翅膀正帶你飛往書本城堡！');
    return;
  }

  const nextLevel = levelGroups[state.level];
  nextLevel.group.visible = true;
  nextLevel.platforms.forEach((item) => { item.active = true; });
  updateQuestionUI();

  // 答對後提供一次向上彈跳，保持「一直向上」的節奏。
  state.velocity.y = 13.5;
  state.velocity.x *= 0.4;
  state.velocity.z *= 0.4;
  state.grounded = false;
}

function respawnAtCheckpoint() {
  if (state.lives <= 0) return;
  state.wrongFall = false;
  state.canCollide = true;
  state.questionLocked = false;
  state.velocity.set(0, 0, 0);
  player.position.copy(state.checkpoint);
  player.position.y += 0.15;
  state.grounded = true;

  const current = levelGroups[state.level];
  if (current) {
    current.platforms.forEach((platform) => {
      platform.triggered = false;
      if (platform.active) {
        const colors = [0xffcc58, 0xff79cd, 0x72d9ff];
        platform.mesh.material.color.set(colors[platform.answerIndex]);
        platform.mesh.material.emissive.set(colors[platform.answerIndex]);
        platform.mesh.material.emissiveIntensity = 0.26;
      }
    });
  }
}

function updateCamera(dt) {
  const desiredY = Math.max(8.5, player.position.y + 6.2);
  state.cameraY = THREE.MathUtils.damp(state.cameraY, desiredY, 4.2, dt);
  const targetX = player.position.x * 0.2;
  camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3.5, dt);
  camera.position.y = state.cameraY;
  camera.position.z = THREE.MathUtils.damp(camera.position.z, 20.5 + player.position.z * 0.12, 3.5, dt);
  camera.lookAt(player.position.x * 0.25, player.position.y + 2.2, player.position.z - 2.5);
}

function updateVictoryFlight(elapsed) {
  const duration = 4.6;
  const t = THREE.MathUtils.clamp((elapsed - state.victoryStart) / duration, 0, 1);
  const smooth = t * t * (3 - 2 * t);
  const target = new THREE.Vector3(0, WORLD.castleY + 4.2, 3.8);
  player.position.lerpVectors(state.victoryFrom, target, smooth);
  player.rotation.y += 0.025;
  player.position.x += Math.sin(t * Math.PI * 4) * 0.025;
  if (t >= 1) endGame(true);
}

function updateQuestionUI() {
  const displayIndex = Math.min(state.level, QUESTIONS.length - 1);
  els.questionNumber.textContent = `第 ${displayIndex + 1} 題`;
  els.questionText.textContent = QUESTIONS[displayIndex].question;
}

function updateHUD() {
  els.lives.textContent = `${'❤️'.repeat(Math.max(0, state.lives))}${'🖤'.repeat(Math.max(0, 5 - state.lives))}`;
  els.progress.textContent = `${Math.min(state.level + 1, 10)} / 10`;
  els.height.textContent = Math.max(0, Math.round(player.position.y * 1.7));
}

function handlePointerKick(event) {
  if (!state.started || state.ended || state.victoryFlight) return;
  const rect = els.canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const targets = [];
  activePowerUps.forEach((tool) => {
    if (!tool.userData.collected && tool.visible && tool.parent?.visible) {
      tool.traverse((child) => { if (child.isMesh || child.isSprite) targets.push(child); });
    }
  });
  const hit = raycaster.intersectObjects(targets, false)[0];
  if (!hit) return;

  const root = hit.object.userData.powerRoot || findPowerRoot(hit.object);
  if (!root || root.userData.collected) return;
  const distance = player.position.distanceTo(root.getWorldPosition(new THREE.Vector3()));
  if (distance > 14) {
    showToast('🖱️ 再靠近一點，才能踢開神秘道具！');
    return;
  }
  kickPowerUp(root);
}

function findPowerRoot(object) {
  let current = object;
  while (current && !current.userData?.isPowerUp) current = current.parent;
  return current;
}

function kickPowerUp(root) {
  root.userData.collected = true;
  animateKick();
  burstParticles(root.getWorldPosition(new THREE.Vector3()), 0xff78dc);
  root.visible = false;
  const effects = ['wings', 'giant', 'cat'];
  activatePower(effects[Math.floor(Math.random() * effects.length)]);
  playTone(690, 0.12, 'square');
  setTimeout(() => playTone(940, 0.18, 'sine'), 80);
}

function activatePower(type) {
  resetPowerVisuals();
  state.power = type;
  state.powerEndsAt = performance.now() + 60000;
  els.powerPanel.classList.remove('hidden');

  if (type === 'wings') {
    wings.visible = true;
    els.powerIcon.textContent = '🪽';
    showToast('🪽 驚喜！獲得魔法翅膀 1 分鐘：跳得更高、下降更慢！');
  } else if (type === 'giant') {
    player.scale.setScalar(1.65);
    els.powerIcon.textContent = '🦸';
    showToast('🦸 驚喜！變成巨人 1 分鐘：力量及跳躍力提升！');
  } else {
    player.userData.bodyParts.forEach((part) => { part.visible = false; });
    catForm.visible = true;
    els.powerIcon.textContent = '🐈';
    showToast('🐈 驚喜！變成小貓 1 分鐘：移動速度提升！');
  }
}

function updatePowerEffect() {
  if (!state.power) {
    els.powerText.textContent = '未啟動';
    return;
  }
  const remaining = Math.max(0, Math.ceil((state.powerEndsAt - performance.now()) / 1000));
  const names = { wings: '魔法翅膀', giant: '巨人力量', cat: '小貓速度' };
  els.powerText.textContent = `${names[state.power]} ${remaining}s`;
  if (remaining <= 0) {
    showToast('✨ 神秘效果完結，回復原狀。');
    state.power = null;
    resetPowerVisuals();
    els.powerIcon.textContent = '✨';
    els.powerText.textContent = '未啟動';
  }
}

function resetPowerVisuals() {
  player.scale.setScalar(1);
  wings.visible = false;
  catForm.visible = false;
  player.userData.bodyParts.forEach((part) => { part.visible = true; });
}

function animateKick() {
  const leg = player.userData.kickLeg;
  if (!leg) return;
  const start = performance.now();
  const duration = 360;
  const run = (now) => {
    const t = Math.min(1, (now - start) / duration);
    leg.rotation.x = -Math.sin(t * Math.PI) * 1.45;
    if (t < 1) requestAnimationFrame(run);
    else leg.rotation.x = 0;
  };
  requestAnimationFrame(run);
}

function fadeOutObject(object) {
  const start = performance.now();
  object.traverse((child) => {
    if (child.material) {
      child.material = child.material.clone();
      child.material.transparent = true;
    }
  });
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 550);
    object.scale.setScalar(1 - t * 0.45);
    object.traverse((child) => {
      if (child.material) child.material.opacity = 1 - t;
    });
    if (t < 1) requestAnimationFrame(tick);
    else object.visible = false;
  };
  requestAnimationFrame(tick);
}

function burstParticles(origin, color) {
  for (let i = 0; i < 22; i += 1) {
    const piece = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.08 + Math.random() * 0.11),
      new THREE.MeshBasicMaterial({ color, transparent: true })
    );
    piece.position.copy(origin);
    piece.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 6);
    scene.add(piece);
    const start = performance.now();
    const tick = (now) => {
      const dt = 0.016;
      piece.userData.velocity.y -= 12 * dt;
      piece.position.addScaledVector(piece.userData.velocity, dt);
      piece.material.opacity = 1 - Math.min(1, (now - start) / 900);
      piece.rotation.x += 0.12;
      piece.rotation.y += 0.1;
      if (now - start < 900) requestAnimationFrame(tick);
      else {
        piece.geometry.dispose();
        piece.material.dispose();
        scene.remove(piece);
      }
    };
    requestAnimationFrame(tick);
  }
}

function showDamage() {
  els.damageFlash.classList.remove('active');
  void els.damageFlash.offsetWidth;
  els.damageFlash.classList.add('active');
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  state.toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3000);
}

function endGame(won) {
  if (state.ended) return;
  state.ended = true;
  keys.clear();
  els.endScreen.classList.add('active');
  els.questionPanel.classList.add('hidden');
  els.crosshair.classList.add('hidden');
  els.resultScore.textContent = `${state.correctCount} / 10`;

  if (won) {
    els.endIcon.textContent = '🏰';
    els.endTitle.textContent = '成功到達書本城堡！';
    els.endMessage.textContent = `${state.playerName}，你完成了全部閱讀問題，也學會勇敢接納真實的自己！`;
    playVictoryMusic();
  } else {
    els.endIcon.textContent = '🌠';
    els.endTitle.textContent = '星光仍在等你';
    els.endMessage.textContent = `${state.playerName}，生命用完了。再讀一次故事，然後重新向書本城堡出發吧！`;
  }
}

function makeTextSprite(text, options = {}) {
  const width = options.width || 512;
  const height = options.height || 150;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const radius = 28;
  roundRect(ctx, 4, 4, width - 8, height - 8, radius);
  ctx.fillStyle = options.background || 'rgba(20,10,55,.88)';
  ctx.fill();
  ctx.strokeStyle = options.border || 'rgba(255,255,255,.72)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${options.fontSize || 48}px "Microsoft JhengHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fitText(ctx, text, width - 44, options.fontSize || 48);
  ctx.fillText(text, width / 2, height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  return new THREE.Sprite(material);
}

function fitText(ctx, text, maxWidth, initialSize) {
  let size = initialSize;
  while (size > 25 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `900 ${size}px "Microsoft JhengHei", sans-serif`;
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function makeRadialTexture(innerColor, outerColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function playTone(frequency, duration, type = 'sine') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!playTone.ctx) playTone.ctx = new AudioContext();
    const ctx = playTone.ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  } catch {
    // 音效不是核心功能；瀏覽器禁止時遊戲仍可正常運行。
  }
}

function playSuccessChord() {
  playTone(523, 0.16, 'sine');
  setTimeout(() => playTone(659, 0.16, 'sine'), 80);
  setTimeout(() => playTone(784, 0.24, 'sine'), 160);
}

function playVictoryMusic() {
  [523, 659, 784, 1047].forEach((note, index) => {
    setTimeout(() => playTone(note, 0.32, 'triangle'), index * 140);
  });
}

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}

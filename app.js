// ---- Data Tables ----
const RAM_DATA = [
  { label: "8GB",  price: 0,   score: 0  },
  { label: "12GB", price: 60,  score: 15 },
  { label: "16GB", price: 120, score: 30 },
  { label: "24GB", price: 200, score: 50 },
];

const STORAGE_DATA = [
  { label: "128GB", price: 0,   score: 0  },
  { label: "256GB", price: 50,  score: 10 },
  { label: "512GB", price: 120, score: 20 },
  { label: "1TB",   price: 220, score: 35 },
];

const CPU_LABELS = {
  "150,80,mid":      "Snapdragon 7+ Gen 3",
  "300,140,flagship":"Snapdragon 8 Gen 3",
  "380,180,flagship":"Snapdragon 8 Elite",
};

const MODEL_SHAPES = {
  flat:   { w: 2.0, h: 4.2, d: 0.18, cornerR: 0.12, screenR: 0.06 },
  curved: { w: 2.0, h: 4.4, d: 0.20, cornerR: 0.32, screenR: 0.28 },
  wide:   { w: 2.4, h: 4.0, d: 0.22, cornerR: 0.14, screenR: 0.08 },
};

// Camera configs: { lenses: [{x,y,r}], flash, lidar, islandW, islandH }
const CAMERA_CONFIGS = {
  single: {
    lenses:  [{ x: 0,     y: 0,     r: 0.13 }],
    flash:   { x: 0.22,  y: 0 },
    lidar:   false,
    islandW: 0.52, islandH: 0.38,
  },
  dual: {
    lenses:  [{ x: -0.18, y: 0.10,  r: 0.12 }, { x: 0.18, y: 0.10, r: 0.10 }],
    flash:   { x: 0,     y: -0.16 },
    lidar:   false,
    islandW: 0.58, islandH: 0.52,
  },
  triple: {
    lenses:  [
      { x: -0.18, y:  0.16, r: 0.13 },
      { x:  0.18, y:  0.16, r: 0.11 },
      { x:  0,    y: -0.14, r: 0.10 },
    ],
    flash:   { x: 0.22,  y: -0.16 },
    lidar:   false,
    islandW: 0.62, islandH: 0.72,
  },
  periscope: {
    lenses:  [
      { x: -0.16, y:  0.26, r: 0.13 },
      { x:  0.16, y:  0.26, r: 0.11 },
      { x: -0.16, y: -0.04, r: 0.10 },
      { x:  0.16, y: -0.04, r: 0.09 },  // periscope — rectangular
    ],
    flash:   { x: 0,     y: -0.28 },
    lidar:   true,
    islandW: 0.66, islandH: 0.90,
  },
};

// ---- State ----
let state = {
  model:       "Custom X1",
  modelShape:  "flat",
  modelPrice:  0,
  color:       "#2a2a2a",
  colorName:   "Midnight Black",
  battPrice:   0,
  battScore:   0,
  battLabel:   "5000mAh",
  screenPrice: 0,
  screenScore: 10,
  screenLabel: "Flat AMOLED 120Hz",
  camKey:      "single",
  camPrice:    0,
  camScore:    0,
  camLabel:    "Single 50MP",
  loggedIn:    false,
  userEmail:   "",
};

// ---- 3D ----
let scene, camera3d, renderer, phoneGroup;
let bodyMesh;

function makeRoundedBox(w, h, d, r) {
  const shape = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geo.translate(0, 0, -d / 2);
  return geo;
}

function buildCameraIsland(s, offsetX) {
  const cfg = CAMERA_CONFIGS[state.camKey];
  const islandGroup = new THREE.Group();

  // Island base
  const islandShape = new THREE.Shape();
  const iw = cfg.islandW, ih = cfg.islandH, ir = 0.08;
  const ix = -iw / 2, iy = -ih / 2;
  islandShape.moveTo(ix + ir, iy);
  islandShape.lineTo(ix + iw - ir, iy);
  islandShape.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir);
  islandShape.lineTo(ix + iw, iy + ih - ir);
  islandShape.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir, iy + ih);
  islandShape.lineTo(ix + ir, iy + ih);
  islandShape.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir);
  islandShape.lineTo(ix, iy + ir);
  islandShape.quadraticCurveTo(ix, iy, ix + ir, iy);
  const islandGeo = new THREE.ExtrudeGeometry(islandShape, { depth: 0.05, bevelEnabled: false });
  islandGeo.translate(0, 0, -0.025);
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, metalness: 0.85, roughness: 0.25 });
  islandGroup.add(new THREE.Mesh(islandGeo, islandMat));

  const lensMat  = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 1.0, roughness: 0.02 });
  const ringMat  = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 1.0, roughness: 0.1  });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, metalness: 0.2, roughness: 0.0, transparent: true, opacity: 0.82 });

  cfg.lenses.forEach((l, i) => {
    const isPeriscope = (state.camKey === "periscope" && i === 3);

    if (isPeriscope) {
      // Periscope lens = rectangular
      const pGeo = new THREE.BoxGeometry(0.14, 0.20, 0.06);
      const pMesh = new THREE.Mesh(pGeo, lensMat);
      pMesh.position.set(l.x, l.y, 0.04);
      islandGroup.add(pMesh);
      // Glass
      const pgGeo = new THREE.BoxGeometry(0.10, 0.16, 0.02);
      const pg = new THREE.Mesh(pgGeo, glassMat);
      pg.position.set(l.x, l.y, 0.07);
      islandGroup.add(pg);
    } else {
      // Outer ring
      const ringGeo = new THREE.CylinderGeometry(l.r + 0.025, l.r + 0.025, 0.03, 32);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(l.x, l.y, 0.025);
      islandGroup.add(ring);
      // Lens barrel
      const barrelGeo = new THREE.CylinderGeometry(l.r, l.r, 0.06, 32);
      const barrel = new THREE.Mesh(barrelGeo, lensMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(l.x, l.y, 0.04);
      islandGroup.add(barrel);
      // Glass element
      const glassGeo = new THREE.CylinderGeometry(l.r - 0.02, l.r - 0.02, 0.02, 32);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.rotation.x = Math.PI / 2;
      glass.position.set(l.x, l.y, 0.07);
      islandGroup.add(glass);
      // Lens reflection dot
      const refGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.005, 16);
      const refMat = new THREE.MeshStandardMaterial({ color: 0x6ee7f7, emissive: 0x6ee7f7, emissiveIntensity: 1.5, transparent: true, opacity: 0.6 });
      const ref = new THREE.Mesh(refGeo, refMat);
      ref.rotation.x = Math.PI / 2;
      ref.position.set(l.x + l.r * 0.3, l.y + l.r * 0.3, 0.075);
      islandGroup.add(ref);
    }
  });

  // Flash
  const flashGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 16);
  const flashMat = new THREE.MeshStandardMaterial({ color: 0xfff5cc, emissive: 0xfff5cc, emissiveIntensity: 0.8, roughness: 0.4 });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.rotation.x = Math.PI / 2;
  flash.position.set(cfg.flash.x, cfg.flash.y, 0.04);
  islandGroup.add(flash);

  // LiDAR (periscope only)
  if (cfg.lidar) {
    const lidarGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
    const lidarMat = new THREE.MeshStandardMaterial({ color: 0x1a0030, emissive: 0x8800ff, emissiveIntensity: 1.2, roughness: 0.3 });
    const lidar = new THREE.Mesh(lidarGeo, lidarMat);
    lidar.rotation.x = Math.PI / 2;
    lidar.position.set(-cfg.flash.x, cfg.flash.y, 0.04);
    islandGroup.add(lidar);
  }

  islandGroup.position.set(offsetX, s.h / 2 - cfg.islandH / 2 - 0.18, s.d / 2 + 0.02);
  return islandGroup;
}

function buildPhone(shape) {
  const s = MODEL_SHAPES[shape] || MODEL_SHAPES.flat;
  if (phoneGroup) scene.remove(phoneGroup);
  phoneGroup = new THREE.Group();

  // Body
  const bodyGeo = makeRoundedBox(s.w, s.h, s.d, s.cornerR);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(state.color),
    metalness: 0.75,
    roughness: 0.22,
  });
  bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  phoneGroup.add(bodyMesh);

  // Screen
  const screenGeo = makeRoundedBox(s.w - 0.28, s.h - 0.38, 0.01, s.screenR);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x060c1a,
    emissive: 0x0a1a2e,
    emissiveIntensity: shape === "curved" ? 1.0 : 0.5,
    roughness: 0.08,
  });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = s.d / 2 + 0.005;
  phoneGroup.add(screenMesh);

  // Front camera punch-hole
  const holeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 20);
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.5, roughness: 0.1 });
  const hole = new THREE.Mesh(holeGeo, holeMat);
  hole.rotation.x = Math.PI / 2;
  hole.position.set(0, s.h / 2 - 0.32, s.d / 2 + 0.012);
  phoneGroup.add(hole);

  // Camera island (rear)
  const camOffsetX = shape === "wide" ? -0.55 : 0;
  phoneGroup.add(buildCameraIsland(s, camOffsetX));

  // Curved edge glow
  if (shape === "curved") {
    const edgeGeo = new THREE.BoxGeometry(0.06, s.h - 0.6, 0.01);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.2, transparent: true, opacity: 0.35 });
    const le = new THREE.Mesh(edgeGeo, edgeMat);
    le.position.set(-s.w / 2 + 0.03, 0, 0);
    phoneGroup.add(le);
    const re = le.clone();
    re.position.set(s.w / 2 - 0.03, 0, 0);
    phoneGroup.add(re);
  }

  // Gamer RGB stripe
  if (shape === "wide") {
    const stripeGeo = new THREE.BoxGeometry(s.w, 0.06, s.d + 0.01);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff3c00, emissive: 0xff3c00, emissiveIntensity: 1.5, transparent: true, opacity: 0.7 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.set(0, -s.h / 2 + 0.4, 0);
    phoneGroup.add(stripe);
  }

  scene.add(phoneGroup);
}

function init3D() {
  const container = document.getElementById("threeContainer");
  const W = container.clientWidth || 240;
  const H = container.clientHeight || 500;

  scene = new THREE.Scene();
  camera3d = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera3d.position.z = 5.8;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(5, 8, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-3, -2, 4);
  scene.add(fillLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  buildPhone("flat");
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (phoneGroup) {
    phoneGroup.rotation.y += 0.008;
    phoneGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.07;
  }
  renderer.render(scene, camera3d);
}

// ---- Helpers ----
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalOverlay").classList.add("open");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
}

// ---- Model ----
function selectModel(btn) {
  document.querySelectorAll("#modelGroup .model-card").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.model      = btn.dataset.val;
  state.modelShape = btn.dataset.shape;
  state.modelPrice = +btn.dataset.price;
  document.getElementById("modelLabel").textContent = state.model;
  buildPhone(state.modelShape);
  if (bodyMesh) bodyMesh.material.color.set(state.color);
  const glow = document.getElementById("phoneGlow");
  glow.style.background = state.modelShape === "wide" ? "#ff3c0055"
    : state.modelShape === "curved" ? "rgba(56,189,248,0.18)"
    : state.color + "55";
  calc();
}

// ---- Screen ----
function selectScreen(btn) {
  document.querySelectorAll("#screenGroup .screen-opt").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const v = btn.dataset.val.split(",");
  state.screenPrice = +v[0];
  state.screenScore = +v[1];
  state.screenLabel = v[2];
  calc();
}

// ---- Camera ----
function selectCamera(btn) {
  document.querySelectorAll("#cameraGroup .camera-opt").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const v = btn.dataset.val.split(",");
  state.camKey   = btn.dataset.key;
  state.camPrice = +v[0];
  state.camScore = +v[1];
  state.camLabel = v[2];
  // Rebuild phone so island updates
  buildPhone(state.modelShape);
  if (bodyMesh) bodyMesh.material.color.set(state.color);
  calc();
}

// ---- Color ----
function selectColor(btn) {
  document.querySelectorAll("#colorGroup .swatch").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.color     = btn.dataset.color;
  state.colorName = btn.dataset.name;
  document.getElementById("colorName").textContent = btn.dataset.name;
  if (bodyMesh) bodyMesh.material.color.set(state.color);
  document.getElementById("phoneGlow").style.background = state.color + "55";
  calc();
}

// ---- Calc ----
function calc() {
  let price = 649, score = 100;
  price += state.modelPrice;
  price += state.screenPrice;  score += state.screenScore;
  price += state.camPrice;     score += state.camScore;

  const cpuVals = document.getElementById("cpu").value.split(",");
  price += +cpuVals[0]; score += +cpuVals[1];

  const ramIdx = +document.getElementById("ram").value;
  const ram = RAM_DATA[ramIdx];
  price += ram.price; score += ram.score;
  document.getElementById("ramLabel").textContent = ram.label;

  const storIdx = +document.getElementById("storage").value;
  const stor = STORAGE_DATA[storIdx];
  price += stor.price; score += stor.score;
  document.getElementById("storageLabel").textContent = stor.label;

  price += state.battPrice; score += state.battScore;

  document.getElementById("price").textContent = "$" + price.toLocaleString();

  const pct = Math.min(100, Math.round((score / 650) * 100));
  document.getElementById("perfFill").style.width = pct + "%";
  document.getElementById("perfNum").textContent = score;

  const cpuLabel = CPU_LABELS[document.getElementById("cpu").value] || "";
  const shortCpu = cpuLabel.replace("Snapdragon ", "SD ");
  document.getElementById("specPills").innerHTML =
    `<span class="pill">${state.model.replace("Custom ","")}</span>` +
    `<span class="pill">${shortCpu}</span>` +
    `<span class="pill">${ram.label} RAM</span>` +
    `<span class="pill">${state.camLabel}</span>`;

  const isFlagship = cpuVals[2] === "flagship";
  document.getElementById("compat").textContent =
    isFlagship && +document.getElementById("ram").value < 2
      ? "⚠ Flagship chip works best with 16GB+ RAM" : "";

  window._buildPrice = price;
  window._ramLabel   = ram.label;
  window._storLabel  = stor.label;
  window._cpuLabel   = cpuLabel;
}

// ---- Battery ----
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#battGroup .opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#battGroup .opt-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const v = btn.dataset.val.split(",");
      state.battPrice = +v[0]; state.battScore = +v[1]; state.battLabel = v[2];
      calc();
    });
  });
  document.getElementById("cpu").addEventListener("change", calc);
});

// ---- Auth ----
function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const pass  = document.getElementById("password").value;
  if (!email || !pass)           { showToast("Please enter email and password."); return; }
  if (!email.includes("@"))      { showToast("Please enter a valid email."); return; }
  state.loggedIn = true;
  state.userEmail = email;
  document.getElementById("authState").style.display = "none";
  document.getElementById("loggedIn").style.display  = "flex";
  document.getElementById("userEmail").textContent   = email;
  document.getElementById("userAvatar").textContent  = email[0].toUpperCase();
  showToast("Logged in! (demo mode)");
}
function handleSignup() {
  const email = document.getElementById("email").value.trim();
  if (!email.includes("@")) { showToast("Enter a valid email to sign up."); return; }
  showToast("Sign-up coming soon — we'll notify you at " + email + "!");
}
function handleLogout() {
  state.loggedIn = false;
  document.getElementById("authState").style.display = "block";
  document.getElementById("loggedIn").style.display  = "none";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  showToast("Logged out.");
}

// ---- Checkout ----
async function startCheckout() {
  const price = window._buildPrice || 649;
  openModal(`
    <h2>Order Summary</h2>
    <p>Review your custom build before placing your order.</p>
    <div class="build-summary">
      <div><span>Model</span><strong>${state.model}</strong></div>
      <div><span>Display</span><strong>${state.screenLabel}</strong></div>
      <div><span>Camera</span><strong>${state.camLabel}</strong></div>
      <div><span>Processor</span><strong>${window._cpuLabel||""}</strong></div>
      <div><span>RAM</span><strong>${window._ramLabel||"8GB"}</strong></div>
      <div><span>Storage</span><strong>${window._storLabel||"128GB"}</strong></div>
      <div><span>Battery</span><strong>${state.battLabel}</strong></div>
      <div><span>Color</span><strong>${state.colorName}</strong></div>
      <div><span>Total</span><strong style="font-size:18px;color:#38bdf8">$${price.toLocaleString()}</strong></div>
    </div>
    <p>🚀 <strong>Stripe checkout coming soon.</strong> Leave your email and we'll notify you when orders open!</p>
    <button class="modal-action" onclick="closeModal(); showToast('We\\'ll be in touch! 🎉')">Notify Me When Ready</button>
  `);
}

// ---- Init ----
init3D();
calc();

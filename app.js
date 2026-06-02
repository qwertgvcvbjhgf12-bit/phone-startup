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
  "150,80,mid": "Snapdragon 7+ Gen 3",
  "300,140,flagship": "Snapdragon 8 Gen 3",
  "380,180,flagship": "Snapdragon 8 Elite",
};

// Model shape definitions
const MODEL_SHAPES = {
  flat:   { w: 2.0, h: 4.2, d: 0.18, cornerR: 0.12, screenR: 0.06 },
  curved: { w: 2.0, h: 4.4, d: 0.20, cornerR: 0.32, screenR: 0.28 },
  wide:   { w: 2.4, h: 4.0, d: 0.22, cornerR: 0.14, screenR: 0.08 },
};

// ---- State ----
let state = {
  model: "Custom X1",
  modelShape: "flat",
  modelPrice: 0,
  color: "#2a2a2a",
  colorName: "Midnight Black",
  battPrice: 0,
  battScore: 0,
  battLabel: "5000mAh",
  screenPrice: 0,
  screenScore: 10,
  screenLabel: "Flat AMOLED 120Hz",
  loggedIn: false,
  userEmail: "",
};

// ---- 3D Phone ----
let scene, camera, renderer, phoneGroup;
let bodyMesh, screenMesh, camDot;

// Build a rounded-rectangle shape for the phone body
function makeRoundedBox(w, h, d, r) {
  // Three.js r160 has no built-in RoundedBoxGeometry, so we use a lathe/extrude trick:
  // We'll approximate with a BoxGeometry and fake rounded corners via material + scale
  // For a real rounded box we use ExtrudeGeometry with a rounded shape
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

  const extrudeSettings = {
    depth: d,
    bevelEnabled: false,
    steps: 1,
  };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  // Center on Z
  geo.translate(0, 0, -d / 2);
  return geo;
}

function buildPhone(shape) {
  const s = MODEL_SHAPES[shape] || MODEL_SHAPES.flat;

  // Clear old group
  if (phoneGroup) {
    scene.remove(phoneGroup);
  }
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

  // Screen face
  const screenGeo = makeRoundedBox(s.w - 0.28, s.h - 0.38, 0.01, s.screenR);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x060c1a,
    emissive: new THREE.Color(0x0a1a2e),
    emissiveIntensity: shape === "curved" ? 1.0 : 0.5,
    metalness: 0,
    roughness: 0.08,
  });
  screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = s.d / 2 + 0.005;
  phoneGroup.add(screenMesh);

  // Camera island
  const camIslandGeo = new THREE.BoxGeometry(0.55, 0.28, 0.04);
  const camIslandMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
  const camIsland = new THREE.Mesh(camIslandGeo, camIslandMat);
  camIsland.position.set(shape === "wide" ? -0.5 : 0, s.h / 2 - 0.3, s.d / 2 + 0.02);
  phoneGroup.add(camIsland);

  // Main lens
  const lensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x080808, metalness: 1, roughness: 0.05 });
  const lens = new THREE.Mesh(lensGeo, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.set(shape === "wide" ? -0.62 : -0.12, s.h / 2 - 0.3, s.d / 2 + 0.04);
  phoneGroup.add(lens);

  // Curved screen glow effect
  if (shape === "curved") {
    const edgeGeo = new THREE.BoxGeometry(0.06, s.h - 0.6, 0.01);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.35,
    });
    const leftEdge = new THREE.Mesh(edgeGeo, edgeMat);
    leftEdge.position.set(-s.w / 2 + 0.03, 0, 0);
    phoneGroup.add(leftEdge);
    const rightEdge = leftEdge.clone();
    rightEdge.position.set(s.w / 2 - 0.03, 0, 0);
    phoneGroup.add(rightEdge);
  }

  // Gamer stripe
  if (shape === "wide") {
    const stripeGeo = new THREE.BoxGeometry(s.w, 0.06, s.d + 0.01);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xff3c00,
      emissive: 0xff3c00,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.7,
    });
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
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.z = 5.8;

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

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  buildPhone("flat");
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (phoneGroup) {
    phoneGroup.rotation.y += 0.008;
    phoneGroup.rotation.x = Math.sin(Date.now() * 0.0005) * 0.07;
  }
  renderer.render(scene, camera);
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

// ---- Model Selection ----
function selectModel(btn) {
  document.querySelectorAll("#modelGroup .model-card").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  state.model = btn.dataset.val;
  state.modelShape = btn.dataset.shape;
  state.modelPrice = +btn.dataset.price;

  document.getElementById("modelLabel").textContent = state.model;

  // Rebuild 3D phone with new shape
  buildPhone(state.modelShape);

  // Re-apply color to new body mesh
  if (bodyMesh) bodyMesh.material.color.set(state.color);

  // Glow color hint
  const glow = document.getElementById("phoneGlow");
  if (state.modelShape === "wide") {
    glow.style.background = "#ff3c0055";
  } else if (state.modelShape === "curved") {
    glow.style.background = "rgba(56,189,248,0.18)";
  } else {
    glow.style.background = state.color + "55";
  }

  calc();
}

// ---- Screen Selection ----
function selectScreen(btn) {
  document.querySelectorAll("#screenGroup .screen-opt").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const vals = btn.dataset.val.split(",");
  state.screenPrice = +vals[0];
  state.screenScore = +vals[1];
  state.screenLabel = vals[2];

  calc();
}

function selectColor(btn) {
  document.querySelectorAll("#colorGroup .swatch").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.color = btn.dataset.color;
  state.colorName = btn.dataset.name;
  document.getElementById("colorName").textContent = btn.dataset.name;
  if (bodyMesh) bodyMesh.material.color.set(state.color);

  const glow = document.getElementById("phoneGlow");
  glow.style.background = state.color + "55";

  calc();
}

// ---- Main Calc ----
function calc() {
  let basePrice = 649;
  let score = 100;

  // Model
  basePrice += state.modelPrice;

  // Screen
  basePrice += state.screenPrice;
  score += state.screenScore;

  // CPU
  const cpuVals = document.getElementById("cpu").value.split(",");
  basePrice += +cpuVals[0];
  score += +cpuVals[1];

  // RAM (slider)
  const ramIdx = +document.getElementById("ram").value;
  const ram = RAM_DATA[ramIdx];
  basePrice += ram.price;
  score += ram.score;
  document.getElementById("ramLabel").textContent = ram.label;

  // Storage (slider)
  const storIdx = +document.getElementById("storage").value;
  const stor = STORAGE_DATA[storIdx];
  basePrice += stor.price;
  score += stor.score;
  document.getElementById("storageLabel").textContent = stor.label;

  // Battery (from state)
  basePrice += state.battPrice;
  score += state.battScore;

  // Update UI
  document.getElementById("price").textContent = "$" + basePrice.toLocaleString();

  const pct = Math.min(100, Math.round((score / 600) * 100));
  document.getElementById("perfFill").style.width = pct + "%";
  document.getElementById("perfNum").textContent = score;

  const cpuLabel = CPU_LABELS[document.getElementById("cpu").value] || "";
  const shortCpu = cpuLabel.replace("Snapdragon ", "SD ");
  document.getElementById("specPills").innerHTML =
    `<span class="pill">${state.model.replace("Custom ", "")}</span>` +
    `<span class="pill">${shortCpu}</span>` +
    `<span class="pill">${ram.label} RAM</span>` +
    `<span class="pill">${stor.label}</span>`;

  const isFlagship = cpuVals[2] === "flagship";
  const needsRam = ramIdx < 2;
  document.getElementById("compat").textContent =
    isFlagship && needsRam ? "⚠ Flagship chip works best with 16GB+ RAM" : "";

  window._buildPrice = basePrice;
  window._buildScore = score;
  window._ramLabel = ram.label;
  window._storLabel = stor.label;
  window._cpuLabel = cpuLabel;
}

// ---- Battery ----
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#battGroup .opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#battGroup .opt-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const vals = btn.dataset.val.split(",");
      state.battPrice = +vals[0];
      state.battScore = +vals[1];
      state.battLabel = vals[2];
      calc();
    });
  });

  document.getElementById("cpu").addEventListener("change", calc);
});

// ---- Auth ----
function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;
  if (!email || !pass) { showToast("Please enter email and password."); return; }
  if (!email.includes("@")) { showToast("Please enter a valid email."); return; }
  state.loggedIn = true;
  state.userEmail = email;
  document.getElementById("authState").style.display = "none";
  document.getElementById("loggedIn").style.display = "flex";
  document.getElementById("userEmail").textContent = email;
  document.getElementById("userAvatar").textContent = email[0].toUpperCase();
  showToast("Logged in! (demo mode)");
}

function handleSignup() {
  const email = document.getElementById("email").value.trim();
  if (!email || !email.includes("@")) { showToast("Enter a valid email to sign up."); return; }
  showToast("Sign-up coming soon — we'll notify you at " + email + "!");
}

function handleLogout() {
  state.loggedIn = false;
  state.userEmail = "";
  document.getElementById("authState").style.display = "block";
  document.getElementById("loggedIn").style.display = "none";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  showToast("Logged out.");
}

// ---- Checkout ----
async function startCheckout() {
  const cpuLabel = window._cpuLabel || "Snapdragon 7+ Gen 3";
  const price = window._buildPrice || 649;
  const ram = window._ramLabel || "8GB";
  const stor = window._storLabel || "128GB";

  openModal(`
    <h2>Order Summary</h2>
    <p>Review your custom build before placing your order.</p>
    <div class="build-summary">
      <div><span>Model</span><strong>${state.model}</strong></div>
      <div><span>Display</span><strong>${state.screenLabel}</strong></div>
      <div><span>Processor</span><strong>${cpuLabel}</strong></div>
      <div><span>RAM</span><strong>${ram}</strong></div>
      <div><span>Storage</span><strong>${stor}</strong></div>
      <div><span>Battery</span><strong>${state.battLabel}</strong></div>
      <div><span>Color</span><strong>${state.colorName}</strong></div>
      <div><span>Total</span><strong style="font-size:18px;color:#38bdf8">$${price.toLocaleString()}</strong></div>
    </div>
    <p>🚀 <strong>Stripe checkout coming soon.</strong> Leave your email and we'll notify you when orders open!</p>
    <button class="modal-action" onclick="closeModal(); showToast('We\\'ll be in touch! 🎉')">
      Notify Me When Ready
    </button>
  `);
}

/*
// ── STRIPE VERSION (use this once your server.js is deployed) ──────────────
async function startCheckout() {
  const SERVER_URL = "https://your-server.onrender.com";
  const amount = (window._buildPrice || 649) * 100;
  try {
    const res = await fetch(SERVER_URL + "/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    window.location.href = data.url;
  } catch (err) {
    showToast("Checkout unavailable — please try again later.");
    console.error(err);
  }
}
*/

// ---- Init ----
init3D();
calc();

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

// ---- State ----
let state = {
  model: "Custom X1",
  color: "#2a2a2a",
  colorName: "Midnight Black",
  battPrice: 0,
  battScore: 0,
  battLabel: "5000mAh",
  loggedIn: false,
  userEmail: "",
};

// ---- 3D Phone ----
let scene, camera, renderer, phoneMesh;

function init3D() {
  const container = document.getElementById("threeContainer");
  const W = container.clientWidth || 240;
  const H = container.clientHeight || 500;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
  camera.position.z = 5.5;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(W, H);
  container.appendChild(renderer.domElement);

  // Phone body
  const bodyGeo = new THREE.BoxGeometry(2, 4.2, 0.18);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    metalness: 0.7,
    roughness: 0.25,
  });
  phoneMesh = new THREE.Mesh(bodyGeo, bodyMat);
  scene.add(phoneMesh);

  // Screen
  const screenGeo = new THREE.BoxGeometry(1.7, 3.7, 0.01);
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1e,
    emissive: 0x0a1a2e,
    emissiveIntensity: 0.6,
    metalness: 0,
    roughness: 0.1,
  });
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.1;
  phoneMesh.add(screen);

  // Camera dot
  const camGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
  const camMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
  const camDot = new THREE.Mesh(camGeo, camMat);
  camDot.rotation.x = Math.PI / 2;
  camDot.position.set(0, 2.0, 0.12);
  phoneMesh.add(camDot);

  // Lights
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(5, 8, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (phoneMesh) {
    phoneMesh.rotation.y += 0.008;
    phoneMesh.rotation.x = Math.sin(Date.now() * 0.0005) * 0.08;
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

function selectOpt(btn, groupId, labelId) {
  document.querySelectorAll(`#${groupId} .opt-btn`).forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  if (labelId) {
    state.model = btn.dataset.val;
    document.getElementById(labelId).textContent = btn.dataset.val;
  }
  calc();
}

function selectColor(btn) {
  document.querySelectorAll("#colorGroup .swatch").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.color = btn.dataset.color;
  state.colorName = btn.dataset.name;
  document.getElementById("colorName").textContent = btn.dataset.name;
  if (phoneMesh) phoneMesh.material.color.set(state.color);

  // Update glow tint
  const glow = document.getElementById("phoneGlow");
  glow.style.background = state.color + "55";

  calc();
}

// ---- Main Calc ----
function calc() {
  let basePrice = 649;
  let score = 100;

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

  // Perf bar (max ~550 score)
  const pct = Math.min(100, Math.round((score / 550) * 100));
  document.getElementById("perfFill").style.width = pct + "%";
  document.getElementById("perfNum").textContent = score;

  // Spec pills
  const cpuLabel = CPU_LABELS[document.getElementById("cpu").value] || "";
  const shortCpu = cpuLabel.replace("Snapdragon ", "SD ");
  document.getElementById("specPills").innerHTML =
    `<span class="pill">${shortCpu}</span>` +
    `<span class="pill">${ram.label} RAM</span>` +
    `<span class="pill">${stor.label}</span>` +
    `<span class="pill">${state.battLabel}</span>`;

  // Compat warning
  const isFlagship = cpuVals[2] === "flagship";
  const needsRam = ramIdx < 2;
  document.getElementById("compat").textContent =
    isFlagship && needsRam ? "⚠ Flagship chip works best with 16GB+ RAM" : "";

  // Store for checkout
  window._buildPrice = basePrice;
  window._buildScore = score;
  window._ramLabel = ram.label;
  window._storLabel = stor.label;
  window._cpuLabel = cpuLabel;
}

// Battery button handler (called inline)
window.selectBatt = function(btn) {
  document.querySelectorAll("#battGroup .opt-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const [price, score, label] = btn.dataset.val.split(",");
  state.battPrice = +price;
  state.battScore = +score;
  state.battLabel = label;
  calc();
};

// Attach battery buttons properly
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
});

// ---- Auth ----
function handleLogin() {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value;

  if (!email || !pass) { showToast("Please enter email and password."); return; }
  if (!email.includes("@")) { showToast("Please enter a valid email."); return; }

  // Demo login — swap with real auth later
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
// GitHub Pages = no backend. Show a summary modal.
// When you deploy server.js (Render / Railway / Vercel), replace this whole
// function with the Stripe redirect version below.
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
  const SERVER_URL = "https://your-server.onrender.com"; // <- replace
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

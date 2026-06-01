const ids = [
  "cpu","ram","storage","display",
  "camera","battery","cooling",
  "charging","body"
];

// --------------------
// THREE.JS SETUP
// --------------------
let scene, camera, renderer, phone;

function init3D(){

    const container = document.getElementById("threeContainer");

    scene = new THREE.Scene();

    // FIXED ASPECT RATIO (IMPORTANT)
    const width = 300;
    const height = 620;

    camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(width, height);

    container.innerHTML = ""; // prevents duplicate canvas
    container.appendChild(renderer.domElement);

    // PHONE MODEL
    const geometry = new THREE.BoxGeometry(2, 4, 0.2);

    const material = new THREE.MeshStandardMaterial({
        color:0x444444,
        roughness:0.3,
        metalness:0.6
    });

    phone = new THREE.Mesh(geometry, material);
    scene.add(phone);

    // LIGHTS (FIXED BRIGHTNESS)
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5,5,5);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    camera.position.z = 5;

    animate();
}

function animate(){
    requestAnimationFrame(animate);

    phone.rotation.y += 0.01;

    renderer.render(scene, camera);
}

// --------------------
// COLOR UPDATE
// --------------------
function updateColor(color){
    phone.material.color.set(color);
}

// --------------------
// MAIN CALC
// --------------------
function calc(){

    let total = 499;
    let score = 100;

    ids.forEach(id=>{
        let v = document.getElementById(id).value.split(",");
        total += +v[0];
        score += +v[1];
    });

    document.getElementById("price").innerText = "$" + total;
    document.getElementById("score").innerText = "Performance: " + score;

    document.getElementById("modelLabel").innerText =
        document.getElementById("model").value;

    updateColor(document.getElementById("color").value);
}

// --------------------
// EVENTS
// --------------------
document.querySelectorAll("select")
.forEach(s => s.addEventListener("change", calc));

// drag rotate
let dragging = false;
let lastX = 0;

document.addEventListener("mousedown",(e)=>{
    dragging = true;
    lastX = e.clientX;
});

document.addEventListener("mouseup",()=>dragging=false);

document.addEventListener("mousemove",(e)=>{
    if(!dragging || !phone) return;

    let dx = e.clientX - lastX;
    phone.rotation.y += dx * 0.01;
    lastX = e.clientX;
});

// INIT
init3D();
calc();

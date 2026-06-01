const ids = [
  "cpu","ram","storage","display",
  "camera","battery","cooling",
  "charging","body"
];

// --------------------
// 3D SETUP
// --------------------
let scene, camera, renderer, phone;

function init3D(){

    const container = document.getElementById("threeContainer");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        300/620,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(300,620);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(2,4,0.2);

    const material = new THREE.MeshStandardMaterial({
        color:0x444444,
        roughness:0.3,
        metalness:0.6
    });

    phone = new THREE.Mesh(geometry, material);
    scene.add(phone);

    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(2,2,5);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff,0.5));

    camera.position.z = 5;

    animate();
}

function animate(){
    requestAnimationFrame(animate);

    phone.rotation.y += 0.005;

    renderer.render(scene,camera);
}

// --------------------
// COLOR ANIMATION
// --------------------
function animateColorChange(color){
    phone.material.color.lerp(
        new THREE.Color(color),
        0.2
    );
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

    document.getElementById("price").innerText = "$"+total;
    document.getElementById("score").innerText = "Performance: "+score;

    // model label
    document.getElementById("modelLabel").innerText =
        document.getElementById("model").value;

    // compatibility rule
    let cpu = document.getElementById("cpu").value.split(",")[2];
    let batteryIndex = document.getElementById("battery").selectedIndex;

    let msg = "✅ Compatible";

    if(cpu === "flagship" && batteryIndex === 0){
        msg = "⚠ Flagship chip needs bigger battery";
    }

    document.getElementById("compat").innerText = msg;

    // 3D updates
    animateColorChange(document.getElementById("color").value);
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
    if(!dragging) return;

    let dx = e.clientX - lastX;
    phone.rotation.y += dx * 0.01;
    lastX = e.clientX;
});

// init
init3D();
calc();

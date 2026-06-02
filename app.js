let scene, camera, renderer, phone;

const ids = ["cpu","ram","storage","battery"];

function init3D(){

    const container = document.getElementById("threeContainer");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, 300/620, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
    renderer.setSize(300,620);
    container.appendChild(renderer.domElement);

    const geo = new THREE.BoxGeometry(2,4,0.2);
    const mat = new THREE.MeshStandardMaterial({ color:0x444444 });

    phone = new THREE.Mesh(geo, mat);
    scene.add(phone);

    const light = new THREE.DirectionalLight(0xffffff,2);
    light.position.set(5,5,5);
    scene.add(light);

    scene.add(new THREE.AmbientLight(0xffffff,0.8));

    animate();
}

function animate(){
    requestAnimationFrame(animate);
    phone.rotation.y += 0.01;
    renderer.render(scene,camera);
}

function calc(){

    let price = 499;
    let score = 100;

    ids.forEach(id=>{
        let v = document.getElementById(id).value.split(",");
        price += +v[0];
        score += +v[1];
    });

    document.getElementById("price").innerText = "$"+price;
    document.getElementById("score").innerText = "Performance: "+score;

    phone.material.color.set(
        document.getElementById("color").value
    );
}

// -------------------------
// REAL CHECKOUT (STRIPE)
// -------------------------
async function startCheckout(){

    const priceText = document.getElementById("price").innerText;
    const amount = parseInt(priceText.replace("$","")) * 100;

    const res = await fetch("http://localhost:4242/create-checkout-session", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ amount })
    });

    const data = await res.json();

    window.location.href = data.url;
}

document.querySelectorAll("select").forEach(s=>{
    s.addEventListener("change", calc);
});

init3D();
calc();

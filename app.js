let scene, camera, renderer, model, controls;

const ids = ["cpu","ram","storage","display","camera","battery"];

function init3D(){

    const container = document.getElementById("threeContainer");

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 400/650, 0.1, 1000);
    camera.position.set(0,1.5,4);

    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(400,650);
    container.appendChild(renderer.domElement);

    // 🎥 ORBIT CONTROLS (drag + zoom)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 💡 STUDIO LIGHTING
    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(5,5,5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-5,2,5);
    scene.add(fillLight);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // 📱 LOAD REAL PHONE MODEL
    const loader = new THREE.GLTFLoader();

    loader.load(
        "phone.glb",
        (gltf)=>{
            model = gltf.scene;
            model.scale.set(1.5,1.5,1.5);
            scene.add(model);
        },
        undefined,
        ()=>{
            console.log("Model not found — using fallback cube");

            const geo = new THREE.BoxGeometry(1,2,0.1);
            const mat = new THREE.MeshStandardMaterial({color:0x444444});
            model = new THREE.Mesh(geo,mat);
            scene.add(model);
        }
    );

    animate();
}

function animate(){
    requestAnimationFrame(animate);

    if(model){
        model.rotation.y += 0.002;
    }

    controls.update();
    renderer.render(scene,camera);
}

// 🎨 COLOR CHANGE
function updateColor(color){
    if(model && model.material){
        model.material.color.set(color);
    }

    if(model && model.traverse){
        model.traverse(child=>{
            if(child.isMesh){
                child.material.color.set(color);
            }
        });
    }
}

// 📊 CALC SYSTEM
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

    updateColor(document.getElementById("color").value);
}

// EVENTS
document.querySelectorAll("select").forEach(s=>{
    s.addEventListener("change", calc);
});

// INIT
init3D();
calc();

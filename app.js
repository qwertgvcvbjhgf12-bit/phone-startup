const ids = ["cpu","ram","storage","display","camera","battery","cooling","charging","body"];

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

    document.getElementById("phone").style.background =
        document.getElementById("color").value;

    let cpu = document.getElementById("cpu").value.split(",")[2];
    let battery = document.getElementById("battery").selectedIndex;

    let msg = "✅ Compatible";

    if(cpu === "flagship" && battery === 0){
        msg = "⚠ Flagship chip recommended with 6500mAh+ battery";
    }

    document.getElementById("compat").innerText = msg;

    document.getElementById("modelLabel").innerText =
        document.getElementById("model").value;
}

document.querySelectorAll("select").forEach(s =>
    s.addEventListener("change", calc)
);

calc();

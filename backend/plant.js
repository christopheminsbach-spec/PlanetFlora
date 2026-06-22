const uploadBox = document.getElementById("uploadBox");
const input = document.getElementById("img");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const conf = document.getElementById("conf");

// 📂 ouvrir file picker
uploadBox.addEventListener("click", () => {
    input.click();
});

// 📷 image sélectionnée
input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    preview.style.display = "block";
    preview.src = URL.createObjectURL(file);

    result.textContent = "Analyse en cours...";
    conf.innerHTML = "";

    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch("http://localhost:3000/api/predict", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        result.innerHTML = `🌿 ${data.prediction}`;

        let html = `
            <h3>📊 Confiance</h3>
            <p>${(data.confidence * 100).toFixed(2)}%</p>
        `;

        if (data.top5) {
            html += `<h3>🌱 Top 5</h3><ul>`;
            data.top5.forEach(p => {
                html += `<li>${p.name} — ${(p.score * 100).toFixed(1)}%</li>`;
            });
            html += `</ul>`;
        }

        conf.innerHTML = html;

        if (data.imageUrl) {
            preview.src = "http://localhost:3000" + data.imageUrl;
        }

    } catch (err) {
        console.error(err);
        result.textContent = "❌ Erreur serveur";
    }
});
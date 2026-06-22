const input = document.getElementById("img");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const conf = document.getElementById("conf");

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  preview.style.display = "block";
  preview.src = URL.createObjectURL(file);

  const formData = new FormData();
  formData.append("image", file);

  result.innerHTML = "Analyse en cours...";
  conf.innerHTML = "";

  try {
    const res = await fetch("/api/predict", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    result.innerHTML = "🌿 TOP 5 résultats";

    conf.innerHTML = data.top5
      .map(
        p => `
        <div class="card-result">
          <strong>${p.name}</strong>
          <span>${(p.score * 100).toFixed(2)}%</span>
        </div>
      `
      )
      .join("");

    if (data.imageUrl) {
      preview.src = data.imageUrl;
    }

  } catch (e) {
    result.innerHTML = "❌ Erreur serveur";
  }
});
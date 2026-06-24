import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:3000",
});
console.log("SCRIPT OK");

console.log("Planète Flora chargé");

// ======================
// ATTENTE CHARGEMENT PAGE
// ======================

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM prêt");

    initLogin();
    initRegister();
    loadHistory();

});

// ======================
// LOGIN
// ======================

function initLogin() {

    const form = document.getElementById("loginForm");

    if (!form) {
        console.error("loginForm introuvable");
        return;
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        try {

            const response = await fetch(
                "/api/auth/login"
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                alert("✅ Connexion réussie");

            } else {

                alert(
                    data.message ||
                    "Email ou mot de passe incorrect"
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "❌ Impossible de contacter le serveur"
            );

        }

    });

}

// ======================
// INSCRIPTION
// ======================

function initRegister() {

    const form =
        document.getElementById("registerForm");

    if (!form) {
        console.error("registerForm introuvable");
        return;
    }

    form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const username =
            document.getElementById("registerUsername").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        try {

            const response = await fetch(
                "/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (data.success) {

                alert("✅ Compte créé");

                form.reset();

            } else {

                alert(
                    data.message ||
                    "Erreur inscription"
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                "❌ Erreur serveur inscription"
            );

        }

    });

}

// ======================
// HISTORIQUE
// ======================

async function loadHistory() {

    try {

        const response = await fetch(
            "/api/history"
        );

        if (!response.ok) {
            throw new Error(
                `Erreur ${response.status}`
            );
        }

        const data = await response.json();

        const container =
            document.getElementById(
                "historyContainer"
            );

        if (!container) return;

        container.innerHTML = data.map(item => `
            <div class="dashboard-card">
                <h4>${item.plante}</h4>
                <p>${Math.round((item.confiance || 0) * 100)}%</p>
            </div>
        `).join("");

    } catch (error) {

        console.error(
            "Erreur historique :",
            error
        );

    }

}
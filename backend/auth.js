document.addEventListener("DOMContentLoaded", () => {

    // LOGIN
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const res = await fetch("http://localhost:3000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Connecté");
                    localStorage.setItem("token", data.token);
                } else {
                    alert("❌ Erreur login");
                }

            } catch (err) {
                console.error(err);
            }
        });
    }

    // REGISTER
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const email = document.getElementById("registerEmail").value;
            const password = document.getElementById("registerPassword").value;

            try {
                const res = await fetch("http://localhost:3000/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Compte créé");
                    window.location.href = "login.html";
                } else {
                    alert("❌ Erreur inscription");
                }

            } catch (err) {
                console.error(err);
            }
        });
    }

});
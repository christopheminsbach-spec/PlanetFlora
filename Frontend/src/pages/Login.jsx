import { useState } from "react";

export default function Login({ apiUrl = "http://localhost:3000" }) {
  const [email, setEmail] = useState("admin@test.com");
  const [password, setPassword] = useState("1234");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Connexion refusée.");
      }

      localStorage.setItem("planet_flora_token", data.token);
      setMessage("Connexion réussie.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ maxWidth: 420 }}>
      <h1>🔐 Connexion</h1>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 12 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </section>
  );
}
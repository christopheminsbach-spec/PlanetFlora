import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const response = await api.post(endpoint, payload);

      localStorage.setItem("planet_flora_token", response.data.token);
      localStorage.setItem(
        "planet_flora_user",
        JSON.stringify(response.data.user)
      );

      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/home");
      }, 500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue. Vérifie que le backend est lancé."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🌿</div>

        <h1 style={styles.title}>
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>

        <p style={styles.subtitle}>
          Accède à ton espace personnel Planet Flora.
        </p>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            style={{
              ...styles.tab,
              ...(mode === "login" ? styles.tabActive : {}),
            }}
          >
            Connexion
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            style={{
              ...styles.tab,
              ...(mode === "register" ? styles.tabActive : {}),
            }}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={submit} style={styles.form}>
          {mode === "register" && (
            <label style={styles.label}>
              Nom
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ton prénom"
                style={styles.input}
                required
              />
            </label>
          )}

          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="exemple@email.com"
              style={styles.input}
              required
            />
          </label>

          <label style={styles.label}>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 caractères"
              minLength="6"
              style={styles.input}
              required
            />
          </label>

          {error && <p style={styles.error}>{error}</p>}
          {message && <p style={styles.success}>{message}</p>}

          <button type="submit" disabled={loading} style={styles.submit}>
            {loading
              ? "Chargement..."
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "calc(100vh - 48px)",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    background: "white",
    padding: 32,
    borderRadius: 20,
    boxShadow: "0 16px 45px rgba(27, 94, 32, 0.15)",
  },
  logo: {
    fontSize: 42,
    textAlign: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    color: "#1b5e20",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 24,
  },
  tabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 24,
    background: "#f1f5f9",
    padding: 5,
    borderRadius: 10,
  },
  tab: {
    border: "none",
    padding: 10,
    borderRadius: 8,
    cursor: "pointer",
    background: "transparent",
  },
  tabActive: {
    background: "#1b5e20",
    color: "white",
  },
  form: {
    display: "grid",
    gap: 16,
  },
  label: {
    display: "grid",
    gap: 7,
    fontWeight: 600,
    color: "#334155",
  },
  input: {
    padding: 12,
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    fontSize: 16,
  },
  submit: {
    border: "none",
    background: "#1b5e20",
    color: "white",
    padding: 13,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 700,
  },
  error: {
    color: "#b91c1c",
    margin: 0,
  },
  success: {
    color: "#15803d",
    margin: 0,
  },
};
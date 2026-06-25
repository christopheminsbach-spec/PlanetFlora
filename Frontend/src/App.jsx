import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Map from "./pages/Map";
import Login from "./pages/Login";

const API_URL = "http://localhost:3000";

const links = [
  { to: "/home", label: "🏠 Dashboard" },
  { to: "/upload", label: "📷 Identifier une plante" },
  { to: "/history", label: "🕘 Historique" },
  { to: "/analytics", label: "📊 Analytics" },
  { to: "/map", label: "🗺️ Carte" },
];

function Layout() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside
        style={{
          width: 250,
          background: "#14532d",
          color: "white",
          padding: 20,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>🌿 Planète Flora</h2>

        {user ? (
          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              marginBottom: 24,
              padding: 10,
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
            }}
          >
            Connecté : <strong>{user.name || user.username || user.email}</strong>
          </div>
        ) : (
          <div style={{ marginBottom: 24, fontSize: 13, opacity: 0.85 }}>
            Visiteur non connecté
          </div>
        )}

        <nav style={{ display: "grid", gap: 8 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                color: "white",
                textDecoration: "none",
                padding: "11px 12px",
                borderRadius: 8,
                background: isActive ? "rgba(255,255,255,0.20)" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          {user ? (
            <button
              type="button"
              onClick={logout}
              style={{
                width: "100%",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 9,
                padding: "11px 12px",
                background: "transparent",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ↪ Se déconnecter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                width: "100%",
                border: 0,
                borderRadius: 9,
                padding: "11px 12px",
                background: "white",
                color: "#14532d",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Se connecter
            </button>
          )}
        </div>
      </aside>

      <main style={{ flex: 1, padding: 24, background: "#f5f7f5" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Dashboard apiUrl={API_URL} />} />
          <Route path="/upload" element={<Upload apiUrl={API_URL} />} />
          <Route path="/history" element={<History apiUrl={API_URL} />} />
          <Route path="/analytics" element={<Analytics apiUrl={API_URL} />} />
          <Route path="/map" element={<Map apiUrl={API_URL} />} />
          <Route path="/login" element={<Login apiUrl={API_URL} />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
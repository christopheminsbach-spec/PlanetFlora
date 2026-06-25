import { useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Map from "./pages/Map";
import Login from "./pages/Login";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("planet_flora_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const links = [
  { to: "/home", label: "🏠 Dashboard" },
  { to: "/upload", label: "📤 Identifier une plante" },
  { to: "/history", label: "🕘 Historique" },
  { to: "/analytics", label: "📊 Statistiques" },
  { to: "/map", label: "🗺️ Carte" },
];

function Layout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem("planet_flora_user") || "null"
  );

  const logout = () => {
    localStorage.removeItem("planet_flora_token");
    localStorage.removeItem("planet_flora_user");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <header style={styles.mobileHeader}>
        <strong>🌿 Planet Flora</strong>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={styles.hamburger}
          aria-label="Ouvrir le menu"
        >
          ☰
        </button>
      </header>

      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside
          style={{
            ...styles.sidebar,
            ...(menuOpen ? styles.sidebarOpen : {}),
          }}
        >
          <h2 style={{ marginTop: 0 }}>🌿 Planet Flora</h2>

          {user && (
            <div style={styles.userBox}>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          )}

          <nav style={{ display: "grid", gap: 8 }}>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  color: "white",
                  textDecoration: "none",
                  padding: "11px 12px",
                  borderRadius: 10,
                  background: isActive
                    ? "rgba(255,255,255,0.20)"
                    : "transparent",
                })}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <button onClick={logout} style={styles.logout}>
            Se déconnecter
          </button>
        </aside>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <Map />
                </ProtectedRoute>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
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

const styles = {
  sidebar: {
    width: 250,
    flexShrink: 0,
    background: "#1b5e20",
    color: "white",
    padding: 20,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  sidebarOpen: {
    display: "flex",
  },
  userBox: {
    display: "grid",
    gap: 5,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.12)",
  },
  logout: {
    marginTop: "auto",
    border: "1px solid rgba(255,255,255,0.4)",
    background: "transparent",
    color: "white",
    padding: 11,
    borderRadius: 10,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    background: "#f5f7f5",
  },
  mobileHeader: {
    display: "none",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1b5e20",
    color: "white",
    padding: "14px 16px",
  },
  hamburger: {
    border: "none",
    background: "transparent",
    color: "white",
    fontSize: 26,
    cursor: "pointer",
  },
};
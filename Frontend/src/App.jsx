import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Map from "./pages/Map";
import Login from "./pages/Login";

const API_URL = "http://localhost:3000";

const links = [
  { to: "/home", label: "Dashboard" },
  { to: "/upload", label: "Upload" },
  { to: "/history", label: "History" },
  { to: "/analytics", label: "Analytics" },
  { to: "/map", label: "Map" },
  { to: "/login", label: "Login" },
];

function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside
        style={{
          width: 240,
          background: "#1b5e20",
          color: "white",
          padding: 20,
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ marginTop: 0 }}>🌿 Planet Flora</h2>

        <nav style={{ display: "grid", gap: 8 }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                color: "white",
                textDecoration: "none",
                padding: "10px 12px",
                borderRadius: 8,
                background: isActive ? "rgba(255,255,255,0.20)" : "transparent",
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
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

          {/* Toute URL inconnue retourne au dashboard */}
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
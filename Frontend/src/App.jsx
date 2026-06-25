import { useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Map from "./pages/Map";
import Login from "./pages/Login";

import "./App.css";

const API_URL = "http://localhost:3000";

const links = [
  { to: "/home", label: "Dashboard", icon: "🏠" },
  { to: "/upload", label: "Identifier une plante", icon: "📷" },
  { to: "/history", label: "Historique", icon: "🕒" },
  { to: "/analytics", label: "Statistiques", icon: "📊" },
  { to: "/map", label: "Carte", icon: "🗺️" },
  { to: "/login", label: "Connexion", icon: "👤" },
];

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const currentPage =
    links.find((link) => link.to === location.pathname)?.label ||
    "Planet Flora";

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-layout">
      {/* Overlay sombre derrière le menu mobile */}
      {menuOpen && (
        <button
          className="menu-overlay"
          onClick={closeMenu}
          aria-label="Fermer le menu"
        />
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🌿</div>

          <div>
            <h1>Planet Flora</h1>
            <p>Mon jardin numérique</p>
          </div>

          <button
            className="close-menu"
            onClick={closeMenu}
            aria-label="Fermer le menu"
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          🌱 Explorez, identifiez et protégez la biodiversité.
        </div>
      </aside>

      <div className="app-content">
        <header className="top-header">
          {/* Bouton hamburger : visible uniquement téléphone */}
          <button
            className="hamburger-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="page-heading">
            <p>PLANET FLORA</p>
            <h2>{currentPage}</h2>
          </div>

          <div className="header-plant">🌱</div>
        </header>

        <main className="main-content">
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